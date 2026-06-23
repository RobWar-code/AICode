const path = require('node:path');
const rulesets = require(path.join(__dirname, "./rulesets.js"));

const fragInspector = {

    fetch(fragRequest, instructionSet) {
        let insCodeData = [];
        let source = fragRequest.source;
        let fragNum = fragRequest.fragNum;
        let numFrags = rulesets.seedRuleFragments.length;
        if (fragNum < numFrags) {
            // Collect the instruction code data
            insCodeData = this.getFragInsCodeData(fragNum, instructionSet);
        }
        return {numFrags: numFrags, insCodeData: insCodeData};
    },

    getFragInsCodeData(fragNum, insSet) {
        let insCodeData = [];
        let frag = rulesets.seedRuleFragments[fragNum];
        for (let i = 0; i < frag.length; i++) {
            let offset = i;
            let code = frag[i];
            let insItem = insSet.getInsDetails(code);
            let insName = insItem.name;
            let insLen = insItem.insLen;
            // Get the data bytes
            let decData = "";
            let hexData = "";
            if (insLen > 1) {
                for (let j = 1; j < insLen; j++) {
                    decData = decData + frag[i + j] + " ";
                    let hex = frag[i + j].toString(16);
                    if (hex.length < 2) hex = "0" + hex;
                    hexData += hex + " ";
                }
                i += insLen - 1;
            }
            let codeItem = {
                offset: offset,
                code: code,
                ins: insName,
                decData: decData,
                hexData: hexData
            }
            insCodeData.push(codeItem);
        }
        return insCodeData;
    }
}

module.exports = fragInspector;