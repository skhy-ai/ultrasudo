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
        // Hydrate from localStorage with PQC Decryption
        await this.hydrateFromLocalStorage();

        // Fetch all data from Rust Backend
        try {
            if (window.__TAURI__) {
                const rustData = await window.__TAURI__.core.invoke('read_data');
                Object.assign(this.memoryStore, rustData);
            }
        } catch (e) {
            console.warn("Failed to connect to Rust Data Manager fallback", e);
        }

        // Periodic sync for queued operations and polling
        setInterval(() => this.pollRustBackend(), 2000);

        // Initialize cross-app data structures
        this.initializeCrossAppData();
    }

    // --- PQC Encryption Methods ---
    async derivePQCKey() {
        const hex = localStorage.getItem('pqc_device_key');
        if (!hex) throw new Error("Missing PQC device key");
        const raw = new Uint8Array(hex.match(/.{1,2}/g).map(byte => parseInt(byte, 16)));
        return await crypto.subtle.importKey(
            "raw", raw, { name: "AES-GCM" }, false, ["encrypt", "decrypt"]
        );
    }

    async pqcEncrypt(plainText) {
        if (!plainText || localStorage.getItem('enable_pqc') !== 'true') return plainText;
        try {
            const key = await this.derivePQCKey();
            const iv = crypto.getRandomValues(new Uint8Array(12));
            const enc = new TextEncoder().encode(plainText);
            const cipher = await crypto.subtle.encrypt({ name: "AES-GCM", iv: iv }, key, enc);

            const cipherArr = new Uint8Array(cipher);
            const combined = new Uint8Array(iv.length + cipherArr.length);
            combined.set(iv);
            combined.set(cipherArr, iv.length);
            return 'PQC:v1:' + btoa(String.fromCharCode(...combined));
        } catch (e) {
            console.error("Local PQC Encryption failed", e);
            throw new Error("PQC Encryption aborted");
        }
    }

    async pqcDecrypt(cipherText) {
        if (!cipherText || localStorage.getItem('enable_pqc') !== 'true' || !cipherText.startsWith('PQC:v1:')) return cipherText;
        try {
            const key = await this.derivePQCKey();
            const combinedRaw = atob(cipherText.substring(7));
            const combined = new Uint8Array(combinedRaw.length);
            for (let i = 0; i < combinedRaw.length; i++) combined[i] = combinedRaw.charCodeAt(i);

            const iv = combined.slice(0, 12);
            const data = combined.slice(12);

            const plain = await crypto.subtle.decrypt({ name: "AES-GCM", iv: iv }, key, data);
            return new TextDecoder().decode(plain);
        } catch (e) {
            console.error("Local PQC Decryption failed", e);
            return cipherText;
        }
    }

    async hydrateFromLocalStorage() {
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key.startsWith(this.storagePrefix)) {
                const encryptedVal = localStorage.getItem(key);
                const decryptedStr = await this.pqcDecrypt(encryptedVal);
                this.memoryStore[key] = decryptedStr;
            }
        }
    }

    async pollRustBackend() {
        try {
            if (window.__TAURI__) {
                const newData = await window.__TAURI__.core.invoke('read_data');
                // Simple event trigger finding if data changed
                for (let key in newData) {
                    if (this.memoryStore[key] !== newData[key]) {
                        this.memoryStore[key] = newData[key];
                        const parsedStr = newData[key];
                        if (parsedStr) {
                            try {
                                this.broadcastDataChange(key.replace(this.storagePrefix, ''), JSON.parse(parsedStr).value, 'external_change', 'rust_backend');
                            } catch (ignore) { }
                        }
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

        // Local Storage Persist with Encryption (Async)
        this.pqcEncrypt(stringified).then(encryptedStr => {
            localStorage.setItem(fullKey, encryptedStr);
        }).catch(err => console.error("Failed to encrypt and store locally:", err));

        // Asynchronous Rust Post
        if (window.__TAURI__) {
            window.__TAURI__.core.invoke('write_data', { key: fullKey, value: stringified }).catch(() => {
                this.queueSync(key, value, 'set', appSource);
            });
        }

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

        // Ensure deleted from local disk
        localStorage.removeItem(fullKey);

        if (window.__TAURI__) {
            window.__TAURI__.core.invoke('write_data', { key: fullKey, value: "" }).catch(e => console.error(e));
        }

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

    // --- Application History Management ---
    saveHistory(appName, entry) {
        if (!appName) return null;
        const key = 'history_' + appName;
        const historyList = this.getData(key, []);
        
        const record = {
            id: 'hist_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
            timestamp: Date.now(),
            appName: appName,
            ...(typeof entry === 'object' && entry !== null ? entry : { data: entry })
        };

        // Keep most recent first, cap at 100 items per app
        historyList.unshift(record);
        if (historyList.length > 100) {
            historyList.length = 100;
        }

        this.setData(key, historyList, appName);
        return record;
    }

    getHistory(appName, limit = 50) {
        if (!appName) return [];
        const historyList = this.getData('history_' + appName, []);
        return Array.isArray(historyList) ? historyList.slice(0, limit) : [];
    }

    clearHistory(appName) {
        if (!appName) return;
        this.setData('history_' + appName, [], appName);
    }

    getAllHistory(limit = 100) {
        const allHistory = [];
        const prefix = this.storagePrefix + 'history_';
        
        const memoryKeys = Object.keys(this.memoryStore || {});
        const storageKeys = [];
        for (let i = 0; i < localStorage.length; i++) {
            const k = localStorage.key(i);
            if (k) storageKeys.push(k);
        }

        const keys = new Set([...memoryKeys, ...storageKeys]);

        for (const fullKey of keys) {
            if (fullKey.startsWith(prefix)) {
                const appName = fullKey.replace(prefix, '');
                const appHistory = this.getHistory(appName);
                if (Array.isArray(appHistory)) {
                    allHistory.push(...appHistory);
                }
            }
        }

        // Sort descending by timestamp
        allHistory.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
        return allHistory.slice(0, limit);
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
                    if (window.__TAURI__) {
                        window.__TAURI__.core.invoke('write_data', { key, value }).catch(e => console.error(e));
                    }
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
// Application history helpers
window.saveAppHistory = (appName, entry) => window.dataManager.saveHistory(appName, entry);
window.getAppHistory = (appName, limit) => window.dataManager.getHistory(appName, limit);
window.clearAppHistory = (appName) => window.dataManager.clearHistory(appName);
window.getAllAppHistory = (limit) => window.dataManager.getAllHistory(limit);

