const { app, BrowserWindow, ipcMain, dialog, shell } = require('electron');
const path = require('node:path');
const files = require('./files');
const graphs = require('./graphs');

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require('electron-squirrel-startup')) {
  app.quit();
}

const createWindow = () => {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
    },
  });


  // and load the index.html of the app.
  mainWindow.loadFile(path.join(__dirname, 'index.html'));

  // Open the DevTools.
  // mainWindow.webContents.openDevTools();

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });
};

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  ipcMain.handle('dialog:getFiles', async (event) => {
    return await files.getFiles();
  });
  ipcMain.handle('dialog:importGraph', (event, graphJson) => {
    return graphs.importGraph(graphJson);
  });
  ipcMain.handle('dialog:exportGraph', (event, graphJson) => {
    const graph = graphs.importGraph(graphJson);
    return graphs.exportGraph(graph);
  });
  ipcMain.handle('dialog:getPartialGraph', (event, files, fileId) => {
    const graph = graphs.getPartialGraph(files,fileId);
    return graphs.exportGraph(graph);
  });
  ipcMain.handle('dialog:getPartialGraphLevel1', (event, files, fileId) => {
    const graph = graphs.getPartialGraphLevel1(files,fileId);
    return graphs.exportGraph(graph);
  });
  ipcMain.handle('dialog:getPartialGraphTags', (event, files, fileId) => {
    const graph = graphs.getPartialGraphTags(files,fileId);
    return graphs.exportGraph(graph);
  });
  createWindow();

  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and import them here.