// Offline Asset Caching System
class OfflineCacheManager {
    constructor() {
        this.cacheName = 'desktop-app-cache-v1';
        this.assetsToCache = new Map();
        this.downloadQueue = [];
        this.isDownloading = false;
        this.init();
    }

    async init() {
        // Register service worker if supported
        if ('serviceWorker' in navigator) {
            try {
                await navigator.serviceWorker.register('/sw.js');
                console.log('Service Worker registered');
            } catch (error) {
                console.log('Service Worker registration failed:', error);
            }
        }

        // Initialize cache assets mapping
        this.initializeCacheAssets();

        // Check current cache status
        await this.checkCacheStatus();
    }

    initializeCacheAssets() {
        // External CDN resources
        this.assetsToCache.set('fontawesome', {
            url: 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta3/css/all.min.css',
            localPath: 'assets/fontawesome/all.min.css',
            size: '1.2MB',
            priority: 'high',
            fallback: this.generateLocalIconCSS()
        });

        this.assetsToCache.set('sheetjs', {
            url: 'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js',
            localPath: 'assets/sheetjs/xlsx.full.min.js',
            size: '800KB',
            priority: 'medium',
            fallback: this.generateBasicExportJS()
        });

        this.assetsToCache.set('hindu-calendar', {
            url: 'https://cdn.jsdelivr.net/npm/hindu-lunar-calendar@1.0.0/dist/hindu-lunar.umd.min.js',
            localPath: 'assets/hindu-calendar/hindu-lunar.umd.min.js',
            size: '150KB',
            priority: 'low',
            fallback: this.generateBasicCalendarJS()
        });

        // External images used in apps
        this.assetsToCache.set('checkbox-unchecked', {
            url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c2/OOjs_UI_icon_unchecked-rtl.svg/1200px-OOjs_UI_icon_unchecked-rtl.svg.png',
            localPath: 'assets/images/checkbox-unchecked.png',
            size: '2KB',
            priority: 'medium',
            fallback: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3QgeD0iMyIgeT0iMyIgd2lkdGg9IjE4IiBoZWlnaHQ9IjE4IiByeD0iMiIgc3Ryb2tlPSIjNjY2IiBzdHJva2Utd2lkdGg9IjIiLz4KPC9zdmc+'
        });

        this.assetsToCache.set('checkbox-checked', {
            url: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcR3wM2x_f_h_s_1g&s',
            localPath: 'assets/images/checkbox-checked.png',
            size: '2KB',
            priority: 'medium',
            fallback: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3QgeD0iMyIgeT0iMyIgd2lkdGg9IjE4IiBoZWlnaHQ9IjE4IiByeD0iMiIgZmlsbD0iIzRmYWNmZSIgc3Ryb2tlPSIjNGZhY2ZlIiBzdHJva2Utd2lkdGg9IjIiLz4KPHBhdGggZD0ibTkgMTIgMiAyIDQtNCIgc3Ryb2tlPSJ3aGl0ZSIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiLz4KPC9zdmc+'
        });
    }

    async checkCacheStatus() {
        const cache = await caches.open(this.cacheName);
        const cachedRequests = await cache.keys();

        const status = {
            totalAssets: this.assetsToCache.size,
            cachedAssets: 0,
            missingAssets: [],
            cacheSize: 0,
            backendStatus: 'Unknown'
        };

        // Ping Rust Backend Cache status
        try {
            const res = await fetch('/api/cache');
            if (res.ok) {
                const data = await res.json();
                status.backendStatus = data[0];
            } else {
                status.backendStatus = 'Offline';
            }
        } catch (e) {
            status.backendStatus = 'Offline';
        }

        for (const [key, asset] of this.assetsToCache) {
            const cached = cachedRequests.find(req => req.url === asset.url);
            if (cached) {
                status.cachedAssets++;
            } else {
                status.missingAssets.push(key);
            }
        }

        // Estimate cache size
        status.cacheSize = await this.estimateCacheSize();

        return status;
    }

    async estimateCacheSize() {
        if ('storage' in navigator && 'estimate' in navigator.storage) {
            const estimate = await navigator.storage.estimate();
            return estimate.usage || 0;
        }
        return 0;
    }

    async downloadAsset(assetKey) {
        const asset = this.assetsToCache.get(assetKey);
        if (!asset) return false;

        try {
            const response = await fetch(asset.url);
            if (!response.ok) throw new Error(`HTTP ${response.status}`);

            const cache = await caches.open(this.cacheName);
            await cache.put(asset.url, response.clone());

            // Also store in data manager for quick access
            const blob = await response.blob();
            const base64 = await this.blobToBase64(blob);
            window.dataManager?.setCacheData(btoa(asset.url), base64, 24 * 7); // Cache for 1 week

            return true;
        } catch (error) {
            console.error(`Failed to download ${assetKey}:`, error);
            return false;
        }
    }

    async downloadAllAssets(progressCallback) {
        const assets = Array.from(this.assetsToCache.keys());
        const results = {
            successful: [],
            failed: [],
            total: assets.length
        };

        this.isDownloading = true;

        for (let i = 0; i < assets.length; i++) {
            const assetKey = assets[i];
            const success = await this.downloadAsset(assetKey);

            if (success) {
                results.successful.push(assetKey);
            } else {
                results.failed.push(assetKey);
            }

            if (progressCallback) {
                progressCallback({
                    current: i + 1,
                    total: assets.length,
                    currentAsset: assetKey,
                    successful: results.successful.length,
                    failed: results.failed.length
                });
            }

            // Small delay to prevent overwhelming the network
            await new Promise(resolve => setTimeout(resolve, 100));
        }

        this.isDownloading = false;
        return results;
    }

    async createOfflinePackage() {
        const status = await this.checkCacheStatus();

        if (status.missingAssets.length > 0) {
            console.log('Downloading missing assets...');
            await this.downloadAllAssets((progress) => {
                console.log(`Progress: ${progress.current}/${progress.total} - ${progress.currentAsset}`);
            });
        }

        // Generate offline HTML files with local asset references
        await this.generateOfflineVersions();

        return {
            status: 'complete',
            assetsDownloaded: this.assetsToCache.size,
            estimatedSize: await this.estimateCacheSize(),
            offlineAppsGenerated: window.appClassifier?.getOfflineCapableApps().length || 0
        };
    }

    async generateOfflineVersions() {
        const offlineApps = window.appClassifier?.getOfflineCapableApps() || [];

        for (const app of offlineApps) {
            try {
                const response = await fetch(app.path);
                const html = await response.text();
                const offlineHtml = this.replaceExternalReferences(html);

                // Store offline version
                window.dataManager?.setCacheData(
                    `offline_${app.id}`,
                    offlineHtml,
                    24 * 30 // Cache for 30 days
                );
            } catch (error) {
                console.error(`Failed to generate offline version for ${app.id}:`, error);
            }
        }
    }

    replaceExternalReferences(html) {
        let offlineHtml = html;

        // Replace CDN links with local fallbacks
        offlineHtml = offlineHtml.replace(
            /https:\/\/cdnjs\.cloudflare\.com\/ajax\/libs\/font-awesome\/[^"]+/g,
            'data:text/css;base64,' + btoa(this.assetsToCache.get('fontawesome').fallback)
        );

        offlineHtml = offlineHtml.replace(
            /https:\/\/cdnjs\.cloudflare\.com\/ajax\/libs\/xlsx\/[^"]+/g,
            'data:application/javascript;base64,' + btoa(this.assetsToCache.get('sheetjs').fallback)
        );

        // Replace external images
        offlineHtml = offlineHtml.replace(
            /https:\/\/upload\.wikimedia\.org\/[^"]+unchecked[^"]+/g,
            this.assetsToCache.get('checkbox-unchecked').fallback
        );

        return offlineHtml;
    }

    generateLocalIconCSS() {
        // Minimal CSS with essential icons as data URIs
        return `
        .fas::before { font-family: 'Font Awesome 6 Free'; font-weight: 900; }
        .fa-calculator::before { content: "🧮"; }
        .fa-list-check::before { content: "✅"; }
        .fa-book::before { content: "📖"; }
        .fa-code::before { content: "💻"; }
        .fa-file-excel::before { content: "📊"; }
        .fa-chart-line::before { content: "📈"; }
        .fa-calendar-days::before { content: "📅"; }
        .fa-clipboard-user::before { content: "📋"; }
        .fa-play::before { content: "▶️"; }
        .fa-pause::before { content: "⏸️"; }
        .fa-volume-down::before { content: "🔉"; }
        .fa-volume-up::before { content: "🔊"; }
        `;
    }

    generateBasicExportJS() {
        // Basic CSV export functionality
        return `
        window.XLSX = {
            utils: {
                sheet_to_csv: function(sheet) {
                    const csv = [];
                    const range = sheet['!ref'];
                    if (!range) return '';
                    
                    // Simple CSV generation logic
                    for (let row = 0; row < 50; row++) {
                        const rowData = [];
                        for (let col = 0; col < 20; col++) {
                            const cellRef = String.fromCharCode(65 + col) + (row + 1);
                            const cell = sheet[cellRef];
                            rowData.push(cell ? cell.v : '');
                        }
                        csv.push(rowData.join(','));
                    }
                    return csv.join('\\n');
                }
            },
            writeFile: function(wb, filename) {
                const csv = this.utils.sheet_to_csv(wb.Sheets[wb.SheetNames[0]]);
                const blob = new Blob([csv], { type: 'text/csv' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = filename;
                a.click();
            }
        };
        `;
    }

    generateBasicCalendarJS() {
        // Basic calendar functionality
        return `
        window.hindulunar = {
            getPanchang: function(date, lat, lon) {
                return {
                    tithi: 'Unavailable offline',
                    nakshatra: 'Unavailable offline',
                    yoga: 'Unavailable offline',
                    karana: 'Unavailable offline'
                };
            }
        };
        `;
    }

    async blobToBase64(blob) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result.split(',')[1]);
            reader.onerror = reject;
            reader.readAsDataURL(blob);
        });
    }

    async clearCache() {
        await caches.delete(this.cacheName);
        // Clear data manager cache as well
        const keys = Object.keys(localStorage).filter(key => key.includes('cache_'));
        keys.forEach(key => localStorage.removeItem(key));
    }

    getDownloadProgress() {
        return {
            isDownloading: this.isDownloading,
            queueLength: this.downloadQueue.length
        };
    }
}

// Service Worker code (to be saved as sw.js in root)
const serviceWorkerCode = `
const CACHE_NAME = 'desktop-app-cache-v1';
const urlsToCache = [];

self.addEventListener('install', function(event) {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(function(cache) {
                return cache.addAll(urlsToCache);
            })
    );
});

self.addEventListener('fetch', function(event) {
    event.respondWith(
        caches.match(event.request)
            .then(function(response) {
                if (response) {
                    return response;
                }
                return fetch(event.request);
            }
        )
    );
});
`;

// Initialize offline cache manager
window.offlineCacheManager = new OfflineCacheManager();

// Expose global functions
window.downloadOfflineAssets = () => window.offlineCacheManager.downloadAllAssets();
window.createOfflinePackage = () => window.offlineCacheManager.createOfflinePackage();
window.getCacheStatus = () => window.offlineCacheManager.checkCacheStatus();
window.clearOfflineCache = () => window.offlineCacheManager.clearCache();
