const path = require('node:path');
const Entity = require(path.join(__dirname, '../processes/Entity.js'));
const InstructionSet = require(path.join(__dirname, '../processes/InstructionSet.js'));

const testMonoclonal = {

    getMonoclonalHTML: function (testWindow) {
        let entities = [];
        // Create the first entity
        let entityNumber = 0;
        let instructionSet = new InstructionSet();
        let asRandom = true;
        let currentCycle = 0;
        let memSpace = null;
        entities.push(new Entity(entityNumber, instructionSet, asRandom, currentCycle, memSpace));
    
        // Create the monoclonal entity
        entityNumber = 1
        entities.push(entities[0].monoclonalBreed(entityNumber, currentCycle));
    
        // disassemble the code
        let memLists = [];
        for (let i = 0; i < 2; i++) {
            let memSpace = entities[i].initialMemSpace;
            memLists.push(instructionSet.disassemble(memSpace, 0, memSpace.length));
        }
    
        // Display the disassembled lists
        let htmlData = [];
        for (let i = 0; i < 2; i++) {
            let itemNum = i + 1;
            let list = "monoclonalList" + itemNum;
            html = `<ul id='${list}' style='list-style: none'>`;
            for (let j = 0; j < memLists[i].length; j++) {
                html += "<li>"
                html += "<span style='display: inline-block; width: 32px'>";
                html += `${memLists[i][j].offset}`;
                html += "</span>";
                html += "<span style='display: inline-block; width: 32px'>";
                html += `${memLists[i][j].code}`;
                html += "</span>";
                html += "<span style='display: inline-block; width: 100px'>";
                html += `${memLists[i][j].ins}`;
                html += "</span>";
                let insLen = memLists[i][j].insLen;
                let dataStr = "";
                if (insLen > 1) {
                    let insData = memLists[i][j].data;
                    for (let k = 0; k < insData.length; k++) {
                        dataStr = insData[k].decimal + " ";
                    }
                }
                html += `<span>${dataStr}</span>`;
                html += "</li>";
            }
            html += "</ul>";
            htmlData.push(html);
        }
        testWindow.webContents.send('displayMonoclonalTest', htmlData);
    }
}

module.exports = testMonoclonal;