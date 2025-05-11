const path = require('node:path');
const InstructionSet = require(path.join(__dirname, '../processes/InstructionSet.js'));

const insTests = {

    testGetCodeFragment() {
        let instructionSet = new InstructionSet();
        let codeBlock = instructionSet.getCodeFragment();
        console.log("codeBlock:", codeBlock);
    }
}

// Main

insTests.testGetCodeFragment();

