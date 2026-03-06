// Network Traffic Monitor for Desktop Suite
class NetworkMonitor {
    constructor() {
        this.networkStatus = navigator.onLine;
        this.resourceCache = new Map();
        this.appConnectivity = new Map();
        this.trafficLog = [];
        this.blockedDomains = new Set(JSON.parse(localStorage.getItem('blockedDomains') || '[]'));
        this.init();
    }

    init() {
        // Monitor online/offline status
        window.addEventListener('online', () => this.updateNetworkStatus(true));
        window.addEventListener('offline', () => this.updateNetworkStatus(false));

        // Intercept fetch requests
        this.interceptFetch();

        // Monitor resource loading
        this.monitorResourceLoading();

        // Update UI periodically
        this.updateUI();
        setInterval(() => this.updateUI(), 2000);

        // Initial UI update
        this.updateNetworkStatus(this.networkStatus);
    }

    updateNetworkStatus(isOnline) {
        this.networkStatus = isOnline;
        this.logTraffic('network_status', { online: isOnline });
        this.broadcastNetworkStatus();
    }

    interceptFetch() {
        const originalFetch = window.fetch;
        const self = this;

        window.fetch = async function (resource, init) {
            const startTime = Date.now();
            const requestUrl = typeof resource === 'string' ? resource : resource.url;

            // Check if it's an internal project API call or local resource
            const isInternal = requestUrl.includes('localhost') ||
                requestUrl.includes('tauri.localhost') ||
                requestUrl.startsWith('/') ||
                requestUrl.startsWith('tauri://') ||
                requestUrl.includes('127.0.0.1');

            if (isInternal) {
                return originalFetch(resource, init);
            }

            // Check if domain is blocked
            if (self.isBlocked(requestUrl)) {
                self.logTraffic('fetch_blocked', {
                    url: requestUrl,
                    method: init?.method || 'GET',
                    timestamp: Date.now(),
                    status: 403
                });
                return Promise.reject(new Error(`Blocked by network monitor: ${requestUrl}`));
            }

            try {
                const response = await originalFetch(resource, init);
                // Log successful fetch
                self.logTraffic('fetch_success', {
                    url: requestUrl,
                    method: init?.method || 'GET',
                    status: response.status,
                    size: response.headers.get('content-length') || 0,
                    duration: Date.now() - startTime
                });

                return response;
            } catch (error) {
                self.logTraffic('fetch_error', {
                    url: requestUrl,
                    method: init?.method || 'GET',
                    error: error.message,
                    duration: Date.now() - startTime
                });
                throw error;
            }
        };
    }

    monitorResourceLoading() {
        // Track script and link elements
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                mutation.addedNodes.forEach((node) => {
                    if (node.tagName === 'SCRIPT' || node.tagName === 'LINK' || node.tagName === 'IMG') {
                        this.trackResourceLoad(node);
                    }
                });
            });
        });

        observer.observe(document.documentElement, {
            childList: true,
            subtree: true
        });
    }

    trackResourceLoad(element) {
        const src = element.src || element.href;
        if (!src || !src.startsWith('http')) return;

        // Skip internal project resources
        const isInternal = src.includes('localhost') ||
            src.includes('tauri.localhost') ||
            src.includes('127.0.0.1');

        if (isInternal) return;

        const startTime = Date.now();

        // Check if resource is blocked
        if (this.isBlocked(src)) {
            this.logTraffic('resource_blocked', {
                url: src,
                type: element.tagName,
                timestamp: Date.now()
            });

            // Remove the element if it's blocked
            if (element.parentNode) {
                element.remove();
            }
            return;
        }

        // Track load events
        element.addEventListener('load', () => {
            this.logTraffic('resource_loaded', {
                url: src,
                type: element.tagName,
                duration: Date.now() - startTime,
                size: 0 // Can't get size for non-fetch resources
            });
        });

        element.addEventListener('error', () => {
            this.logTraffic('resource_error', {
                url: src,
                type: element.tagName,
                duration: Date.now() - startTime
            });
        });
    }

    logTraffic(type, data) {
        const entry = {
            type,
            timestamp: Date.now(),
            ...data
        };

        this.trafficLog.push(entry);

        // Keep log size manageable
        if (this.trafficLog.length > 1000) {
            this.trafficLog = this.trafficLog.slice(-1000);
        }

        // Save to Rust backend
        fetch('/api/network', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(entry)
        }).catch(() => { });

        return entry;
    }

    isBlocked(url) {
        try {
            const domain = new URL(url).hostname;
            return Array.from(this.blockedDomains).some(blocked =>
                domain === blocked || domain.endsWith('.' + blocked)
            );
        } catch (e) {
            return false;
        }
    }

    blockDomain(domain) {
        if (!domain) return false;

        // Normalize domain (remove protocol and path)
        try {
            const url = new URL(domain.startsWith('http') ? domain : `https://${domain}`);
            domain = url.hostname;
        } catch (e) {
            console.error('Invalid domain:', domain);
            return false;
        }

        this.blockedDomains.add(domain);
        this.saveBlockedDomains();
        return true;
    }

    unblockDomain(domain) {
        this.blockedDomains.delete(domain);
        this.saveBlockedDomains();
    }

    saveBlockedDomains() {
        localStorage.setItem('blockedDomains', JSON.stringify(Array.from(this.blockedDomains)));
        this.updateUI();
    }

    saveToLocalStorage() {
        // Obsolete - Handled by backend API
    }

    async updateUI() {
        // Update network status indicator
        const indicator = document.getElementById('network-status-indicator');
        if (indicator) {
            indicator.className = this.networkStatus ? 'online' : 'offline';
            indicator.title = this.networkStatus ? 'Online' : 'Offline';
        }

        // Update traffic log display if the tab is active
        if (document.querySelector('#network-tab.active')) {
            try {
                const response = await fetch('/api/network');
                if (response.ok) {
                    this.trafficLog = await response.json();
                }
            } catch (e) {
                // Ignore errors
            }
            this.updateTrafficDisplay();
        }
    }

    updateTrafficDisplay() {
        const trafficLog = document.getElementById('traffic-log');
        if (!trafficLog) return;

        // Show last 50 traffic events
        const recentLogs = this.trafficLog.slice(-50);

        if (recentLogs.length === 0) {
            trafficLog.innerHTML = '<div class="empty-state">No network activity yet</div>';
            return;
        }

        // Calculate Gantt chart dimensions
        const minTime = Math.min(...recentLogs.map(l => l.timestamp));
        const maxTime = Math.max(...recentLogs.map(l => l.timestamp + Math.max(l.duration || 10, 10)));
        const totalDuration = Math.max(maxTime - minTime, 100);

        trafficLog.innerHTML = `
            <div class="gantt-container" style="overflow-x: auto; width: 100%; position: relative; padding-bottom: 20px;">
                <div class="gantt-chart" style="min-width: 600px; position: relative;">
                    <div class="gantt-header" style="display: flex; border-bottom: 1px solid #ccc; padding-bottom: 5px; margin-bottom: 10px; font-family: sans-serif;">
                        <span style="flex: 0 0 250px; font-weight: bold;">Resource</span>
                        <span style="flex: 1; font-weight: bold; position: relative;">
                            Timeline
                        </span>
                    </div>
                    ${recentLogs.map(log => {
            const startPct = Math.max(0, ((log.timestamp - minTime) / totalDuration) * 100);
            const dur = Math.max(log.duration || 10, 10);
            const widthPct = Math.max(0.5, (dur / totalDuration) * 100);
            const isError = log.status >= 400 || log.type === 'fetch_blocked';
            const color = isError ? '#ff4d4d' : '#8884d8';
            const methodHtml = log.method ? `<strong style="color:#aaa;">${log.method}</strong> ` : '';

            return `
                        <div class="gantt-row" style="display: flex; margin-bottom: 6px; align-items: center; font-size: 12px; font-family: monospace;">
                            <span style="flex: 0 0 250px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; padding-right: 10px;" title="${log.url}">
                                ${methodHtml}${this.shortenUrl(log.url)}
                            </span>
                            <div style="flex: 1; position: relative; height: 16px; background-color: rgba(255,255,255,0.05); border-left: 1px solid rgba(255,255,255,0.1); border-right: 1px solid rgba(255,255,255,0.1); border-radius: 3px;">
                                <div style="position: absolute; left: ${startPct}%; width: ${widthPct}%; height: 100%; background-color: ${color}; border-radius: 3px; min-width: 4px; box-shadow: 0 1px 3px rgba(0,0,0,0.3);" title="Duration: ${dur}ms\nSize: ${this.formatSize(log.size)}\nStatus: ${log.status || (log.type === 'fetch_blocked' ? 'BLOCKED' : 'N/A')}"></div>
                            </div>
                            <span style="flex: 0 0 60px; text-align: right; padding-left: 10px; color: #ccc;">${dur}ms</span>
                        </div>
                        `;
        }).join('')}
                </div>
            </div>
        `;

        // Update blocked domains list
        this.updateBlockedDomainsList();
    }

    updateBlockedDomainsList() {
        const blockedList = document.getElementById('blocked-domains-list');
        if (!blockedList) return;

        if (this.blockedDomains.size === 0) {
            blockedList.innerHTML = '<div class="empty-state">No domains blocked</div>';
            blockedList.className = 'empty';
            return;
        }

        blockedList.className = '';
        blockedList.innerHTML = Array.from(this.blockedDomains).map(domain => `
            <div class="blocked-domain">
                <span>${domain}</span>
                <button onclick="window.networkMonitor.unblockDomain('${domain}')" 
                        title="Unblock domain">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `).join('');
    }

    // Helper methods
    shortenUrl(url) {
        if (!url) return '';
        try {
            const u = new URL(url);
            return `${u.hostname}${u.pathname.substring(0, 30)}${u.pathname.length > 30 ? '...' : ''}`;
        } catch {
            return url.substring(0, 30) + (url.length > 30 ? '...' : '');
        }
    }

    formatSize(bytes) {
        if (!bytes) return '';
        if (bytes < 1024) return `${bytes} B`;
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
        return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    }

    broadcastNetworkStatus() {
        // Broadcast to other tabs/windows
        if (window.BroadcastChannel) {
            const channel = new BroadcastChannel('network-status');
            channel.postMessage({
                type: 'networkStatus',
                isOnline: this.networkStatus,
                timestamp: Date.now()
            });
        }
    }
}

// Initialize network monitor
window.networkMonitor = new NetworkMonitor();

// Global functions for UI
function showBlockDomainPrompt() {
    const domain = prompt('Enter domain to block (e.g., example.com):');
    if (domain) {
        if (window.networkMonitor.blockDomain(domain)) {
            alert(`Successfully blocked ${domain}`);
        } else {
            alert('Failed to block domain. Please check the format and try again.');
        }
    }
}

// Expose global functions
window.getNetworkReport = () => window.networkMonitor.getReport();
window.getTrafficLog = () => window.networkMonitor.trafficLog;
