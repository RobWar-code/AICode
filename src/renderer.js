const {ipcRenderer, ipcMain} = require("electron");
const path = require('node:path');
const entityDisplay = require(path.join(__dirname, "/display/entityDisplay.js"));
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
let traceActive = false;

let globals = null;

ipcRenderer.on("setGlobals", (event, data) => {
    globals = data;
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
    if (!processingCancelled && !testObj.testOperation) {
        processTimeout = setTimeout(() => {
            document.getElementById("statusDiv").style.display = "block";
            document.getElementById("statusPara").innerText = "Processing...";
            ipcRenderer.send("activateMainProcess", 0);
        }, 3000);
    }
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

ipcRenderer.on("displayRuleSelectionList", (event, ruleList) => {
    ruleDisplay.displayRuleSelector(ruleList);
});

ipcRenderer.on("saveDone", (event, data) => {
    document.getElementById("statusDiv").style.display = "block";
    document.getElementById("statusPara").innerText = "SAVE DONE";
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
    const traceButton = document.getElementById('traceButton');
    const loadSeedButton = document.getElementById('loadSeedButton');
    const seedSelectorForm = document.getElementById('seedSelectorForm');
    const cancelLoadSeedButton = document.getElementById('cancelLoadSeedButton');
    const insertSeedForm = document.getElementById('insertSeedForm');
    const loadSeedRuleButton = document.getElementById('loadSeedRuleButton');
    const seedRuleSelectorForm = document.getElementById('seedRuleSelectorForm');
    const cancelLoadSeedRuleButton = document.getElementById('cancelLoadSeedRuleButton');
    const restoreRuleSeedButton = document.getElementById('restoreRuleSeedButton');
    const restoreRuleSeedSelector = document.getElementById('restoreRuleSeedSelector');
    const restoreRuleSeedSubmit = document.getElementById('restoreRuleSeedSubmit');
    const restoreRuleSeedDismiss = document.getElementById('restoreRuleSeedDismiss')
    const ruleSelectionButton = document.getElementById('ruleSelectionButton');
    const ruleSelectorForm = document.getElementById('ruleSelectorForm');
    const cancelRuleSelectionButton = document.getElementById('cancelRuleSelectionButton');
    const saveButton = document.getElementById('saveButton');
    const loadButton = document.getElementById('loadButton');
    const testMonoclonalButton = document.getElementById('testMonoclonalButton');

    bestEntitySelector.addEventListener('submit', (event) => {
        event.preventDefault(); // Prevent the form from reloading the page

        // Gather form data
        const formData = new FormData(bestEntitySelector);
        const bestSetNum = formData.get("bestSetNumInput");
        const bestSetEntityNum = formData.get('bestSetEntityNumInput');

        // Call the appropriate routine
        doEntityDisplay(bestSetNum, bestSetEntityNum);
    });

    scoreListDismiss.addEventListener('click', (event) => {
        document.getElementById('scoreListBackground').style.display = "none";
    });

    scoreListButton.addEventListener('click', (event) => {
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
            document.getElementById("haltProcessButton").innerText = "Halt Process";
            document.getElementById("statusDiv").style.display = "block";
            document.getElementById("statusPara").innerText = "Processing...";
            entityDisplay.redoMainEntityDisplay();
            ipcRenderer.send("activateMainProcess", 0);
        }
        processingCancelled = !processingCancelled;
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
        let seedSetNum = document.getElementById("seedSetNumInput").value;
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
        ipcRenderer.send("loadAndExecuteSeedRule", seedRuleId);
    });

    cancelLoadSeedRuleButton.addEventListener("click", (event) => {
        document.getElementById("seedRuleSelectionDiv").style.display = "none";
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
        document.getElementById("statusPara").innerText = "Processing...";
        processingCancelled = false;
        let selectedRuleSequenceNum = parseInt(document.getElementById('ruleSelector').value);
        ipcRenderer.send("startSelectedRule", selectedRuleSequenceNum);
    });

    cancelRuleSelectionButton.addEventListener("click", (event) => {
        document.getElementById("ruleSelectionDiv").style.display = "none";
    });


    saveButton.addEventListener('click', (event) => {
        ipcRenderer.send("saveSession", 0);
    });

    loadButton.addEventListener('click', (event) => {
        ipcRenderer.send("loadSession", 0);
    });

    testMonoclonalButton.addEventListener('click', (event) => {
        ipcRenderer.send('openTestMonoclonal');
    });
});

function doEntityDisplay(bestSetNum, bestSetEntityNum) {
    ipcRenderer.send("bestSetEntityDisplay", {bestSetNum: bestSetNum, bestSetEntityNum: bestSetEntityNum});
}


