const { app, BrowserWindow, Tray, Menu, nativeImage, ipcMain, Notification } = require('electron');
const path = require('path');
const isDev = !app.isPackaged;

let mainWindow;
let tray;

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1200,
        height: 800,
        minWidth: 1000,
        minHeight: 700,
        title: "Sovereign Command Center",
        backgroundColor: '#020817',
        icon: path.join(__dirname, '../public/favicon.ico'), // Temporary icon
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
            enableRemoteModule: true
        }
    });

    // Load the Vite dev server in development, or the built files in production
    const startUrl = isDev
        ? "http://localhost:5174/"
        : `file://${path.join(__dirname, '../sovereign-ui/dist/index.html')}`;

    const loadURL = (url) => {
        mainWindow.loadURL(url).catch(err => {
            console.log('⚠️ [Electron] Failed to load URL, retrying in 2s...', err.message);
            setTimeout(() => loadURL(url), 2000);
        });
    };

    loadURL(startUrl);

    // Open DevTools in dev mode
    if (isDev) {
        mainWindow.webContents.openDevTools();
    }

    mainWindow.on('closed', () => {
        mainWindow = null;
    });

    // Hide instead of close when the window is "closed" if it's in the tray
    mainWindow.on('close', (event) => {
        if (!app.isQuitting) {
            event.preventDefault();
            mainWindow.hide();
        }
        return false;
    });
}

function createTray() {
    const iconPath = path.join(__dirname, '../public/favicon.ico');
    const icon = nativeImage.createFromPath(iconPath);
    tray = new Tray(icon.resize({ width: 16, height: 16 }));

    const contextMenu = Menu.buildFromTemplate([
        { label: 'Show Dashboard', click: () => mainWindow.show() },
        { type: 'separator' },
        { label: 'Maintenance Mode: ON', click: () => toggleMaintenance(true) },
        { label: 'Maintenance Mode: OFF', click: () => toggleMaintenance(false) },
        { type: 'separator' },
        {
            label: 'Quit Sovereign', click: () => {
                app.isQuitting = true;
                app.quit();
            }
        }
    ]);

    tray.setToolTip('Sovereign Swarm Control');
    tray.setContextMenu(contextMenu);

    tray.on('double-click', () => {
        mainWindow.show();
    });
}

async function toggleMaintenance(active) {
    // In a real implementation we could send an IPC to the renderer 
    // or call the maintenance CLI directly.
    new Notification({
        title: 'Sovereign Swarm',
        body: `Maintenance Mode ${active ? 'Activated' : 'Deactivated'}`
    }).show();
}

app.whenReady().then(() => {
    createWindow();
    createTray();

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    });
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        // We stay alive in the tray
    }
});
