const { app, BrowserWindow } = require('electron');
const path = require('path');

// Determine if we're running in development or production
const isDev = !app.isPackaged;

function createWindow() {
  const win = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1024,
    minHeight: 768,
    title: "FaceAttend",
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  });

  // In development mode, load the Vite dev server
  if (isDev) {
    win.loadURL('http://localhost:5173');
    // Open Developer Tools automatically in dev mode
    win.webContents.openDevTools();
  } else {
    // In production, load the built static files
    win.loadFile(path.join(__dirname, '../dist/index.html'));
  }
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
