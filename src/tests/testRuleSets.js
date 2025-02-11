const InstructionSet = require('../processes/InstructionSet');
const rulesets = require('../processes/rulesets.js');
const Entity = require('../processes/Entity.js');

// Check the rule numbers before running the tests, as these are subject to on-going
// updates

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
        let initialParams = [0, 1, 2, 3, 7, 8, 9, 10, 11, 12];
        let valuesOut = [1,12,1,12,1,12,1,12];
        let outBlockStart = 0;
        let outBlockLen = 8;
        let inBlockStart = 0;
        let inBlockLen = 8;
        let score = rulesets.valuesOutFromInitialParams(initialParams, valuesOut, outBlockStart, outBlockLen,
            inBlockStart, inBlockLen
        )
        console.log("score, expect 0.125:", score);

        outBlockLen = 4;
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
    },

    testParamsGreaterThanN: function () {
        let initialParams = [5,6,7,9,10,15,18,23,27,8,4,5,19,10,12,13];
        let valuesOut =     [1,0,0,0,0 ,1 ,1, 1, 1, 0,0,0,5, 5, 5, 5 ];
        let dataParams = {};
        dataParams.initialParams = initialParams;
        dataParams.valuesOut = valuesOut;
        let ruleParams = {};
        ruleParams.outBlockStart = 0;
        ruleParams.outBlockLen = 16;
        ruleParams.inBlockStart = 0;
        ruleParams.inBlockLen = 16;
        ruleParams.n = 12;

        console.log("testParamsGreaterThanN:");
        let score = rulesets.paramsGreaterThanN(rulesets, dataParams, ruleParams);
        console.log("Expect:", 11/16, "Got: ", score);
        valuesOut =     [255,0,0,0,0 ,0 ,0, 0, 0, 0,0,0,0, 0, 0, 0 ];
        dataParams.valuesOut = valuesOut;
        score = rulesets.paramsGreaterThanN(rulesets, dataParams, ruleParams);
        console.log("Expect:", 9/16, "Got: ", score);

    },

    testAddFirstParam: function() {
        let initialParams = [5,6,7,9,10,15,18,23];
        let valuesOut = [10,11,12,14,10,15,18,23];
        let dataParams = {};
        dataParams.initialParams = initialParams;
        dataParams.valuesOut = valuesOut;
        let ruleParams = {};
        ruleParams.outBlockStart = 0;
        ruleParams.outBlockLen = 8;
        ruleParams.inBlockStart = 0;
        ruleParams.inBlockLen = 8;

        console.log("testAddFirstParam:");
        let score = rulesets.addFirstParam(rulesets, dataParams, ruleParams);
        console.log("Expect approx 0.5; Got: ", score);
        valuesOut = [10,11,12,14,15,20,18,23];
        dataParams.valuesOut = valuesOut;
        score = rulesets.addFirstParam(rulesets, dataParams, ruleParams);
        console.log("Expect approx 0.75; Got: ", score);
    },

    testDuplicateParams: function () {
        let initialParams = [7,6,8,9,11,12,72,73];
        let valuesOut = [7,7,6,6,8,8,9,9,11,11,12,12,72,72,71,75];
        let dataParams = {};
        dataParams.initialParams = initialParams;
        dataParams.valuesOut = valuesOut;
        let ruleParams = {};
        ruleParams.outBlockStart = 0;
        ruleParams.outBlockLen = 16;
        ruleParams.inBlockStart = 0;
        ruleParams.inBlockLen = 8;

        console.log("testDuplicateParams:");
        let score = rulesets.duplicateParams(rulesets, dataParams, ruleParams);
        console.log("Expect: ", 14/16, "; Got: ", score);
        valuesOut = [7,7,6,6,8,8,9,9,11,11,12,12,72,72,73,73]
        dataParams.valuesOut = valuesOut;
        score = rulesets.duplicateParams(rulesets, dataParams, ruleParams);
        console.log("Expect 1; Got: ", score);

    },

    testSkipAdjacentParams: function() {
        rulesets.initialise();

        console.log("testSkipAdjacentParams");
        let iniParams = [1,3, 100,156, 5,8, 7,10, 11,21, 16,17, 9,10, 30,40];
        let valuesOut = [3, 156, 8, 10, 9, 11, 21, 14];
        let dataParams = {};
        dataParams.initialParams = iniParams;
        dataParams.valuesOut = valuesOut;
        let ruleParams = {};
        ruleParams.outBlockStart = 0;
        ruleParams.outBlockLen = 8;
        ruleParams.inBlockStart = 0;
        ruleParams.inBlockLen = 8;
        let score = rulesets.skipAdjacentParams(rulesets, dataParams, ruleParams);
        console.log("Expect approx: 0.5; Got:", score);
    },

    testSwapAdjacentParams: function() {
        rulesets.initialise();

        console.log("testSwapAdjacentParams");
        let iniParams = [1,3, 100,156, 5,8, 7,10];
        let valuesOut = [3,1, 156,100, 8,5, 12,15];
        let dataParams = {};
        dataParams.initialParams = iniParams;
        dataParams.valuesOut = valuesOut;
        let ruleParams = {};
        ruleParams.outBlockStart = 0;
        ruleParams.outBlockLen = 8;
        ruleParams.inBlockStart = 0;
        ruleParams.inBlockLen = 8;
        let score = rulesets.swapAdjacentParams(rulesets, dataParams, ruleParams);
        console.log("Expect approx: 0.75; Got:", score);

    },

    testGreaterOfAdjacentParams() {
        rulesets.initialise();
        let iniParams = [1,3, 100,156, 5,8, 7,10, 11,21, 16,17, 9,10, 30,40];
        let valuesOut = [3, 156, 8, 10, 17, 19, 24, 20];
        let dataParams = {};
        dataParams.initialParams = iniParams;
        dataParams.valuesOut = valuesOut;
        let ruleParams = {};
        ruleParams.outBlockStart = 0;
        ruleParams.outBlockLen = 8;
        ruleParams.inBlockStart = 0;
        ruleParams.inBlockLen = 16;
        console.log("testGreaterOfAdjacentParams:");
        let score = rulesets.greaterOfAdjacentParams(rulesets, dataParams, ruleParams);
        console.log("Expect approx 0.5; Got: ", score);
    },

    testSortAdjacentParams: function() {
        rulesets.initialise();
        let iniParams = [1,3, 100,156, 5,8, 7,10, 11,21, 16,17, 9,10, 30,40];
        let valuesOut = [3,1, 156,100, 17,9, 11,21];
        let dataParams = {};
        dataParams.initialParams = iniParams;
        dataParams.valuesOut = valuesOut;
        let ruleParams = {};
        ruleParams.outBlockStart = 0;
        ruleParams.outBlockLen = 8;
        ruleParams.inBlockStart = 0;
        ruleParams.inBlockLen = 8;
        console.log("testSortAdjacentParams: ")
        let score = rulesets.sortAdjacentParams(rulesets, dataParams, ruleParams);
        console.log("Expect approx: 0.5; Got: ", score);

    },

    testAddAdjacentParams: function() {
        rulesets.initialise();
        // Test 1
        console.log("testAddAdjacentParams:")
        // Get the initial params
        let iniParams = [1,3, 100,157, 5,8, 7,10, 11,21, 16,17, 9,10, 30,40];
        let valuesOut = [4, 0, 13, 17, 32, 11, 21, 14];
        let dataParams = {};
        dataParams.initialParams = iniParams;
        dataParams.valuesOut = valuesOut;
        let ruleParams = {};
        ruleParams.outBlockStart = 0;
        ruleParams.outBlockLen = 8;
        ruleParams.inBlockStart = 0;
        ruleParams.inBlockLen = 16;
        let score = rulesets.addAdjacentParams(rulesets, dataParams, ruleParams);
        console.log("Expect approx: 0.5; Got: ", score);

    },

    testSubtractAdjacentParams: function() {
        let ruleNum = 16;
        rulesets.initialise();
        let rule = rulesets.scoreList[ruleNum];


        // Test 1
        console.log("testSubtractAdjacentParams:")
        // Get the initial params
        let iniParams = [3,1, 156,100, 8,5, 10,7, 10,11, 16,17, 9,10, 30,40];
        let valuesOut = [2, 56, 3, 3, 0xFF, 11, 21, 14, 10];
        let dataParams = {};
        dataParams.initialParams = iniParams;
        dataParams.valuesOut = valuesOut;
        let ruleParams = {};
        ruleParams.outBlockStart = 0;
        ruleParams.outBlockLen = 8;
        ruleParams.inBlockStart = 0;
        ruleParams.inBlockLen = 16;
        let score = rulesets.subtractAdjacentParams(rulesets, dataParams, ruleParams);
        console.log("Expect approx: 0.625; Got: ", score);

    },

    testConvertASCIINumbers: function() {
        let ruleNum = 18;
        rulesets.initialise();
        let rule = rulesets.scoreList[ruleNum];

        // Check the initial parameters in the entity
        let insSet = new InstructionSet();
        let entity = new Entity(0, insSet, true, false, 0, 0, null);
        let iniParamsList = entity.initialParamsList;
        // Output the initial params
        let outStart = rule.outBlockStart;
        let inStart = rule.inBlockStart;
        let inLen = rule.inBlockLen;
        for (let ip of iniParamsList) {
            let p = inStart;
            let s = "";
            while (p < inStart + inLen) {
                s += String.fromCharCode(ip[p]);
                ++p;
            }
            console.log("params:", s);
        }

        // Setup Output values
        let v = [];
        let e = []
        let v1 = [1, 5, 9];
        let e1 = rulesets.doScore(16,3,16,0);
        v.push(v1);
        e.push(e1);
        let v2 = [3, 0, 8];
        let e2 = rulesets.doScore(16,2,16,0);
        v.push(v2);
        e.push(e2);
        let index = 0;
        for (let values of v) {
            let valuesOut = new Array(256).fill(0);
            // Insert the test values
            let p = outStart;
            for (let v of values) {
                valuesOut[p] = v;
                ++p;
            }
            // Get the initial params
            let ip = iniParamsList[index];
            let dataParams = {initialParams: ip, valuesOut: valuesOut};
            let score = rulesets.convertASCIINumbers(rulesets, dataParams, rule);
            console.log("ConvertASCIIScore:", score, "Expect:", e[index]);
            ++index;
        }

        // Test the byte function
        let value = 8;
        let address = outStart + 6;
        let initialParams = iniParamsList[0];
        let params = new Array(256).fill(0);
        let valuesOut = new Array(256).fill(0);
        valuesOut[address] = value;
        let score = rulesets.byteConvertASCIINumbers(rulesets, rule, value, address, initialParams, params, valuesOut);
        console.log("byteConvertASCIINumbers expect 64:", score);
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

    paramsGreaterThanN: function () {
        let ruleNum = 18;
        rulesets.initialise();
        let rule = rulesets.scoreList[ruleNum];
        let iniParams = [1, 3, 100, 156, 5, 8, 7, 10];
        let valuesOut = [2, 1, 1, 157, 0, 9, 11, 21];
        let params = [];
        let address = 2;
        let value = 1;
        console.log("testByteParamsGreaterThanN:");
        let score = rulesets.byteParamsGreaterThanN(rulesets, rule, value, address, iniParams, params, valuesOut);
        console.log("Expect: 0; Got:", score);
        address = 1;
        value = 1;
        score = rulesets.byteParamsGreaterThanN(rulesets, rule, value, address, iniParams, params, valuesOut);
        console.log("Expect: 255; Got:", score);
        address = 4;
        value = 0;
        score = rulesets.byteParamsGreaterThanN(rulesets, rule, value, address, iniParams, params, valuesOut);
        console.log("Expect: 0; Got:", score);

    },

    addFirstParam: function () {
        let ruleNum = 15;
        rulesets.initialise();
        let rule = rulesets.scoreList[ruleNum];
        let iniParams = [1, 3, 100, 156, 5, 8, 7, 10];
        let valuesOut = [2, 4, 101, 157, 17, 9, 11, 21];
        let params = [];
        let address = 2;
        let value = 101;
        console.log("testByteAddFirstParam:");
        let score = rulesets.byteAddFirstParam(rulesets, rule, value, address, iniParams, params, valuesOut);
        console.log("Expect: 0; Got:", score);
        address = 4;
        value = 17;
        score = rulesets.byteAddFirstParam(rulesets, rule, value, address, iniParams, params, valuesOut);
        console.log("Expect: 255; Got:", score);

    },

    duplicateParams: function () {
        let ruleNum = 15;
        rulesets.initialise();
        let rule = rulesets.scoreList[ruleNum];
        let iniParams = [1,3, 100,156, 5,8, 7,10, 11,21, 16,17, 9,10, 30,40];
        let valuesOut = [1, 1, 3, 3, 17, 9, 11, 21, 14];
        let params = [];
        let address = 3;
        let value = 3;
        console.log("testByteDuplicateParams:");
        let score = rulesets.byteDuplicateParams(rulesets, rule, value, address, iniParams, params, valuesOut);
        console.log("Expect: 0; Got:", score);
        address = 4;
        value = 17;
        score = rulesets.byteDuplicateParams(rulesets, rule, value, address, iniParams, params, valuesOut);
        console.log("Expect: 255; Got:", score);
    },

    skipAdjacentParams: function() {
        let ruleNum = 17;
        rulesets.initialise();
        let rule = rulesets.scoreList[ruleNum];
        console.log("testByteSkipAdjacentParams:")
        // Get the initial params
        let iniParams = [1,3, 100,156, 5,8, 7,10, 11,21, 16,17, 9,10, 30,40];
        let valuesOut = [3, 156, 13, 17, 9, 11, 21, 14];
        let params = [];
        let address = 1;
        let value = 156;
        let score = rulesets.byteSkipAdjacentParams2(rulesets, rule, value, address, iniParams, params, valuesOut);
        console.log("Expect: 0; Got: ", score);
        address = 4;
        value = 9;
        score = rulesets.byteSkipAdjacentParams2(rulesets, rule, value, address, iniParams, params, valuesOut);
        console.log("Expect: 255; Got: ", score);

    },

    swapAdjacentParams: function() {
        let ruleNum = 15;
        rulesets.initialise();
        let rule = rulesets.scoreList[ruleNum];
        console.log("testByteSwapAdjacentParams:")
        // Get the initial params
        let iniParams = [1,3, 100,156, 5,8, 7,10];
        let valuesOut = [3,1, 156,100, 9,7, 11,12];
        let params = [];
        let address = 2;
        let value = 156;
        let score = rulesets.byteSwapAdjacentParams(rulesets, rule, value, address, iniParams, params, valuesOut);
        console.log("Expect: 0; Got: ", score);
        address = 4;
        value = 9;
        score = rulesets.byteSwapAdjacentParams(rulesets, rule, value, address, iniParams, params, valuesOut);
        console.log("Expect: 255; Got: ", score);
    },

    greaterOfAdjacentParams() {
        let ruleNum = 21;
        rulesets.initialise();
        let rule = rulesets.scoreList[ruleNum];
        let iniParams = [100,50, 5,200, 7,3, 9,11];
        let params = [];
        let valuesOut = [10, 200, 3, 11];
        let address = 1;
        let value = 200;
        console.log("testByteGreaterOfAdjacentParams:");
        let score = rulesets.byteGreaterOfAdjacentParams(rulesets, rule, value, address, iniParams, params, valuesOut);
        console.log("Expect 0; Got: ", score);
        address = 2;
        value = 3; 
        score = rulesets.byteGreaterOfAdjacentParams(rulesets, rule, value, address, iniParams, params, valuesOut);
        console.log("Expect 255; Got: ", score);
    },

    sortAdjacentParams: function() {
        let ruleNum = 21;
        rulesets.initialise();
        let rule = rulesets.scoreList[ruleNum];
        console.log("testByteSwapAdjacentParams:")
        // Get the initial params
        let iniParams = [1,3, 100,156, 5,8, 7,10];
        let valuesOut = [3,1, 156,100, 9,7, 11,12];
        let params = [];
        let address = 2;
        let value = 156;
        let score = rulesets.byteSortAdjacentParams(rulesets, rule, value, address, iniParams, params, valuesOut);
        console.log("Expect: 0; Got: ", score);
        address = 4;
        value = 9;
        score = rulesets.byteSortAdjacentParams(rulesets, rule, value, address, iniParams, params, valuesOut);
        console.log("Expect: 255; Got: ", score);

    },

    addAdjacentParams: function () {
        let ruleNum = 15;
        rulesets.initialise();
        let rule = rulesets.scoreList[ruleNum];

        // Test 1
        console.log("testByteAddAdjacentParams:")
        // Get the initial params
        let iniParams = [1,3, 100,156, 5,8, 7,10, 11,21, 16,17, 9,10, 30,40];
        let valuesOut = [4, 0, 13, 17, 9, 11, 21, 14, 10];
        let params = [];
        let address = 2;
        let value = 13;
        let score = rulesets.byteAddAdjacentParams(rulesets, rule, value, address, iniParams, params, valuesOut);
        console.log("Expect: 0; Got: ", score);
        address = 4;
        value = 9;
        score = rulesets.byteAddAdjacentParams(rulesets, rule, value, address, iniParams, params, valuesOut);
        console.log("Expect: 255; Got: ", score);
    },

    subtractAdjacentParams: function () {
        let ruleNum = 15;
        rulesets.initialise();
        let rule = rulesets.scoreList[ruleNum];

        // Test 1
        console.log("testByteSubtractAdjacentParams:")
        // Get the initial params
        let iniParams = [1,3, 100,156, 8,5, 7,10, 21,11, 16,17, 9,10, 30,40];
        let valuesOut = [4, 0, 3, 17, 9, 11, 21, 14, 10];
        let params = [];
        let address = 2;
        let value = 3;
        let score = rulesets.byteSubtractAdjacentParams(rulesets, rule, value, address, iniParams, params, valuesOut);
        console.log("Expect: 0; Got: ", score);
        address = 4;
        value = 9;
        score = rulesets.byteSubtractAdjacentParams(rulesets, rule, value, address, iniParams, params, valuesOut);
        console.log("Expect: 255; Got: ", score);
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

// testRuleSets.testCountInsOccurrences();
// testRuleSets.testCountInsDistribution();
// testRuleSets.testValuesOutFromInitialParams();
// testRuleSets.testMatchCASM();
testRuleSets.testParamsGreaterThanN();
// testRuleSets.testAddFirstParam();
// testRuleSets.testDuplicateParams();
// testRuleSets.testSkipAdjacentParams();
// testRuleSets.testSwapAdjacentParams();
// testRuleSets.testGreaterOfAdjacentParams();
// testRuleSets.testSortAdjacentParams();
// testRuleSets.testAddAdjacentParams();
// testRuleSets.testSubtractAdjacentParams();
// testRuleSets.testConvertASCIINumbers();

// testByteRules.valuesOutFromInitialParams();
// testByteRules.valuesOutMatchInitialParams();
// testByteRules.valuesOutDifferent();
// testByteRules.valuesOutSeries();
// testByteRules.valuesOutFromParams();
// testByteRules.paramsPlusThree();
// testByteRules.paramsTimesTwo();
// testByteRules.paramsGreaterThanN();
// testByteRules.addFirstParam();
// testByteRules.duplicateParams();
// testByteRules.skipAdjacentParams();
// testByteRules.swapAdjacentParams();
// testByteRules.greaterOfAdjacentParams();
// testByteRules.sortAdjacentParams();
// testByteRules.addAdjacentParams();
// testByteRules.subtractAdjacentParams();
// testByteRules.multiplyParams();
// testByteRules.divideParams();