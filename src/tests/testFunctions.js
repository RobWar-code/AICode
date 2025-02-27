const path = require('node:path');
const InstructionSet = require(path.join(__dirname, '../processes/InstructionSet.js'));

/*
let crossSetRange = 9;
let numBestSets = 32;
let bestSetNum = 20;

for (let i = 0; i < 40; i++) {
    let r = chooseBestSetMate(crossSetRange, bestSetNum, numBestSets);
    console.log(r);
}
*/

function chooseBestSetMate(crossSetRange, bestSetNum, numBestSets) {
    let n = crossSetRange; // range of selection
    let d = Math.floor(n/2);
    if (bestSetNum < d) {
        n = n - (d - bestSetNum);
        d = bestSetNum;
    }
    else if (bestSetNum >= numBestSets - d) {
        n = n - ((d + 1) - (numBestSets - bestSetNum));
    }
    let r = Math.floor(Math.random() * n) - d;
    if (r === 0) {
        if (bestSetNum - 1 < 0) r = 1;
        else if (bestSetNum + 1 >= numBestSets) r = -1;
        else r = (Math.floor(Math.random() * 2) * 2) - 1; 
    }
    return r;
}

function doGetCodeFragmentTest() {
    let insSet = new InstructionSet();
    let codeBlock = insSet.getCodeFragment();
    console.log("Code Fragment:", codeBlock);
}

doGetCodeFragmentTest();