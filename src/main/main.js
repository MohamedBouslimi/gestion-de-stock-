const { app, BrowserWindow } = require('electron');
const path = require('path');
const { initDatabase, closeDatabase } = require('../backend/database');
const expressApp = require('../backend/server');

let mainWindow;
let server;
const PORT = 3001;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1000,
    minHeight: 700,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true
    },
    icon: path.join(__dirname, '../../assets/icon.png'),
    title: 'Gestion de Stock',
    show: false
  });

  // Remove menu bar
  mainWindow.setMenuBarVisibility(false);

  // Load the app
  if (process.env.NODE_ENV === 'development') {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../../dist/index.html'));
  }

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

function startServer() {
  return new Promise((resolve) => {
    // Initialize database with path in userData
    const dbPath = path.join(app.getPath('userData'), 'stock.db');
    initDatabase(dbPath);
    
    server = expressApp.listen(PORT, () => {
      console.log(`Backend server running on port ${PORT}`);
      resolve();
    });
  });
}

function stopServer() {
  return new Promise((resolve) => {
    closeDatabase();
    if (server) {
      server.close(() => {
        console.log('Backend server stopped');
        resolve();
      });
    } else {
      resolve();
    }
  });
}

app.whenReady().then(async () => {
  await startServer();
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', async () => {
  await stopServer();
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('before-quit', async () => {
  await stopServer();
});
