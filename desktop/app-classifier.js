// App Classification System for Desktop Suite
class AppClassifier {
    constructor() {
        this.appRegistry = new Map();
        this.networkRequirements = new Map();
        this.offlineCapabilities = new Map();
        this.init();
    }

    init() {
        this.registerExistingApps();
        this.assessNetworkRequirements();
        this.updateDesktopIcons();
    }

    assessNetworkRequirements() {
        // This method is called for each app in registerExistingApps()
        // The actual implementation is in the registerExistingApps method
    }

    updateDesktopIcons() {
        const appIcons = document.querySelectorAll('.app-icon');
        appIcons.forEach(icon => {
            const appName = icon.getAttribute('data-name');
            const app = Array.from(this.appRegistry.values()).find(a => a.name === appName);
            if (app) {
                this.addNetworkIndicator(icon, app);
            }
        });
    }

    registerExistingApps() {
        const apps = [
            {
                id: 'calculator',
                name: 'Calculator',
                path: '../calculator/index.html',
                icon: 'fas fa-calculator',
                category: 'utility',
                type: 'offline',
                networkDependencies: ['fontawesome-cdn'],
                offlineCapable: true,
                cacheableAssets: ['style.css', 'script.js'],
                description: 'Scientific calculator with unit converter'
            },
            {
                id: 'todo-list',
                name: 'To-Do List',
                path: '../todo-list/index.html',
                icon: 'fas fa-list-check',
                category: 'productivity',
                type: 'offline',
                networkDependencies: ['fontawesome-cdn', 'external-checkbox-images'],
                offlineCapable: true,
                cacheableAssets: ['style.css', 'script.js'],
                description: 'Task management with local storage'
            },
            {
                id: 'notebook',
                name: 'Notebook',
                path: '../notebook/index.html',
                icon: 'fas fa-file-word',
                category: 'productivity',
                type: 'offline',
                networkDependencies: ['fontawesome-cdn'],
                offlineCapable: true,
                cacheableAssets: ['style.css', 'script.js'],
                description: 'Professional Docx editor with Rust-backed persistence'
            },
            {
                id: 'code-generator',
                name: 'Code Generator',
                path: '../code-generator/code-generator.html',
                icon: 'fas fa-code',
                category: 'development',
                type: 'hybrid',
                networkDependencies: ['fontawesome-cdn', 'lmstudio-api'],
                offlineCapable: false,
                cacheableAssets: ['style.css', 'script.js'],
                description: 'AI code generation via LMStudio API'
            },

            {
                id: 'stock-ticker',
                name: 'Stock Ticker',
                path: '../stock-ticker/stock-ticker.html',
                icon: 'fas fa-chart-line',
                category: 'finance',
                type: 'online',
                networkDependencies: ['fontawesome-cdn', 'alphavantage-api'],
                offlineCapable: false,
                cacheableAssets: ['style.css', 'script.js'],
                description: 'Real-time stock market data'
            },
            {
                id: 'calendar-sync',
                name: 'Calendar',
                path: '../calendar/calendar_sync.html',
                icon: 'fas fa-calendar-days',
                category: 'productivity',
                type: 'online',
                networkDependencies: ['fontawesome-cdn', 'google-apis'],
                offlineCapable: false,
                cacheableAssets: ['calendar_sync.js'],
                description: 'Google Calendar integration'
            },
            {
                id: 'life-board',
                name: 'Life Board',
                path: '../life-board/index.html',
                icon: 'fas fa-clipboard-user',
                category: 'lifestyle',
                type: 'hybrid',
                networkDependencies: ['fontawesome-cdn', 'hindu-calendar-cdn'],
                offlineCapable: true,
                cacheableAssets: ['styles.css', 'widget-manager.js', 'ui-render.js'],
                description: 'Personal dashboard with widgets'
            }
        ];
        apps.forEach(app => {
            this.appRegistry.set(app.id, app);
            this.assessAppNetworkRequirements(app);
        });

        // Additional complete apps
        const completeApps = [
            {
                id: 'send-money',
                name: 'Send Money',
                path: '../send-money/index.html',
                icon: 'fas fa-paper-plane',
                category: 'finance',
                type: 'online',
                networkDependencies: ['fontawesome-cdn', 'supabase'],
                offlineCapable: false,
                cacheableAssets: ['style.css', 'transfer.js'],
                description: 'Peer-to-peer secure fund transfers'
            },
            {
                id: 'birthday-card-generator',
                name: 'Birthday Card Generator',
                path: '../birthday-card-generator/index.html',
                icon: 'fas fa-gift',
                category: 'lifestyle',
                type: 'offline',
                networkDependencies: ['fontawesome-cdn'],
                offlineCapable: true,
                cacheableAssets: ['index.html', 'style.css', 'script.js'],
                description: 'Create custom birthday cards'
            },
            {
                id: 'calendar',
                name: 'Calendar',
                path: '../calendar/index.html',
                icon: 'fas fa-calendar-days',
                category: 'productivity',
                type: 'offline',
                networkDependencies: ['fontawesome-cdn'],
                offlineCapable: true,
                cacheableAssets: ['index.html', 'style.css', 'script.js'],
                description: 'Interactive calendar with event management'
            },
            {
                id: 'desktop',
                name: 'Desktop',
                path: '../desktop/desktop.html',
                icon: 'fas fa-desktop',
                category: 'system',
                type: 'offline',
                networkDependencies: ['fontawesome-cdn'],
                offlineCapable: true,
                cacheableAssets: ['desktop.html', 'desktop.css', 'desktop.js', 'app-classifier.js'],
                description: 'Web-based desktop environment'
            },
            {
                id: 'galactic-simulator',
                name: 'Galactic Simulator',
                path: '../galactic-simulator/index.html',
                icon: 'fas fa-rocket',
                category: 'entertainment',
                type: 'offline',
                networkDependencies: ['fontawesome-cdn'],
                offlineCapable: true,
                cacheableAssets: ['index.html', 'style.css', 'script.js'],
                description: '3D space simulation'
            },
            {
                id: 'music',
                name: 'Music Player',
                path: '../music/index.html',
                icon: 'fas fa-music',
                category: 'entertainment',
                type: 'offline',
                networkDependencies: ['fontawesome-cdn'],
                offlineCapable: true,
                cacheableAssets: ['index.html', 'style.css', 'script.js'],
                description: 'Simple music player'
            },
            {
                id: 'quote-and-catalog-generator',
                name: 'Quote & Catalog Generator',
                path: '../quote-and-catalog-generator/index.html',
                icon: 'fas fa-quote-left',
                category: 'productivity',
                type: 'offline',
                networkDependencies: ['fontawesome-cdn'],
                offlineCapable: true,
                cacheableAssets: ['index.html', 'style.css', 'script.js'],
                description: 'Generate quotes and catalogs'
            },
            {
                id: 'weather',
                name: 'Weather App',
                path: '../weather/weather-dashboard.html',
                icon: 'fas fa-cloud-sun',
                category: 'lifestyle',
                type: 'online',
                networkDependencies: ['fontawesome-cdn', 'weather-api'],
                offlineCapable: false,
                cacheableAssets: ['weather-dashboard.html', 'style.css', 'script.js'],
                description: 'Weather information'
            },
            {
                id: 'Healthy-kitchen',
                name: 'Healthy Kitchen',
                path: '../Healthy-kitchen/healthy-kitchen.html',
                icon: 'fas fa-utensils',
                category: 'lifestyle',
                type: 'offline',
                networkDependencies: ['fontawesome-cdn'],
                offlineCapable: true,
                cacheableAssets: ['index.html', 'style.css', 'script.js'],
                description: 'Kitchen management tool'
            },
            {
                id: 'spreadsheet-app',
                name: 'Spreadsheets',
                path: '../spreadsheet-app/index.html',
                icon: 'fas fa-table',
                category: 'productivity',
                type: 'offline',
                networkDependencies: ['fontawesome-cdn', 'sheetjs-cdn'],
                offlineCapable: true,
                cacheableAssets: ['index.html', 'style.css', 'script.js', 'data-model.js', 'formula-engine.js', 'grid-controller.js', 'grid-view.js', 'selection-controller.js', 'ui-controller.js'],
                description: 'Advanced spreadsheet application with formulas and charts'
            }
        ];
        completeApps.forEach(app => {
            this.appRegistry.set(app.id, app);
            this.assessAppNetworkRequirements(app);
        });

        // Incomplete apps
        const incompleteApps = [
            {
                id: 'kanban-board',
                name: 'Kanban Board',
                path: '../kanban-board/index.html',
                icon: 'fas fa-columns',
                category: 'productivity',
                type: 'offline',
                networkDependencies: ['fontawesome-cdn'],
                offlineCapable: true,
                cacheableAssets: ['style.css', 'script.js', 'index.html'],
                description: 'Project management tool (Incomplete)'
            },
            {
                id: 'mermaid-editor',
                name: 'Mermaid Editor',
                path: '../mermaid-editor/mermaid-live-editor.html',
                icon: 'fas fa-diagram-project',
                category: 'development',
                type: 'online',
                networkDependencies: ['fontawesome-cdn', 'mermaid-cdn', 'tailwind-cdn'],
                offlineCapable: false,
                cacheableAssets: ['mermaid-live-editor.html'],
                description: 'Create diagrams with Mermaid (Incomplete)'
            }
        ];
        incompleteApps.forEach(app => {
            this.appRegistry.set(app.id, app);
            this.assessAppNetworkRequirements(app);
        });

        // Newly added offline apps
        const extra = [
            {
                id: 'social-feed',
                name: 'Unified Social Feed',
                path: '../social-feed/index.html',
                icon: 'fas fa-hashtag',
                category: 'lifestyle',
                type: 'online',
                networkDependencies: ['fontawesome-cdn'],
                offlineCapable: false,
                cacheableAssets: ['index.html', 'style.css', 'script.js'],
                description: 'Unified social media feed for LinkedIn, X, Facebook, and Instagram.'
            },
            {
                id: 'p2p-calling',
                name: 'P2P Calling',
                path: '../p2p-calling/index.html',
                icon: 'fas fa-phone-volume',
                category: 'system',
                type: 'online',
                networkDependencies: ['fontawesome-cdn', 'peerjs'],
                offlineCapable: false,
                cacheableAssets: ['index.html', 'style.css', 'script.js'],
                description: 'Secure, peer-to-peer audio and video calling using WebRTC'
            },
            {
                id: 'whatsapp-web',
                name: 'WhatsApp',
                path: 'https://web.whatsapp.com',
                icon: 'fab fa-whatsapp',
                category: 'lifestyle',
                type: 'online',
                networkDependencies: ['fontawesome-cdn'],
                offlineCapable: false,
                cacheableAssets: [],
                description: 'WhatsApp Web client wrapper'
            },
            {
                id: 'telegram-web',
                name: 'Telegram',
                path: 'https://web.telegram.org',
                icon: 'fab fa-telegram',
                category: 'lifestyle',
                type: 'online',
                networkDependencies: ['fontawesome-cdn'],
                offlineCapable: false,
                cacheableAssets: [],
                description: 'Telegram Web client wrapper'
            },
            {
                id: 'community-board',
                name: 'Community Apps',
                path: '../community/index.html',
                icon: 'fas fa-users-viewfinder',
                category: 'system',
                type: 'online',
                networkDependencies: ['fontawesome-cdn', 'supabase'],
                offlineCapable: false,
                cacheableAssets: ['index.html', 'community.js'],
                description: 'Discover and submit community-driven applications.'
            },
            {
                id: 'pqc-education',
                name: 'PQC Explorer',
                path: '../pqc-education/index.html',
                icon: 'fas fa-shield-halved',
                category: 'system',
                type: 'offline',
                networkDependencies: ['fontawesome-cdn'],
                offlineCapable: true,
                cacheableAssets: ['index.html', 'script.js'],
                description: 'Post-Quantum Cryptography settings and education'
            },
            {
                id: 'timer',
                name: 'Timer',
                path: '../timer/index.html',
                icon: 'fas fa-stopwatch',
                category: 'productivity',
                type: 'offline',
                networkDependencies: ['fontawesome-cdn'],
                offlineCapable: true,
                cacheableAssets: ['style.css', 'script.js', 'index.html'],
                description: 'Countdown and Pomodoro timer'
            },
            {
                id: 'api-key-manager',
                name: 'API Key Manager',
                path: '../api-key-manager/index.html',
                icon: 'fas fa-key',
                category: 'system',
                type: 'hybrid',
                networkDependencies: ['fontawesome-cdn'],
                offlineCapable: true,
                cacheableAssets: ['index.html', 'style.css', 'script.js'],
                description: 'Centralized storage for API keys (OpenAI, Gemini, Alpha Vantage, LMStudio)'
            },
            {
                id: 'markdown-editor',
                name: 'Markdown Editor',
                path: '../markdown-editor/index.html',
                icon: 'fas fa-file-lines',
                category: 'productivity',
                type: 'offline',
                networkDependencies: ['fontawesome-cdn'],
                offlineCapable: true,
                cacheableAssets: ['style.css', 'script.js', 'index.html'],
                description: 'Live preview markdown editor with export'
            },
            {
                id: 'python-ide',
                name: 'Data Science Workspace',
                path: '../python-IDE/index.html',
                icon: 'fas fa-flask-vial',
                category: 'development',
                type: 'offline',
                networkDependencies: ['fontawesome-cdn'],
                offlineCapable: true,
                cacheableAssets: ['style.css', 'script.js', 'index.html'],
                description: 'Unified Data Science IDE with Pyodide and Package Manager'
            },
            {
                id: 'investment-board',
                name: 'Investment Board',
                path: '../investment-board/index.html',
                icon: 'fas fa-coins',
                category: 'finance',
                type: 'offline',
                networkDependencies: ['fontawesome-cdn'],
                offlineCapable: true,
                cacheableAssets: ['style.css', 'script.js', 'index.html'],
                description: 'Starter investment planning app'
            },

            {
                id: 'pomodoro-timer',
                name: 'Pomodoro Timer',
                path: '../pomodoro-timer/index.html',
                icon: 'fas fa-hourglass-half',
                category: 'productivity',
                type: 'offline',
                networkDependencies: ['fontawesome-cdn'],
                offlineCapable: true,
                cacheableAssets: ['style.css', 'script.js', 'index.html'],
                description: 'Starter pomodoro timer app'
            },
            {
                id: 'home-diagnostics',
                name: 'Home Diagnostics',
                path: '../home-diagnostics/index.html',
                icon: 'fas fa-stethoscope',
                category: 'health',
                type: 'hybrid',
                networkDependencies: ['fontawesome-cdn'],
                offlineCapable: true,
                cacheableAssets: ['index.html', 'style.css', 'script.js', 'manifest.json', 'service-worker.js', 'db.js', 'remedies.js', 'care.js', 'sw-register.js'],
                description: 'Assess symptoms, track vitals/diary, natural remedies, and find nearby care'
            },
            {
                id: 'portfolio-manager',
                name: 'Portfolio Manager',
                path: '../portfolio-manager/index.html',
                icon: 'fas fa-briefcase',
                category: 'finance',
                type: 'offline',
                networkDependencies: ['fontawesome-cdn'],
                offlineCapable: true,
                cacheableAssets: ['style.css', 'script.js', 'index.html'],
                description: 'Starter portfolio tracking app'
            },
            {
                id: 'stock-screener',
                name: 'Stock Screener',
                path: '../stock-screener/index.html',
                icon: 'fas fa-search-dollar',
                category: 'finance',
                type: 'online',
                networkDependencies: ['fontawesome-cdn', 'alphavantage-api'],
                offlineCapable: false,
                cacheableAssets: ['index.html', 'style.css', 'script.js'],
                description: 'Screen stocks with RSI and market selection using Alpha Vantage'
            },

            {
                id: 'patent-researcher',
                name: 'Patent Researcher',
                path: '../patent-researcher/index.html',
                icon: 'fas fa-lightbulb',
                category: 'productivity',
                type: 'online',
                networkDependencies: ['fontawesome-cdn'],
                offlineCapable: false,
                cacheableAssets: ['index.html', 'style.css', 'script.js'],
                description: 'Takes a synopsis and finds relevant patent documents using OpenAI/Gemini generated queries'
            },
            {
                id: 'currency-converter',
                name: 'Currency Converter',
                path: '../currency-converter/index.html',
                icon: 'fas fa-money-bill-transfer',
                category: 'finance',
                type: 'online',
                networkDependencies: ['fontawesome-cdn', 'exchangerate-api'],
                offlineCapable: true,
                cacheableAssets: ['index.html', 'style.css', 'script.js'],
                description: 'Real-time currency converter with offline backup'
            },
            {
                id: 'web-browser',
                name: 'Web Browser',
                path: '../browser-ui/browser.html', // This path dictates what opens from Desktop icon
                icon: 'fab fa-chrome', // Using a generic browser icon
                category: 'system',
                type: 'online',
                networkDependencies: ['fontawesome-cdn'],
                offlineCapable: false,
                cacheableAssets: [],
                description: 'Chromium-based Web Browser'
            },
            {
                id: 'yoga',
                name: 'Yoga & Wellness',
                path: '../yoga/index.html',
                icon: 'fas fa-spa',
                category: 'health',
                type: 'offline',
                networkDependencies: ['fontawesome-cdn'],
                offlineCapable: true,
                cacheableAssets: ['index.html'],
                description: 'Guided yoga poses and wellness routines'
            },
            {
                id: 'grocery',
                name: 'Grocery List',
                path: '../grocery/index.html',
                icon: 'fas fa-cart-shopping',
                category: 'lifestyle',
                type: 'offline',
                networkDependencies: ['fontawesome-cdn'],
                offlineCapable: true,
                cacheableAssets: ['index.html'],
                description: 'Smart grocery list manager'
            },
            {
                id: 'vpn',
                name: 'VPN',
                path: '../vpn/index.html',
                icon: 'fas fa-shield-virus',
                category: 'system',
                type: 'online',
                networkDependencies: ['fontawesome-cdn'],
                offlineCapable: false,
                cacheableAssets: ['index.html', 'style.css', 'script.js'],
                description: 'Virtual Private Network with global server selection'
            },
            {
                id: 'openfang',
                name: 'OpenFang AI',
                path: '../openfang/index.html',
                icon: 'fas fa-robot',
                category: 'system',
                type: 'online',
                networkDependencies: ['fontawesome-cdn'],
                offlineCapable: false,
                cacheableAssets: ['index.html', 'style.css', 'script.js'],
                description: 'AI model configuration and LLM integration hub for Skand Browser'
            }
        ].forEach(app => {
            this.appRegistry.set(app.id, app);
            this.assessAppNetworkRequirements(app);
        });

        // Mermaid Editor (online due to CDNs, no offline fallback yet)
        const mermaidApp = {
            id: 'mermaid-editor',
            name: 'Mermaid Editor',
            path: '../mermaid-editor/mermaid-live-editor.html',
            icon: 'fas fa-diagram-project',
            category: 'development',
            type: 'online',
            networkDependencies: ['fontawesome-cdn', 'mermaid-cdn', 'tailwind-cdn'],
            offlineCapable: false,
            cacheableAssets: ['mermaid-live-editor.html'],
            description: 'Live Mermaid diagram editor with export'
        };
        this.appRegistry.set(mermaidApp.id, mermaidApp);
        this.assessAppNetworkRequirements(mermaidApp);

        // Load custom community installed apps
        try {
            const customApps = JSON.parse(localStorage.getItem('custom_installed_apps')) || [];
            customApps.forEach(app => {
                const customEntry = {
                    id: app.id,
                    name: app.name,
                    path: app.path,
                    icon: app.icon || 'fas fa-rocket',
                    category: 'community',
                    type: 'online',
                    networkDependencies: [],
                    offlineCapable: false,
                    cacheableAssets: [],
                    description: app.description || 'Community submitted app',
                    isCustom: true
                };
                this.appRegistry.set(customEntry.id, customEntry);
                this.assessAppNetworkRequirements(customEntry);
            });
        } catch (e) {
            console.error('Error loading custom community apps', e);
        }
    }

    assessAppNetworkRequirements(app) {
        const requirements = {
            essential: [],
            optional: [],
            fallbacks: []
        };

        app.networkDependencies.forEach(dep => {
            switch (dep) {
                case 'fontawesome-cdn':
                    requirements.optional.push({
                        url: 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta3/css/all.min.css',
                        fallback: 'local-icons',
                        size: '1.2MB',
                        critical: false
                    });
                    break;
                case 'sheetjs-cdn':
                    requirements.essential.push({
                        url: 'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js',
                        fallback: 'basic-csv-export',
                        size: '800KB',
                        critical: true
                    });
                    break;
                case 'google-apis':
                    requirements.essential.push({
                        url: 'https://apis.google.com/js/api.js',
                        fallback: 'local-calendar-only',
                        size: '300KB',
                        critical: true
                    });
                    break;
                case 'alphavantage-api':
                    requirements.essential.push({
                        url: 'https://www.alphavantage.co/query',
                        fallback: 'cached-data',
                        size: 'variable',
                        critical: true
                    });
                    break;
                case 'lmstudio-api':
                    requirements.essential.push({
                        url: 'http://localhost:1234',
                        fallback: 'template-responses',
                        size: 'variable',
                        critical: true
                    });
                    break;
                case 'hindu-calendar-cdn':
                    requirements.optional.push({
                        url: 'https://cdn.jsdelivr.net/npm/hindu-lunar-calendar@1.0.0/dist/hindu-lunar.umd.min.js',
                        fallback: 'basic-calendar',
                        size: '150KB',
                        critical: false
                    });
                    break;
                case 'mermaid-cdn':
                    requirements.essential.push({
                        url: 'https://cdn.jsdelivr.net/npm/mermaid@9.1.3/dist/mermaid.min.js',
                        fallback: 'basic-svg-export',
                        size: '200KB',
                        critical: true
                    });
                    break;
                case 'tailwind-cdn':
                    requirements.optional.push({
                        url: 'https://cdn.jsdelivr.net/npm/tailwindcss@3.0.23/dist/tailwind.min.css',
                        fallback: 'basic-styles',
                        size: '100KB',
                        critical: false
                    });
                    break;
            }
        });

        this.networkRequirements.set(app.id, requirements);
    }

    getAppsByType(type) {
        return Array.from(this.appRegistry.values()).filter(app => app.type === type);
    }

    getOfflineCapableApps() {
        return Array.from(this.appRegistry.values()).filter(app => app.offlineCapable);
    }

    getNetworkDependentApps() {
        return Array.from(this.appRegistry.values()).filter(app => !app.offlineCapable);
    }

    assessOfflineReadiness(appId) {
        const app = this.appRegistry.get(appId);
        if (!app) return null;

        const requirements = this.networkRequirements.get(appId);
        const readiness = {
            canWorkOffline: app.offlineCapable,
            missingAssets: [],
            availableFallbacks: [],
            recommendations: []
        };

        // Check if essential dependencies are cached
        requirements.essential.forEach(req => {
            if (!this.isAssetCached(req.url)) {
                readiness.missingAssets.push(req);
                if (req.fallback) {
                    readiness.availableFallbacks.push(req.fallback);
                }
            }
        });

        // Generate recommendations
        if (readiness.missingAssets.length > 0) {
            readiness.recommendations.push('Cache essential dependencies for offline use');
        }

        if (app.type === 'hybrid' && readiness.missingAssets.length === 0) {
            readiness.recommendations.push('App can work in limited offline mode');
        }

        return readiness;
    }

    isAssetCached(url) {
        // Check if asset is available in cache or local storage
        return window.dataManager?.getCacheData(btoa(url)) !== null;
    }

    updateDesktopIcons() {
        // Add visual indicators to desktop icons based on network status
        const appGrid = document.getElementById('app-grid');
        if (!appGrid) return;

        const icons = appGrid.querySelectorAll('.app-icon');
        icons.forEach(icon => {
            const appName = icon.getAttribute('data-name');
            const app = Array.from(this.appRegistry.values())
                .find(a => a.name === appName);

            if (app) {
                this.addNetworkIndicator(icon, app);
            }
        });
    }

    addNetworkIndicator(iconElement, app) {
        // Remove existing indicators
        const existingIndicator = iconElement.querySelector('.network-indicator');
        if (existingIndicator) {
            existingIndicator.remove();
        }

        // Create new indicator
        const indicator = document.createElement('div');
        indicator.className = 'network-indicator';

        let indicatorClass = '';
        let title = '';

        switch (app.type) {
            case 'offline':
                indicatorClass = 'offline-app';
                title = 'Works offline';
                indicator.innerHTML = '📱';
                break;
            case 'online':
                indicatorClass = 'online-app';
                title = 'Requires internet';
                indicator.innerHTML = '🌐';
                break;
            case 'hybrid':
                indicatorClass = 'hybrid-app';
                title = 'Limited offline mode';
                indicator.innerHTML = '🔄';
                break;
        }

        indicator.className += ` ${indicatorClass}`;
        indicator.title = title;
        iconElement.appendChild(indicator);
    }

    generateOfflinePackage() {
        const offlineApps = this.getOfflineCapableApps();
        const package_info = {
            version: '1.0.0',
            generated: new Date().toISOString(),
            apps: offlineApps.map(app => ({
                id: app.id,
                name: app.name,
                assets: app.cacheableAssets,
                dependencies: this.networkRequirements.get(app.id)?.optional || []
            })),
            totalSize: this.calculatePackageSize(offlineApps),
            instructions: [
                '1. Download all listed assets',
                '2. Store in local cache or service worker',
                '3. Update app paths to use local assets',
                '4. Test offline functionality'
            ]
        };

        return package_info;
    }

    calculatePackageSize(apps) {
        let totalSize = 0;
        apps.forEach(app => {
            const requirements = this.networkRequirements.get(app.id);
            if (requirements) {
                [...requirements.essential, ...requirements.optional].forEach(req => {
                    if (req.size && req.size !== 'variable') {
                        const sizeNum = parseFloat(req.size);
                        if (req.size.includes('MB')) {
                            totalSize += sizeNum * 1024;
                        } else if (req.size.includes('KB')) {
                            totalSize += sizeNum;
                        }
                    }
                });
            }
        });
        return `${Math.round(totalSize)}KB`;
    }

    getAppClassification() {
        return {
            offline: this.getAppsByType('offline'),
            online: this.getAppsByType('online'),
            hybrid: this.getAppsByType('hybrid'),
            summary: {
                total: this.appRegistry.size,
                offline_capable: this.getOfflineCapableApps().length,
                network_dependent: this.getNetworkDependentApps().length
            }
        };
    }
}

// Initialize app classifier
window.appClassifier = new AppClassifier();

// Expose global functions
window.getAppClassification = () => window.appClassifier.getAppClassification();
window.getOfflineReadiness = (appId) => window.appClassifier.assessOfflineReadiness(appId);
window.generateOfflinePackage = () => window.appClassifier.generateOfflinePackage();
