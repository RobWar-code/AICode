const insSetListDisplay = {
    display(insSetLists) {
        document.getElementById("insSetListDiv").style.display = "block";
        let selectElem = document.getElementById("insSetListSelector");
        selectElem.innerHTML = "";
        for (let itemNum = 0; itemNum <= insSetLists.length; itemNum++) {
            const opt = document.createElement('option');
            opt.value = itemNum;
            opt.textContent = itemNum;
            selectElem.appendChild(opt);
        };
    }
}

module.exports = insSetListDisplay;