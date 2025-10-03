const entityDisplay = {
    currentData: null,
    numDataDivs: 6,

    display(data) {
        if (!data) return;
        this.currentData = data;
        displayEntityDetails(data);
        this.displayEntityCode(data.data, 0);
        this.displayEntityCode(data.data, 1);
        this.displayEntityRegisters(data);
        this.displayDataValues(data);
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
            document.getElementById("roundsThisRule").innerText = data.roundsThisRule;
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
            document.getElementById("seedTemplateBreedCount").innerText = data.seedTemplateBreedCount;
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

    displayDataValues(data) {
        let displayGroupBy = parseInt(data.displayGroupBy);

        // Sample Data
        let sampleInList = data.sampleIn;
        let sampleOutList = data.sampleOut;
        let colElem1 = document.getElementById("sampleInCol");
        displaySampleData("in", sampleInList, colElem1);
        let colElem2 = document.getElementById("sampleOutCol");
        displaySampleData("out", sampleOutList, colElem2);

        // Initial Params
        let initialParams = data.initialParamsList;
        for (let i = 0; i < this.numDataDivs; i++) {
            let paramsDiv = "initialParams" + i;
            let paramsList = "initialParamsList" + i;
            if (i >= initialParams.length) {
                document.getElementById(paramsList).innerHTML = "";
            }
            else {
                listParams(paramsDiv, paramsList, initialParams[i], displayGroupBy);
            }
        }
        // Parameter blocks
        if (data.params.length < 4) {
            document.getElementById("inputsRow2").classList.add("d-none");
            document.getElementById("outputsRow2").classList.add("d-none");
        }
        else {
            document.getElementById("inputsRow2").classList.remove("d-none");
            document.getElementById("outputsRow2").classList.remove("d-none");
        }
        for (let i = 0; i < this.numDataDivs; i++) {
            let num = i;
            let divId = "inputParams" + num;
            let listId = "inputParamsList" + num;
            if (i >= data.params.length) {
                document.getElementById(listId).innerHTML = "";
            }
            else {
                listDataBlocks(divId, listId, data.params[i], displayGroupBy);
            }
        }
        // Output Blocks
        for (let i = 0; i < this.numDataDivs; i++) {
            let num = i;
            let divId = "outputValues" + num;
            let listId = "outputValuesList" + num;
            if (i >= data.valuesOut.length) {
                document.getElementById(listId).innerHTML = "";
            }
            else {
                listDataBlocks(divId, listId, data.valuesOut[i], displayGroupBy);
            }
        }

        function displaySampleData(direction, list, colElem) {
            colElem.innerHTML = "";
            let html = "";
            let index = 0;
            for (let dataArray of list) {
                html += "<div style='border: 1px solid green'>";
                html += doDataBlocks("sample_" + direction + index, dataArray, data.displayGroupBy);
                html += "</div>";
                ++index;
            }
            colElem.innerHTML = html;
        }

        function listParams(paramsDiv, paramsList, values, displayGroupBy) {
            document.getElementById(paramsList).remove();
            let html = `<div id="${paramsList}">`;
            for (let i = 0; i < values.length; i++) {
                let flag = (Math.floor(i / displayGroupBy)) % 2;
                if (flag === 0) background = "#d0d0d0";
                else background = "#00d0d0";
                html += `<span style="background-color: ${background}">${values[i]} <span>`;
            }
            html += "</div>";
            document.getElementById(paramsDiv).innerHTML = html;
        } 
    
        function listDataBlocks(paramsDiv, paramsList, values, displayGroupBy) {
            document.getElementById(paramsList).remove();
            let html = doDataBlocks(paramsList, values, displayGroupBy);
            document.getElementById(paramsDiv).innerHTML = html;
        }

        function doDataBlocks(paramsList, values, displayGroupBy) {
            let html = `<div id="${paramsList}">`;
            for (let i = 0; i < values.length; i++) {
                let flag = i % 8;
                if (flag === 0) {
                    let offset = i;
                    html += "<p style='margin-bottom: 1px;'>";
                    html += `<span style='display: inline-block; width: 30px;'>${offset})</span>`;
                }
                flag = Math.floor(i / displayGroupBy) % 2;
                let background = "#C0C0C0";
                if (flag === 1) background = "#00F0F0"; 
                html += `<span style="background-color: ${background}">${values[i]} <span>`;
                if (flag === 7) html += "</p>";
            }
            html += "</div>";
            return html;
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
        document.getElementById('scoreListDiv').innerHTML = "";
        // Display the modal
        document.getElementById('scoreListBackground').style.display = "block";
        // Prepare the new list
        let html = "<ul id='scoreList'>";
        let i = 0;
        for (let scoreItem of data.scoreList) {
            let outBlockStart = "";
            if ("outBlockStart" in scoreItem) {
                outBlockStart = scoreItem.outBlockStart;
            }
            let sequenceNum = "&nbsp;";
            if ("sequenceNum" in scoreItem) {
                sequenceNum = scoreItem.sequenceNum;
            }
            let ruleStartRound = "&nbsp;";
            let completed = "&nbsp";
            if (data.ruleRounds[i].start > -1) {
                ruleStartRound = data.ruleRounds[i].start;
                if (data.ruleRounds[i].completed) {
                    completed = "Y";
                }
            }
            let completionRound = "&nbsp;";
            let numRounds = "&nbsp;";
            if (data.ruleRounds[i].completed) {
                completionRound = data.ruleRounds[i].end;
                numRounds = data.ruleRounds[i].end - data.ruleRounds[i].start;
            }

            let score = Math.floor(data.ruleScores[i] * 10000) / 10000;
            html += "<li>";
            html += `<span class="scoreListItem" id="scoreListSequenceNum" style="display: inline-block; width: 80px">${sequenceNum}</span>`;
            html += `<span class="scoreListItem" id="scoreListRule" style="display: inline-block; width: 300px">${scoreItem.rule}</span>`;
            html += `<span class="scoreListItem" id="scoreListScore" style="display: inline-block; width: 100px">${score}</span>`;
            html += `<span class="scoreListItem" id="scoreListMax" style="display: inline-block; width: 50px">${scoreItem.max}</span>`;
            html += `<span class="scoreListItem" id="scoreListStartRound" style="display: inline-block; width: 50px">${ruleStartRound}</span>`;
            html += `<span class="scoreListItem" id="scoreListCompletionRound" style="display: inline-block; width: 50px">${completionRound}</span>`;
            html += `<span class="scoreListItem" id="scoreListNumRounds" style="display: inline-block; width: 53px">${numRounds}</span>`;
            html += `<span class="scoreListItem" id="scoreListCompleted" style="display: inline-block; width: 50px">${completed}</span>`;
            html += "</li>";
            ++i;
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