const { app, BrowserWindow, ipcMain, dialog, shell } = require('electron');
const path = require('path');
const fs = require('fs');
const { spawn } = require('child_process');

// ─────────────────────────────────────────────────────────────────────────────
// CONFIGURATION
// ─────────────────────────────────────────────────────────────────────────────
const isDev = process.env.NODE_ENV === 'development' || process.env.ELECTRON_DEV === '1';
const VITE_DEV_URL = 'http://127.0.0.1:5173';
const DIST_INDEX   = path.join(__dirname, '../dist/index.html');

let mainWindow;
let backendProcess;

// ─────────────────────────────────────────────────────────────────────────────
// AUTH SESSION MANAGEMENT
// ─────────────────────────────────────────────────────────────────────────────
const AUTH_FILE = path.join(app.getPath('userData'), 'ultrasudo-auth.json');

function getStoredSession() {
    try {
        if (fs.existsSync(AUTH_FILE)) {
            const raw = fs.readFileSync(AUTH_FILE, 'utf-8');
            const data = JSON.parse(raw);
            // Check if session is expired
            if (data.expires_at && Date.now() / 1000 > data.expires_at) {
                fs.unlinkSync(AUTH_FILE);
                return null;
            }
            return data;
        }
    } catch (err) {
        console.warn('[UltraSudo] Error reading auth session:', err.message);
    }
    return null;
}

function saveSession(sessionData) {
    try {
        fs.writeFileSync(AUTH_FILE, JSON.stringify(sessionData, null, 2), 'utf-8');
    } catch (err) {
        console.error('[UltraSudo] Error saving auth session:', err.message);
    }
}

function clearSession() {
    try {
        if (fs.existsSync(AUTH_FILE)) {
            fs.unlinkSync(AUTH_FILE);
        }
    } catch (err) {
        console.error('[UltraSudo] Error clearing auth session:', err.message);
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// WINDOW CREATION
// ─────────────────────────────────────────────────────────────────────────────
function createWindow() {
    const iconPath = path.join(__dirname, '../images/icon.png');
    const iconExists = fs.existsSync(iconPath);

    mainWindow = new BrowserWindow({
        width:     1400,
        height:    900,
        minWidth:  900,
        minHeight: 600,
        title:     'UltraSudo',
        ...(iconExists && { icon: iconPath }),
        webPreferences: {
            nodeIntegration:  false,   // Security: no Node in renderer
            contextIsolation: true,    // Security: isolate renderer context
            sandbox:          false,   // Must be false to allow preload scripts with contextBridge
            webviewTag:       true,    // Allow <webview> for in-app browser tabs
            preload:          path.join(__dirname, 'preload.cjs'),
            webSecurity:      false,   // Allow cross-origin requests for local dev (iframe apps)
        }
    });

    // ── Load entry point ──────────────────────────────────────────────────────
    if (isDev) {
        // Dev mode: connect to Vite dev server (run `npm run dev` first)
        console.log('[UltraSudo] Dev mode: loading from', VITE_DEV_URL);
        mainWindow.loadURL(VITE_DEV_URL).catch(() => {
            console.error('[UltraSudo] Could not connect to Vite dev server. Did you run `npm run dev`?');
            mainWindow.loadFile(DIST_INDEX); // fallback to dist
        });
        mainWindow.webContents.openDevTools(); // Auto-open DevTools in dev mode
    } else {
        // Production mode: load built Vite React app from dist/
        console.log('[UltraSudo] Production mode: loading from', DIST_INDEX);
        mainWindow.loadFile(DIST_INDEX);
    }

    mainWindow.setMenuBarVisibility(false);

    // Open external links in system browser instead of a new Electron window
    mainWindow.webContents.setWindowOpenHandler(({ url }) => {
        if (url.startsWith('http://') || url.startsWith('https://')) {
            shell.openExternal(url);
            return { action: 'deny' };
        }
        return { action: 'allow' };
    });
}

// ─────────────────────────────────────────────────────────────────────────────
// OPTIONAL RUST SYSTEM BACKEND
// ─────────────────────────────────────────────────────────────────────────────
function tryStartRustBackend() {
    const isWin = process.platform === 'win32';
    const binaryName = isWin ? 'system-manager.exe' : 'system-manager';
    const binaryPath = path.join(__dirname, '../system-manager/target/release', binaryName);

    if (!fs.existsSync(binaryPath)) {
        console.warn('[UltraSudo] Rust system-manager not found at:', binaryPath);
        console.warn('[UltraSudo] Continuing without system backend. Build with: cd system-manager && cargo build --release');
        return; // graceful — don't crash the app
    }

    console.log('[UltraSudo] Starting Rust backend:', binaryPath);
    backendProcess = spawn(binaryPath, [], {
        cwd: path.join(__dirname, '../system-manager'),
        stdio: 'inherit'
    });

    backendProcess.on('error', (err) => {
        console.error('[UltraSudo] Rust backend error:', err.message);
    });

    backendProcess.on('exit', (code) => {
        console.log('[UltraSudo] Rust backend exited with code:', code);
    });
}

// ─────────────────────────────────────────────────────────────────────────────
// APP LIFECYCLE
// ─────────────────────────────────────────────────────────────────────────────
app.whenReady().then(() => {
    tryStartRustBackend();
    createWindow();

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
});

app.on('will-quit', () => {
    if (backendProcess) {
        backendProcess.kill('SIGTERM');
    }
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
});

// ─────────────────────────────────────────────────────────────────────────────
// IPC HANDLERS — Auth Session
// ─────────────────────────────────────────────────────────────────────────────

/** Get stored auth session */
ipcMain.handle('get-auth-session', async () => {
    try {
        const session = getStoredSession();
        return { ok: true, session };
    } catch (err) {
        return { ok: false, error: err.message };
    }
});

/** Store auth session */
ipcMain.handle('set-auth-session', async (event, sessionData) => {
    try {
        saveSession(sessionData);
        return { ok: true };
    } catch (err) {
        return { ok: false, error: err.message };
    }
});

/** Clear auth session (logout) */
ipcMain.handle('clear-auth-session', async () => {
    try {
        clearSession();
        return { ok: true };
    } catch (err) {
        return { ok: false, error: err.message };
    }
});

// ─────────────────────────────────────────────────────────────────────────────
// IPC HANDLERS — File System Bridge
// ─────────────────────────────────────────────────────────────────────────────

/** Save arbitrary text content to a file chosen by the user */
ipcMain.handle('save-file', async (event, { filename, content }) => {
    try {
        const { canceled, filePath } = await dialog.showSaveDialog(mainWindow, {
            defaultPath: filename,
            title: 'Save File'
        });
        if (canceled || !filePath) return { ok: false, error: 'Cancelled' };
        fs.writeFileSync(filePath, content, 'utf-8');
        return { ok: true, filePath };
    } catch (err) {
        return { ok: false, error: err.message };
    }
});

/** Open a file and return its text content */
ipcMain.handle('open-file', async (event, options) => {
    try {
        const { canceled, filePaths } = await dialog.showOpenDialog(mainWindow, {
            properties: ['openFile'],
            filters: options?.filters || [{ name: 'All Files', extensions: ['*'] }]
        });
        if (canceled || filePaths.length === 0) return { ok: false, error: 'Cancelled' };
        const content = fs.readFileSync(filePaths[0], 'utf-8');
        return { ok: true, content, filePath: filePaths[0] };
    } catch (err) {
        return { ok: false, error: err.message };
    }
});

/** Read a JSON data store from app data directory */
ipcMain.handle('read-data', async (event, { key }) => {
    try {
        const dataDir = app.getPath('userData');
        const filePath = path.join(dataDir, `${key}.json`);
        if (!fs.existsSync(filePath)) return { ok: true, data: null };
        const raw = fs.readFileSync(filePath, 'utf-8');
        return { ok: true, data: JSON.parse(raw) };
    } catch (err) {
        return { ok: false, error: err.message };
    }
});

/** Write a JSON data store to app data directory */
ipcMain.handle('write-data', async (event, { key, data }) => {
    try {
        const dataDir = app.getPath('userData');
        fs.mkdirSync(dataDir, { recursive: true });
        const filePath = path.join(dataDir, `${key}.json`);
        fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
        return { ok: true };
    } catch (err) {
        return { ok: false, error: err.message };
    }
});
