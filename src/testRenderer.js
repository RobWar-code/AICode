document.addEventListener('DOMContentLoaded', () => {
    const monoclonalButton = document.getElementById('executeMonoclonalTestButton');

    monoclonalButton.addEventListener('click', (event) => {
        window.electronAPI.sendMessage('getMonoclonalTestData', 0);
    });
});

window.electronAPI.onMessage("displayMonoclonalTest", (htmlData) => {
    window.nodeAPI.displayMonoclonal.displayData(htmlData);    
});

