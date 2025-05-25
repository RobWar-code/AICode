const path = require('node:path');
const InstructionSet = require(path.join(__dirname, '../processes/InstructionSet.js'));

const insTests = {

    testGetCodeFragment() {
        let instructionSet = new InstructionSet();
        let codeBlock = instructionSet.getCodeFragment();
        console.log("codeBlock:", codeBlock);
    },

    testCompileCodeFragmentOrTemplate() {
        let instructionSet = new InstructionSet();
        let fragment = [
            {
                ins: "LD A, IMM",
                data: [16]
            },
            {
                label: "first",
                ins: "ST (MEM), A",
                data: ["storeOne"]
            },
            {
                ins: "JR",
                data: ["first"]
            },
            {
                ins: "CALL",
                data: ["second"]
            },
            {
                noops: 5
            },
            {
                label: "second",
                ins: "ADD A, B"
            },
            {
                ins: "RET"
            },
            {
                addr: 200
            },
            {
                label: "storeOne"
            }
        ];
        let codeBlock = instructionSet.compileCodeFragmentOrTemplate(fragment);
        console.log(codeBlock);
    }
}

// Main

// insTests.testGetCodeFragment();
insTests.testCompileCodeFragmentOrTemplate();

