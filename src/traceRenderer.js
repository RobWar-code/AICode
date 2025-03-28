let stepPause = 2000;
let autoStep = false;
let stepTimeout = null;
let lastData = null;

document.addEventListener('DOMContentLoaded', () => {
    const stepButton = document.getElementById('stepButton');
    const autoStepButton = document.getElementById('autoStepButton');
    const stepPauseInput = document.getElementById('stepPause');
    const traceScoreListButton = document.getElementById('traceScoreListButton');
    const stepRestartButton = document.getElementById('stepRestartButton');
    const jumpToExecutionCountButton = document.getElementById('jumpToExecutionCountButton');
    const executionCountDismiss = document.getElementById('executionCountDismiss');
    const executionCountSelector = document.getElementById("executionCountSelector");
    const scoreListDismiss = document.getElementById('scoreListDismiss');

    window.electronAPI.onMessage("displayTrace", (traceData) => {
        if (traceData.executionEnded) return;
        lastData = traceData;

        window.nodeAPI.traceDisplay.displayTrace(traceData);

        if (traceData.scoreObj != null) {
            document.getElementById("traceScoreListButton").style.display = "inline";
        }
        else {
            document.getElementById("traceScoreListButton").style.display = "none";
        }
        if (autoStep) {
            stepTimeout = setTimeout(() => {
                window.electronAPI.sendMessage('traceStep', 0);
            }, stepPause);
        }    
    });

    stepButton.addEventListener('click', (event) => {
        window.electronAPI.sendMessage('traceStep', 0);
    });

    autoStepButton.addEventListener('click', (event) => {
        autoStep = !autoStep;
        if (autoStep) {
            autoStepButton.innerText = "Auto Step Off";
            window.electronAPI.sendMessage('traceStep', 0);
        }
        else {
            autoStepButton.innerText = "Auto Step";
            clearTimeout(stepTimeout);
        }
    });

    stepRestartButton.addEventListener('click', (event) => {
        window.electronAPI.sendMessage('traceStepRestart', 0);
    });

    stepPauseInput.addEventListener('input', (event) => {
        stepPause = stepPauseInput.value;
    });

    jumpToExecutionCountButton.addEventListener('click', (event) => {
        window.nodeAPI.traceDisplay.displayExecutionSelector();
    });

    executionCountSelector.addEventListener('click', (event) => {
        let executionCount = event.target.value;
        if (executionCount === null) return;
        document.getElementById('executionCountPara').style.display = "none";
        window.electronAPI.sendMessage('traceRestart', parseInt(executionCount));
    });

    executionCountDismiss.addEventListener('click', (event) => {
        document.getElementById("executionCountPara").style.display = "none";
    })

    traceScoreListButton.addEventListener('click', (event) => {
        window.nodeAPI.traceDisplay.displayScoreList(lastData);
    });

    scoreListDismiss.addEventListener('click', (event) => {
        document.getElementById('scoreListBackground').style.display = "none";
    });


});


