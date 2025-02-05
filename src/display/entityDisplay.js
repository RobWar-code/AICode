const entityDisplay = {
    currentData: null,

    display(data) {
        if (!data) return;
        this.currentData = data;
        displayEntityDetails(data);
        this.displayEntityCode(data.data, 0);
        this.displayEntityCode(data.data, 1);
        this.displayEntityRegisters(data);
        this.displayDataValues(data, data.data, 1);
        return;

        function displayEntityDetails(data) {
            document.getElementById("bestSetNum").innerText = data.bestSetNum;
            document.getElementById("bestSetEntityNum").innerText = data.bestSetEntityNum;
            document.getElementById("currentCycle").innerText = data.currentCycle;
            document.getElementById("numRounds").innerText = data.numRounds;
            document.getElementById("entityId").innerText = data.entityNumber;
            document.getElementById("creationCycle").innerText = data.birthCycle;
            document.getElementById("numTrials").innerText = data.numTrials;
            document.getElementById("mainTotalScore").innerText = data.score;
            document.getElementById("ruleSequenceNum").innerText = data.ruleSequenceNum;
            document.getElementById("currentMaxScore").innerText = data.currentMaxScore;
            document.getElementById("maxScore").innerText = data.maxScore;
            document.getElementById("elapsedTime").innerText = data.elapsedTime;
            document.getElementById("breedMethod").innerText = data.breedMethod;
            document.getElementById("randomCount").innerText = data.randomCount;
            document.getElementById("monoclonalInsCount").innerText = data.monoclonalInsCount;
            document.getElementById("monoclonalByteCount").innerText = data.monoclonalByteCount;
            document.getElementById("interbreedCount").innerText = data.interbreedCount;
            document.getElementById("interbreed2Count").innerText = data.interbreed2Count;
            document.getElementById("interbreedFlaggedCount").innerText = data.interbreedFlaggedCount;
            document.getElementById("interbreedInsMergeCount").innerText = data.interbreedInsMergeCount;
            document.getElementById("selfBreedCount").innerText = data.selfBreedCount;
            document.getElementById("seedRuleBreedCount").innerText = data.seedRuleBreedCount;
            document.getElementById("crossSetCount").innerText = data.crossSetCount;
            document.getElementById("currentRule").innerText = data.currentRule;
        }
    },

    displayEntityRegisters(data) {
        document.getElementById("regA").innerText = data.registers.A;
        document.getElementById("regB").innerText = data.registers.B;
        document.getElementById("regC").innerText = data.registers.C;
        document.getElementById("regCF").innerText = data.registers.CF;
        document.getElementById("regZF").innerText = data.registers.ZF;
        document.getElementById("regSP").innerText = data.registers.SP;
        document.getElementById("regIP").innerText = data.registers.IP;
        document.getElementById("regIC").innerText = data.registers.IC;
    },

    displayDataValues(data, dataBlock, index) {
        let initialParams = data.initialParamsList;
        let dataIn = dataBlock[index].inputParams;
        let dataOut = dataBlock[index].oldValuesOut;
        for (let i = 0; i < initialParams.length; i++) {
            let paramsDiv = "initialParams" + i;
            let paramsList = "initialParamsList" + i;
            listParams(paramsDiv, paramsList, initialParams[i]);
        }
        // Parameter blocks
        for (let i = 0; i < 2; i++) {
            let num = (i + 1);
            let divId = "inputParams" + num;
            let listId = "inputParamsList" + num;
            if (data.params.length > 0) {
                listDataBlocks(divId, listId, data.params[i]);
            }
        }
        // Output Blocks
        for (let i = 0; i < 2; i++) {
            let num = i + 1;
            let divId = "outputValues" + num;
            let listId = "outputValuesList" + num;
            if (data.valuesOut.length > 0) {
                listDataBlocks(divId, listId, data.valuesOut[i]);
            }
        }

        function listParams(paramsDiv, paramsList, values) {
            document.getElementById(paramsList).remove();
            let html = `<div id="${paramsList}">`;
            for (let i = 0; i < values.length; i++) {
                let flag = (Math.floor(i / 4)) % 2;
                if (flag === 0) background = "#d0d0d0";
                else background = "#00d0d0";
                html += `<span style="background-color: ${background}">${values[i]} <span>`;
            }
            html += "</div>";
            document.getElementById(paramsDiv).innerHTML = html;
        } 
    
        function listDataBlocks(paramsDiv, paramsList, values) {
            document.getElementById(paramsList).remove();
            let html = `<div id="${paramsList}">`;
            for (let i = 0; i < values.length; i++) {
                let flag = i % 8;
                if (flag === 0) {
                    let offset = i;
                    html += "<p style='margin-bottom: 1px;'>";
                    html += `<span style='display: inline-block; width: 30px;'>${offset})</span>`;
                }
                html += `<span style="background-color: ${background}">${values[i]} <span>`;
                if (flag === 7) html += "</p>";
            }
            html += "</div>";
            document.getElementById(paramsDiv).innerHTML = html;
        }
    },

    displayEntityCode(codeBlock, index) {
        let listDiv, list;
        if (index === 0) {
            listDiv = "initialCode";
            list = "initialCodeList";
        }
        else {
            listDiv = "finalCode";
            list = "finalCodeList";
        }
        let listElem = document.getElementById(list);
        if (listElem) {
            document.getElementById(list).remove();
        }
        document.getElementById(listDiv).innerHTML = 
            `<ul id="${list}" style='list-style-type: none; padding-left: 0px; margin-left: 0px;'><ul>`;
        let htmlSet = "";
        let addr = 0;
        for (let i = 0; i < codeBlock[index].code.length; i++) {
            let insLen = codeBlock[index].code[i].insLen;
            let htmlItem = "<li><div class='row'>";
            htmlItem += `<div class='col-sm-1'>${i}</div>`;
            htmlItem += `<div class='col-sm-1'>${addr}</div>`;
            htmlItem += `<div class='col-sm-1'>${codeBlock[index].code[i].code}</div>`;
            htmlItem += `<div class='col-sm-4'>${codeBlock[index].code[i].ins}</div>`;
            if (insLen > 1) {
                let numString = "";
                for (let j = 0; j < codeBlock[index].code[i].data.length; j++) {
                    valueItem = codeBlock[index].code[i].data[j];
                    numString += valueItem.decimal + "(0x" + valueItem.hex + ") ";
                };
                htmlItem += `<div class='col-sm-5'>${numString}</div`;
            }
            htmlItem += "</div>"
            htmlItem += "</li>";
            htmlSet += htmlItem;
            addr += insLen;
        }
        document.getElementById(listDiv).innerHTML = htmlSet;
    },

    displayScoreList() {
        let data = this.currentData;
        // Clear the old list
        document.getElementById('scoreList').remove();
        // Display the modal
        document.getElementById('scoreListBackground').style.display = "block";
        // Prepare the new list
        let html = "<ul id='scoreList'>"
        for (let scoreItem of data.scoreList) {
            let outBlockStart = "";
            if ("outBlockStart" in scoreItem) {
                outBlockStart = scoreItem.outBlockStart;
            }
            let sequenceNum = "";
            if ("sequenceNum" in scoreItem) {
                sequenceNum = scoreItem.sequenceNum;
            }
            let completionRound = "";
            if ("completionRound" in scoreItem) {
                if (scoreItem.completionRound > -1) {
                    completionRound = scoreItem.completionRound;
                }
            }
            let score = Math.floor(scoreItem.score * 10000) / 10000;
            html += "<li>";
            html += `<span id="scoreListStartRound" style="display: inline-block; width: 50px">${scoreItem.startRoundNum}</span>`;
            html += `<span id="scoreListOutAddress" style="display: inline-block; width: 50px">${outBlockStart}</span>`;
            html += `<span id="scoreListSequenceNum" style="display: inline-block; width: 60px">${sequenceNum}</span>`;
            html += `<span id="scoreListRule" style="display: inline-block; width: 300px">${scoreItem.rule}</span>`;
            html += `<span id="scoreListScore" style="display: inline-block; width: 100px">${score}</span>`;
            html += `<span id="scoreListMax" style="display: inline-block; width: 40px">${scoreItem.max}</span>`;
            html += `<span id="scoreListCompletionRound" style="display: inline-block; width: 60px">${completionRound}</span>`;
            html += "</li>";
        }
        html += "</ul>";
        document.getElementById('scoreListDiv').innerHTML = html;
        document.getElementById('totalScore').innerText = data.score;
    },

    redoMainEntityDisplay() {
        // Redisplay the best entity selector
        document.getElementById("bestEntitySelectorDiv").style.display = "block";
        // Redisplay the entity process details
        document.getElementById("entityDetails").style.display = "block";
        // Hide the seed divs
        document.getElementById("seedSelectionDiv").style.display = "none";
        document.getElementById("seedDetails").style.display = "none";
        // Hide the seed rule divs
        document.getElementById("seedRuleSelectionDiv").style.display = "none";
        // Re-display the option buttons
        document.getElementById("scoreHistoryButton").style.display = "inline";
        document.getElementById("loadSeedButton").style.display = "inline";
        document.getElementById("saveButton").style.display = "inline";
        document.getElementById("loadButton").style.display = "inline";

    }
}

module.exports = entityDisplay;