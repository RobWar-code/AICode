const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('node:path');
const MainControl = require(path.join(__dirname, './processes/MainControl.js'));
const trace = require(path.join(__dirname, './processes/trace.js'));
const seedPrograms = require(path.join(__dirname, './processes/seedPrograms.js'));
const dbTransactions = require(path.join(__dirname, './database/dbTransactions'));

const testMonoclonal = require(path.join(__dirname, "./tests/testMonoclonal.js"));

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require('electron-squirrel-startup')) {
  console.log("Squirrel startup triggered. Exiting...");
  app.quit();
  return; // Exit early if Squirrel startup is active
}

let mainWindow;
let traceWindow = null;
let program = null;
let cancelled = false;
let testWindow = null;

const createWindow = () => {
  // Create the browser window.
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 650,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: true,
      contextIsolation: false,
    },
  });

  // and load the index.html of the app.
  mainWindow.loadFile(path.join(__dirname, 'index.html'));

  // Open the DevTools.
  mainWindow.webContents.openDevTools();

  mainWindow.webContents.once("did-finish-load", () => {
    program = new MainControl(mainWindow);
  });

  ipcMain.on("startTrace", (event, data) => {
    if (!traceWindow) {
      traceWindow = new BrowserWindow({
          width: 1200,
          height: 600,
          webPreferences: {
            preload: path.join(__dirname, 'tracePreload.js'),
            nodeIntegration: true,
            contextIsolation: true,
          },
      });

      traceWindow.loadFile(path.join(__dirname, 'trace.html'));

      traceWindow.on('closed', () => {
          mainWindow.webContents.send("traceWindowClosed", 0);
          traceWindow = null;
      });

      traceWindow.webContents.once('did-finish-load', () => {
        trace.start(traceWindow, program);
      });
    }
    else {
      traceWindow.focus();
    }
  });

  ipcMain.on('openTestMonoclonal', () => {
    if (!testWindow) {
        testWindow = new BrowserWindow({
            width: 1200,
            height: 600,
            webPreferences: {
              preload: path.join(__dirname, 'testPreload.js'),
              nodeIntegration: true,
              contextIsolation: true,
            },
        });
        console.log("After new browser window");

        testWindow.loadFile(path.join(__dirname, 'testMonoclonal.html'));

        testWindow.on('closed', () => {
            testWindow = null;
        });
    } else {
        testWindow.focus();
    }
  });

};

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  console.log("Got app when ready");
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
ipcMain.on("buttonClicked", () => {
  console.log("Got Button Clicked in Main");
});

ipcMain.on("bestSetEntityDisplay", (event, bestSetObj) => {
  let bestSetNum = bestSetObj.bestSetNum;
  let bestSetEntityNum = bestSetObj.bestSetEntityNum;
  if (bestSetNum < 0 || program.numBestSets <= bestSetNum || bestSetEntityNum < 0 || 
    program.bestEntitySetMax <= bestSetEntityNum) {
    return;
  }
  trace.bestSetNum = bestSetNum;
  trace.bestSetEntityNum = bestSetEntityNum;
  if (bestSetEntityNum >= program.bestSets[bestSetNum].length || bestSetNum >= program.numBestSets) return;
  // Get the actual entity num
  let entity = program.bestSets[bestSetNum][bestSetEntityNum];
  entity.display(mainWindow, bestSetNum, program.elapsedTime, program.entityNumber, program.randomCount, 
    program.monoclonalInsCount, program.monoclonalByteCount, program.interbreedCount, 
    program.interbreed2Count, program.interbreedFlaggedCount, program.selfBreedCount, 
    program.crossSetCount, program.cycleCounter, program.numRounds);
});

ipcMain.on("activateMainProcess", () => {
  program.mainLoop();
  mainWindow.webContents.send("mainCycleCompleted", 0);
});

ipcMain.on("traceStep", (data) => {
  trace.nextStep();
});

ipcMain.on("fetchDisplayHistory", () => {
  mainWindow.webContents.send("displayHistory", program.scoreHistory);
});

ipcMain.on("fetchSeedList", () => {
  let nameList = seedPrograms.getSeedList();
  mainWindow.webContents.send("displaySeedSelector", nameList);
});

ipcMain.on("loadAndExecuteSeed", (event, seedProgramNumber) => {
  let seedProgram = seedPrograms.programs[seedProgramNumber];
  let seedDisplayData = program.loadAndExecuteSeed(seedProgram);
  mainWindow.webContents.send("seedDisplayResults", seedDisplayData);
});

ipcMain.on("insertSeed", (event, seedSetNum) => {
  program.insertSeed(seedSetNum);
});

ipcMain.on("saveSession", () => {
  dbTransactions.saveSession(mainWindow, program);
});

ipcMain.on("loadSession", () => {
  dbTransactions.loadSession(mainWindow, program);
});

// Test events
ipcMain.on("getMonoclonalTestData", (event, data) => {
  testMonoclonal.getMonoclonalHTML(testWindow);
});

