document.addEventListener('DOMContentLoaded', () => {
    const stepButton = document.getElementById('stepButton');

    window.electronAPI.onMessage("displayTrace", (traceData) => {
        window.nodeAPI.traceDisplay.displayTrace(traceData);    
    });

    stepButton.addEventListener('click', (event) => {
        window.electronAPI.sendMessage('traceStep', 0);
    });
});


