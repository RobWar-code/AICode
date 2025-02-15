const ruleDisplay = {

    displayRuleSelector(ruleList) {
        document.getElementById("ruleSelectionDiv").style.display = "block";
        let selectElem = document.getElementById("ruleSelector");
        selectElem.innerHTML = "";
        for (let rule of ruleList) {
            const opt = document.createElement('option');
            opt.value = rule.sequenceNum;
            opt.textContent = rule.rule;
            selectElem.appendChild(opt);
        };
    }

}

module.exports = ruleDisplay;