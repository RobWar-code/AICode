const startRuleDisplay = {

    displayRuleSelector(ruleList) {
        let selectElem = document.getElementById("startRuleSelector");
        selectElem.innerHTML = "";
        for (let rule of ruleList) {
            const opt = document.createElement('option');
            opt.value = rule.sequenceNum;
            opt.textContent = rule.rule;
            selectElem.appendChild(opt);
        };
    }

}

module.exports = startRuleDisplay;