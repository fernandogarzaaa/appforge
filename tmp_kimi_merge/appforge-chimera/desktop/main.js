/**
 * AppForge Chimera Desktop - Main Process
 * ========================================
 * Electron main process with autonomous capabilities.
 */

const { app, BrowserWindow, ipcMain, Tray, Menu, dialog, shell } = require('electron');
const path = require('path');
const { spawn } = require('child_process');
const fs = require('fs');
const os = require('os');

// Global references
let mainWindow = null;
let tray = null;
let backendProcess = null;
let aiEngineProcess = null;
let autonomousProcess = null;

// App configuration
const APP_CONFIG = {
  backendPort: 8765,
  aiEnginePort: 8766,
  autonomousPort: 8767,
  autoStartBackend: true,
  autoStartAI: true,
  autoStartAutonomous: true,
  devMode: process.env.NODE_ENV === 'development'
};

// Paths
const getPythonPath = () => {
  const platform = os.platform();
  if (platform === 'win32') {
    return path.join(process.resourcesPath || '.', 'python', 'python.exe');
  }
  return 'python3';
};

const getBackendPath = () => {
  return path.join(__dirname, '..', 'backend');
};

const getAIEnginePath = () => {
  return path.join(__dirname, '..', 'ai-engine');
};

const getAutonomousPath = () => {
  return path.join(__dirname, '..', 'autonomous-core');
};

/**
 * Create the main application window
 */
function createMainWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1000,
    minHeight: 700,
    title: 'AppForge Chimera v4.0',
    icon: path.join(__dirname, 'assets', 'icon.png'),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    },
    show: false,
    titleBarStyle: 'hiddenInset'
  });

  // Load the app
  if (APP_CONFIG.devMode) {
    mainWindow.loadURL('http://localhost:3000');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, 'renderer', 'index.html'));
  }

  // Show when ready
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    
    // Start background services
    if (APP_CONFIG.autoStartBackend) startBackend();
    if (APP_CONFIG.autoStartAI) startAIEngine();
    if (APP_CONFIG.autoStartAutonomous) startAutonomous();
  });

  // Handle close
  mainWindow.on('close', (event) => {
    if (!app.isQuiting) {
      event.preventDefault();
      mainWindow.hide();
    }
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

/**
 * Create system tray
 */
function createTray() {
  const iconPath = path.join(__dirname, 'assets', 'tray-icon.png');
  tray = new Tray(iconPath);
  
  const contextMenu = Menu.buildFromTemplate([
    { label: 'Show AppForge', click: () => mainWindow.show() },
    { type: 'separator' },
    { label: 'Services', submenu: [
      { label: 'Backend: Stopped', id: 'backend-status', enabled: false },
      { label: 'AI Engine: Stopped', id: 'ai-status', enabled: false },
      { label: 'Autonomous: Stopped', id: 'autonomous-status', enabled: false }
    ]},
    { type: 'separator' },
    { label: 'Start All Services', click: startAllServices },
    { label: 'Stop All Services', click: stopAllServices },
    { type: 'separator' },
    { label: 'Quit', click: () => {
      app.isQuiting = true;
      stopAllServices();
      app.quit();
    }}
  ]);
  
  tray.setToolTip('AppForge Chimera');
  tray.setContextMenu(contextMenu);
  
  tray.on('click', () => {
    mainWindow.show();
  });
}

/**
 * Start backend service
 */
function startBackend() {
  if (backendProcess) return;
  
  const pythonPath = getPythonPath();
  const backendPath = getBackendPath();
  
  backendProcess = spawn(pythonPath, ['-m', 'uvicorn', 'main:app', '--port', APP_CONFIG.backendPort], {
    cwd: backendPath,
    env: { ...process.env, PYTHONPATH: backendPath }
  });
  
  backendProcess.stdout.on('data', (data) => {
    console.log(`[Backend] ${data}`);
    if (mainWindow) {
      mainWindow.webContents.send('backend-log', data.toString());
    }
  });
  
  backendProcess.stderr.on('data', (data) => {
    console.error(`[Backend Error] ${data}`);
  });
  
  backendProcess.on('close', (code) => {
    console.log(`Backend exited with code ${code}`);
    backendProcess = null;
    updateTrayStatus('backend', 'Stopped');
  });
  
  updateTrayStatus('backend', 'Running');
  console.log(`Backend started on port ${APP_CONFIG.backendPort}`);
}

/**
 * Start AI Engine service
 */
function startAIEngine() {
  if (aiEngineProcess) return;
  
  const pythonPath = getPythonPath();
  const aiPath = getAIEnginePath();
  
  aiEngineProcess = spawn(pythonPath, ['chimera_server.py'], {
    cwd: aiPath,
    env: { ...process.env, PYTHONPATH: aiPath }
  });
  
  aiEngineProcess.stdout.on('data', (data) => {
    console.log(`[AI Engine] ${data}`);
    if (mainWindow) {
      mainWindow.webContents.send('ai-log', data.toString());
    }
  });
  
  aiEngineProcess.stderr.on('data', (data) => {
    console.error(`[AI Engine Error] ${data}`);
  });
  
  aiEngineProcess.on('close', (code) => {
    console.log(`AI Engine exited with code ${code}`);
    aiEngineProcess = null;
    updateTrayStatus('ai', 'Stopped');
  });
  
  updateTrayStatus('ai', 'Running');
  console.log(`AI Engine started on port ${APP_CONFIG.aiEnginePort}`);
}

/**
 * Start Autonomous Core service
 */
function startAutonomous() {
  if (autonomousProcess) return;
  
  const pythonPath = getPythonPath();
  const autoPath = getAutonomousPath();
  
  autonomousProcess = spawn(pythonPath, ['main.py'], {
    cwd: autoPath,
    env: { ...process.env, PYTHONPATH: autoPath }
  });
  
  autonomousProcess.stdout.on('data', (data) => {
    console.log(`[Autonomous] ${data}`);
    if (mainWindow) {
      mainWindow.webContents.send('autonomous-log', data.toString());
    }
  });
  
  autonomousProcess.stderr.on('data', (data) => {
    console.error(`[Autonomous Error] ${data}`);
  });
  
  autonomousProcess.on('close', (code) => {
    console.log(`Autonomous Core exited with code ${code}`);
    autonomousProcess = null;
    updateTrayStatus('autonomous', 'Stopped');
  });
  
  updateTrayStatus('autonomous', 'Running');
  console.log(`Autonomous Core started on port ${APP_CONFIG.autonomousPort}`);
}

/**
 * Start all services
 */
function startAllServices() {
  startBackend();
  startAIEngine();
  startAutonomous();
}

/**
 * Stop all services
 */
function stopAllServices() {
  if (backendProcess) {
    backendProcess.kill();
    backendProcess = null;
  }
  if (aiEngineProcess) {
    aiEngineProcess.kill();
    aiEngineProcess = null;
  }
  if (autonomousProcess) {
    autonomousProcess.kill();
    autonomousProcess = null;
  }
}

/**
 * Update tray status
 */
function updateTrayStatus(service, status) {
  if (!tray) return;
  
  const menu = tray.getContextMenu();
  if (menu) {
    const item = menu.getMenuItemById(`${service}-status`);
    if (item) {
      item.label = `${service.charAt(0).toUpperCase() + service.slice(1)}: ${status}`;
    }
  }
}

// IPC Handlers
ipcMain.handle('get-app-version', () => app.getVersion());

ipcMain.handle('get-services-status', () => ({
  backend: backendProcess !== null,
  aiEngine: aiEngineProcess !== null,
  autonomous: autonomousProcess !== null
}));

ipcMain.handle('start-service', (event, service) => {
  switch (service) {
    case 'backend': startBackend(); break;
    case 'ai': startAIEngine(); break;
    case 'autonomous': startAutonomous(); break;
  }
});

ipcMain.handle('stop-service', (event, service) => {
  switch (service) {
    case 'backend': 
      if (backendProcess) { backendProcess.kill(); backendProcess = null; }
      break;
    case 'ai':
      if (aiEngineProcess) { aiEngineProcess.kill(); aiEngineProcess = null; }
      break;
    case 'autonomous':
      if (autonomousProcess) { autonomousProcess.kill(); autonomousProcess = null; }
      break;
  }
});

ipcMain.handle('open-external', (event, url) => {
  shell.openExternal(url);
});

ipcMain.handle('show-save-dialog', async (event, options) => {
  const result = await dialog.showSaveDialog(mainWindow, options);
  return result;
});

ipcMain.handle('show-open-dialog', async (event, options) => {
  const result = await dialog.showOpenDialog(mainWindow, options);
  return result;
});

// App lifecycle
app.whenReady().then(() => {
  createMainWindow();
  createTray();
  
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createMainWindow();
    } else {
      mainWindow.show();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    stopAllServices();
    app.quit();
  }
});

app.on('before-quit', () => {
  app.isQuiting = true;
  stopAllServices();
});
