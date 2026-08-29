const { contextBridge, ipcRenderer } = require('electron');

// ─────────────────────────────────────────────────────────────────────────────
// UltraSudo — Preload Bridge
// Exposes secure IPC methods to the renderer process via contextBridge
// ─────────────────────────────────────────────────────────────────────────────

contextBridge.exposeInMainWorld('ultraSudo', {
    // ── File System ──
    saveFile: (filename, content) => ipcRenderer.invoke('save-file', { filename, content }),
    openFile: (options) => ipcRenderer.invoke('open-file', options),
    readData: (key) => ipcRenderer.invoke('read-data', { key }),
    writeData: (key, data) => ipcRenderer.invoke('write-data', { key, data }),

    // ── Auth Session ──
    getAuthSession: () => ipcRenderer.invoke('get-auth-session'),
    setAuthSession: (sessionData) => ipcRenderer.invoke('set-auth-session', sessionData),
    clearAuthSession: () => ipcRenderer.invoke('clear-auth-session'),

    // ── Platform Info ──
    platform: process.platform,
    isElectron: true
});
