const { contextBridge, ipcRenderer } = require('electron');
const path = require('node:path');
const testDisplay = path.join(__dirname, 'testDisplay/displayMonoclonal.js');
console.log("testDisplay", testDisplay);
contextBridge.exposeInMainWorld('electronAPI', {
    sendMessage: (channel, data) => ipcRenderer.send(channel, data),
    onMessage: (channel, callback) => ipcRenderer.on(channel, (event, ...args) => callback(...args)),
});

contextBridge.exposeInMainWorld('nodeAPI', {
    displayMonoclonal: require(path.join(__dirname, './testDisplay/displayMonoclonal.js')), // Specific module
});
