const { contextBridge, ipcRenderer } = require('electron');

/**
 * Electron Preload — exposes a secure bridge from renderer to main process.
 * This mirrors the Tauri IPC API surface so shared code can call
 * window.electronAPI or window.__TAURI__ depending on the runtime.
 */
contextBridge.exposeInMainWorld('electronAPI', {
    // File operations (used by Notebook app, etc.)
    saveFile: (data)    => ipcRenderer.invoke('save-file', data),
    openFile: (options) => ipcRenderer.invoke('open-file', options),

    // Data persistence — mirrors Tauri's read_data / write_data commands
    readData:  (key)         => ipcRenderer.invoke('read-data',  { key }),
    writeData: (key, data)   => ipcRenderer.invoke('write-data', { key, data }),

    // Environment detection
    isElectron: true,
    platform: process.platform,   // 'win32' | 'linux' | 'darwin'
});
