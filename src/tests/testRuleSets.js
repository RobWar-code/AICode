const InstructionSet = require('../processes/InstructionSet');
const rulesets = require('../processes/rulesets.js');


const testRuleSets = {
    instructionSet: new InstructionSet(),

    testCountInsOccurrences: function () {
        // Test Script
        const testScript = this.getTestScript();
        // Compile to byte format
        let memSpace = new Array(testScript.length).fill(0);
        this.instructionSet.compileTestCode(testScript, memSpace);
        let count = this.instructionSet.countInsInMemSpace(memSpace, memSpace.length, "CALL");
    },

    testCountInsDistribution: function () {
        // Test Script
        const testScript = this.getTestScript();
        // Compile to byte format
        let memSpace = new Array(testScript.length).fill(0);
        this.instructionSet.compileTestCode(testScript, memSpace);
        let optimum = 4;
        let score = this.instructionSet.scoreDistribution("CALL", optimum, memSpace, memSpace.length);
    },

    testValuesOutFromInitialParams: function() {
        let initialParams = [0, 1, 2, 3];
        let valuesOut = [3, 1, 0, 2];
        let outBlockStart = 0;
        let outBlockLen = 4;
        let inBlockStart = 0;
        let inBlockLen = 4;
        let score = rulesets.valuesOutFromInitialParams(initialParams, valuesOut, outBlockStart, outBlockLen,
            inBlockStart, inBlockLen
        )
        console.log("score, expect 1:", score);

        valuesOut = [3, 1, 1, 2];
        score = rulesets.valuesOutFromInitialParams(initialParams, valuesOut, outBlockStart, outBlockLen,
            inBlockStart, inBlockLen
        )
        console.log("score, expect 0.75:", score);

        initialParams = [1, 1, 0, 2];
        score = rulesets.valuesOutFromInitialParams(initialParams, valuesOut, outBlockStart, outBlockLen,
            inBlockStart, inBlockLen
        )
        console.log("score, expect 0.75:", score);
    },

    getTestScript: function() {
        const testScript = [
            {
                addr: 0,
                ins: "ADD A, B",
            },
            {
                addr: 0,
                ins: "JRZ",
                data: [0x15]
            },
            {
                addr: 0,
                ins: "CALL",
                data: [0x15]
            },
            {
                addr: 0,
                ins: "RET",
            },
            {
                addr: 0,
                ins: "SUB A, B"
            },
            {
                addr: 0,
                ins: "CALL",
                data: [0x15]
            },
            {
                addr: 0,
                ins: "RET",
            },
            {
                addr: 0,
                ins: "SUB A, B"
            },
            {
                addr: 0,
                ins: "ADD A, B",
            },
            {
                addr: 0,
                ins: "JRZ",
                data: [0x15]
            },
            {
                addr: 0,
                ins: "CALL",
                data: [0x15]
            }
        ]
        return testScript;
    },

    testMatchCASM: function() {
        let memSpace = getScriptMemSpace1(this.instructionSet);
        console.log("memSpace[0]", memSpace[0]);
        let score = rulesets.matchCASM(this.instructionSet, memSpace);
        console.log("matchCASM score:", score);

        function getScriptMemSpace1(instructionSet) {
            testScript = [
                {
                    ins: "SM",
                    data: [0]
                },
                {
                    ins: "SM",
                    data: [1]
                },
                {
                    ins: "LD A, (C)"
                },
                {
                    ins: "CASM",
                    data: [0]
                },
                {
                    ins: "CASM",
                    data: [1]
                }
            ];

            // Compile the code
            let memSpace = new Array(256).fill(0);
            instructionSet.compileTestCode(testScript, memSpace);
            return memSpace;
        }
    }
}

const testByteRules = {
    initialParams: new Array(256).fill(0),
    params: new Array(256).fill(0),
    valuesOut: new Array(256).fill(0),

    valuesOutFromInitialParams: function() {
        let ruleNum = 4;
        rulesets.initialise();
        let rule = rulesets.scoreList[ruleNum];
        let offset = 1;
        let address = rule.outBlockStart + offset;
        // Test value correct
        let inStart = rule.inBlockStart;
        this.initialParams[inStart + offset] = 8;
        let value = 8;
        let resultObj = rulesets.getOutputByteScore(value, address, this.initialParams, this.params, this.valuesOut);
        console.log("valuesOutFromInitialParams");
        console.log("score", resultObj.totalScore, "significance", resultObj.totalSignificance);
    },

    valuesOutMatchInitialParams: function () {
        let ruleNum = 5;
        rulesets.initialise();
        let rule = rulesets.scoreList[ruleNum];
        let offset = 1;
        let address = rule.outBlockStart + offset;
        // Test value correct
        let inStart = rule.inBlockStart;
        this.initialParams[inStart + offset] = 12;
        let value = 12;
        let resultObj = rulesets.getOutputByteScore(value, address, this.initialParams, this.params, this.valuesOut);
        console.log("valuesOutMatchInitialParams");
        console.log("score", resultObj.totalScore, "significance", resultObj.totalSignificance);
    },

    valuesOutDifferent: function () {
        let ruleNum = 7;
        rulesets.initialise();
        let rule = rulesets.scoreList[ruleNum];
        let offset = 1;
        let address = rule.outBlockStart + offset;
        this.valuesOut[rule.outBlockStart] = 1;
        this.valuesOut[rule.outBlockStart + 2] = 3;
        // Test value correct
        let value = 15;
        let resultObj = rulesets.getOutputByteScore(value, address, this.initialParams, this.params, this.valuesOut);
        console.log("valuesOutDifferent");
        console.log("score", resultObj.totalScore, "significance", resultObj.totalSignificance);
    },

    valuesOutSeries: function () {
        let ruleNum = 8;
        rulesets.initialise();
        let rule = rulesets.scoreList[ruleNum];
        let offset = 0;
        let address = rule.outBlockStart + offset;
        this.valuesOut[rule.outBlockStart + 1] = 2;
        this.valuesOut[rule.outBlockStart + 2] = 3;
        // Test value correct
        let value = 1;
        let resultObj = rulesets.getOutputByteScore(value, address, this.initialParams, this.params, this.valuesOut);
        console.log("valuesOutSeries 1");
        console.log("score", resultObj.totalScore, "significance", resultObj.totalSignificance);

        offset = 1;
        address = rule.outBlockStart + offset;
        this.valuesOut[rule.outBlockStart + 2] = 3;
        this.valuesOut[rule.outBlockStart + 3] = 4;
        // Test value correct
        value = 2;
        resultObj = rulesets.getOutputByteScore(value, address, this.initialParams, this.params, this.valuesOut);
        console.log("valuesOutSeries 2");
        console.log("score", resultObj.totalScore, "significance", resultObj.totalSignificance);

        offset = rule.outBlockLen - 1;
        address = rule.outBlockStart + offset;
        for (let i = 0; i < rule.outBlockLen - 1; i++) {
            this.valuesOut[rule.outBlockStart + i] = i + 1;
        }
        // Test value correct
        value = rule.outBlockLen;
        resultObj = rulesets.getOutputByteScore(value, address, this.initialParams, this.params, this.valuesOut);
        console.log("valuesOutSeries 3");
        console.log("score", resultObj.totalScore, "significance", resultObj.totalSignificance);
    },

    valuesOutFromParams: function () {
        let ruleNum = 9;
        rulesets.initialise();
        let rule = rulesets.scoreList[ruleNum];
        let offset = 1;
        let address = rule.outBlockStart + offset;
        // Test value correct
        let inStart = rule.inBlockStart;
        this.params[inStart + offset] = 12;
        let value = 12;
        let resultObj = rulesets.getOutputByteScore(value, address, this.initialParams, this.params, this.valuesOut);
        console.log("valuesOutFromParams");
        console.log("score", resultObj.totalScore, "significance", resultObj.totalSignificance);
    },

    paramsPlusThree: function () {
        let ruleNum = 10;
        rulesets.initialise();
        let rule = rulesets.scoreList[ruleNum];
        let offset = 1;
        let address = rule.outBlockStart + offset;
        // Test value correct
        let inStart = rule.inBlockStart;
        this.initialParams[inStart + offset] = 12;
        let value = 15;
        let resultObj = rulesets.getOutputByteScore(value, address, this.initialParams, this.params, this.valuesOut);
        console.log("paramsPlusThree1");
        console.log("score", resultObj.totalScore, "significance", resultObj.totalSignificance);

        offset = 1;
        address = rule.outBlockStart + offset;
        // Test value correct
        inStart = rule.inBlockStart;
        this.initialParams[inStart + offset] = 12;
        value = 16;
        resultObj = rulesets.getOutputByteScore(value, address, this.initialParams, this.params, this.valuesOut);
        console.log("paramsPlusThree2");
        console.log("score", resultObj.totalScore, "significance", resultObj.totalSignificance);
    },

    paramsTimesTwo: function () {
        let ruleNum = 11;
        rulesets.initialise();
        let rule = rulesets.scoreList[ruleNum];
        let offset = 1;
        let address = rule.outBlockStart + offset;
        // Test value correct
        let inStart = rule.inBlockStart;
        this.initialParams[inStart + offset] = 12;
        let value = 24;
        let resultObj = rulesets.getOutputByteScore(value, address, this.initialParams, this.params, this.valuesOut);
        console.log("paramsTimesTwo1");
        console.log("score", resultObj.totalScore, "significance", resultObj.totalSignificance);

        offset = 1;
        address = rule.outBlockStart + offset;
        // Test value correct
        inStart = rule.inBlockStart;
        this.initialParams[inStart + offset] = 12;
        value = 30;
        resultObj = rulesets.getOutputByteScore(value, address, this.initialParams, this.params, this.valuesOut);
        console.log("paramsTimesTwo2");
        console.log("score", resultObj.totalScore, "significance", resultObj.totalSignificance);

    },

    multiplyParams: function () {

        let ruleNum = 12;
        rulesets.initialise();
        let rule = rulesets.scoreList[ruleNum];
        let offset = 0;
        let address = rule.outBlockStart + offset;
        // Test value correct
        let inStart = rule.inBlockStart;
        this.initialParams[inStart + offset] = 3;
        this.initialParams[inStart + offset + 1] = 4;
        let value = 12;
        let resultObj = rulesets.getOutputByteScore(value, address, this.initialParams, this.params, this.valuesOut);
        console.log("multiplyParams1");
        console.log("score", resultObj.totalScore, "significance", resultObj.totalSignificance);

        offset = 2;
        address = rule.outBlockStart + offset;
        // Test value correct
        inStart = rule.inBlockStart;
        this.initialParams[inStart + offset] = 12;
        this.initialParams[inStart + offset + 1] = 12;
        value = 100;
        resultObj = rulesets.getOutputByteScore(value, address, this.initialParams, this.params, this.valuesOut);
        console.log("multiplyParams2");
        console.log("score", resultObj.totalScore, "significance", resultObj.totalSignificance);
    },

    divideParams: function () {
        let ruleNum = 13;
        rulesets.initialise();
        let rule = rulesets.scoreList[ruleNum];
        let offset = 0;
        let address = rule.outBlockStart + offset;
        // Test value correct
        let inStart = rule.inBlockStart;
        let inStart2 = rule.inBlockStart2;
        this.initialParams[inStart + offset] = 3;
        this.initialParams[inStart2 + offset] = 12;
        let value = 4;
        let resultObj = rulesets.getOutputByteScore(value, address, this.initialParams, this.params, this.valuesOut);
        console.log("divideParams1");
        console.log("score", resultObj.totalScore, "significance", resultObj.totalSignificance);

        offset = 2;
        address = rule.outBlockStart + offset;
        // Test value correct
        inStart = rule.inBlockStart;
        inStart2 = rule.inBlockStart2;
        this.initialParams[inStart + offset] = 12;
        this.initialParams[inStart2 + offset] = 60;
        value = 3;
        resultObj = rulesets.getOutputByteScore(value, address, this.initialParams, this.params, this.valuesOut);
        console.log("divideParams2");
        console.log("score", resultObj.totalScore, "significance", resultObj.totalSignificance);
    }
}
console.log("Got Here");
/*
testRuleSets.testCountInsOccurrences();
testRuleSets.testCountInsDistribution();
testRuleSets.testValuesOutFromInitialParams();
*/
testRuleSets.testMatchCASM();

// testByteRules.valuesOutFromInitialParams();
// testByteRules.valuesOutMatchInitialParams();
// testByteRules.valuesOutDifferent();
// testByteRules.valuesOutSeries();
// testByteRules.valuesOutFromParams();
// testByteRules.paramsPlusThree();
// testByteRules.paramsTimesTwo();
// testByteRules.multiplyParams();
// testByteRules.divideParams();