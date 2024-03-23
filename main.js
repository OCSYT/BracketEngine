const { app, BrowserWindow, screen, remote, ipcMain, Menu, globalShortcut } = require('electron');
const path = require('path');



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


  const template = [
    {
      label: 'Developer',
      submenu: [
        {
          label: 'Toggle Developer Tools',
          accelerator: 'CmdOrCtrl+Shift+I', // Shortcut for opening the inspector
          click: () => {
            mainWindow.webContents.toggleDevTools();
          }
        }
      ]
    }
  ];

  // Build menu from template
  const menu = Menu.buildFromTemplate(template);

  // Set application menu
  Menu.setApplicationMenu(menu);

  // Register global shortcut for inspector
  globalShortcut.register('CmdOrCtrl+Shift+I', () => {
    mainWindow.webContents.toggleDevTools();
  });

}

app.whenReady().then(createWindow);
