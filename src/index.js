const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('node:path');
const miscDbFunctions = require(path.join(__dirname, './database/miscDbFunctions'));
const MainControl = require(path.join(__dirname, './processes/MainControl.js'));
const MainControlParallel = require(path.join(__dirname, './processes/MainControlParallel.js'));
const mainControlShared = require(path.join(__dirname, "./processes/mainControlShared.js"));
const trace = require(path.join(__dirname, './processes/trace.js'));
const seedPrograms = require(path.join(__dirname, './processes/seedPrograms.js'));
const rulesets = require(path.join(__dirname, "./processes/rulesets.js"));
const instructionSetLists = require(path.join(__dirname, "./processes/instructionSetLists.js"));
const logResults = require(path.join(__dirname, "./processes/logResults.js"));
const testMonoclonal = require(path.join(__dirname, "./tests/testMonoclonal.js"));
const {databaseType, processMode} = require(path.join(__dirname, 'AICodeConfig.js'));
let dbConn;
if (databaseType === "sqlite") {
  dbConn = require(path.join(__dirname, './database/dbConnSqlite.js'));
}
const dbTransactions = require(path.join(__dirname, './database/dbTransactions.js'));


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
    }
  });

  // and load the index.html of the app.
  mainWindow.loadFile(path.join(__dirname, 'index.html'));

  // Open the DevTools.
  mainWindow.webContents.openDevTools();

  mainWindow.webContents.once("did-finish-load", () => {
    if (processMode === "serial") {
      program = new MainControl(mainWindow);
    }
    else {
      program = new MainControlParallel(mainWindow);
    }
    if (databaseType === 'sqlite') {
      dbConn.openConnection();
    }
    // Global Data
    let globalData = {numBestSets: program.numBestSets};
    mainWindow.webContents.send("setGlobals", globalData);
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
  if (databaseType === 'sqlite') {
    dbConn.close();
  }
  
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
  // Display the entity
  console.log("bestSetEntityDisplay:", bestSetNum, bestSetEntityNum);
  let terminateProcessing = false;
  program.displayEntity(null, bestSetNum, bestSetEntityNum, terminateProcessing);
});

ipcMain.on("activateMainProcess", () => {
  // reset the seeded program status
  program.seedEntity = null;
  program.ruleSequenceNum = rulesets.ruleSequenceNum;
  if (rulesets.ruleSequenceNum === 0) {
    let ruleIndex = rulesets.getRuleIndexFromSequence(rulesets.ruleSequenceNum);
    if (rulesets.ruleRounds[ruleIndex].start === -1) {
      rulesets.ruleRounds[ruleIndex].start = program.numRounds;
    }
  }
  
  if (processMode === "serial") {
    program.doProcess(program);
    if (rulesets.ruleSequenceNum <= rulesets.maxRuleSequenceNum) {
      mainWindow.webContents.send("mainCycleCompleted", 0);
    }
  }
  else {
    program.batchProcessLoop();
  }
});

ipcMain.on("fetchStartRuleList", (data) => {
  let ruleList = rulesets.fetchRuleSequenceList();
  mainWindow.webContents.send("displayStartRuleList", ruleList);
})

ipcMain.on("startAtRule", (event, ruleSequenceNum) => {
  program.startAtRule(ruleSequenceNum);
});

ipcMain.on("traceStep", (data) => {
  trace.nextStep();
});

ipcMain.on("traceStepRestart", (data) => {
  let executionCount = null;
  trace.restart(executionCount);
});

ipcMain.on("traceRestart", (event, executionCount) => {
  trace.restart(executionCount);
});

ipcMain.on("fetchDisplayHistory", () => {
  mainWindow.webContents.send("displayHistory", program.scoreHistory);
});

ipcMain.on("fetchWeightingTable", () => {
  mainWindow.webContents.send("displayWeights", rulesets.weightingTable);
});

ipcMain.on("fetchBreedTable", () => {
  const breedTableData = mainControlShared.fetchBreedTable(program);
  mainWindow.webContents.send("displayBreedTable", breedTableData);
});

ipcMain.on("logCompletions", () => {
  logResults.makeRuleCompletionLog();
  mainWindow.webContents.send("ruleCompletionLogDone", 0);
});

ipcMain.on("fetchInsSetListData", () => {
  mainWindow.webContents.send("displayInsSetList", instructionSetLists.lists);
});

ipcMain.on("setInsSetList", (event, insSetListNum) => {
  instructionSetLists.selectedListNum = parseInt(insSetListNum);
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

ipcMain.on("seedRuleListRequest", (event, data) => {
  let seedRulesLength = rulesets.seedRuleMemSpaces.length;
  if (seedRulesLength === 0) return;
  else {
    let seedRules = [];
    for (let i = 0; i < seedRulesLength; i++) {
      let item = rulesets.seedRuleMemSpaces[i];
      let ruleId = item.ruleId;
      let name = rulesets.getDescriptionFromRuleId(ruleId);
      seedRules.push({ruleId: ruleId, name:name});
    }
    mainWindow.webContents.send("seedRuleSelectorActivate", seedRules);
  }  
});

ipcMain.on("subOptRuleListRequest", (event, data) => {
  let subOptRulesLength = rulesets.subOptRuleMemSpaces.length;
  console.log("subOptRuleListRequest", subOptRulesLength);
  if (subOptRulesLength === 0) return;
  else {
    let subOptRules = [];
    for (let i = 0; i < subOptRulesLength; i++) {
      let item = rulesets.subOptRuleMemSpaces[i];
      let ruleId = item.ruleId;
      let name = rulesets.getDescriptionFromRuleId(ruleId);
      subOptRules.push({ruleId: ruleId, name:name});
    }
    mainWindow.webContents.send("subOptRuleSelectorActivate", subOptRules);
  }  
});

ipcMain.on("loadAndExecuteSeedRule", (event, data) => {
  let id = data.id
  let seedNum = parseInt(id);
  let seedDisplayData = program.loadAndExecuteSeedRule(data.option, seedNum);
  mainWindow.webContents.send("seedDisplayResults", {option: data.option, displayData: seedDisplayData});
});

ipcMain.on("fetchSavedRuleSeedList", async (event, data) => {
  let seedList = await dbTransactions.fetchSeedRuleList();
  mainWindow.webContents.send("displayRestoreRuleSeedSelection", seedList);
});

ipcMain.on('insertRuleSeed', (event, ruleSeedList) => {
  dbTransactions.insertRuleSeed(ruleSeedList);
});

ipcMain.on("requestRuleSequenceList", (event, data) => {
  let ruleList = rulesets.fetchRuleSequenceList();
  mainWindow.webContents.send("displayRuleSelectionList", ruleList);
});

ipcMain.on("startSelectedRule", (event, ruleNum) => {
  program.startSelectedRule(ruleNum);
});

ipcMain.on("clearTables", async () => {
  await miscDbFunctions.clearTables();
  program.resetArrays();
  mainWindow.webContents.send("tablesCleared", 0);
});

ipcMain.on("saveSession", () => {
  dbTransactions.saveSession(mainWindow, program, rulesets.ruleSequenceNum);
});

ipcMain.on("loadSession", () => {
  dbTransactions.loadSession(mainWindow, program);
});

// Test events
ipcMain.on("getMonoclonalTestData", (event, data) => {
  testMonoclonal.getMonoclonalHTML(testWindow);
});

