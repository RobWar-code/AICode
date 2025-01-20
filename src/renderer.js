const {ipcRenderer, ipcMain} = require("electron");
const path = require('node:path');
const entityDisplay = require(path.join(__dirname, "/display/entityDisplay.js"));
const scoreHistory = require(path.join(__dirname, '/display/scoreHistory.js'));
const seedDisplay = require(path.join(__dirname, '/display/seedDisplay.js'));
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
        }, 2000);
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
    const insertSeedForm = document.getElementById('insertSeedForm');
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
            document.getElementById("haltProcessButton").innerText = "Restart";
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
            document.getElementById("haltProcessButton").innerText = "Restart";
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


