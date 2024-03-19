const { app, BrowserWindow, screen, remote, ipcMain } = require('electron');
const path = require('path');
// Create the browser window
function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    autoHideMenuBar: true,
    webPreferences: {
      nodeIntegration: true
    }
  });
  

  // Load the index.html file
  mainWindow.loadFile('index.html');
}

app.whenReady().then(createWindow);
