const path = require('node:path');
const entityDisplay = require(path.join(__dirname, "entityDisplay.js"));

const seedDisplay = {

    displaySelector(nameList) {
        // Build the selection list
        const selector = document.getElementById("seedSelector");
        selector.innerHTML = "";
        let count = 0;
        nameList.forEach(option => {
            const opt = document.createElement('option');
            opt.value = count;
            opt.textContent = option;
            selector.appendChild(opt);
            ++count;
        });
        // Display the seed selector div
        document.getElementById("seedSelectionDiv").style.display = "block";
    },

    displaySeedResults(displayData) {
        // Display the seed program details
        displaySeedProgramDetails(displayData);
        // Display the program details
        entityDisplay.displayEntityCode(displayData.data, 0);
        entityDisplay.displayEntityCode(displayData.data, 1);
        entityDisplay.displayEntityRegisters(displayData);
        entityDisplay.displayDataValues(displayData, displayData.data, 1);
        return;

        function displaySeedProgramDetails(displayData) {
            // Hide the best set display selector
            document.getElementById("bestEntitySelectorDiv").style.display = "none";
            // Hide the standard entity process details
            document.getElementById("entityDetails").style.display = "none";
            // Show the seed program details
            document.getElementById("seedDetails").style.display = "block";
            document.getElementById("seedName").innerText = displayData.seedName;
            document.getElementById("seedDescription").innerText = displayData.seedDescription;

            // Hide the process button options
            document.getElementById("scoreHistoryButton").style.display = "none";
            document.getElementById("haltProcessButton").innerText = "Resume Process";
            document.getElementById("loadSeedButton").style.display = "none";
            document.getElementById("saveButton").style.display = "none";
            document.getElementById("loadButton").style.display = "none";

        }
    }

}

module.exports = seedDisplay; 