const { contextBridge, ipcRenderer } = require('electron');
const path = require('node:path');

contextBridge.exposeInMainWorld('electronAPI', {
    sendMessage: (channel, data) => ipcRenderer.send(channel, data),
    onMessage: (channel, callback) => ipcRenderer.on(channel, (event, ...args) => callback(...args)),
});

contextBridge.exposeInMainWorld('nodeAPI', {
    traceDisplay: require(path.join(__dirname, './display/traceDisplay.js')), // Specific module
});
