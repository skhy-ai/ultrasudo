// Local Widget Storage
// Handles reading from and writing to a local widget-state.json file

// Expose the storage class globally
window.WidgetStorage = class LocalWidgetStorage {
    constructor() {
        this.STORAGE_KEY = 'widgetState';
        this.DEFAULT_STATE = {
            version: '1.0',
            widgets: [
                {
                    name: 'Todo List',
                    url: '../todo-list/index.html',
                    position: 'left'
                },
                {
                    name: 'Hindu Calendar',
                    url: 'hindu_calendar.html',
                    position: 'right'
                }
            ],
            settings: {
                defaultPosition: 'left'
            }
        };
        this.fileHandle = null;
    }

    // Initialize file handle
    async init() {
        try {
            if ('showOpenFilePicker' in window) {
                try {
                    const handle = await this.getFileHandle();
                    if (handle) {
                        this.fileHandle = handle;
                        return true;
                    }
                } catch (e) {
                    console.warn('File System Access API not supported or permission denied:', e);
                }
            }
            return false;
        } catch (error) {
            console.error('Error initializing file handle:', error);
            return false;
        }
    }

    // Get or create file handle
    async getFileHandle() {
        try {
            // Try to get existing handle
            const handleJson = localStorage.getItem('widgetStateFileHandle');
            if (handleJson) {
                const handles = await window.showOpenFilePicker({
                    multiple: false,
                    types: [{
                        description: 'JSON Files',
                        accept: {'application/json': ['.json']}
                    }]
                });
                return handles[0];
            }

            // Create new file if none exists
            const handle = await window.showSaveFilePicker({
                suggestedName: 'widget-state.json',
                types: [{
                    description: 'JSON File',
                    accept: {'application/json': ['.json']}
                }]
            });

            // Save handle for future use
            localStorage.setItem('widgetStateFileHandle', JSON.stringify({
                name: handle.name,
                kind: handle.kind
            }));

            // Initialize file with default state
            const writable = await handle.createWritable();
            await writable.write(JSON.stringify(this.DEFAULT_STATE, null, 2));
            await writable.close();

            return handle;
        } catch (error) {
            console.warn('Error getting file handle:', error);
            return null;
        }
    }

    // Load widget state
    async load() {
        try {
            // First try to load from file system
            try {
                // Try to get any existing file handle first
                if (this.fileHandle) {
                    const file = await this.fileHandle.getFile();
                    const contents = await file.text();
                    const data = JSON.parse(contents);
                    
                    if (data && data.version && Array.isArray(data.widgets)) {
                        console.log('Successfully loaded from file system');
                        return data;
                    }
                    console.warn('Invalid widget state format in file');
                }
                
                // If no file handle but file exists, try to read it directly
                const response = await fetch('widget-state.json');
                if (response.ok) {
                    const data = await response.json();
                    if (data && data.version && Array.isArray(data.widgets)) {
                        console.log('Successfully loaded from local JSON file');
                        return data;
                    }
                }
            } catch (e) {
                console.warn('Error reading from file system, trying fallback:', e);
            }

            // Fallback to localStorage
            const savedState = localStorage.getItem(this.STORAGE_KEY);
            if (savedState) {
                try {
                    const data = JSON.parse(savedState);
                    if (data && data.version && Array.isArray(data.widgets)) {
                        return data;
                    }
                } catch (e) {
                    console.warn('Error parsing saved state from localStorage:', e);
                }
            }

            // Try legacy storage key for backward compatibility
            const legacyState = localStorage.getItem('widgetState');
            if (legacyState) {
                try {
                    const data = JSON.parse(legacyState);
                    if (data && (data.widgets || data.version)) {
                        // Migrate to new storage key
                        localStorage.setItem(this.STORAGE_KEY, legacyState);
                        return data;
                    }
                } catch (e) {
                    console.warn('Error parsing legacy state from localStorage:', e);
                }
            }

            // Return default state if nothing else works
            return { ...this.DEFAULT_STATE };
        } catch (error) {
            console.error('Error loading widget state:', error);
            return { ...this.DEFAULT_STATE };
        }
    }

    // Save widget state
    async save(state) {
        try {
            const stateToSave = {
                ...state,
                version: '1.0',
                lastUpdated: new Date().toISOString()
            };
            const jsonData = JSON.stringify(stateToSave, null, 2);

            // Try to save to file system
            try {
                // If we have a file handle, use it
                if (this.fileHandle) {
                    const writable = await this.fileHandle.createWritable();
                    await writable.write(jsonData);
                    await writable.close();
                    console.log('Successfully saved to file system');
                    return true;
                }
                
                // Otherwise try to save using the File System Access API
                if ('showSaveFilePicker' in window) {
                    const handle = await window.showSaveFilePicker({
                        suggestedName: 'widget-state.json',
                        types: [{
                            description: 'JSON File',
                            accept: {'application/json': ['.json']}
                        }]
                    });
                    
                    const writable = await handle.createWritable();
                    await writable.write(jsonData);
                    await writable.close();
                    
                    // Store the file handle for future use
                    this.fileHandle = handle;
                    localStorage.setItem('widgetStateFileHandle', JSON.stringify({
                        name: handle.name,
                        kind: handle.kind
                    }));
                    
                    console.log('Successfully saved to new file');
                    return true;
                }
                
                console.warn('File System Access API not available, falling back to localStorage');
            } catch (e) {
                console.warn('Error saving to file system:', e);
            }

            // Fall back to localStorage if file operations fail
            console.log('Falling back to localStorage');
            localStorage.setItem(this.STORAGE_KEY, jsonData);
            return true;
        } catch (error) {
            console.error('Error saving widget state:', error);
            return false;
        }
    }

    // Reset to default state
    async resetToDefault() {
        const defaultState = { ...this.DEFAULT_STATE };
        await this.save(defaultState);
        return defaultState;
    }

    // Get widget list
    async getWidgets() {
        const state = await this.load();
        return [...state.widgets];
    }

    // Save widget list
    async saveWidgets(widgets) {
        const state = await this.load();
        state.widgets = [...widgets];
        return this.save(state);
    }

    // Get default position setting
    async getDefaultPosition() {
        const state = await this.load();
        return state.settings.defaultPosition || 'left';
    }

    // Set default position setting
    async setDefaultPosition(position) {
        const state = await this.load();
        state.settings.defaultPosition = position;
        return this.save(state);
    }
};

// Create and initialize the storage instance when the script loads
window.addEventListener('DOMContentLoaded', function() {
    const widgetStorage = new window.WidgetStorage();
    widgetStorage.init().then(() => {
        console.log('Widget storage initialized');
    }).catch(error => {
        console.error('Failed to initialize widget storage:', error);
    });
});
