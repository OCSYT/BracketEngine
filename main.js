const { app, BrowserWindow, screen, remote, ipcMain, globalShortcut } = require('electron');
const path = require('path');
// Create the browser window
function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    autoHideMenuBar: true,
    webPreferences: {
      nodeIntegration: true,
      backgroundThrottling: false
    }
  });

  // Load the index.html file
  mainWindow.loadFile('index.html');
}

setTimeout(()=>{
app.commandLine.appendSwitch('disable-frame-rate-limit')
},100);

app.whenReady().then(createWindow);
