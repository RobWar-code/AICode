const restoreRuleSeed = {
    ruleSeedSet: [],

    displayModal(seedList) {
        document.getElementById('restoreRuleSeedBackground').style.display = "block";
        // Display the seed selector
        let selector = document.getElementById("restoreRuleSeedSelector");
        selector.innerHTML = "";
        const opt = document.createElement('option');
        opt.value = -1;
        opt.textContent = "None Selected";
        selector.appendChild(opt);
        for (let item of seedList) {
            const opt = document.createElement('option');
            opt.value = item.ruleId;
            opt.textContent = item.name;
            selector.appendChild(opt);
        };
        // Initialise selections
        this.ruleSeedSet = [];
        document.getElementById('restoreRuleSeedSelectionsList').innerHTML = "";
    },

    insertSelection() {
        let selector = document.getElementById("restoreRuleSeedSelector");
        let ruleId = parseInt(selector.value);
        if (ruleId === -1) return;
        // Check whether the rule has already been added
        let found = false;
        for (let id of this.ruleSeedSet) {
            if (id === ruleId) {
                found = true;
                break;
            }
        }
        if (found) {
            return;
        }

        let optionNum = selector.selectedIndex;
        this.ruleSeedSet.push(ruleId);
        // Update the display
        let selectionList = document.getElementById('restoreRuleSeedSelectionsList');
        selectionList.innerHTML += `<li data-ruleId="${ruleId}" onclick="restoreRuleSeed.removeItem(event)">
            ${selector.options[optionNum].textContent}</li>`;
    },

    removeItem(event) {
        let ruleId = event.target.getAttribute('data-ruleId');
        ruleId = parseInt(ruleId);
        // Remove from the set of selections
        // Find the rule
        let found = false;
        let itemNum = 0;
        for (let id of this.ruleSeedSet) {
            if (id === ruleId) {
                found = true;
                break;
            }
            ++itemNum;
        }
        if (!found) return;
        let a = [];
        for (let i = 0; i < this.ruleSeedSet.length; i++) {
            if (i != itemNum) a.push(this.ruleSeedSet[i]);
        }
        this.ruleSeedSet = a;
        event.target.remove();
    }
}

module.exports = restoreRuleSeed;