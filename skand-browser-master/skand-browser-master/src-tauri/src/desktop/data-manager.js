// Centralized Data Manager for Desktop App Suite
class DataManager {
    constructor() {
        this.storagePrefix = 'desktop_app_';
        this.eventBus = new EventTarget();
        this.syncQueue = [];
        this.schemas = this.initSchemas();
        this.memoryStore = {}; // New in-memory store backed by Rust
        this.init();
    }

    async init() {
        // Fetch all data from Rust Backend
        try {
            const response = await fetch('/api/data');
            if (response.ok) {
                this.memoryStore = await response.json();
            }
        } catch (e) {
            console.warn("Failed to connect to Rust Data Manager fallback", e);
        }

        // Periodic sync for queued operations and polling
        setInterval(() => this.pollRustBackend(), 2000);

        // Initialize cross-app data structures
        this.initializeCrossAppData();
    }

    async pollRustBackend() {
        try {
            const response = await fetch('/api/data');
            if (response.ok) {
                const newData = await response.json();
                // Simple event trigger finding if data changed
                for (let key in newData) {
                    if (this.memoryStore[key] !== newData[key]) {
                        this.memoryStore[key] = newData[key];
                        this.broadcastDataChange(key.replace(this.storagePrefix, ''), JSON.parse(newData[key]).value, 'external_change', 'rust_backend');
                    }
                }
            }
        } catch (e) {
            // Silently ignore polling errors
        }
        this.processSyncQueue();
    }

    initSchemas() {
        return {
            user_profile: {
                name: '',
                preferences: {},
                settings: {},
                created_at: Date.now()
            },
            shared_notes: {
                id: '',
                title: '',
                content: '',
                tags: [],
                app_source: '',
                created_at: Date.now(),
                updated_at: Date.now()
            },
            task_data: {
                id: '',
                title: '',
                description: '',
                status: 'pending',
                priority: 'medium',
                due_date: null,
                app_source: '',
                created_at: Date.now()
            },
            app_usage: {
                app_name: '',
                last_accessed: Date.now(),
                usage_count: 0,
                time_spent: 0
            },
            cross_app_cache: {
                key: '',
                value: null,
                expiry: Date.now() + (24 * 60 * 60 * 1000),
                app_source: ''
            }
        };
    }

    initializeCrossAppData() {
        // Initialize shared data structures if they don't exist
        if (!this.getData('user_profile')) {
            this.setData('user_profile', this.schemas.user_profile);
        }

        if (!this.getData('shared_notes_index')) {
            this.setData('shared_notes_index', []);
        }

        if (!this.getData('cross_app_tasks')) {
            this.setData('cross_app_tasks', []);
        }

        // Initialize centralized API keys object
        if (!this.getData('api_keys')) {
            this.setData('api_keys', {
                openai: { apiKey: '', model: 'gpt-4o-mini', baseUrl: 'https://api.openai.com/v1' },
                gemini: { apiKey: '', model: 'gemini-1.5-flash', baseUrl: 'https://generativelanguage.googleapis.com' },
                lmstudio: { baseUrl: 'http://localhost:1234', model: '' },
                alphavantage: { apiKey: '' }
            });
        }
    }

    // Core storage operations
    setData(key, value, appSource = 'desktop') {
        const fullKey = this.storagePrefix + key;
        const dataWrapper = {
            value,
            timestamp: Date.now(),
            app_source: appSource,
            version: 1
        };

        const stringified = JSON.stringify(dataWrapper);
        this.memoryStore[fullKey] = stringified; // Synchronous availability

        // Asynchronous Rust Post
        fetch('/api/data', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ key: fullKey, value: stringified })
        }).catch(() => {
            this.queueSync(key, value, 'set', appSource);
        });

        this.broadcastDataChange(key, value, 'set', appSource);
        return true;
    }

    getData(key, defaultValue = null) {
        const fullKey = this.storagePrefix + key;
        try {
            const stored = this.memoryStore[fullKey];
            if (stored) {
                const parsed = JSON.parse(stored);
                return parsed.value;
            }
        } catch (error) {
            console.error('Failed to get data:', error);
        }
        return defaultValue;
    }

    updateData(key, updateFunction, appSource = 'desktop') {
        const currentData = this.getData(key);
        if (currentData !== null) {
            const updatedData = updateFunction(currentData);
            return this.setData(key, updatedData, appSource);
        }
        return false;
    }

    deleteData(key, appSource = 'desktop') {
        const fullKey = this.storagePrefix + key;
        delete this.memoryStore[fullKey];

        // We haven't implemented DELETE in Rust yet, so for now we push empty string
        fetch('/api/data', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ key: fullKey, value: "" })
        }).catch(e => console.error(e));

        this.broadcastDataChange(key, null, 'delete', appSource);
    }

    // Cross-app specific methods
    shareNote(note, fromApp) {
        const noteId = 'note_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        const sharedNote = {
            ...this.schemas.shared_notes,
            id: noteId,
            title: note.title || 'Untitled',
            content: note.content || '',
            tags: note.tags || [],
            app_source: fromApp
        };

        const notes = this.getData('shared_notes_index', []);
        notes.push(sharedNote);
        this.setData('shared_notes_index', notes, fromApp);

        return noteId;
    }

    getSharedNotes(filterByApp = null) {
        const notes = this.getData('shared_notes_index', []);
        if (filterByApp) {
            return notes.filter(note => note.app_source === filterByApp);
        }
        return notes;
    }

    addCrossAppTask(task, fromApp) {
        const taskId = 'task_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        const crossAppTask = {
            ...this.schemas.task_data,
            id: taskId,
            title: task.title || task.name || 'Untitled Task',
            description: task.description || '',
            status: task.status || 'pending',
            priority: task.priority || 'medium',
            due_date: task.due_date || null,
            app_source: fromApp
        };

        const tasks = this.getData('cross_app_tasks', []);
        tasks.push(crossAppTask);
        this.setData('cross_app_tasks', tasks, fromApp);

        return taskId;
    }

    getCrossAppTasks(status = null) {
        const tasks = this.getData('cross_app_tasks', []);
        if (status) {
            return tasks.filter(task => task.status === status);
        }
        return tasks;
    }

    updateTaskStatus(taskId, newStatus, fromApp) {
        return this.updateData('cross_app_tasks', (tasks) => {
            return tasks.map(task =>
                task.id === taskId
                    ? { ...task, status: newStatus, updated_at: Date.now() }
                    : task
            );
        }, fromApp);
    }

    // App usage tracking
    trackAppUsage(appName, timeSpent = 0) {
        const usageKey = 'app_usage_' + appName;
        const currentUsage = this.getData(usageKey, {
            ...this.schemas.app_usage,
            app_name: appName
        });

        currentUsage.last_accessed = Date.now();
        currentUsage.usage_count += 1;
        currentUsage.time_spent += timeSpent;

        this.setData(usageKey, currentUsage, appName);
    }

    getAppUsageStats() {
        const stats = {};
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key.startsWith(this.storagePrefix + 'app_usage_')) {
                const appName = key.replace(this.storagePrefix + 'app_usage_', '');
                stats[appName] = this.getData('app_usage_' + appName);
            }
        }
        return stats;
    }

    // Cache management
    setCacheData(key, value, expiryHours = 24, appSource = 'desktop') {
        const cacheData = {
            ...this.schemas.cross_app_cache,
            key,
            value,
            expiry: Date.now() + (expiryHours * 60 * 60 * 1000),
            app_source: appSource
        };

        this.setData('cache_' + key, cacheData, appSource);
    }

    getCacheData(key) {
        const cacheData = this.getData('cache_' + key);
        if (cacheData && cacheData.expiry > Date.now()) {
            return cacheData.value;
        } else if (cacheData) {
            this.deleteData('cache_' + key);
        }
        return null;
    }

    // Centralized API Key storage
    setApiKey(provider, payload, appSource = 'desktop') {
        // provider: 'openai' | 'gemini' | 'lmstudio' | 'alphavantage' | string
        const keys = this.getData('api_keys', {});
        keys[provider] = { ...(keys[provider] || {}), ...payload };
        this.setData('api_keys', keys, appSource);
        return keys[provider];
    }

    getApiKey(provider) {
        const keys = this.getData('api_keys', {});
        return keys[provider] || null;
    }

    getAllApiKeys() {
        return this.getData('api_keys', {});
    }

    // Event handling
    broadcastDataChange(key, value, operation, appSource) {
        const event = new CustomEvent('dataChange', {
            detail: { key, value, operation, appSource, timestamp: Date.now() }
        });
        this.eventBus.dispatchEvent(event);

        // Also broadcast to other windows/tabs
        window.postMessage({
            type: 'DATA_CHANGE',
            key,
            value,
            operation,
            appSource,
            timestamp: Date.now()
        }, '*');
    }

    handleStorageChange(event) {
        if (event.key && event.key.startsWith(this.storagePrefix)) {
            const key = event.key.replace(this.storagePrefix, '');
            const newValue = event.newValue ? JSON.parse(event.newValue).value : null;

            this.broadcastDataChange(key, newValue, 'external_change', 'unknown');
        }
    }

    // Sync queue for offline operations
    queueSync(key, value, operation, appSource) {
        this.syncQueue.push({
            key,
            value,
            operation,
            appSource,
            timestamp: Date.now()
        });
    }

    processSyncQueue() {
        if (this.syncQueue.length === 0) return;

        const operations = [...this.syncQueue];
        this.syncQueue = [];

        operations.forEach(op => {
            try {
                if (op.operation === 'set') {
                    this.setData(op.key, op.value, op.appSource);
                } else if (op.operation === 'delete') {
                    this.deleteData(op.key, op.appSource);
                }
            } catch (error) {
                // Re-queue failed operations
                this.syncQueue.push(op);
            }
        });
    }

    // Data export/import
    exportAllData() {
        return JSON.stringify(this.memoryStore, null, 2);
    }

    importData(jsonData) {
        try {
            const data = JSON.parse(jsonData);
            Object.entries(data).forEach(([key, value]) => {
                if (key.startsWith(this.storagePrefix)) {
                    this.memoryStore[key] = value;
                    // Forward directly to backend
                    fetch('/api/data', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ key, value })
                    }).catch(e => console.error(e));
                }
            });
            return true;
        } catch (error) {
            console.error('Failed to import data:', error);
            return false;
        }
    }

    // Event subscription for apps
    subscribe(callback) {
        this.eventBus.addEventListener('dataChange', callback);
        return () => this.eventBus.removeEventListener('dataChange', callback);
    }
}

// Initialize global data manager
window.dataManager = new DataManager();

// Expose convenient global functions
window.setAppData = (key, value, app) => window.dataManager.setData(key, value, app);
window.getAppData = (key, defaultValue) => window.dataManager.getData(key, defaultValue);
window.shareNote = (note, app) => window.dataManager.shareNote(note, app);
window.addCrossAppTask = (task, app) => window.dataManager.addCrossAppTask(task, app);
window.trackAppUsage = (app, time) => window.dataManager.trackAppUsage(app, time);
// API key helpers
window.setApiKey = (provider, payload, app) => window.dataManager.setApiKey(provider, payload, app);
window.getApiKey = (provider) => window.dataManager.getApiKey(provider);
window.getAllApiKeys = () => window.dataManager.getAllApiKeys();
