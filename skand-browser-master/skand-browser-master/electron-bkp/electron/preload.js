const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
    saveFile: (data) => ipcRenderer.invoke('save-file', data),
    openFile: (options) => ipcRenderer.invoke('open-file', options)
});
