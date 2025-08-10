const {ipcRenderer, ipcMain} = require("electron");
const path = require('node:path');
const entityDisplay = require(path.join(__dirname, "/display/entityDisplay.js"));
const startRuleDisplay = require(path.join(__dirname, "/display/startRuleDisplay.js"));
const scoreHistory = require(path.join(__dirname, '/display/scoreHistory.js'));
const seedDisplay = require(path.join(__dirname, '/display/seedDisplay.js'));
const ruleDisplay = require(path.join(__dirname, '/display/ruleDisplay.js'));
const restoreRuleSeed = require(path.join(__dirname, '/display/restoreRuleSeed.js'));
const testObj = require(path.join(__dirname, '/processes/testObj.js'));
/*
document.getElementById("button01").addEventListener("click", () => {
    document.getElementById("report").innerText = "Clicked";
    console.log("Clicked");
    ipcRenderer.send("buttonClicked");
});
*/
let processingCancelled = true;
let processTimeout = null;
let batchStatus = "not started";
let traceActive = false;
let processingMode = false;

let globals = null;

ipcRenderer.on("setGlobals", (event, data) => {
    globals = data;
});

ipcRenderer.on('batchDispatched', (event, data) => {
    batchStatus = "batch span dispatched";
    document.getElementById('statusDiv').style.display = "block";
    document.getElementById('statusPara').innerText = batchStatus + " Processing";
});

ipcRenderer.on('batchProcessed', (event, pause) => {
    batchStatus = "batch span processed";
    document.getElementById('statusDiv').style.display = "block";
    document.getElementById('statusPara').innerText = batchStatus + " User Interface Active";
    processingMode = false;
    let waitTime = 6000;
    if (pause) waitTime = 120000;
    document.getElementById('statusPara').innerText = batchStatus + " User Interface Active - " + waitTime;
    if (!processingCancelled && !testObj.testOperation) {
        processTimeout = setTimeout(() => {
            document.getElementById("statusDiv").style.display = "block";
            document.getElementById("statusPara").innerText = "Processing...";
            processingMode = true;
            ipcRenderer.send("activateMainProcess", 0);
        }, waitTime);
    }
});

ipcRenderer.on("displayEntity", (event, data) => {
    if (data.terminateProcessing) {
        processingCancelled = true;
        clearTimeout(processTimeout);
        document.getElementById('statusDiv').style.display = "block";
        document.getElementById('statusPara').innerText = "Score Threshold Reached/Rules Completed";
    }
    entityDisplay.display(data);
});

ipcRenderer.on("mainCycleCompleted", (event, data) => {
    document.getElementById("statusDiv").style.display = "block";
    document.getElementById("statusPara").innerText = "User-interaction Active";
    processingMode = false;
    if (!processingCancelled && !testObj.testOperation) {
        processTimeout = setTimeout(() => {
            document.getElementById("statusDiv").style.display = "block";
            document.getElementById("statusPara").innerText = "Processing...";
            processingMode = true;
            ipcRenderer.send("activateMainProcess", 0);
        }, 5000);
    }
});

ipcRenderer.on("displayStartRuleList", (event, ruleList) => {
    startRuleDisplay.displayRuleSelector(ruleList);
});

ipcRenderer.on("displayHistory", (event, data) => {
    scoreHistory.displayHistory(data);
});

ipcRenderer.on("displaySeedSelector", (event, nameList) => {
    seedDisplay.displaySelector(nameList);
});

ipcRenderer.on("seedDisplayResults", (event, data) => {
    seedDisplay.displaySeedResults(data);
});

ipcRenderer.on("displayRestoreRuleSeedSelection", (event, seedList) => {
    restoreRuleSeed.displayModal(seedList);
});

ipcRenderer.on("seedRuleSelectorActivate", (event, ruleList) => {
    seedDisplay.displaySeedRuleSelector(ruleList);
});

ipcRenderer.on("subOptRuleSelectorActivate", (event, ruleList) => {
    console.log("subOptRuleSelectorActivate");
    seedDisplay.displaySubOptRuleSelector(ruleList);
});

ipcRenderer.on("displayRuleSelectionList", (event, ruleList) => {
    ruleDisplay.displayRuleSelector(ruleList);
});

ipcRenderer.on("tablesCleared", (event, data) => {
    document.getElementById("statusDiv").style.display = "block";
    document.getElementById("statusPara").innerText = "TABLES CLEARED";
});

ipcRenderer.on("saveDone", (event, data) => {
    document.getElementById("statusDiv").style.display = "block";
    let statusText = document.getElementById("statusPara").innerText;
    console.log("Got statusText:", statusText);
    if (statusText.indexOf("Completed") > 0) {
        document.getElementById("statusPara").innerText += " SAVE DONE";
    }
    else {
        document.getElementById("statusPara").innerText = "SAVE DONE";
    }
});

ipcRenderer.on("loadDone", (event, data) => {
    document.getElementById("statusDiv").style.display = "block";
    document.getElementById("statusPara").innerText = "LOAD DONE";
});

ipcRenderer.on("traceWindowClosed", (event, data) => {
    document.getElementById("traceButton").innerText = "Trace";
});

document.addEventListener('DOMContentLoaded', () => {
    const bestEntitySelector = document.getElementById('bestEntitySelector');
    const scoreListDismiss = document.getElementById('scoreListDismiss');
    const scoreListButton = document.getElementById('scoreListButton');
    const scoreHistoryButton = document.getElementById('scoreHistoryButton');
    const scoreHistoryDismiss = document.getElementById('scoreHistoryDismiss');
    const haltProcessButton = document.getElementById('haltProcessButton');
    const startAtRuleButton = document.getElementById('startAtRuleButton');
    const startRuleSelectorForm = document.getElementById('startRuleSelectorForm');
    const traceButton = document.getElementById('traceButton');
    const loadSeedButton = document.getElementById('loadSeedButton');
    const seedSelectorForm = document.getElementById('seedSelectorForm');
    const cancelLoadSeedButton = document.getElementById('cancelLoadSeedButton');
    const insertSeedForm = document.getElementById('insertSeedForm');
    const loadSeedRuleButton = document.getElementById('loadSeedRuleButton');
    const seedRuleSelectorForm = document.getElementById('seedRuleSelectorForm');
    const cancelLoadSeedRuleButton = document.getElementById('cancelLoadSeedRuleButton');
    const loadSubOptRuleButton = document.getElementById('loadSubOptRuleButton');
    const subOptRuleSelectorForm = document.getElementById('subOptRuleSelectorForm');
    const cancelLoadSubOptRuleButton = document.getElementById('cancelLoadSubOptRuleButton');
    const restoreRuleSeedButton = document.getElementById('restoreRuleSeedButton');
    const restoreRuleSeedSelector = document.getElementById('restoreRuleSeedSelector');
    const restoreRuleSeedSubmit = document.getElementById('restoreRuleSeedSubmit');
    const restoreRuleSeedDismiss = document.getElementById('restoreRuleSeedDismiss')
    const ruleSelectionButton = document.getElementById('ruleSelectionButton');
    const ruleSelectorForm = document.getElementById('ruleSelectorForm');
    const cancelRuleSelectionButton = document.getElementById('cancelRuleSelectionButton');
    const clearTablesButton = document.getElementById('clearTablesButton');
    const saveButton = document.getElementById('saveButton');
    const loadButton = document.getElementById('loadButton');

    bestEntitySelector.addEventListener('submit', (event) => {
        event.preventDefault(); // Prevent the form from reloading the page

        // Gather form data
        const formData = new FormData(bestEntitySelector);
        const bestSetNum = parseInt(formData.get("bestSetNumInput"));
        const bestSetEntityNum = parseInt(formData.get('bestSetEntityNumInput'));

        // Call the appropriate routine
        doEntityDisplay(bestSetNum, bestSetEntityNum);
    });

    scoreListDismiss.addEventListener('click', (event) => {
        document.getElementById('scoreListBackground').style.display = "none";
    });

    scoreListButton.addEventListener('click', (event) => {
        console.log("Got to display score list");
        entityDisplay.displayScoreList();
    });

    scoreHistoryButton.addEventListener('click', (event) => {
        ipcRenderer.send('fetchDisplayHistory', 0);
    });

    scoreHistoryDismiss.addEventListener('click', (event) => {
        document.getElementById("scoreHistoryBackground").style.display = "none";
    });

    haltProcessButton.addEventListener('click', (event) => {
        if (!processingCancelled) {
            document.getElementById("haltProcessButton").innerText = "Resume";
            clearTimeout(processTimeout);
        }
        else {
            if (processingMode) return;
            processingMode = true;
            document.getElementById("haltProcessButton").innerText = "Halt Process";
            document.getElementById("statusDiv").style.display = "block";
            document.getElementById("statusPara").innerText = "Processing...";
            entityDisplay.redoMainEntityDisplay();
            ipcRenderer.send("activateMainProcess", 0);
        }
        processingCancelled = !processingCancelled;
    });

    startAtRuleButton.addEventListener('click', (event) => {
        document.getElementById("startRuleDiv").style.display = "block";
        ipcRenderer.send("fetchStartRuleList", 0)
    });

    startRuleSelectorForm.addEventListener('submit', (event) => {
        event.preventDefault();
        let sequenceNum = parseInt(document.getElementById("startRuleSelector").value);
        document.getElementById("startRuleDiv").style.display = "none";
        processingCancelled = false;
        processingMode = true;
        document.getElementById("haltProcessButton").innerText = "Halt Process";
        document.getElementById("statusDiv").style.display = "block";
        document.getElementById("statusPara").innerText = "Processing...";
        ipcRenderer.send("startAtRule", sequenceNum); 
    });

    traceButton.addEventListener('click', (event) => {
        if (!traceActive) {
            processingCancelled = true;
            document.getElementById("haltProcessButton").innerText = "Resume";
            traceButton.innerText = "Trace Off"
            clearTimeout(processTimeout);
            ipcRenderer.send("startTrace", 0);
        }
        else {
            // Close Trace Window
            traceButton.innerText = "Trace";
            traceActive = false;
        }
    });

    loadSeedButton.addEventListener('click', (event) => {
        // Fetch list of seed programs etc.
        ipcRenderer.send("fetchSeedList", 0);
    });

    seedSelectorForm.addEventListener("submit", (event) => {
        event.preventDefault();
        let seedOption = document.getElementById("seedSelector").value;
        // Cancel the ongoing processing
        clearTimeout(processTimeout);
        processingCancelled = true;
        // Start the seed program
        ipcRenderer.send("loadAndExecuteSeed", seedOption);
    });

    cancelLoadSeedButton.addEventListener("click", (event) => {
        document.getElementById("seedSelectionDiv").style.display = "none";
    });

    insertSeedForm.addEventListener("submit", (event) => {
        event.preventDefault();
        let seedSetNum = parseInt(document.getElementById("seedSetNumInput").value);
        let valid = false;
        if (!isNaN(seedSetNum)) {
            if (seedSetNum >= 0 && globals.numBestSets > seedSetNum) {
                document.getElementById('statusDiv').style.display = "block";
                document.getElementById('statusPara').innerText = "Seed Inserted";
                valid = true;
            }
        }
        if (!valid) {
            document.getElementById('statusDiv').style.display = "block";
            document.getElementById('statusPara').innerText = "Invalid seed set number";
            return;
        }
        ipcRenderer.send("insertSeed", seedSetNum);
    });

    loadSeedRuleButton.addEventListener('click', (event) => {
        ipcRenderer.send("seedRuleListRequest", 0);
        // Halt the on-going processing
        document.getElementById("haltProcessButton").innerText = "Resume";
        clearTimeout(processTimeout);
        processingCancelled = true;
    });

    seedRuleSelectorForm.addEventListener('click', (event) => {
        event.preventDefault();
        let seedRuleId = document.getElementById('seedRuleSelector').value;
        ipcRenderer.send("loadAndExecuteSeedRule", {option: "seed", id: seedRuleId});
    });

    cancelLoadSeedRuleButton.addEventListener("click", (event) => {
        document.getElementById("seedRuleSelectionDiv").style.display = "none";
    });

    loadSubOptRuleButton.addEventListener('click', (event) => {
        ipcRenderer.send("subOptRuleListRequest", 0);
        // Halt the on-going processing
        document.getElementById("haltProcessButton").innerText = "Resume";
        clearTimeout(processTimeout);
        processingCancelled = true;
    });

    subOptRuleSelectorForm.addEventListener('click', (event) => {
        event.preventDefault();
        let subOptRuleId = document.getElementById('subOptRuleSelector').value;
        ipcRenderer.send("loadAndExecuteSeedRule", {option: "subOpt", id: subOptRuleId});
    });

    cancelLoadSubOptRuleButton.addEventListener("click", (event) => {
        document.getElementById("subOptRuleSelectionDiv").style.display = "none";
    });

    restoreRuleSeedButton.addEventListener("click", (event) => {
        ipcRenderer.send('fetchSavedRuleSeedList', 0);
    });

    restoreRuleSeedSelector.addEventListener("change", (event) => {
        restoreRuleSeed.insertSelection();
    });

    restoreRuleSeedSubmit.addEventListener("click", (event) => {
        if (restoreRuleSeed.ruleSeedSet.length === 0) return;
        ipcRenderer.send('insertRuleSeed', restoreRuleSeed.ruleSeedSet);
        document.getElementById("restoreRuleSeedBackground").style.display = "none";
    });

    restoreRuleSeedDismiss.addEventListener("click", (event) => {
        document.getElementById("restoreRuleSeedBackground").style.display = "none";
    });

    ruleSelectionButton.addEventListener('click', (event) => {
        ipcRenderer.send("requestRuleSequenceList", 0);
        processingCancelled = true;
        clearTimeout(processTimeout);
    });

    ruleSelectorForm.addEventListener('click', (event) => {
        event.preventDefault();
        document.getElementById("ruleSelectionDiv").style.display = "none";
        document.getElementById("haltProcessButton").innerText = "Halt Process";
        document.getElementById("statusDiv").style.display = "block";
        document.getElementById("statusPara").innerText = "Processing...";
        processingCancelled = false;
        let selectedRuleSequenceNum = parseInt(document.getElementById('ruleSelector').value);
        ipcRenderer.send("startSelectedRule", selectedRuleSequenceNum);
    });

    cancelRuleSelectionButton.addEventListener("click", (event) => {
        document.getElementById("ruleSelectionDiv").style.display = "none";
    });

    clearTablesButton.addEventListener('click', (event) => {
        ipcRenderer.send("clearTables");
    });

    saveButton.addEventListener('click', (event) => {
        ipcRenderer.send("saveSession", 0);
    });

    loadButton.addEventListener('click', (event) => {
        ipcRenderer.send("loadSession", 0);
    });
});

function doEntityDisplay(bestSetNum, bestSetEntityNum) {
    console.log("doEntityDisplay - reached");
    ipcRenderer.send("bestSetEntityDisplay", {bestSetNum: bestSetNum, bestSetEntityNum: bestSetEntityNum});
}


