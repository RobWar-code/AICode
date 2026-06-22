const path = require('node:path');
const rulesets = require(path.join(__dirname, "./rulesets.js"));

const fragInspector = {

    fetch(fragRequest) {
        let source = fragRequest.source;
        let fragNum = fragRequest.fragNum;
        let numFrags = rulesets.seedRuleFragments.length;
        return {numFrags: numFrags};
    }
}

module.exports = fragInspector;