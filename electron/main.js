const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const { spawn } = require('child_process');

let mainWindow;
let backendProcess;

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1280,
        height: 800,
        minWidth: 800,
        minHeight: 600,
        title: 'Skand Browser',
        icon: path.join(__dirname, '../images/icon.png'),
        webPreferences: {
            nodeIntegration: false, // Security best practice
            contextIsolation: true, // Security best practice
            sandbox: true, // Enforce Chromium sandbox for renderer
            webviewTag: true, // Enable <webview> for Phase 3 Browser
            preload: path.join(__dirname, 'preload.js'),
            // Enable web security to enforce CORS/isolation, 
            // but we might need to adjust for local file loading depending on complex app needs
            webSecurity: true
        }
    });

    // Wait briefly for Rust Server to boot, then load the new Browser UI
    setTimeout(() => {
        mainWindow.loadFile(path.join(__dirname, '../browser-ui/browser.html'));
    }, 1500);

    // Hide the default menu bar for a more "app-like" feel
    mainWindow.setMenuBarVisibility(false);

    // mainWindow.webContents.openDevTools();
}

function spawnRustBackend() {
    const isWin = process.platform === "win32";
    const binaryName = isWin ? 'system-manager.exe' : 'system-manager';
    // When packaged with electron-builder, the structure changes
    // But since `npm start` runs from project root `electron .` or inside `app.asar`,
    // it's safest to assume the binary is alongside the electron folder or in resources for a production build
    const devPath = path.join(__dirname, '../system-manager/target/release', binaryName);

    // Attempt to spawn the backend process
    backendProcess = spawn(devPath, [], {
        cwd: path.join(__dirname, '../system-manager'),
        stdio: 'inherit' // Pipe logs to electron console
    });

    backendProcess.on('error', (err) => {
        console.error('Failed to start Rust Backend:', err);
    });
}

app.whenReady().then(() => {
    spawnRustBackend();
    createWindow();

    app.on('activate', function () {
        if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
});

app.on('will-quit', () => {
    if (backendProcess) {
        backendProcess.kill('SIGTERM');
    }
});

app.on('window-all-closed', function () {
    if (process.platform !== 'darwin') app.quit();
});

// --- IPC Handlers (Replacing Python Local Backend) ---

// Handle saving files locally (replacing service_manager logic)
ipcMain.handle('save-file', async (event, { filename, content }) => {
    try {
        const { canceled, filePath } = await dialog.showSaveDialog(mainWindow, {
            defaultPath: filename,
            title: 'Save File'
        });

        if (canceled || !filePath) return { ok: false, error: 'Cancelled' };

        fs.writeFileSync(filePath, content, 'utf-8');
        return { ok: true, filePath };
    } catch (error) {
        console.error('Save error:', error);
        return { ok: false, error: error.message };
    }
});

// Handle reading files locally
ipcMain.handle('open-file', async (event, options) => {
    try {
        const { canceled, filePaths } = await dialog.showOpenDialog(mainWindow, {
            properties: ['openFile'],
            filters: options?.filters || [{ name: 'All Files', extensions: ['*'] }]
        });

        if (canceled || filePaths.length === 0) return { ok: false, error: 'Cancelled' };

        const content = fs.readFileSync(filePaths[0], 'utf-8');
        return { ok: true, content, filePath: filePaths[0] };
    } catch (error) {
        console.error('Open error:', error);
        return { ok: false, error: error.message };
    }
});
