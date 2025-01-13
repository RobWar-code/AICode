const traceDisplay = {
    startDone: false,

    displayTrace(traceData) {
        if (traceData.start) {
            // Display the fixed data
            document.getElementById('bestSetNum').innerText = traceData.fixedData.bestSetNum;
            document.getElementById('bestSetEntityNum').innerText = traceData.fixedData.bestSetEntityNum;
            document.getElementById('entityId').innerText = traceData.fixedData.entityNumber;

            // Initial Parameters
            this.displayInitialParams(traceData.fixedData.initialParamsList);

            // Initial Code List
            this.displayInitialCode(traceData.fixedData.initialMemList);
        }
        this.doRegisterList("prevReg", traceData.previousRegisters);
        this.doRegisterList("reg", traceData.registers);
        this.listDataBlocks('params', 'paramsList', traceData.params);
        this.listDataBlocks('outputValues', 'outputValuesList', traceData.valuesOut);
        this.displayActiveCode(traceData.insList, traceData.stepLine);
    },

    displayInitialParams(initialParamsList) {
        for (let i = 0; i < initialParamsList.length; i++) {
            let paramStr = "";
            for (let j = 0; j < initialParamsList[i].length; j++) {
                paramStr += initialParamsList[i][j] + " ";
            }
            let elemId = "initialParamsList" + i;
            document.getElementById(elemId).innerText = paramStr;
        }
    },

    displayInitialCode(initialMemList) {
        document.getElementById('initialCodeList').remove();
        let html = "<ul id='initialCodeList' style='list-style: none'>";
        for (let i = 0; i < initialMemList.length; i++) {
            html += "<li>";
            html += "<span style='display: inline-block; width: 32px'>";
            html += `${initialMemList[i].offset}`;
            html += "</span>";
            html += "<span style='display: inline-block; width: 32px'>";
            html += `${initialMemList[i].code}`;
            html += "</span>"
            html += "<span style='display: inline-block; width: 100px'>";
            html += `${initialMemList[i].ins}`;
            html += "</span>";
            html += "<span style='display: inline-block; width: 240px'>";
            let dataStr = "";
            for (let j = 0; j < initialMemList[i].data.length; j++) {
                dataStr += `${initialMemList[i].data[j].decimal} (${initialMemList[i].data[j].hex}) `;
            }
            html += dataStr;
            html += "</span>";
            html += "</li>";
        }
        html += "</ul>";
        document.getElementById('initialCode').innerHTML = html;
    },

    displayActiveCode(insList, stepLine){
        document.getElementById('currentCodeList').remove();
        let html = "<ul id='currentCodeList' style='list-style: none'>";
        for (let i = 0; i < insList.length; i++) {
            html += "<li>";
            html += "<span style='display: inline-block; width: 16px'>";
            html += `${insList[i].IPMark}`;
            html += "</span>"
            html += "<span style='display: inline-block; width: 32px'>";
            html += `${insList[i].offset}`;
            html += "</span>";
            html += "<span style='display: inline-block; width: 32px'>";
            html += `${insList[i].code}`;
            html += "</span>"
            html += "<span style='display: inline-block; width: 100px'>";
            html += `${insList[i].ins}`;
            html += "</span>";
            html += "<span style='display: inline-block; width: 240px'>";
            let dataStr = "";
            for (let j = 0; j < insList[i].data.length; j++) {
                dataStr += `${insList[i].data[j].decimal} (${insList[i].data[j].hex}) `;
            }
            html += dataStr;
            html += "</span>";
            html += "</li>";
        }
        html += "</ul>";
        document.getElementById('currentCode').innerHTML = html;

        this.doCodeScroll(stepLine, insList.length);
    },

    doRegisterList(htmlFieldName, registers) {
        for (let [key, value] of Object.entries(registers)) {
            fieldId = htmlFieldName + key;
            let regElem = document.getElementById(fieldId);
            regElem.innerText = value;
        }
    },

    listDataBlocks(paramsDiv, paramsList, values) {
        document.getElementById(paramsList).remove();
        let html = `<div id="${paramsList}">`;
        for (let i = 0; i < values.length; i++) {
            let flag = i % 8;
            if (flag === 0) {
                let offset = i;
                html += "<p style='margin-bottom: 1px;'>";
                html += `<span style='display: inline-block; width: 30px;'>${offset})</span>`;
            }
            html += `<span>${values[i]} <span>`;
            if (flag === 7) html += "</p>";
        }
        html += "</div>";
        document.getElementById(paramsDiv).innerHTML = html;
    },

    doCodeScroll(stepLine, numIns) {
        const divElem = document.getElementById('currentCode');
        const lineHeight = 17;
        const lineClearance = 8;
        const divHeightPx = divElem.style.height;
        const divHeight = parseInt(divHeightPx.substring(0, divHeightPx.length - 2));
        let numDivLines = Math.floor(divHeight / lineHeight);
        let listLength = numIns * lineHeight;
        if (stepLine <= lineClearance) {
            divElem.scrollTop = 0;
        }
        else if (stepLine * lineHeight > listLength - divHeight) {
            divElem.scrollTop = listLength - divHeight;
        }
        else {
            divElem.scrollTop = lineHeight * (stepLine - lineClearance);
        }
    }
}

module.exports = traceDisplay;