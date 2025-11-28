const { app } = require('electron');
const path = require('node:path');
const mathFuncs = require(path.join(__dirname, '../appLib/mathFuncs.js'));
const testObj = require(path.join(__dirname, 'testObj'));

const rulesets = {
    meanInsLen: 1.5,
    meanInsCount: 240 / 1.5,
    numOutputZones: 8,
    outputZoneLen: 8,
    numRules: 114,
    maxRuleId: 113,
    maxRoundsPerRule: 6,
    maxRuleSequenceNum: 0,
    scoreList: [],
    ruleFunction: [],
    byteFunction: [],
    requiredOutputsFunction: [],
    totalScore: 0,
    currentMaxScore: 0,
    maxScore: 0,
    interimMaxScore: 0,
    diffScore: 0,
    ignoreRounds: true,
    bestEntity: null,
    numRuleLoops: 0,
    ruleSequenceNum: 0,
    maxRuleSequenceNum: 0,
    ruleRounds: [], // {completed:, start:, end:, ruleLoopEnd:, used:}
    seedRuleNum: 9,
    seedRuleMemSpaces: [],
    subOptRuleMemSpaces: [],
    bestsStore: [],
    seedRuleFragments: [],
    seedRuleSet: false,
    subOptRuleSet: false,
    executionScores: [],
    learnCodeAllowance: 2000,

    initialise() {

        this.scoreList = [];
        this.ruleFunction = [];
        this.byteFunction = [];
        this.requiredOutputsFunction = [];
        const learnCodeAllowance = this.learnCodeAllowance;
        /*
            On Adding a rule, update the outputScoresItem and diffScore values toward
            the end of this function
            The ruleId for the new rule is the this.maxRuleId at the start of this object.

            Rule Template
            {   rule: "Convert ASCII Numbers 1", ruleId: 32,
                retain: false, 
                skip: false, 
                excludeHelperRules: [67], // Optional ID's
                sequenceNum: 62, // Automatic
                score: 0, 
                passScore: 0.95, // Optional
                startRound: -1,
                completionRound: -1, 
                max: 5, 
                startRoundNum: 800, // Not currently in use
                interim: boolean, // optional whether to include this rule in interim score
                outBlockStart: 0, 
                outBlockLen: 16,
                inBlockStart: 0, 
                inBlockLen: 32,
                highIC: 16 * 10,
                highIP: 40, // Optional, Default 80
                ASCIISampleIn: // Optional, Default Ignore 
                [
                    "1;7;9;3;2;5;7;0;9;8;3;2;4;6;7;8;"
                ],
                sampleIn: [],
                sampleOut: [],
                ASCIIParamsIn: // Optional, Default Ignore 
                [
                    "5;6;7;0;8;9;3;2;5;4;9;6;2;1;0;9;",
                    "5;7;9;8;2;2;3;0;4;6;5;7;9;8;1;4;"
                ],
                paramsIn: [],
                outputs: []
            }

        */
        this.scoreList.push(
            {rule: "Instruction Distribution", ruleId: 0, skip: false, retain: true, 
                score: 0, max: 2, startRoundNum: 0, interim: true}
        );
        this.ruleFunction.push(this.insDistribution);
        this.byteFunction.push(null);
        this.requiredOutputsFunction.push(null);

        this.scoreList.push(
            {rule: "General Instruction Distribution", ruleId: 84, skip: false, retain: true, 
                score: 0, max: 1, startRoundNum: 0, interim: true,
                insDistribution: [
                    {
                        ins: "LDSI A, (C)",
                        countOpt: 1,
                        scanStart: 0,
                        scanEnd: 40
                    },
                    {
                        ins: "LDSO A, (C)",
                        countOpt: 1,
                        scanStart: 0,
                        scanEnd: 40
                    },
                    {
                        ins: "CMP A, B",
                        countOpt: 1,
                        scanStart: 0,
                        scanEnd: 40
                    }
                ]
            }
        );
        this.ruleFunction.push(this.generalInsDistribution);
        this.byteFunction.push(null);
        this.requiredOutputsFunction.push(null);

        this.scoreList.push( 
            {rule: "Matching CASM Instruction", ruleId: 1, skip: true,
                score: 0, max: 4, startRoundNum: 0}
        );
        this.ruleFunction.push(this.matchCASM);
        this.byteFunction.push(null);
        this.requiredOutputsFunction.push(null);

        this.scoreList.push(
            {rule: "Number of reverse JR ins", ruleId: 2, skip: true,
                score: 0, max: 4, startRoundNum: 0
            }
        );
        this.ruleFunction.push(this.reverseJR);
        this.byteFunction.push(null);
        this.requiredOutputsFunction.push(null);

        // It would be better to do this rule as a rule specific estimate
        this.scoreList.push(
            {rule: "Instruction Counter", ruleId: 3, skip: false, retain: true,
                score: 0, max: 0.5, startRoundNum: 800}
        );
        this.ruleFunction.push(this.instructionCount);
        this.byteFunction.push(null);
        this.requiredOutputsFunction.push(null);

        this.scoreList.push(
            {rule: "Highest IP", ruleId: 4, skip: false, retain: true,
                score: 0, max: 1, startRoundNum: 800}
        );
        this.ruleFunction.push(this.highestIPScore);
        this.byteFunction.push(null);
        this.requiredOutputsFunction.push(null);

        this.scoreList.push(
            {rule: "Number of Input Reads", ruleId: 53, skip: true, retain: true,
                score: 0, max: 2, startRoundNum: 0
            }
        );
        this.ruleFunction.push(this.numInputReads);
        this.byteFunction.push(null);
        this.requiredOutputsFunction.push(null);

        this.scoreList.push(
            {rule: "Params Preserved", ruleId: 5, skip: true,
                retain: true, score: 0, max: 3, startRoundNum: 0}
        );
        this.ruleFunction.push(this.initialParamsPreserved);
        this.byteFunction.push(null);
        this.requiredOutputsFunction.push(null);

        this.scoreList.push(
            {rule: "Values Out Set", ruleId: 6, skip: false,
                retain: true, score: 0, max: 1, startRoundNum: 0, interim: true,
                outBlockStart: 0, outBlockLen: 128 
            }
        );
        this.ruleFunction.push(this.valuesOutSet);
        this.byteFunction.push(null);
        this.requiredOutputsFunction.push(null);

        this.scoreList.push(
            {rule: "Outputs Different to Inputs", ruleId: 67, 
                skip: false,
                retain: true, score: 0, max: 1, startRoundNum: 0,
                outBlockStart: 0, outBlockLen: 128 
            }
        );
        this.ruleFunction.push(this.outputDifferentToInput);
        this.byteFunction.push(null);
        this.requiredOutputsFunction.push(null);

        this.scoreList.push(
            {rule: "Sum of Outputs", ruleId: 68, 
                skip: false,
                retain: true, score: 0, max: 1, startRoundNum: 0, interim: true,
                outBlockStart: 0, outBlockLen: 128 
            }
        );
        this.ruleFunction.push(this.sumOfOutputs);
        this.byteFunction.push(null);
        this.requiredOutputsFunction.push(null);

        this.scoreList.push(
            {rule: "Output Standard Deviation", ruleId: 69, 
                skip: false,
                retain: true, score: 0, max: 1, startRoundNum: 0, interim: true,
                outBlockStart: 0, outBlockLen: 128 
            }
        );
        this.ruleFunction.push(this.outputStandardDeviation);
        this.byteFunction.push(null);
        this.requiredOutputsFunction.push(null);

        this.scoreList.push(
            {rule: "Values Out From Params", ruleId: 7, skip: true,
                score: 0, max: 4, startRoundNum: 800,
                outBlockStart: 0, outBlockLen: 8, inBlockStart: 0, inBlockLen: 8
            }
        );
        this.ruleFunction.push(this.valuesOutFromParams)
        this.byteFunction.push(this.byteValuesOutFromParams);
        this.requiredOutputsFunction.push(null);

        this.scoreList.push(
            {rule: "Values Out From Initial Params", ruleId: 8, skip: true,
                score: 0, max: 4, 
                startRoundNum: 800,
                outBlockStart: 0, outBlockLen: 8, inBlockStart: 0, inBlockLen: 8
            }
        );
        this.ruleFunction.push(this.valuesOutFromInitialParams);
        this.byteFunction.push(this.byteValuesOutFromInitialParams);
        this.requiredOutputsFunction.push(null);

        this.scoreList.push(
            {rule:"Values Out Match Initial Params", ruleId: 9, skip: false,
                retain: false, score: 0, completionRound: -1, max: 5,
                startRoundNum: 0,
                outBlockStart: 0, outBlockLen: 16, inBlockStart: 0, inBlockLen: 16,
                highIC: 7 * 16 + learnCodeAllowance,
                highIP: 60,
                sampleIn: [[7,5,4,18,19,36,220,190,5,18,19,35,65,72,84,92]],
                sampleOut: [],
                paramsIn: [
                    [
                        0,9,18,57,202,109,81,56,14,17,34,67,83,76,20,21
                    ],
                    [
                        4,96,75,254,108,91,84,20,21,45,76,14,17,35,36,110
                    ]
                ],
                outputs: []
            }
        );
        this.ruleFunction.push(this.valuesOutMatchInitialParams);
        this.byteFunction.push(this.byteValuesOutMatch);
        this.requiredOutputsFunction.push(this.getValuesOutMatchRequiredOutputs);

        this.scoreList.push(
            {rule:"Values Out Match Sample Input", ruleId: 108, skip: false,
                retain: false, score: 0, completionRound: -1, max: 5,
                startRoundNum: 0,
                outBlockStart: 0, outBlockLen: 16, inBlockStart: 0, inBlockLen: 16,
                highIC: 7 * 16 + learnCodeAllowance,
                highIP: 60,
                sampleIn: [[7,5,4,18,19,36,220,190,5,18,19,35,65,72,84,92]],
                sampleOut: [[9,15,78,90,76,81,96,45,105,202,16,17,19,76,81,5]],
                paramsIn: [
                    [
                        0,9,18,57,202,109,81,56,14,17,34,67,83,76,20,21
                    ]
                ],
                outputs: [[7,5,4,18,19,36,220,190,5,18,19,35,65,72,84,92]]
            }
        );
        this.ruleFunction.push(this.valuesOutMatchSampleInput);
        this.byteFunction.push(null);
        this.requiredOutputsFunction.push(null);

        this.scoreList.push(
            {rule:"Values Out Match Sample Output", ruleId: 109, skip: false,
                retain: false, score: 0, completionRound: -1, max: 5,
                startRoundNum: 0,
                outBlockStart: 0, outBlockLen: 16, inBlockStart: 0, inBlockLen: 16,
                highIC: 7 * 16 + learnCodeAllowance,
                highIP: 60,
                sampleIn: [[7,5,4,18,19,36,220,190,5,18,19,35,65,72,84,92]],
                sampleOut: [[7,21,67,98,107,109,213,234,3,2,11,21,54,96,87,65]],
                paramsIn: [
                    [
                        0,9,18,57,202,109,81,56,14,17,34,67,83,76,20,21
                    ]
                ],
                outputs: [[7,21,67,98,107,109,213,234,3,2,11,21,54,96,87,65]]
            }
        );
        this.ruleFunction.push(this.valuesOutMatchSampleOut);
        this.byteFunction.push(null);
        this.requiredOutputsFunction.push(null);

        this.scoreList.push(
            {rule: "Values Out Different", ruleId: 10, skip:false, retain: false,
                excludeHelperRules: [36,67,68,69],
                score: 0, max: 5, startRoundNum: 800,
                outBlockStart: 0, outBlockLen: 16,
                highIC: 16 * 16,
                highIP: 60,
                sampleIn: [],
                sampleOut: [],
                paramsIn: [[0,0,1,1,2,2,3,3,4,4,5,5,6,6,7,7]]
            }
        );
        this.ruleFunction.push(this.valuesOutDifferent);
        this.byteFunction.push(this.byteValuesOutDifferent);
        this.requiredOutputsFunction.push(null);

        this.scoreList.push(
            {rule:"Sample Out Greater than Sample In", ruleId: 70, 
                skip: false,
                excludeHelperRules: [67],
                retain: false, score: 0, max: 5,
                startRoundNum: 800,
                outBlockStart: 0, outBlockLen: 32, inBlockStart: 0, inBlockLen: 32,
                highIC: 12 * 16 + 5,
                highIP: 40,
                insDistribution: [
                    {
                        ins: "LDSI A, (C)",
                        countOpt: 1,
                        scanStart: 0,
                        scanEnd: 20
                    },
                    {
                        ins: "LDSO A, (C)",
                        countOpt: 1,
                        scanStart: 0,
                        scanEnd: 20
                    },
                    {
                        ins: "CMP A, B",
                        countOpt: 1,
                        scanStart: 0,
                        scanEnd: 20
                    }
                ],
                sampleIn: [
                    [7,5,4,18,19,36,220,190,5,18,19,35,65,72,84,92],
                    [29,48,7,110,120,121,87,16,90,85,76,89,93,64,63,19]
                ],
                sampleOut: [
                    [9,3,6,18,24,37,221,120,4,19,18,33,64,71,87,96],
                    [30,46,6,111,123,119,98,17,88,83,77,91,90,63,65,18]
                ],
                paramsIn: [
                    [0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15],
                    [32,33,34,35,36,37,38,39,40,41,42,43,44,45,46,47]
                ],
                outputs: [
                    [1,0,1,0,1,1,1,0,0,1,0,0,0,0,1,1],
                    [1,0,0,1,1,0,1,1,0,0,1,1,0,0,1,0]
                ]
            }
        );
        this.ruleFunction.push(this.sampleOutGreaterThanSampleIn);
        this.byteFunction.push(null);
        this.requiredOutputsFunction.push(null);

        this.scoreList.push(
            {rule:"Sample In Minus Sample Out", ruleId: 71, 
                skip: false,
                excludeHelperRules: [67],
                retain: false, score: 0, max: 5,
                startRoundNum: 800,
                outBlockStart: 0, outBlockLen: 16, inBlockStart: 0, inBlockLen: 32,
                highIC: 12 * 16 + 5,
                highIP: 40,
                insDistribution: [
                    {
                        ins: "LDSI A, (C)",
                        countOpt: 1,
                        scanStart: 0,
                        scanEnd: 20
                    },
                    {
                        ins: "LDSO A, (C)",
                        countOpt: 1,
                        scanStart: 0,
                        scanEnd: 20
                    },
                    {
                        ins: "SUB A, B",
                        countOpt: 1,
                        scanStart: 5,
                        scanEnd:40
                    }
                ],
                sampleIn: [
                    [32,5,7,18,26,36,225,190,20,22,19,35,63,79,105,99],
                    [33,48,7,110,186,121,87,33,90,85,96,108,93,64,69,19]
                ],
                sampleOut: [
                    [9,3,6,18,24,37,221,120,4,19,18,33,64,71,87,96],
                    [30,46,6,111,123,119,89,17,88,83,77,91,90,63,65,18]
                ],
                paramsIn: [
                    [0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15],
                    [32,33,34,35,36,37,38,39,40,41,42,43,44,45,46,47]
                ],
                outputs: [
                    [23,2,1,0,2,255,4,70,16,3,1,2,255,8,18,3],
                    [3,2,1,255,63,2,254,16,2,2,19,17,3,1,4,1]
                ]
            }
        );
        this.ruleFunction.push(this.sampleInMinusSampleOut);
        this.byteFunction.push(null);
        this.requiredOutputsFunction.push(null);

        this.scoreList.push(
            {rule:"Compare Sample In Sample Out", ruleId: 100, 
                skip: false,
                excludeHelperRules: [67],
                retain: false, score: 0, max: 5,
                startRoundNum: 800,
                outBlockStart: 0, outBlockLen: 16, inBlockStart: 0, inBlockLen: 32,
                highIC: 18 * 16 + 5,
                highIP: 80,
                insDistribution: [
                    {
                        ins: "LDSI A, (C)",
                        countOpt: 1,
                        scanStart: 0,
                        scanEnd: 20
                    },
                    {
                        ins: "LDSO A, (C)",
                        countOpt: 1,
                        scanStart: 0,
                        scanEnd: 20
                    },
                    {
                        ins: "CMP A, B",
                        countOpt: 1,
                        scanStart: 5,
                        scanEnd:40
                    }
                ],
                sampleIn: [
                    [32,5,7,18,26,36,225,190,20,22,19,35,63,79,105,99],
                    [33,48,7,110,186,121,87,33,90,85,96,108,93,64,69,19]
                ],
                sampleOut: [
                    [9,3,6,18,24,37,225,193,4,25,18,35,64,71,107,99],
                    [30,49,6,111,186,122,87,17,88,85,77,91,95,63,65,19]
                ],
                paramsIn: [
                    [15,85,93,24,201,176,184,98,32,21,76,186,130,110,82,65],
                    [16,87,94,24,170,176,183,96,32,22,75,185,135,110,82,67]
                ],
                outputs: [
                    [23,2,1,0,2,255,4,70,16,3,1,2,255,8,18,3],
                    [3,2,1,255,63,2,254,16,2,2,19,17,3,1,4,1]
                ]
            }
        );
        this.ruleFunction.push(this.compareSampleInSampleOut);
        this.byteFunction.push(null);
        this.requiredOutputsFunction.push(null);

        this.scoreList.push(
            {rule: "Output Series", ruleId: 11, retain: false, skip: false,
                excludeHelperRules: [67],
                score: 0, max: 5, startRoundNum: 800,
                outBlockStart: 0, outBlockLen: 16,
                highIC: 7 * 16,
                highIP: 32,
                sampleIn: [[3,4]],
                sampleOut: [],
                paramsIn: [
                    [2,8],
                    [5,12],
                    [7,5],
                    [10,16]
                ],
                outputs: []
            }
        );
        this.ruleFunction.push(this.outputSeries);
        this.byteFunction.push(this.byteOutputSeries);
        this.requiredOutputsFunction.push(this.getOutputSeriesRequiredOutputs);

        this.scoreList.push(
            {rule: "Output Series Of Series 1", ruleId: 52, retain: false, skip: false,
                excludeHelperRules: [67],
                score: 0, max: 5, startRoundNum: 800,
                outBlockStart: 0, outBlockLen: 64,
                highIC: 9 * 16 * 5 + learnCodeAllowance,
                highIP: 80,
                insDistribution: [
                    {
                        ins: "LDI A, (C)",
                        countOpt: 3,
                        scanStart: 0,
                        scanEnd: 80
                    },
                    {
                        ins: "INC C",
                        countOpt: 3,
                        scanStart: 0,
                        scanEnd: 80
                    },
                    {
                        ins: "SWP A, B",
                        countOpt: 1,
                        scanStart: 0,
                        scanEnd: 80
                    }
                ],
                sampleIn: [[3,16,3]],
                sampleOut: [],
                paramsIn: [
                    [2,16,5],
                    [5,16,5],
                    [7,16,5],
                    [10,16,5]
                ],
                outputs: []
            }
        );
        this.ruleFunction.push(this.outputSeriesOfSeries);
        this.byteFunction.push(this.byteOutputSeriesOfSeries);
        this.requiredOutputsFunction.push(this.getOutputSeriesOfSeriesRequiredOutputs);

        this.scoreList.push(
            {rule: "Output Series Of Series 2", ruleId: 51, retain: false, skip: false,
                excludeHelperRules: [67],
                score: 0, max: 5, startRoundNum: 800,
                outBlockStart: 0, outBlockLen: 64,
                highIC: 9 * 16 * 5 + learnCodeAllowance,
                highIP: 80,
                insDistribution: [
                    {
                        ins: "LDI A, (C)",
                        countOpt: 3,
                        scanStart: 0,
                        scanEnd: 80
                    },
                    {
                        ins: "INC C",
                        countOpt: 3,
                        scanStart: 0,
                        scanEnd: 80
                    },
                    {
                        ins: "SWP A, B",
                        countOpt: 1,
                        scanStart: 0,
                        scanEnd: 80
                    }
                ],
                sampleIn: [[3,15,3]],
                sampleOut: [],
                paramsIn: [
                    [2,16,3],
                    [5,16,2],
                    [7,12,4],
                    [10,12,5]
                ],
                outputs: []
            }
        );
        this.ruleFunction.push(this.outputSeriesOfSeries);
        this.byteFunction.push(this.byteOutputSeriesOfSeries);
        this.requiredOutputsFunction.push(this.getOutputSeriesOfSeriesRequiredOutputs);

        this.scoreList.push(
            {rule: "Output Series Of Series 3", ruleId: 50, retain: false, skip: false,
                excludeHelperRules: [67],
                score: 0, max: 5, startRoundNum: 800,
                outBlockStart: 0, outBlockLen: 20,
                highIC: 9 * 12 * 5 + learnCodeAllowance,
                highIP: 80,
                insDistribution: [
                    {
                        ins: "LDI A, (C)",
                        countOpt: 3,
                        scanStart: 0,
                        scanEnd: 80
                    },
                    {
                        ins: "INC C",
                        countOpt: 3,
                        scanStart: 0,
                        scanEnd: 80
                    },
                    {
                        ins: "SWP A, B",
                        countOpt: 1,
                        scanStart: 0,
                        scanEnd: 80
                    }
                ],
                sampleIn: [[4,10,3]],
                sampleOut: [],
                paramsIn: [
                    [3,12,5],
                    [6,4,4],
                    [9,7,4],
                    [11,3,5]
                ]
            }
        );
        this.ruleFunction.push(this.outputSeriesOfSeries);
        this.byteFunction.push(this.byteOutputSeriesOfSeries);
        this.requiredOutputsFunction.push(this.getOutputSeriesOfSeriesRequiredOutputs);

        this.scoreList.push(
            {rule: "Extract First Paramth Inputs 1", ruleId: 105,
                retain: false, skip: false, 
                score: 0, completionRound: -1, max: 5, startRoundNum: 800,
                outBlockStart: 0, outBlockLen: 16,
                inBlockStart: 0, inBlockLen: 32,
                highIC: 9 * 16 + learnCodeAllowance,
                highIP: 80,
                sampleIn: [[
                    2,3, 20,24, 190,87, 65,224, 120,95, 86,38, 71,86, 254,112,
                    79,115, 126,210, 63,3, 65,7, 9,11, 8,145, 10,126, 11,128
                ]],
                sampleOut: [],
                paramsIn: [
                    [
                        2,11, 4,16, 90,75, 101,202, 225,248, 121,128, 45,65, 64,73,
                        23,56, 54,48, 85,72, 32,39, 67,98, 111,96, 134,4, 76,82
                    ],
                    [
                        2,12, 3,4, 5,6, 9,11, 21,23, 56,68, 78,90, 77,63,
                        23,43, 54,65, 43,21, 67,2, 91,1, 10,0, 11,12, 76,34
                    ]
                ],
                outputs: []
            }
        );
        this.ruleFunction.push(null);
        this.byteFunction.push(null);
        this.requiredOutputsFunction.push(this.getExtractFirstParamthInputsRequiredOutputs);

        this.scoreList.push(
            {rule: "Extract First Paramth Inputs 2", ruleId: 106,
                retain: false, skip: false, 
                score: 0, completionRound: -1, max: 5, startRoundNum: 800,
                outBlockStart: 0, outBlockLen: 16,
                inBlockStart: 0, inBlockLen: 48,
                highIC: 9 * 16 + learnCodeAllowance,
                highIP: 80,
                sampleIn: [[
                    3,3,11, 20,24,34, 190,87,45, 65,224,228, 120,95,12, 86,38,1, 71,86,0, 254,112,1,
                    79,115,8, 126,210,212, 63,3,32, 65,7,3, 9,11,212, 8,145,63, 10,126,34, 11,128,17
                ]],
                sampleOut: [],
                paramsIn: [
                    [
                        3,11,21, 4,16,17, 90,75,72, 101,202,145, 225,248,12, 121,128,14, 45,65,19, 64,73,13,
                        23,56,18, 54,48,76, 85,72,74, 32,39,11, 67,98,10, 111,96,67, 134,4,5, 76,82,76
                    ],
                    [
                        3,12,21, 3,4,16, 5,6,48, 9,11,21, 21,23,27, 56,68,98, 78,90,0, 77,63,2,
                        23,43,45, 54,65,76, 43,21,81, 67,2,3, 91,1,7, 10,0,214, 11,12,83, 76,34,17
                    ]
                ],
                outputs: []
            }
        );
        this.ruleFunction.push(null);
        this.byteFunction.push(null);
        this.requiredOutputsFunction.push(this.getExtractFirstParamthInputsRequiredOutputs);

        this.scoreList.push(
            {rule: "Extract First Paramth Inputs 3", ruleId: 107,
                retain: false, skip: false, 
                score: 0, completionRound: -1, max: 5, startRoundNum: 800,
                outBlockStart: 0, outBlockLen: 16,
                inBlockStart: 0, inBlockLen: 48,
                highIC: 9 * 16 + learnCodeAllowance,
                highIP: 80,
                sampleIn: [[
                    3,3,11, 20,24,34, 190,87,45, 65,224,228, 120,95,12, 86,38,1, 71,86,0, 254,112,1,
                    79,115,8, 126,210,212, 63,3,32, 65,7,3, 9,11,212, 8,145,63, 10,126,34, 11,128,17
                ]],
                sampleOut: [],
                paramsIn: [
                    [
                        2,13, 4,17, 90,75, 101,202, 225,12, 121,128, 45,19, 64,13,
                        23,56, 54,48, 72,74, 32,39, 98,10, 111,67, 4,5, 82,76
                    ],
                    [
                        3,12,22, 3,4,16, 5,6,48, 9,11,29, 21,23,27, 56,68,101, 78,90,0, 77,63,8,
                        23,43,47, 54,65,76, 43,21,83, 67,2,13, 91,1,17, 10,0,214, 11,12,85, 76,34,17
                    ]
                ],
                outputs: []
            }
        );
        this.ruleFunction.push(null);
        this.byteFunction.push(null);
        this.requiredOutputsFunction.push(this.getExtractFirstParamthInputsRequiredOutputs);

        this.scoreList.push(
            {rule: "And First Param", ruleId: 85,
                retain: false, skip: false, 
                score: 0, completionRound: -1, max: 5, startRoundNum: 800,
                outBlockStart: 0, outBlockLen: 16,
                inBlockStart: 0, inBlockLen: 16,
                highIC: 9 * 16 + learnCodeAllowance,
                highIP: 80,
                sampleIn: [[12,3,20,24,190,87,65,224,120,95,86,38,71,86,254,112]],
                sampleOut: [],
                paramsIn: [
                    [
                        5,20,15,13,96,3,8,200,127,255,28,29,37,14,16,21
                    ],
                    [
                        12,22,44,67,69,81,72,187,215,4,9,15,23,38,104,128
                    ]
                ],
                outputs: []
            }
        );
        this.ruleFunction.push(null);
        this.byteFunction.push(null);
        this.requiredOutputsFunction.push(this.getAndFirstParamRequiredOutputs);

        this.scoreList.push(
            {rule: "Or First Param", ruleId: 86,
                retain: false, skip: false, 
                score: 0, completionRound: -1, max: 5, startRoundNum: 800,
                outBlockStart: 0, outBlockLen: 16,
                inBlockStart: 0, inBlockLen: 16,
                highIC: 9 * 16 + learnCodeAllowance,
                highIP: 80,
                sampleIn: [[12,3,21,24,190,89,65,224,125,95,86,39,71,86,204,112]],
                sampleOut: [],
                paramsIn: [
                    [
                        7,20,17,13,96,3,8,205,127,255,30,29,37,15,16,23
                    ],
                    [
                        9,22,46,67,69,81,73,187,215,4,19,55,23,38,104,129
                    ]
                ],
                outputs: []
            }
        );
        this.ruleFunction.push(null);
        this.byteFunction.push(null);
        this.requiredOutputsFunction.push(this.getAndFirstParamRequiredOutputs);

        this.scoreList.push(
            {rule: "Add First Param", ruleId: 12,
                retain: false, skip: false, 
                score: 0, completionRound: -1, max: 5, startRoundNum: 800,
                outBlockStart: 0, outBlockLen: 16,
                inBlockStart: 0, inBlockLen: 16,
                highIC: 9 * 16 + learnCodeAllowance,
                highIP: 80,
                sampleIn: [[12,3,19,24,190,87,65,221,120,95,86,38,72,86,254,112]],
                sampleOut: [],
                paramsIn: [
                    [
                        5,20,15,11,96,3,8,200,128,255,27,29,31,14,16,21
                    ],
                    [
                        12,22,43,67,69,81,72,186,215,4,9,15,22,38,104,126
                    ]
                ],
                outputs: []
            }
        );
        this.ruleFunction.push(this.addFirstParam);
        this.byteFunction.push(this.byteAddFirstParam);
        this.requiredOutputsFunction.push(this.getAddFirstParamRequiredOutputs);

        this.scoreList.push(
            {rule: "Subtract First Param", ruleId: 13,
                retain: false, skip: false, 
                score: 0, completionRound: -1, max: 5, startRoundNum: 800,
                outBlockStart: 0, outBlockLen: 16,
                inBlockStart: 0, inBlockLen: 16,
                highIC: 9 * 16 + learnCodeAllowance,
                highIP: 80,
                sampleIn: [[10,25,34,65,53,98,87,110,5,86,93,63,76,81,24,32]],
                sampleOut: [],
                paramsIn: [
                    [
                        6,20,15,11,96,3,8,200,128,255,27,29,31,14,16,21
                    ],
                    [
                        13,22,43,67,69,81,72,186,215,4,9,15,22,38,104,126
                    ]
                ],
                outputs: [],
            }
        );
        this.ruleFunction.push(this.subtractFirstParam);
        this.byteFunction.push(this.byteSubtractFirstParam);
        this.requiredOutputsFunction.push(this.getSubtractFirstParamRequiredOutputs);

        this.scoreList.push(
            {rule: "Add Sum of First and Second Params", ruleId: 101,
                retain: false, skip: false, 
                score: 0, completionRound: -1, max: 5, startRoundNum: 800,
                outBlockStart: 0, outBlockLen: 16,
                inBlockStart: 0, inBlockLen: 16,
                highIC: 9 * 16 + learnCodeAllowance,
                highIP: 80,
                sampleIn: [[10,25,34,65,53,98,87,110,5,86,93,63,76,81,24,32]],
                sampleOut: [],
                paramsIn: [
                    [
                        6,20,15,11,96,3,8,200,128,220,27,29,31,14,16,21
                    ],
                    [
                        13,22,43,67,69,81,72,186,215,4,9,15,22,38,104,126
                    ]
                ],
                outputs: [],
            }
        );
        this.ruleFunction.push(null);
        this.byteFunction.push(null);
        this.requiredOutputsFunction.push(this.getAddSumOfFirstAndSecondParamsRequiredOutputs);

        this.scoreList.push(
            {rule: "Sub Sum of First and Second Params", ruleId: 102,
                retain: false, skip: false, 
                score: 0, completionRound: -1, max: 5, startRoundNum: 800,
                outBlockStart: 0, outBlockLen: 16,
                inBlockStart: 0, inBlockLen: 16,
                highIC: 9 * 16 + learnCodeAllowance,
                highIP: 80,
                sampleIn: [[10,25,34,65,53,99,87,115,5,86,93,63,78,81,24,32]],
                sampleOut: [],
                paramsIn: [
                    [
                        6,20,15,15,97,3,8,200,128,220,27,29,38,140,16,21
                    ],
                    [
                        13,22,43,67,69,81,72,186,201,4,9,15,220,38,104,126
                    ]
                ],
                outputs: [],
            }
        );
        this.ruleFunction.push(null);
        this.byteFunction.push(null);
        this.requiredOutputsFunction.push(this.getSubSumOfFirstAndSecondParamsRequiredOutputs);

        this.scoreList.push(
            {rule: "Odd And Even Params", ruleId: 14,
                retain: false, skip: false, 
                score: 0, completionRound: -1, max: 5, startRoundNum: 800,
                outBlockStart: 0, outBlockLen: 16,
                inBlockStart: 0, inBlockLen: 16,
                highIC: 9 * 16 + learnCodeAllowance,
                highIP: 80,
                sampleIn: [[3,4,7,9,8,10,12,5,29,31,85,2,4,15,91,84]],
                sampleOut: [],
                paramsIn: [
                    [
                        1,20,15,11,96,3,8,200,128,255,27,29,31,14,16,21
                    ],
                    [
                        4,22,43,62,69,81,72,186,215,4,9,15,22,38,104,126
                    ]
                ],
                outputs: []
            }
        );
        this.ruleFunction.push(this.oddAndEvenParams);
        this.byteFunction.push(this.byteOddAndEvenParams);
        this.requiredOutputsFunction.push(this.getOddAndEvenParamsRequiredOutputs);

        this.scoreList.push(
            {rule: "Select Less Than First Param", ruleId: 94,
                retain: false, skip: false, 
                score: 0, completionRound: -1, max: 5, startRoundNum: 800,
                outBlockStart: 0, outBlockLen: 16,
                inBlockStart: 0, inBlockLen: 32,
                highIC: 9 * 16 + learnCodeAllowance,
                highIP: 80,
                sampleIn: [[
                    40,39,26,58,128,17,19,21,76,94,14,8,3,97,220,168,
                    1,91,96,145,76,74,3,5,4,225,230,2,196,34,27,28
                ]],
                sampleOut: [],
                paramsIn: [
                    [
                        60,39,26,58,128,170,19,71,36,94,14,8,3,97,220,168,
                        21,91,96,145,76,4,3,5,66,225,235,2,196,34,27,28
                    ],
                    [
                        90,39,26,58,129,171,19,91,180,46,94,14,8,3,97,220,
                        17,21,91,96,145,96,4,3,5,166,225,235,2,196,34,27
                    ]
                ],
                outputs: []
            }
        );
        this.ruleFunction.push(null);
        this.byteFunction.push(null);
        this.requiredOutputsFunction.push(this.getSelectLessThanFirstParamRequiredOutputs);

        this.scoreList.push(
            {rule: "Select Greater Than First Param", ruleId: 95,
                retain: false, skip: false, 
                score: 0, completionRound: -1, max: 5, startRoundNum: 800,
                outBlockStart: 0, outBlockLen: 16,
                inBlockStart: 0, inBlockLen: 32,
                highIC: 9 * 16 + learnCodeAllowance,
                highIP: 80,
                sampleIn: [[
                    31,39,26,58,12,170,19,21,76,94,14,8,3,97,220,168,
                    2,1,91,96,145,76,74,3,5,4,225,230,2,196,30,27,
                ]],
                sampleOut: [],
                paramsIn: [
                    [
                        65,94,39,26,58,128,170,19,71,36,94,147,8,3,97,220,
                        76,21,91,96,145,76,4,3,5,66,225,235,2,19,34,27
                    ],
                    [
                        80,45,39,26,58,129,171,19,91,180,46,94,94,88,3,97,
                        85,17,21,91,96,145,96,4,3,5,166,225,235,2,19,34
                    ]
                ],
                outputs: []
            }
        );
        this.ruleFunction.push(null);
        this.byteFunction.push(null);
        this.requiredOutputsFunction.push(this.getSelectGreaterThanFirstParamRequiredOutputs);

        this.scoreList.push(
            {rule: "Multiply By First Param 1", ruleId: 15,
                retain: false, skip: false, 
                score: 0, completionRound: -1, max: 5, startRoundNum: 800,
                outBlockStart: 0, outBlockLen: 16,
                inBlockStart: 0, inBlockLen: 16,
                highIC: 4 * 10 * 16 + learnCodeAllowance,
                highIP: 90,
                sampleIn: [[4,6,51,23,25,31,18,10,12,65,32,43,14,21,31,7]],
                sampleOut: [], 
                paramsIn: [
                    [
                        2,20,15,11,96,3,8,200,128,255,27,29,31,14,16,21
                    ],
                    [
                        4,22,43,67,69,81,72,186,215,4,9,15,22,38,104,126
                    ]
                ],
                outputs: []
            }
        );
        this.ruleFunction.push(this.multiplyByFirstParam);
        this.byteFunction.push(this.byteMultiplyByFirstParam);
        this.requiredOutputsFunction.push(this.getMultiplyByFirstParamRequiredOutputs);

        this.scoreList.push(
            {rule: "Multiply By First Param 2", ruleId: 16,
                retain: false, skip: false, 
                score: 0, completionRound: -1, max: 5, startRoundNum: 800,
                outBlockStart: 0, outBlockLen: 16,
                inBlockStart: 0, inBlockLen: 16,
                highIC: 6 * 10 * 16 + learnCodeAllowance,
                highIP: 90,
                sampleIn: [[5,3,12,34,43,53,42,13,21,27,32,19,8,7,6,4]],
                sampleOut: [],
                paramsIn: [
                    [
                        3,20,15,11,96,3,8,200,128,255,27,29,31,14,16,21
                    ],
                    [
                        6,22,43,67,69,81,72,186,215,4,9,15,22,38,104,126
                    ]
                ],
                outputs: []
            }
        );
        this.ruleFunction.push(this.multiplyByFirstParam);
        this.byteFunction.push(this.byteMultiplyByFirstParam);
        this.requiredOutputsFunction.push(this.getMultiplyByFirstParamRequiredOutputs);

        this.scoreList.push(
            {rule: "Multiply By First Param 3", ruleId: 17,
                retain: false, skip: false, 
                score: 0, completionRound: -1, max: 5, startRoundNum: 800,
                outBlockStart: 0, outBlockLen: 16,
                inBlockStart: 0, inBlockLen: 16,
                highIC: 9 * 10 * 16 + learnCodeAllowance,
                highIP: 90,
                sampleIn: [[8,3,5,20,24,30,35,19,17,6,4,5,8,11,17,19]],
                sampleOut: [],
                paramsIn: [
                    [
                        5,20,15,11,96,3,8,200,128,255,27,29,31,14,16,21
                    ],
                    [
                        9,22,43,67,69,81,72,186,215,4,9,15,22,38,104,126
                    ]
                ]
            }
        );
        this.ruleFunction.push(this.multiplyByFirstParam);
        this.byteFunction.push(this.byteMultiplyByFirstParam);
        this.requiredOutputsFunction.push(this.getMultiplyByFirstParamRequiredOutputs);

        this.scoreList.push(
            {rule: "Multiply Params by 10", ruleId: 110,
                retain: false, skip: false, 
                score: 0, completionRound: -1, max: 5, startRoundNum: 800,
                outBlockStart: 0, outBlockLen: 16,
                inBlockStart: 0, inBlockLen: 16,
                highIC: 9 * 10 * 16 + learnCodeAllowance,
                highIP: 90,
                sampleIn: [[8,3,5,20,24,25,15,19,17,6,4,5,8,11,17,19]],
                sampleOut: [],
                paramsIn: [
                    [
                        5,20,15,11,20,3,8,14,12,25,24,22,11,4,16,21
                    ],
                    [
                        9,22,23,17,19,11,12,18,21,4,9,15,22,18,10,16
                    ]
                ]
            }
        );
        this.ruleFunction.push(null);
        this.byteFunction.push(null);
        this.requiredOutputsFunction.push(this.getMultiplyParamsBy10RequiredOutputs);

        this.scoreList.push(
            {rule: "Sixteen Bit Add First Param 1", ruleId: 111,
                retain: false, skip: false, 
                score: 0, completionRound: -1, max: 5, startRoundNum: 800,
                outBlockStart: 0, outBlockLen: 16,
                inBlockStart: 0, inBlockLen: 16,
                highIC: 9 * 10 * 16 + learnCodeAllowance,
                highIP: 90,
                sampleIn: [[20,255,250,240,245,252,237,230,252,249,254,248,247,241,242,210]],
                sampleOut: [],
                paramsIn: [
                    [
                        40,217,220,235,210,222,226,252,245,248,230,225,229,227,217,200
                    ],
                    [
                        105,220,230,170,190,111,195,180,60,49,212,215,222,188,175,160
                    ]
                ]
            }
        );
        this.ruleFunction.push(null);
        this.byteFunction.push(null);
        this.requiredOutputsFunction.push(this.getSixteenBitAddFirstParamRequiredOutputs);

        this.scoreList.push(
            {rule: "Sixteen Bit Add First Param 2", ruleId: 112,
                retain: false, skip: false, 
                score: 0, completionRound: -1, max: 5, startRoundNum: 800,
                outBlockStart: 0, outBlockLen: 16,
                inBlockStart: 0, inBlockLen: 16,
                highIC: 9 * 10 * 16 + learnCodeAllowance,
                highIP: 90,
                sampleIn: [[250,255,250,240,245,252,237,230,252,249,254,248,247,241,242,210]],
                sampleOut: [],
                paramsIn: [
                    [
                        240,217,220,235,5,222,226,252,245,248,230,1,229,10,217,200
                    ],
                    [
                        245,220,230,1,190,111,195,180,3,49,212,2,222,188,175,160
                    ]
                ]
            }
        );
        this.ruleFunction.push(null);
        this.byteFunction.push(null);
        this.requiredOutputsFunction.push(this.getSixteenBitAddFirstParamRequiredOutputs);

        this.scoreList.push(
            {rule: "Sixteen Bit Add First Two Params", ruleId: 113,
                retain: false, skip: false, 
                score: 0, completionRound: -1, max: 5, startRoundNum: 800,
                outBlockStart: 0, outBlockLen: 16,
                inBlockStart: 0, inBlockLen: 16,
                highIC: 9 * 10 * 16 + learnCodeAllowance,
                highIP: 90,
                sampleIn: [[4,255,6,240,12,252,20,230,18,249,35,248,41,241,16,210]],
                sampleOut: [],
                paramsIn: [
                    [
                        10,217,20,235,25,222,26,252,15,248,0,10,1,10,30,200
                    ],
                    [
                        20,220,15,1,26,111,54,180,3,49,20,2,0,188,0,10
                    ]
                ]
            }
        );
        this.ruleFunction.push(null);
        this.byteFunction.push(null);
        this.requiredOutputsFunction.push(this.getSixteenBitAddFirstTwoParamsRequiredOutputs);

        this.scoreList.push(
            {rule: "Multiply By First Param Add Adjacent", ruleId: 98,
                retain: false, skip: false, 
                score: 0, completionRound: -1, max: 5, startRoundNum: 800,
                outBlockStart: 0, outBlockLen: 16,
                inBlockStart: 0, inBlockLen: 32,
                highIC: 9 * 10 * 16 + learnCodeAllowance,
                highIP: 90,
                sampleIn: [[2,3, 5,20, 24,30, 35,19, 17,6, 4,5, 8,11, 17,19,
                            4,12, 17,9, 63,20, 45,49, 55,20, 61,19, 42,19, 28,21
                ]],
                sampleOut: [],
                paramsIn: [
                    [
                        5,20, 15,11, 35,3, 8,200, 40,16, 27,29, 31,14, 16,21,
                        17,19, 18,21, 19,52, 25,21, 24,24, 28,19, 13,4, 15,6
                    ],
                    [
                        10,22, 4,67, 5,81, 12,17, 22,4, 19,15, 23,6, 9,11,
                        10,15, 13,18, 8,11, 12,19, 4,8, 5,6, 16,7, 18,20
                    ]
                ]
            }
        );
        this.ruleFunction.push(null);
        this.byteFunction.push(null);
        this.requiredOutputsFunction.push(this.getMultiplyByFirstParamAddAdjacentRequiredOutputs);

        this.scoreList.push(
            {rule: "Multiply By First Param Minus Adjacent", ruleId: 99,
                retain: false, skip: false, 
                score: 0, completionRound: -1, max: 5, startRoundNum: 800,
                outBlockStart: 0, outBlockLen: 16,
                inBlockStart: 0, inBlockLen: 32,
                highIC: 9 * 10 * 16 + learnCodeAllowance,
                highIP: 90,
                sampleIn: [[5,3, 5,20, 24,30, 35,19, 17,6, 4,5, 8,11, 17,19,
                            4,12, 17,9, 43,20, 45,49, 35,20, 41,19, 42,19, 28,21
                ]],
                sampleOut: [],
                paramsIn: [
                    [
                        2,2, 15,11, 35,3, 100,4, 40,16, 27,29, 31,14, 16,21,
                        17,19, 18,21, 19,22, 25,21, 24,24, 28,19, 13,4, 15,6
                    ],
                    [
                        10,22, 4,27, 5,11, 12,17, 22,4, 19,15, 23,6, 9,11,
                        10,15, 13,18, 8,11, 12,19, 4,8, 5,6, 16,7, 18,20
                    ]
                ]
            }
        );
        this.ruleFunction.push(null);
        this.byteFunction.push(null);
        this.requiredOutputsFunction.push(this.getMultiplyByFirstParamMinusAdjacentRequiredOutputs);

        this.scoreList.push(
            {rule: "Subtract First Param Second Times", ruleId: 91,
                retain: false, skip: false, 
                score: 0, completionRound: -1, max: 5, startRoundNum: 800,
                outBlockStart: 0, outBlockLen: 16,
                inBlockStart: 0, inBlockLen: 16,
                highIC: 9 * 10 * 16 + learnCodeAllowance,
                highIP: 90,
                sampleIn: [[8,3,5,20,24,30,35,19,17,6,4,5,8,11,17,19]],
                sampleOut: [],
                paramsIn: [
                    [
                        5,4,15,11,96,3,8,200,128,255,27,29,31,14,16,21
                    ],
                    [
                        7,5,43,67,69,81,72,186,215,4,9,15,22,38,104,126
                    ],
                    [
                        3,8,15,11,96,3,8,200,128,255,27,29,31,14,16,21
                    ],                    
                    [
                        6,7,43,67,69,81,72,186,215,4,9,15,22,38,104,126
                    ]
                ]
            }
        );
        this.ruleFunction.push(null);
        this.byteFunction.push(null);
        this.requiredOutputsFunction.push(this.getSubtractFirstParamSecondTimesRequiredOutputs);

        this.scoreList.push(
            {rule: "Modulo First Param 1", ruleId: 43,
                retain: false, skip: false, 
                score: 0, completionRound: -1, max: 5, startRoundNum: 800,
                outBlockStart: 0, outBlockLen: 16,
                inBlockStart: 0, inBlockLen: 16,
                highIC: 50 * 9 * 16 + learnCodeAllowance,
                highIP: 90,
                sampleIn: [[4,19,30,65,207,191,3,18,20,48,64,76,54,19,32,17]],
                sampleOut: [], 
                paramsIn: [
                    [
                        2,20,15,11,96,3,8,200,128,255,27,29,31,14,16,21
                    ],
                    [
                        4,22,43,67,69,81,72,186,215,4,9,15,22,38,104,126
                    ]
                ]
            }
        );
        this.ruleFunction.push(this.moduloFirstParam);
        this.byteFunction.push(this.byteModuloFirstParam);
        this.requiredOutputsFunction.push(this.getModuloFirstParamRequiredOutputs);

        this.scoreList.push(
            {rule: "Modulo First Param 2", ruleId: 46,
                retain: false, skip: false, 
                score: 0, completionRound: -1, max: 5, startRoundNum: 800,
                outBlockStart: 0, outBlockLen: 16,
                inBlockStart: 0, inBlockLen: 16,
                highIC: 30 * 9 * 16 + learnCodeAllowance,
                highIP: 90,
                sampleIn: [[5,5,8,90,180,217,86,64,32,54,98,118,96,17,24,23]],
                sampleOut: [],
                paramsIn: [
                    [
                        3,20,15,11,96,3,8,200,128,255,27,29,31,14,16,21
                    ]
                ],
                outputs: []
            }
        );
        this.ruleFunction.push(this.moduloFirstParam);
        this.byteFunction.push(this.byteModuloFirstParam);
        this.requiredOutputsFunction.push(this.getModuloFirstParamRequiredOutputs);

        this.scoreList.push(
            {rule: "Modulo First Param 3", ruleId: 47,
                retain: false, skip: false, 
                score: 0, completionRound: -1, max: 5, startRoundNum: 800,
                outBlockStart: 0, outBlockLen: 16,
                inBlockStart: 0, inBlockLen: 16,
                highIC: 20 * 9 * 16 + learnCodeAllowance,
                highIP: 90,
                sampleIn: [[7,19,24,87,196,216,86,96,54,49,24,8,19,43,72,12]],
                sampleOut: [],
                paramsIn: [
                    [
                        5,20,15,11,96,3,8,200,128,255,27,29,31,14,16,21
                    ]
                ],
                outputs: []
            }
        );
        this.ruleFunction.push(this.moduloFirstParam);
        this.byteFunction.push(this.byteModuloFirstParam);
        this.requiredOutputsFunction.push(this.getModuloFirstParamRequiredOutputs);

        this.scoreList.push(
            {rule: "Modulo First Param 4", ruleId: 48,
                retain: false, skip: false, 
                score: 0, completionRound: -1, max: 5, startRoundNum: 800,
                outBlockStart: 0, outBlockLen: 16,
                inBlockStart: 0, inBlockLen: 16,
                highIC: 16 * 9 * 16 + learnCodeAllowance,
                highIP: 90,
                sampleIn: [[9,18,24,5,78,196,112,90,76,63,24,87,18,93,75,202]],
                sampleOut: [],
                paramsIn: [
                    [
                        6,20,15,11,96,3,8,200,128,255,27,29,31,14,16,21
                    ]
                ],
                outputs: []
            }
        );
        this.ruleFunction.push(this.moduloFirstParam);
        this.byteFunction.push(this.byteModuloFirstParam);
        this.requiredOutputsFunction.push(this.getModuloFirstParamRequiredOutputs);

        this.scoreList.push(
            {rule: "Modulo First Param 5", ruleId: 49,
                retain: false, skip: false, 
                score: 0, completionRound: -1, max: 5, startRoundNum: 800,
                outBlockStart: 0, outBlockLen: 16,
                inBlockStart: 0, inBlockLen: 16,
                highIC: 15 * 9 * 16 + learnCodeAllowance,
                highIP: 90,
                sampleIn: [[12,45,37,98,147,56,215,54,76,85,180,17,54,9,11,19]],
                sampleOut: [],
                paramsIn: [
                    [
                        7,20,15,11,96,3,8,200,128,255,27,29,31,14,16,21
                    ]
                ],
                outputs: []
            }
        );
        this.ruleFunction.push(this.moduloFirstParam);
        this.byteFunction.push(this.byteModuloFirstParam);
        this.requiredOutputsFunction.push(this.getModuloFirstParamRequiredOutputs);

        this.scoreList.push(
            {rule: "Modulo First Param 6", ruleId: 44,
                retain: false, skip: false, 
                score: 0, completionRound: -1, max: 5, startRoundNum: 800,
                outBlockStart: 0, outBlockLen: 16,
                inBlockStart: 0, inBlockLen: 16,
                highIC: 33 * 9 * 16 + learnCodeAllowance,
                highIP: 90,
                sampleIn: [[11,121,48,76,198,212,86,245,75,190,15,17,11,12,13,85]],
                sampleOut: [],
                paramsIn: [
                    [
                        10,20,15,11,96,3,8,200,128,255,27,29,31,14,16,21
                    ],
                    [
                        3,22,43,67,69,81,72,186,215,4,9,15,22,38,104,126
                    ],
                    [
                        5,22,43,67,69,81,72,186,215,4,9,15,22,38,104,126
                    ],
                    [
                        15,22,43,67,69,81,72,186,215,4,9,15,22,38,104,126
                    ]
                ],
                outputs: []
            }
        );
        this.ruleFunction.push(this.moduloFirstParam);
        this.byteFunction.push(this.byteModuloFirstParam);
        this.requiredOutputsFunction.push(this.getModuloFirstParamRequiredOutputs);

        this.scoreList.push(
            {rule: "Modulo First Param 7", ruleId: 45,
                retain: false, skip: false, 
                score: 0, completionRound: -1, max: 5, startRoundNum: 800,
                outBlockStart: 0, outBlockLen: 16,
                inBlockStart: 0, inBlockLen: 16,
                highIC: 20 * 9 * 16 + learnCodeAllowance,
                highIP: 90,
                sampleIn: [[15,87,45,13,91,100,95,30,76,84,83,82,19,8,21,24]],
                sampleOut: [],
                paramsIn: [
                    [
                        5,20,15,11,96,3,8,200,128,255,27,29,31,14,16,21
                    ],
                    [
                        6,22,43,67,69,81,72,186,215,4,9,15,22,38,104,126
                    ]
                ],
                outputs: []
            }
        );
        this.ruleFunction.push(this.moduloFirstParam);
        this.byteFunction.push(this.byteModuloFirstParam);
        this.requiredOutputsFunction.push(this.getModuloFirstParamRequiredOutputs);

        this.scoreList.push(
            {rule: "Divisible By First Param", ruleId: 82,
                retain: false, skip: false, 
                score: 0, completionRound: -1, max: 5, startRoundNum: 800,
                outBlockStart: 0, outBlockLen: 16,
                inBlockStart: 0, inBlockLen: 32,
                insDistribution: [
                    {
                        ins: "SWP A, B",
                        countOpt: 1,
                        scanStart: 20,
                        scanEnd: 100
                    },
                    {
                        ins: "SUB A, B",
                        countOpt: 1,
                        scanStart: 20,
                        scanEnd: 100
                    },
                    {
                        ins: "JRZ",
                        countOpt: 1,
                        scanStart: 20,
                        scanEnd: 100
                    },
                    {
                        ins: "JRNC",
                        countOpt: 1,
                        scanStart: 20,
                        scanEnd: 100
                    }
                ],
                highIC: 33 * 9 * 16 + learnCodeAllowance,
                highIP: 110,
                sampleIn: [
                    [
                        6,24,17,18,3,7,15,12,36,120,19,17,11,72,13,30,
                        42,54,9,37,36,60,10,20,29,126,132,138,7,9,144,2
                    ]
                ],
                sampleOut: [],
                paramsIn: [
                    [
                        3,6,9,20,31,43,13,21,24,7,27,30,11,19,23,15,
                        33,60,61,62,68,69,72,74,75,77,78,81,84,8,22,25
                    ],
                    [
                        2,9,15,19,6,3,39,10,12,24,91,93,99,80,120,130,
                        4,3,7,8,40,19,11,62,63,65,64,70,90,92,101,201
                    ],
                    [
                        6,24,19,20,31,17,15,18,36,120,21,19,61,72,13,30,
                        48,60,9,37,42,66,10,20,29,132,138,144,7,9,150,2                        
                    ],
                    [
                        4,3,7,16,15,17,24,64,120,119,118,56,32,36,31,33,
                        12,13,15,16,52,56,80,81,82,83,84,88,92,93,94,95
                    ]
                ],
                outputs: []
            }
        );
        this.ruleFunction.push(null);
        this.byteFunction.push(null);
        this.requiredOutputsFunction.push(this.getDivisibleByFirstParamRequiredOutputs);

        this.scoreList.push(
            {rule: "Not Divisible By First Param", ruleId: 83,
                retain: false, skip: false, 
                score: 0, completionRound: -1, max: 5, startRoundNum: 800,
                outBlockStart: 0, outBlockLen: 16,
                inBlockStart: 0, inBlockLen: 32,
                highIC: 33 * 9 * 16 + learnCodeAllowance,
                highIP: 110,
                insDistribution: [
                    {
                        ins: "SUB A, B",
                        countOpt: 1,
                        scanStart: 10,
                        scanEnd: 30
                    }
                ],
                sampleIn: [
                    [
                        6,24,17,18,3,7,15,12,36,120,19,17,11,72,13,30,
                        42,54,9,37,36,60,10,20,29,126,132,138,7,9,144,2
                    ]
                ],
                sampleOut: [],
                paramsIn: [
                    [
                        3,6,9,20,31,43,13,21,24,7,27,30,11,19,23,15,
                        33,60,61,62,68,69,72,74,75,77,78,81,84,8,22,25
                    ],
                    [
                        2,9,15,19,6,3,39,10,12,24,91,93,99,80,120,130,
                        4,3,7,8,40,19,11,62,63,65,64,70,90,92,101,201
                    ],
                    [
                        6,24,19,20,31,17,15,18,36,120,21,19,61,72,13,30,
                        48,60,9,37,42,66,10,20,29,132,138,144,7,9,150,2                        
                    ],
                    [
                        4,3,7,16,15,17,24,64,120,119,118,56,32,36,31,33,
                        12,13,15,16,52,56,80,81,82,83,84,88,92,93,94,95
                    ]
                ],
                outputs: []
            }
        );
        this.ruleFunction.push(null);
        this.byteFunction.push(null);
        this.requiredOutputsFunction.push(this.getNotDivisibleByFirstParamRequiredOutputs);

        this.scoreList.push(
            {rule: "Divide by First Param 1", ruleId: 18,
                retain: false, skip: false, 
                score: 0, completionRound: -1, max: 5, startRoundNum: 800,
                outBlockStart: 0, outBlockLen: 16,
                inBlockStart: 0, inBlockLen: 16,
                highIC: 50 * 9 * 16 + learnCodeAllowance,
                highIP: 90,
                sampleIn: [[5,10,15,20,31,33,87,121,64,236,119,125,64,63,62,12]],
                sampleOut: [],
                paramsIn: [
                    [
                        2,20,15,11,96,3,8,200,128,255,27,29,31,14,16,21
                    ],
                    [
                        4,22,43,67,69,81,72,186,215,4,9,15,22,38,104,126
                    ]
                ],
                outputs: []
            }
        );
        this.ruleFunction.push(this.divideByFirstParam);
        this.byteFunction.push(this.byteDivideByFirstParam);
        this.requiredOutputsFunction.push(this.getDivideByFirstParamRequiredOutputs);

        this.scoreList.push(
            {rule: "Divide by First Param 2", ruleId: 39,
                retain: false, skip: false, 
                score: 0, completionRound: -1, max: 5, startRoundNum: 800,
                outBlockStart: 0, outBlockLen: 16,
                inBlockStart: 0, inBlockLen: 16,
                highIC: 30 * 9 * 16 + learnCodeAllowance,
                highIP: 110,
                insDistribution: [
                    {
                        ins: "SUB A, B",
                        countOpt: 1,
                        scanStart: 10,
                        scanEnd: 35
                    },
                    {
                        ins: "JRC",
                        countOpt: 1,
                        scanStart: 10,
                        scanEnd: 50
                    }
                ],
                sampleIn: [[3,9,12,18,36,48,87,180,53,64,97,237,181,18,64,17]],
                sampleOut: [],
                paramsIn: [
                    [
                        2,20,15,11,96,3,8,200,128,255,27,29,31,14,16,21
                    ],
                    [
                        3,22,43,67,69,81,72,186,215,4,9,15,22,38,104,126
                    ]
                ],
                outputs: []
            }
        );
        this.ruleFunction.push(this.divideByFirstParam);
        this.byteFunction.push(this.byteDivideByFirstParam);
        this.requiredOutputsFunction.push(this.getDivideByFirstParamRequiredOutputs);

        this.scoreList.push(
            {rule: "Divide by First Param 3", ruleId: 41,
                retain: false, skip: false, 
                score: 0, completionRound: -1, max: 5, startRoundNum: 800,
                outBlockStart: 0, outBlockLen: 16,
                inBlockStart: 0, inBlockLen: 16,
                highIC: 16 * 9 * 16 + learnCodeAllowance,
                highIP: 110,
                insDistribution: [
                    {
                        ins: "SUB A, B",
                        countOpt: 1,
                        scanStart: 10,
                        scanEnd: 35
                    },
                    {
                        ins: "JRC",
                        countOpt: 1,
                        scanStart: 10,
                        scanEnd: 50
                    }
                ],
                sampleIn: [[6,8,9,64,53,27,98,247,45,85,17,24,45,46,76,32]],
                sampleOut: [],
                paramsIn: [
                    [
                        3,20,15,11,96,3,8,200,128,255,27,29,31,14,16,21
                    ],
                    [
                        4,22,43,67,69,81,72,186,215,4,9,15,22,38,104,126
                    ]
                ],
                outputs: []
            }
        );
        this.ruleFunction.push(this.divideByFirstParam);
        this.byteFunction.push(this.byteDivideByFirstParam);
        this.requiredOutputsFunction.push(this.getDivideByFirstParamRequiredOutputs);

        this.scoreList.push(
            {rule: "Divide by First Param 4", ruleId: 42,
                retain: false, skip: false, 
                score: 0,
                completionRound: -1, 
                max: 5, 
                startRoundNum: 800,
                outBlockStart: 0, outBlockLen: 16,
                inBlockStart: 0, inBlockLen: 16,
                highIC: 16 * 9 * 16 + learnCodeAllowance,
                highIP: 110,
                insDistribution: [
                    {
                        ins: "SUB A, B",
                        countOpt: 1,
                        scanStart: 10,
                        scanEnd: 35
                    },
                    {
                        ins: "JRC",
                        countOpt: 1,
                        scanStart: 10,
                        scanEnd: 50
                    }
                ],
                sampleIn: [[12,144,87,86,50,212,119,8,65,76,86,17,18,34,36,17]],
                sampleOut: [],
                paramsIn: [
                    [
                        3,20,15,11,96,3,8,200,128,255,27,29,31,14,16,21
                    ],
                    [
                        4,22,43,67,69,81,72,186,215,4,9,15,22,38,104,126
                    ],
                    [
                        2,27,33,47,89,82,79,182,217,5,8,12,24,33,112,124
                    ],
                    [
                        6,12,33,87,65,83,71,146,213,11,7,17,29,31,101,136
                    ]
                ],
                outputs: []
            }
        );
        this.ruleFunction.push(this.divideByFirstParam);
        this.byteFunction.push(this.byteDivideByFirstParam);
        this.requiredOutputsFunction.push(this.getDivideByFirstParamRequiredOutputs);

        this.scoreList.push(
            {rule: "Divide by First Param 5", ruleId: 40,
                retain: false, skip: false, 
                score: 0, 
                completionRound: -1, 
                max: 5, 
                startRoundNum: 800,
                outBlockStart: 0, outBlockLen: 16,
                inBlockStart: 0, inBlockLen: 16,
                highIC: 13 * 9 * 16 + learnCodeAllowance,
                highIP: 110,
                insDistribution: [
                    {
                        ins: "SUB A, B",
                        countOpt: 1,
                        scanStart: 10,
                        scanEnd: 35
                    },
                    {
                        ins: "JRC",
                        countOpt: 1,
                        scanStart: 10,
                        scanEnd: 50
                    }
                ],
                sampleIn: [[7,49,56,90,87,14,32,54,86,197,230,145,86,185,82,19]],
                sampleOut: [],
                paramsIn: [
                    [
                        4,20,15,11,96,3,8,200,128,255,27,29,31,14,16,21
                    ],
                    [
                        6,22,43,67,69,81,72,186,215,4,9,15,22,38,104,126
                    ]
                ],
                outputs: []
            }
        );
        this.ruleFunction.push(this.divideByFirstParam);
        this.byteFunction.push(this.byteDivideByFirstParam);
        this.requiredOutputsFunction.push(this.getDivideByFirstParamRequiredOutputs);

        this.scoreList.push(
            {rule: "Divide by First Param 6", ruleId: 37,
                retain: false, skip: false, 
                score: 0, completionRound: -1, max: 5, startRoundNum: 800,
                outBlockStart: 0, outBlockLen: 16,
                inBlockStart: 0, inBlockLen: 16,
                highIC: 16 * 9 * 16 + learnCodeAllowance,
                highIP: 110,
                insDistribution: [
                    {
                        ins: "SUB A, B",
                        countOpt: 1,
                        scanStart: 10,
                        scanEnd: 35
                    },
                    {
                        ins: "JRC",
                        countOpt: 1,
                        scanStart: 10,
                        scanEnd: 50
                    }
                ],
                sampleIn: [[8,64,86,90,108,84,25,32,65,64,72,89,150,160,12,16]],
                sampleOut: [],
                paramsIn: [
                    [
                        3,20,15,11,96,3,8,200,128,255,27,29,31,14,16,21
                    ],
                    [
                        6,22,43,67,69,81,72,186,215,4,9,15,22,38,104,126
                    ]
                ],
                paramsOut: []
            }
        );
        this.ruleFunction.push(this.divideByFirstParam);
        this.byteFunction.push(this.byteDivideByFirstParam);
        this.requiredOutputsFunction.push(this.getDivideByFirstParamRequiredOutputs);

        this.scoreList.push(
            {rule: "Divide by First Param 7", ruleId: 38,
                retain: false, skip: false, 
                score: 0, completionRound: -1, max: 5, startRoundNum: 800,
                outBlockStart: 0, outBlockLen: 16,
                inBlockStart: 0, inBlockLen: 16,
                highIC: 10 * 9 * 16 + learnCodeAllowance,
                highIP: 110,
                insDistribution: [
                    {
                        ins: "SUB A, B",
                        countOpt: 1,
                        scanStart: 10,
                        scanEnd: 35
                    },
                    {
                        ins: "JRC",
                        countOpt: 1,
                        scanStart: 10,
                        scanEnd: 50
                    }
                ],
                sampleIn: [[7,49,87,90,14,17,21,34,57,86,98,87,119,212,81,43]],
                sampleOut: [],
                paramsIn: [
                    [
                        5,20,15,11,96,3,8,200,128,255,27,29,31,14,16,21
                    ],
                    [
                        9,22,43,67,69,81,72,186,215,4,9,15,22,38,104,126
                    ]
                ],
                outputs: []
            }
        );
        this.ruleFunction.push(this.divideByFirstParam);
        this.byteFunction.push(this.byteDivideByFirstParam);
        this.requiredOutputsFunction.push(this.getDivideByFirstParamRequiredOutputs);

        this.scoreList.push(
            {rule: "Is Prime", ruleId: 92,
                retain: false, skip: false, 
                score: 0, completionRound: -1, max: 5, startRoundNum: 800,
                outBlockStart: 0, outBlockLen: 16,
                inBlockStart: 0, inBlockLen: 16,
                highIC: 10 * 9 * 16 + learnCodeAllowance,
                highIP: 110,
                sampleIn: [[7,49,87,90,14,17,21,34,57,86,98,87,119,212,81,43]],
                sampleOut: [],
                paramsIn: [
                    [
                        5,20,15,11,96,3,8,201,123,255,27,29,31,14,16,21
                    ],
                    [
                        9,22,43,67,69,81,72,186,215,4,9,23,29,38,104,123
                    ],
                    [
                        11,29,43,67,69,81,72,31,211,4,9,23,29,37,104,123
                    ]
                ],
                outputs: []
            }
        );
        this.ruleFunction.push(null);
        this.byteFunction.push(null);
        this.requiredOutputsFunction.push(this.getIsPrimeRequiredOutputs);

        this.scoreList.push(
            {rule: "Paramth Prime", ruleId: 93,
                retain: false, skip: false, 
                score: 0, completionRound: -1, max: 5, startRoundNum: 800,
                outBlockStart: 0, outBlockLen: 16,
                inBlockStart: 0, inBlockLen: 16,
                highIC: 10 * 9 * 16 + learnCodeAllowance,
                highIP: 110,
                sampleIn: [[7,49,37,50,14,17,21,34,52,18,34,37,49,12,16,43]],
                sampleOut: [],
                paramsIn: [
                    [
                        5,20,15,11,46,3,8,20,23,54,27,29,31,14,16,21
                    ],
                    [
                        9,22,43,51,49,31,32,18,21,4,9,23,29,38,10,12
                    ],
                    [
                        11,29,43,37,49,41,22,31,21,4,9,23,29,37,31,13
                    ]
                ],
                outputs: []
            }
        );
        this.ruleFunction.push(null);
        this.byteFunction.push(null);
        this.requiredOutputsFunction.push(this.getParamthPrimeRequiredOutputs);

        this.scoreList.push(
            {rule: "Power First Param 1", ruleId: 79,
                retain: false, skip: false, 
                score: 0, completionRound: -1, max: 5, startRoundNum: 800,
                outBlockStart: 0, outBlockLen: 16,
                inBlockStart: 0, inBlockLen: 16,
                highIC: 16 * 11 * 16 + learnCodeAllowance,
                highIP: 120,
                sampleIn: [[2,3,7,10,4,6,11,13,14,5,15,8,16,0,9,12]],
                sampleOut: [],
                paramsIn: [
                    [
                        2,6,7,11,16,13,8,10,9,4,7,11,12,0,1,3
                    ],
                    [
                        2,15,2,5,8,11,9,12,13,14,10,7,6,8,4,0
                    ]
                ],
                outputs: []
            }
        );
        this.ruleFunction.push(null);
        this.byteFunction.push(null);
        this.requiredOutputsFunction.push(this.getPowerFirstParamRequiredOutputs);

        this.scoreList.push(
            {rule: "Power First Param 2", ruleId: 80,
                retain: false, skip: false, 
                score: 0, completionRound: -1, max: 5, startRoundNum: 800,
                outBlockStart: 0, outBlockLen: 16,
                inBlockStart: 0, inBlockLen: 16,
                highIC: 16 * 12 * 16 + learnCodeAllowance,
                highIP: 120,
                sampleIn: [[3,3,7,4,4,6,5,3,5,2,1,6,3,1,7,0]],
                sampleOut: [],
                paramsIn: [
                    [
                        3,6,7,4,3,5,1,2,6,4,7,3,5,0,1,3
                    ],
                    [
                        3,1,2,5,6,4,7,3,0,2,4,5,6,1,4,0
                    ]
                ],
                outputs: []
            }
        );
        this.ruleFunction.push(null);
        this.byteFunction.push(null);
        this.requiredOutputsFunction.push(this.getPowerFirstParamRequiredOutputs);

        this.scoreList.push(
            {rule: "Power First Param 3", ruleId: 81,
                retain: false, skip: false, 
                score: 0, completionRound: -1, max: 5, startRoundNum: 800,
                outBlockStart: 0, outBlockLen: 16,
                inBlockStart: 0, inBlockLen: 16,
                highIC: 16 * 12 * 16 + learnCodeAllowance,
                highIP: 120,
                sampleIn: [
                    [2,1,6,4,5,3,7,5,3,3,4,2,1,0,6,5],
                    [3,3,7,4,4,6,5,3,5,2,1,6,3,1,7,0]
                ],
                sampleOut: [],
                paramsIn: [
                    [
                        2,6,7,14,3,5,11,2,6,4,10,3,15,0,16,3
                    ],
                    [
                        3,1,2,5,6,4,7,3,0,2,4,5,6,1,4,0
                    ]
                ],
                outputs: []
            }
        );
        this.ruleFunction.push(null);
        this.byteFunction.push(null);
        this.requiredOutputsFunction.push(this.getPowerFirstParamRequiredOutputs);

        this.scoreList.push(
            {rule: "Square Roots", ruleId: 103,
                retain: false, skip: false, 
                score: 0, completionRound: -1, max: 5, startRoundNum: 800,
                outBlockStart: 0, outBlockLen: 16,
                inBlockStart: 0, inBlockLen: 16,
                highIC: 16 * 12 * 16 + learnCodeAllowance,
                highIP: 120,
                sampleIn: [
                    [4,121,100,64,225,144,36,16,25,225,144,196,9,81,49,16],
                    [121,225,169,16,25,49,81,64,144,121,196,4,9,36,81,100]
                ],
                sampleOut: [],
                paramsIn: [
                    [
                        121,100,81,225,4,16,225,169,121,49,36,25,64,100,196,144
                    ],
                    [
                        4,16,9,49,25,225,169,196,121,100,100,36,64,81,81,144
                    ]
                ],
                outputs: []
            }
        );
        this.ruleFunction.push(null);
        this.byteFunction.push(null);
        this.requiredOutputsFunction.push(this.getSquareRootsRequiredOutputs);

        this.scoreList.push(
            {rule: "Cube Roots", ruleId: 104,
                retain: false, skip: false, 
                score: 0, completionRound: -1, max: 5, startRoundNum: 800,
                outBlockStart: 0, outBlockLen: 16,
                inBlockStart: 0, inBlockLen: 16,
                highIC: 16 * 12 * 16 + learnCodeAllowance,
                highIP: 120,
                sampleIn: [
                    [216,27,64,8,125,27,216,216,125,64,8,8,27,64,216,125],
                    [27,216,125,64,64,27,8,216,64,8,8,125,27,8,125,216]
                ],
                sampleOut: [],
                paramsIn: [
                    [
                        125,216,216,8,8,64,216,64,27,125,27,125,64,64,8,216
                    ],
                    [
                        216,8,8,64,27,27,64,125,27,216,64,64,125,216,8,8
                    ]
                ],
                outputs: []
            }
        );
        this.ruleFunction.push(null);
        this.byteFunction.push(null);
        this.requiredOutputsFunction.push(this.getCubeRootsRequiredOutputs);

        this.scoreList.push(
            {rule: "Greater than First Param", ruleId: 19,
                retain: false, skip: false, 
                score: 0, completionRound: -1, max: 5, startRoundNum: 800,
                outBlockStart: 0, outBlockLen: 16,
                inBlockStart: 0, inBlockLen: 16,
                highIC: 16 * 8 + learnCodeAllowance,
                highIP: 80,
                sampleIn: [[17,98,4,86,15,17,19,12,10,9,54,3,45,12,13,91]],
                sampleOut: [],
                paramsIn: [
                    [
                        20,20,15,11,96,3,8,200,128,255,27,29,31,14,16,21
                    ],
                    [
                        38,22,43,67,69,81,72,186,215,4,9,15,22,38,104,126
                    ]
                ],
                outputs: []
            }
        );
        this.ruleFunction.push(this.greaterThanFirstParam);
        this.byteFunction.push(this.byteGreaterThanFirstParam);
        this.requiredOutputsFunction.push(this.getGreaterThanFirstParamRequiredOutputs);

        this.scoreList.push(
            {rule: "Compare First Param", ruleId: 20,
                retain: false, skip: false, 
                score: 0, completionRound: -1, max: 5, startRoundNum: 800,
                outBlockStart: 0, outBlockLen: 16,
                inBlockStart: 0, inBlockLen: 16,
                highIC: 16 * 14 + learnCodeAllowance,
                highIP: 80,
                sampleIn: [[36,17,19,45,59,75,17,24,34,76,90,112,211,89,12,32]],
                sampleOut: [],
                paramsIn: [
                    [
                        20,20,15,11,96,3,8,200,128,255,27,29,31,14,16,21
                    ],
                    [
                        38,22,43,67,69,81,72,186,215,4,9,15,22,38,104,126
                    ]
                ],
                outputs: []
            }
        );
        this.ruleFunction.push(this.compareFirstParam);
        this.byteFunction.push(this.byteCompareFirstParam);
        this.requiredOutputsFunction.push(this.getCompareFirstParamRequiredOutputs);

        // Rules with separate input and output pointers
        this.scoreList.push(
            {rule: "Duplicate Params", ruleId: 21,
                retain: false, skip: false, 
                excludeHelperRules: [67],
                score: 0, completionRound: -1, max: 5, startRoundNum: 800,
                outBlockStart: 0, outBlockLen: 16,
                inBlockStart: 0, inBlockLen: 8,
                highIC: 8 * 10 + learnCodeAllowance,
                highIP: 80,
                sampleIn: [[2,7,9,19,108,43,22,17]],
                sampleOut: [],
                paramsIn: [
                    [
                        9,25,27,33,38,100,96,75
                    ],
                    [
                        11,21,13,108,225,217,18,15
                    ]
                ],
                outputs: []
            }
        );
        this.ruleFunction.push(this.duplicateParams);
        this.byteFunction.push(this.byteDuplicateParams);
        this.requiredOutputsFunction.push(this.getDuplicateParamsRequiredOutputs);

        // Rules relating adjacent parameters
        this.scoreList.push(
            {rule: "Skip Adjacent Params 1", ruleId: 22,
                retain: false, skip: false, 
                excludeHelperRules: [67],
                score: 0, completionRound: -1, max: 5, startRoundNum: 800,
                outBlockStart: 0, outBlockLen: 16,
                inBlockStart: 0, inBlockLen: 32,
                highIC: 16 * 8 + learnCodeAllowance,
                highIP: 90,
                sampleIn: [[
                    17,16,90,34,76,65,39,86,12,45,97,112,86,19,87,17,
                    23,65,87,83,67,73,19,29,32,54,12,90,198,74,86,61
                ]],
                sampleOut: [],
                paramsIn: [
                    [
                        1,7,12,8,11,96,91,10,16,84,101,105,90,58,202,201,
                        202,11,34,56,32,87,9,18,95,93,92,34,37,81,17,22
                    ],
                    [
                        4,9,11,15,89,63,62,80,93,30,65,78,35,36,107,209,
                        201,17,19,40,78,79,85,53,42,39,70,16,17,105,111,112
                    ]
                ],
                outputs: []
            }
        );
        this.ruleFunction.push(this.skipAdjacentParams1);
        this.byteFunction.push(this.byteSkipAdjacentParams1);
        this.requiredOutputsFunction.push(this.getSkipAdjacentParams1RequiredOutputs);

        this.scoreList.push(
            {rule: "Skip Adjacent Params 2", ruleId: 23,
                retain: false, skip: false, 
                excludeHelperRules: [67],
                score: 0, completionRound: -1, max: 5, startRoundNum: 800,
                outBlockStart: 0, outBlockLen: 16,
                inBlockStart: 0, inBlockLen: 32,
                highIC: 16 * 8 + learnCodeAllowance,
                highIP: 90,
                sampleIn: [[
                    43,54,76,81,17,19,21,40,80,120,255,103,96,75,81,84,
                    23,24,25,26,18,30,90,40,50,121,212,170,86,64,79,18
                ]],
                sampleOut: [],
                paramsIn: [
                    [
                        1,16,96,74,108,212,220,15,90,96,98,101,73,65,45,35,
                        2,4,16,58,98,76,85,61,17,25,86,92,18,46,74,57,
                    ],
                    [
                        3,19,47,90,81,31,87,91,26,103,222,67,87,62,35,97,
                        4,16,90,19,17,21,23,24,89,84,167,189,29,218,17,16
                    ]
                ],
                outputs: []
            }
        );
        this.ruleFunction.push(this.skipAdjacentParams2);
        this.byteFunction.push(this.byteSkipAdjacentParams2);
        this.requiredOutputsFunction.push(this.getSkipAdjacentParams2RequiredOutputs);

        this.scoreList.push(
            {rule: "Swap Adjacent Params", ruleId: 24,
                retain: false, skip: false, 
                score: 0, completionRound: -1, max: 5, startRoundNum: 800,
                outBlockStart: 0, outBlockLen: 16,
                inBlockStart: 0, inBlockLen: 16,
                highIC: 16 * 10 + learnCodeAllowance,
                highIP: 90,
                sampleIn: [[87,64,54,12,67,43,109,85,205,173,86,94,17,19,18,57]],
                sampleOut:[],
                paramsIn: [
                    [
                        1,5,6,9,18,90,49,57,86,178,202,85,54,72,19,21
                    ],
                    [
                        9,10,56,23,43,23,90,17,110,76,228,234,146,18,19,21
                    ]
                ], 
                outputs: []
            }
        );
        this.ruleFunction.push(this.swapAdjacentParams);
        this.byteFunction.push(this.byteSwapAdjacentParams);
        this.requiredOutputsFunction.push(this.getSwapAdjacentParamsRequiredOutputs);

        this.scoreList.push(
            {rule: "Reverse Params", ruleId: 89,
                retain: false, skip: false, 
                score: 0, completionRound: -1, max: 5, startRoundNum: 800,
                outBlockStart: 0, outBlockLen: 16,
                inBlockStart: 0, inBlockLen: 16,
                highIC: 16 * 10 + learnCodeAllowance,
                highIP: 90,
                sampleIn: [[87,64,54,12,67,43,109,85,205,173,86,94,17,19,18,57]],
                sampleOut:[],
                paramsIn: [
                    [
                        1,5,6,9,18,90,49,57,86,178,202,85,54,72,19,21
                    ],
                    [
                        9,10,56,23,43,23,90,17,110,76,228,234,146,18,19,21
                    ]
                ], 
                outputs: []
            }
        );
        this.ruleFunction.push(null);
        this.byteFunction.push(null);
        this.requiredOutputsFunction.push(this.getReverseParamsRequiredOutputs);

        this.scoreList.push(
            {rule: "Reverse Params Triplets", ruleId: 90,
                retain: false, skip: false, 
                score: 0, completionRound: -1, max: 5, startRoundNum: 800,
                outBlockStart: 0, outBlockLen: 16,
                inBlockStart: 0, inBlockLen: 16,
                highIC: 16 * 10 + learnCodeAllowance,
                highIP: 90,
                sampleIn: [[87,64,54,12,67,43,109,85,205,173,86,94,17,19,18,57,59,81]],
                sampleOut:[],
                paramsIn: [
                    [
                        1,5,6,9,18,90,49,57,86,178,202,85,54,72,19,21,54,57
                    ],
                    [
                        9,10,56,23,43,23,90,17,110,76,228,234,146,18,19,21,23,30
                    ]
                ], 
                outputs: []
            }
        );
        this.ruleFunction.push(null);
        this.byteFunction.push(null);
        this.requiredOutputsFunction.push(this.getReverseParamTripletsRequiredOutputs);

        this.scoreList.push(
            {rule: "Get Numbers Greater than First", ruleId: 76,
                retain: false, skip: false, 
                score: 0, completionRound: -1, max: 5, startRoundNum: 800,
                outBlockStart: 0, outBlockLen: 16,
                inBlockStart: 0, inBlockLen: 32,
                insDistribution: [
                    {
                        ins: "CMP A, B",
                        countOpt: 1,
                        scanStart: 30,
                        scanEnd: 100
                    },
                    {
                        ins: "JRC",
                        countOpt: 1,
                        scanStart: 30,
                        scanEnd: 100
                    }
                ],
                highIC: 16 * 20 + learnCodeAllowance,
                highIP: 90,
                sampleIn: [
                    [
                        60,49,87,90,14,17,21,34,57,86,98,87,119,212,81,43,
                        81,83,25,22,34,78,92,24,19,18,90,105,177,14,17,15,99
                    ]
                ],
                sampleOut: [],
                paramsIn: [
                    [
                        45,20,15,11,96,3,8,200,128,255,27,29,47,52,16,55,
                        22,108,106,55,119,118,120,121,101,124,16,27,30,25,24,23
                    ],
                    [
                        32,22,43,67,69,81,72,186,215,4,9,15,22,38,104,126,
                        16,19,12,105,103,101,24,26,72,201,203,205,22,14,18,1
                    ]
                ],
                outputs: []
            }
        );
        this.ruleFunction.push(null);
        this.byteFunction.push(null);
        this.requiredOutputsFunction.push(this.getNumbersGreaterThanFirstRequiredOutputs);

        this.scoreList.push(
            {rule: "Get Numbers Less than First", ruleId: 77,
                retain: false, skip: false, 
                score: 0, completionRound: -1, max: 5, startRoundNum: 800,
                outBlockStart: 0, outBlockLen: 16,
                inBlockStart: 0, inBlockLen: 32,
                insDistribution: [
                    {
                        ins: "CMP A, B",
                        countOpt: 1,
                        scanStart: 0,
                        scanEnd: 90
                    }
                ],
                highIC: 16 * 20 + learnCodeAllowance,
                highIP: 90,
                sampleIn: [
                    [
                        60,49,87,90,14,17,21,34,57,86,98,87,119,212,81,43,
                        1,3,25,22,34,78,92,24,19,18,90,105,177,79,17,15,99
                    ]
                ],
                sampleOut: [],
                paramsIn: [
                    [
                        45,20,15,11,96,3,8,200,128,255,27,29,47,52,16,55,
                        22,108,40,55,119,118,120,43,101,124,16,27,30,25,24,23
                    ],
                    [
                        32,22,43,67,9,8,72,186,215,4,9,15,22,38,104,126,
                        16,19,12,105,103,101,24,26,72,201,203,205,22,14,18,1
                    ]
                ],
                outputs: []
            }
        );
        this.ruleFunction.push(null);
        this.byteFunction.push(null);
        this.requiredOutputsFunction.push(this.getNumbersLessThanFirstRequiredOutputs);

        this.scoreList.push(
            {rule: "Get Numbers Between First Two", ruleId: 78,
                retain: false, skip: false, 
                score: 0, completionRound: -1, max: 5, startRoundNum: 800,
                outBlockStart: 0, outBlockLen: 16,
                inBlockStart: 0, inBlockLen: 32,
                insDistribution: [
                    {
                        ins: "CMP A, B",
                        countOpt: 2,
                        scanStart: 0,
                        scanEnd: 90
                    },
                    {
                        ins: "JRC",
                        countOpt: 1, 
                        scanStart: 0,
                        scanEnd: 90
                    },
                    {
                        ins: "JRZ",
                        countOpt: 2,
                        scanStart: 0,
                        scanEnd: 90
                    },
                    {
                        ins: "JRNC",
                        countOpt: 1,
                        scanStart: 0,
                        scanEnd: 90
                    }
                ],
                highIC: 16 * 24 + learnCodeAllowance,
                highIP: 90,
                sampleIn: [
                    [
                        40,60,87,90,52,17,21,34,57,45,98,47,119,54,81,45,
                        1,3,58,59,48,78,92,42,41,18,59,51,41,79,44,46,99
                    ]
                ],
                sampleOut: [],
                paramsIn: [
                    [
                        20,50,25,11,37,3,45,200,128,36,45,29,47,52,16,48,
                        22,108,40,55,42,44,37,43,101,124,16,27,30,250,240,18
                    ],
                    [
                        50,90,53,67,9,8,72,186,215,76,77,80,22,38,62,64,
                        16,19,12,105,75,73,24,64,72,51,203,205,62,67,18,69
                    ]
                ],
                outputs: []
            }
        );
        this.ruleFunction.push(null);
        this.byteFunction.push(null);
        this.requiredOutputsFunction.push(this.getNumbersBetweenFirstTwoRequiredOutputs);

        this.scoreList.push(
            {rule: "Extract Even Numbers", ruleId: 74,
                retain: false, skip: false, 
                score: 0, completionRound: -1, max: 5, startRoundNum: 800,
                outBlockStart: 0, outBlockLen: 16,
                inBlockStart: 0, inBlockLen: 32,
                highIC: 10 * 9 * 16 + learnCodeAllowance,
                highIP: 80,
                sampleIn: [
                    [
                        7,49,87,90,14,17,21,34,57,86,98,87,119,212,81,43,
                        81,83,25,22,34,78,92,24,19,18,10,8,12,14,17,15,99
                    ]
                ],
                sampleOut: [],
                paramsIn: [
                    [
                        5,20,15,11,96,3,8,200,128,255,27,29,31,14,16,21,
                        22,108,106,55,119,118,120,121,101,124,16,97,80,60,97,81
                    ],
                    [
                        9,22,43,67,69,81,72,186,215,4,9,15,22,38,104,126,
                        16,19,106,105,103,101,84,86,72,201,203,205,22,44,48,1
                    ]
                ],
                outputs: []
            }
        );
        this.ruleFunction.push(null);
        this.byteFunction.push(null);
        this.requiredOutputsFunction.push(this.getExtractEvenNumbersRequiredOutputs);

        this.scoreList.push(
            {rule: "Extract Odd Numbers", ruleId: 75,
                retain: false, skip: false, 
                score: 0, completionRound: -1, max: 5, startRoundNum: 800,
                outBlockStart: 0, outBlockLen: 32,
                inBlockStart: 0, inBlockLen: 16,
                highIC: 10 * 9 * 16 + learnCodeAllowance,
                highIP: 90,
                sampleIn: [
                    [
                        7,49,87,90,14,17,21,34,57,86,98,87,119,212,81,43,
                        81,83,25,22,34,78,92,24,19,18,10,8,12,14,17,15,99
                    ]
                ],
                sampleOut: [],
                paramsIn: [
                    [
                        5,20,15,11,96,3,8,200,128,255,27,29,31,14,16,21,
                        22,108,106,55,119,118,120,121,101,124,16,97,80,60,97,81
                    ],
                    [
                        9,22,43,67,69,81,72,186,215,4,9,15,22,38,104,126,
                        16,19,106,105,103,101,84,86,72,201,203,205,22,44,48,1
                    ]
                ],
                outputs: []
            }
        );
        this.ruleFunction.push(null);
        this.byteFunction.push(null);
        this.requiredOutputsFunction.push(this.getExtractOddNumbersRequiredOutputs);

        this.scoreList.push(
            {rule: "Greater of Adjacent Params", ruleId: 25,
                retain: false, skip: false, 
                excludeHelperRules: [67],
                score: 0, completionRound: -1, max: 5, startRoundNum: 800,
                outBlockStart: 0, outBlockLen: 16,
                inBlockStart: 0, inBlockLen: 32,
                highIC: 16 * 12 + learnCodeAllowance,
                highIP: 90,
                sampleIn: [[
                    37,17,86,86,85,32,64,17,90,110,87,65,87,88,109,110,
                    43,87,65,76,94,83,52,18,91,111,86,83,87,19,106,201
                ]],
                sampleOut: [],
                paramsIn: [
                    [
                        32,12,56,70,74,56,81,3,74,45,89,105,96,87,109,82,
                        21,90,87,67,109,204,45,78,91,87,86,4,41,24,17,3
                    ],
                    [
                        32,89,64,43,64,76,4,6,90,80,3,97,101,87,4,76,
                        87,15,85,43,34,16,76,8,87,105,98,220,76,5,87,3
                    ]
                ],
                outputs: []
            }
        );
        this.ruleFunction.push(this.greaterOfAdjacentParams);
        this.byteFunction.push(this.byteGreaterOfAdjacentParams);
        this.requiredOutputsFunction.push(this.getGreaterOfAdjacentParamsRequiredOutputs);

        this.scoreList.push(
            {rule: "Greater of Three", ruleId: 66,
                retain: false, skip: false, 
                excludeHelperRules: [67],
                score: 0, completionRound: -1, max: 5, startRoundNum: 800,
                outBlockStart: 0, outBlockLen: 8,
                inBlockStart: 0, inBlockLen: 24,
                highIC: 8 * 18 * 12 + learnCodeAllowance,
                highIP: 120,
                sampleIn: [[
                    37,17,86,86,85,32,64,17,90,110,87,65,87,88,109,110,
                    43,87,65,76,94,83,52,18
                ]],
                sampleOut: [],
                paramsIn: [
                    [
                        32,12,56,70,74,56,81,3,74,45,89,105,96,87,109,82,
                        21,90,87,67,109,204,45,78
                    ],
                    [
                        32,89,64,43,64,76,4,6,90,80,3,97,101,87,4,76,
                        87,15,85,43,34,16,76,8
                    ]
                ],
                outputs: []
            }
        );
        this.ruleFunction.push(null);
        this.byteFunction.push(null);
        this.requiredOutputsFunction.push(this.getGreaterOfThreeRequiredOutputs);

        this.scoreList.push(
            {rule: "Sort Adjacent Params", ruleId: 26,
                retain: false, skip: false, 
                score: 0, completionRound: -1, max: 10, startRoundNum: 800,
                outBlockStart: 0, outBlockLen: 16,
                inBlockStart: 0, inBlockLen: 16,
                highIC: 16 * 15 * 16 + learnCodeAllowance,
                highIP: 120,
                sampleIn: [[17,4,67,98,19,30,11,17,21,29,89,93,12,11,74,17]],
                sampleOut: [],
                paramsIn: [
                    [
                        45,3,2,56,45,6,8,9,98,109,46,15,124,45,23,16
                    ],
                    [
                        2,1,7,9,18,23,201,222,206,195,87,43,23,45,43,42
                    ]
                ],
                outputs: []
            }
        );
        this.ruleFunction.push(this.sortAdjacentParams);
        this.byteFunction.push(this.byteSortAdjacentParams);
        this.requiredOutputsFunction.push(this.getSortAdjacentParamsRequiredOutputs);

        this.scoreList.push(
            {rule: "Find Numbers", ruleId: 72,
                retain: false, skip: false, 
                score: 0, completionRound: -1, max: 10, startRoundNum: 800,
                outBlockStart: 0, outBlockLen: 16,
                inBlockStart: 0, inBlockLen: 32,
                insDistribution: [
                    {
                        ins: "CMP A, B",
                        countOpt: 1,
                        scanStart: 0,
                        scanEnd: 90
                    }
                ],
                highIC: 16 * 15 + learnCodeAllowance,
                highIP: 90,
                sampleIn: [
                    [
                        17,4,67,98,19,30,11,27,21,29,89,93,12,11,74,38,
                        67,17,93,19,38,12,98,29,11,74,30,89,12,4,27,21
                    ]
                ],
                sampleOut: [],
                paramsIn: [
                    [
                        45,3,2,56,48,6,8,9,98,109,46,15,124,47,23,16,
                        56,109,3,8,45,9,2,47,98,15,46,124,23,16,48,6
                    ],
                    [
                        2,1,7,9,18,23,201,222,206,195,87,47,25,45,43,42,
                        45,206,87,9,43,2,42,195,222,1,201,7,18,23,25,47
                    ]
                ],
                outputs: []
            }
        );
        this.ruleFunction.push(null);
        this.byteFunction.push(null);
        this.requiredOutputsFunction.push(this.getFindNumbersRequiredOutputs);

        this.scoreList.push(
            {rule: "Find Number Triplets", ruleId: 73,
                retain: false, skip: false, 
                score: 0, completionRound: -1, max: 10, startRoundNum: 800,
                outBlockStart: 0, outBlockLen: 8,
                inBlockStart: 0, inBlockLen: 48,
                highIC: 8 * 18 * 5 + learnCodeAllowance,
                highIP: 110,
                sampleIn: [
                    [
                        17,4,67, 98,19,30, 11,27,21, 29,89,93, 12,11,74, 38,67,17, 93,19,38, 12,98,29,
                        93,19,38, 11,27,21, 38,67,17, 12,98,29, 17,4,67, 12,11,74, 98,19,30, 29,89,93
                    ]
                ],
                sampleOut: [],
                paramsIn: [
                    [
                        45,3,2, 56,48,6, 8,9,98, 109,46,15, 124,47,23, 16,56,109, 3,8,45, 9,2,47,
                        109,46,15, 3,8,45, 56,48,6, 45,3,2, 9,2,47, 16,56,109, 124,47,23, 8,9,98
                    ],
                    [
                        2,1,7, 9,18,23, 201,222,206, 195,87,47, 25,45,43, 42,45,206, 87,9,43, 2,42,195,
                        25,45,43, 2,42,195, 2,1,7, 195,87,47, 9,18,23, 87,9,43, 42,45,206, 201,222,206
                    ]
                ],
                outputs: []
            }
        );
        this.ruleFunction.push(null);
        this.byteFunction.push(null);
        this.requiredOutputsFunction.push(this.getFindNumberTripletsRequiredOutputs);

        this.scoreList.push(
            {rule: "Sort Triplets", ruleId: 65,
                retain: false, skip: false, 
                score: 0, displayGroupBy: 3, completionRound: -1, 
                max: 10, startRoundNum: 800,
                outBlockStart: 0, outBlockLen: 18,
                inBlockStart: 0, inBlockLen: 18,
                insDistribution: [
                    {
                        ins: "CMP A, B",
                        countOpt: 2,
                        scanStart: 5,
                        scanEnd: 120
                    },
                    {
                        ins: "JRNC",
                        countOpt: 2,
                        scanStart: 5,
                        scanEnd: 120
                    },
                    {
                        ins: "JRC",
                        countOpt: 1,
                        scanStart: 5,
                        scanEnd: 120
                    }
                ],
                highIC: 16 * 15 * 8 + learnCodeAllowance,
                highIP: 120,
                sampleIn: [[17,4,67,98,19,30,11,17,21,29,89,93,12,11,74,17,21,9]],
                sampleOut: [],
                paramsIn: [
                    [
                        45,3,2,56,45,6,8,9,98,109,46,15,124,45,23,16,18,4
                    ],
                    [
                        2,1,7,9,18,23,201,222,206,195,87,43,23,45,43,42,1,5
                    ]
                ],
                outputs: []
            }
        );
        this.ruleFunction.push(null);
        this.byteFunction.push(null);
        this.requiredOutputsFunction.push(this.getSortTripletsRequiredOutputs);

        this.scoreList.push(
            {rule: "Sort Params", ruleId: 64,
                retain: false, skip: false, 
                score: 0, completionRound: -1, max: 5, passScore: 0.8, startRoundNum: 800,
                outBlockStart: 0, outBlockLen: 16,
                inBlockStart: 0, inBlockLen: 16,
                highIC: 16 * 15 * 8 + learnCodeAllowance,
                highIP: 120,
                sampleIn: [[45,46,12,19,164,84,23,17,96,98,99,12,10,11,13,14]],
                sampleOut: [],
                paramsIn: [
                    [
                        45,3,2,56,45,6,8,9,98,109,46,15,124,45,23,16
                    ],
                    [
                        2,1,7,9,18,23,201,222,206,195,87,43,23,45,43,42
                    ]
                ],
                outputs: []
            }
        );
        this.ruleFunction.push(null);
        this.byteFunction.push(null);
        this.requiredOutputsFunction.push(this.getSortParamsRequiredOutputs);

        this.scoreList.push(
            {rule: "And Adjacent Params", ruleId: 87,
                retain: false, skip: false, 
                excludeHelperRules: [67],
                score: 0, completionRound: -1, max: 5, startRoundNum: 800,
                outBlockStart: 0, outBlockLen: 16,
                inBlockStart: 0, inBlockLen: 32,
                highIC: 16 * 9 + learnCodeAllowance,
                highIP: 90,
                sampleIn: [[
                    4,5,8,9,90,93,103,12,76,77,89,87,54,12,18,21,
                    4,3,92,119,76,87,16,15,97,17,3,5,8,7,11,12,
                ]],
                sampleOut: [],
                paramsIn: [
                    [
                        1,3,7,5,19,10,11,15,54,23,17,16,101,13,230,40,
                        23,27,56,78,32,49,15,201,10,197,7,18,21,23,45,46
                    ],
                    [
                        4,9,12,17,15,18,78,4,92,76,89,100,220,30,45,96,
                        5,6,7,11,90,8,87,6,89,92,240,20,65,76,89,88
                    ]
                ],
                outputs: []
            }
        );
        this.ruleFunction.push(null);
        this.byteFunction.push(null);
        this.requiredOutputsFunction.push(this.getAndAdjacentParamsRequiredOutputs);

        this.scoreList.push(
            {rule: "Or Adjacent Params", ruleId: 88,
                retain: false, skip: false, 
                excludeHelperRules: [67],
                score: 0, completionRound: -1, max: 5, startRoundNum: 800,
                outBlockStart: 0, outBlockLen: 16,
                inBlockStart: 0, inBlockLen: 32,
                highIC: 16 * 9 + learnCodeAllowance,
                highIP: 90,
                sampleIn: [[
                    4,5,8,9,97,93,203,12,76,77,89,19,54,12,91,21,
                    4,3,92,121,76,87,16,15,99,17,3,5,8,9,11,12,
                ]],
                sampleOut: [],
                paramsIn: [
                    [
                        5,3,7,5,19,10,11,17,54,23,17,17,101,13,240,40,
                        23,27,56,78,32,52,15,201,10,197,7,18,29,23,47,46
                    ],
                    [
                        1,9,12,19,15,18,78,4,93,76,89,105,220,30,45,96,
                        5,6,71,11,90,8,87,6,89,93,240,20,65,76,89,88
                    ]
                ],
                outputs: []
            }
        );
        this.ruleFunction.push(null);
        this.byteFunction.push(null);
        this.requiredOutputsFunction.push(this.getOrAdjacentParamsRequiredOutputs);

        this.scoreList.push(
            {rule: "Add Adjacent Params", ruleId: 27,
                retain: false, skip: false, 
                excludeHelperRules: [67],
                score: 0, completionRound: -1, max: 5, startRoundNum: 800,
                outBlockStart: 0, outBlockLen: 16,
                inBlockStart: 0, inBlockLen: 32,
                highIC: 16 * 9 + learnCodeAllowance,
                highIP: 90,
                sampleIn: [[
                    4,5,8,9,90,91,103,12,76,76,87,87,54,12,17,19,
                    4,3,90,109,76,87,16,15,97,17,3,3,8,7,11,12,
                ]],
                sampleOut: [],
                paramsIn: [
                    [
                        1,3,4,5,19,10,11,12,54,23,17,16,101,12,230,40,
                        23,25,56,78,32,45,15,201,10,197,6,18,21,23,45,46
                    ],
                    [
                        4,9,12,15,15,18,78,4,98,76,89,100,220,30,43,96,
                        5,6,7,8,90,8,87,6,89,91,240,20,65,76,87,88
                    ]
                ],
                outputs: []
            }
        );
        this.ruleFunction.push(this.addAdjacentParams);
        this.byteFunction.push(this.byteAddAdjacentParams);
        this.requiredOutputsFunction.push(this.getAddAdjacentParamsRequiredOutputs);

        this.scoreList.push(
            {rule: "Subtract Adjacent Params", ruleId: 28,
                retain: false, skip: false, 
                excludeHelperRules: [67],
                score: 0, completionRound: -1, max: 5, startRoundNum: 800,
                outBlockStart: 0, outBlockLen: 16,
                inBlockStart: 0, inBlockLen: 32,
                highIC: 16 * 9 + learnCodeAllowance,
                highIP: 90,
                sampleIn: [[
                    8,9,87,43,54,25,23,13,8,9,78,76,87,14,100,10,
                    76,65,87,85,85,87,54,17,15,8,9,6,7,7,19,12
                ]],
                sampleOut: [],
                paramsIn: [
                    [
                        5,2, 10,8, 49,23, 56,43, 76,25, 105,54, 43,29, 65,24,
                        6,4, 10,11, 40,80, 54,52, 30,15, 43,21, 116,94, 23,21
                    ],
                    [
                        6,9, 7,6, 91,54, 150,64, 250,123, 54,54, 45,21, 43,32,
                        5,6, 8,7, 54,32, 76,28, 185,110, 43,39, 76,23, 65,28
                    ]
                ],
                outputs: []
            }
        );
        this.ruleFunction.push(this.subtractAdjacentParams);
        this.byteFunction.push(this.byteSubtractAdjacentParams);
        this.requiredOutputsFunction.push(this.getSubtractAdjacentParamsRequiredOutputs);

        this.scoreList.push(
            {rule: "Multiply Adjacent Params", ruleId: 29, 
                retain: false, skip: false, 
                excludeHelperRules: [67],
                score: 0, completionRound: -1, max: 5, startRoundNum: 800, 
                outBlockStart: 0, outBlockLen: 16, 
                inBlockStart: 0, inBlockLen: 32,
                insDistribution: [
                    {
                        ins: "ADD A, B",
                        countOpt: 1,
                        scanStart: 5,
                        scanEnd: 110
                    },
                    {
                        ins: "SWP A, B",
                        countOpt: 1,
                        scanStart: 5,
                        scanEnd: 110
                    }
                ],
                highIC: 16 * 18 * 20 + learnCodeAllowance,
                highIP: 110,
                sampleIn: [[
                    3,2,4,5,6,4,89,2,86,3,86,2,12,2,13,3,
                    43,3,32,5,76,2,19,6,21,4,45,3,16,0,17,1
                ]],
                sampleOut: [],
                paramsIn: [
                    [
                        2,3, 4,5, 9,10, 8,5, 18,10, 20,20, 32,4, 63,3,
                        4,3, 33,3, 43,5, 16,12, 13,10, 32,6, 100,3, 62,3
                    ],
                    [
                        7,6, 5,4, 3,4, 5,18, 7,22, 19,8, 18,9, 24,5,
                        6,5, 9,43, 7,65, 32,3, 30,5, 34,4, 28,7, 13,3
                    ]
                ],
                outputs: []
            }
        );
        this.ruleFunction.push(this.multiplyAdjacentParams);
        this.byteFunction.push(this.byteMultiplyParams);
        this.requiredOutputsFunction.push(this.getMultiplyAdjacentParamsRequiredOutputs);

        this.scoreList.push(
            {rule: "Divide Adjacent Params", ruleId: 30, 
                retain: false, skip: false, 
                excludeHelperRules: [67],
                score: 0, completionRound: -1, max: 5, startRoundNum: 800, 
                outBlockStart: 0, outBlockLen: 16, inBlockStart: 0, 
                inBlockLen: 32,
                highIC: 16 * 18 * 25 + learnCodeAllowance,
                highIP: 110,
                sampleIn: [[
                    56,3,32,4,9,0,8,2,76,21,63,9,87,7,140,20,
                    43,8,40,8,76,17,78,9,144,12,46,19,82,2,14,7
                ]],
                sampleOut: [],
                paramsIn: [
                    [
                        10,2,  20,0, 36,9, 3,2,   12,2, 15,5,  60,12, 47,3,
                        200,3, 3,6,  7,9,  120,7, 17,4, 18,11, 96,17, 27,3
                    ],
                    [
                        15,7,  18,9, 21,3, 90,5, 17,0, 200,4, 240,12, 190,3,
                        17,11, 64,6, 17,9, 19,7, 24,3, 96,3,  85,4,   180,26 
                    ]
                ],
                outputs: []
            }
        );
        this.ruleFunction.push(this.divideAdjacentParams);
        this.byteFunction.push(this.byteDivideAdjacentParams);
        this.requiredOutputsFunction.push(this.getDivideAdjacentParamsRequiredOutputs);

        this.scoreList.push(
            {rule: "Sum of Three Params", ruleId: 97, 
                retain: false, skip: false, 
                excludeHelperRules: [67],
                score: 0, completionRound: -1, max: 5, startRoundNum: 800, 
                outBlockStart: 0, outBlockLen: 16, inBlockStart: 0, 
                inBlockLen: 48,
                highIC: 16 * 18 * 25 + learnCodeAllowance,
                highIP: 110,
                sampleIn: [[
                    56,3,4, 32,4,11, 9,0,12, 8,2,45, 76,21,100, 63,9,2, 87,7,11, 140,20,5,
                    43,8,15, 40,8,17, 76,17,19, 78,9,21, 144,12,45, 46,19,43, 82,2,1, 14,7,200
                ]],
                sampleOut: [],
                paramsIn: [
                    [
                        10,2,11,  20,0,5, 36,9,45, 3,2,34, 12,2,54, 15,5,73, 60,12,105, 47,3,19,
                        200,3,8, 3,6,9,  7,9,12,  120,7,15, 17,4,25, 18,11,91, 96,17,8, 27,3,11
                    ],
                    [
                        15,7,18, 18,9,27, 21,3,39, 90,5,65, 17,0,72, 200,4,11, 240,12,1, 190,3,29,
                        17,11,45, 64,6,76, 17,9,97, 19,7,14, 24,3,54, 96,3,15,  85,4,17, 180,26,15 
                    ]
                ],
                outputs: []
            }
        );
        this.ruleFunction.push(null);
        this.byteFunction.push(null);
        this.requiredOutputsFunction.push(this.getSumOfThreeRequiredOutputs);

        this.scoreList.push(
            {rule: "Average of Three Params", ruleId: 96, 
                retain: false, skip: false, 
                excludeHelperRules: [67],
                score: 0, completionRound: -1, max: 5, startRoundNum: 800, 
                outBlockStart: 0, outBlockLen: 16, inBlockStart: 0, 
                inBlockLen: 48,
                highIC: 16 * 18 * 25 + learnCodeAllowance,
                highIP: 110,
                sampleIn: [[
                    56,3,32, 4,9,0, 8,2,76, 21,63,9, 87,7,140, 20,100,5, 82,45,30, 17,22,42,
                    43,8,40, 8,76,17, 78,9,144, 12,46,19, 82,2,14, 7,9,13, 61,72,17, 201,190,200
                ]],
                sampleOut: [],
                paramsIn: [
                    [
                        10,2,1,  20,0,15, 36,9,11, 3,2,81, 12,2,23, 15,5,7, 60,12,11, 47,3,9,
                        200,3,3, 3,6,21,  7,9,15, 120,7,200, 17,4,5, 18,11,91, 96,17,30, 27,3,2
                    ],
                    [
                        15,7,9,  18,9,27, 21,3,11, 90,5,15, 17,0,1, 200,4,2, 240,12,220, 190,3,7,
                        17,11,24, 64,6,3, 17,9,7, 19,7,2, 24,3,23, 96,3,13, 85,4,12, 180,26,27 
                    ]
                ],
                outputs: []
            }
        );
        this.ruleFunction.push(null);
        this.byteFunction.push(this.null);
        this.requiredOutputsFunction.push(this.getAveOfThreeRequiredOutputs);

        this.scoreList.push(
            {rule: "Use op to Convert Adjacent Params 1 (=)", ruleId: 57, 
                retain: false, skip: false, 
                excludeHelperRules: [67],
                score: 0, completionRound: -1, displayGroupBy: 3, max: 5, startRoundNum: 800, 
                outBlockStart: 0, outBlockLen: 16, inBlockStart: 0, 
                inBlockLen: 48,
                highIC: 16 * 14 + learnCodeAllowance,
                highIP: 120,
                sampleIn: [[
                    61,7,8, 61,9,7, 61,0,9, 61,2,4, 61,3,11, 61,12,90, 61,10,56, 61,11,16,
                    61,8,19, 61,4,12, 61,13,86, 61,15,45, 61,6,15, 61,5,14, 61,1,65, 61,9,11
                ]],
                sampleOut: [],
                paramsIn: [
                    [
                        61,5,2, 61,2,0, 61,3,20, 61,0,5, 61,4,100, 61,1,25, 61,15,91, 61,10,92,
                        61,6,3, 61,8,5, 61,9,15, 61,7,6, 61,12,45, 61,11,7, 61,14,76, 61,13,25
                    ],
                    [
                        61,9,2,  61,11,0, 61,3,20, 61,5,5, 61,0,100, 61,12,25, 61,13,91, 61,1,92,
                        61,15,3, 61,10,5, 61,14,16, 61,7,7, 61,4,45,  61,2,7,   61,8,76,  61,6,25
                    ]
                ],
                outputs: []
            }
        );
        this.ruleFunction.push(this.paramOperations);
        this.byteFunction.push(this.byteParamOperations);
        this.requiredOutputsFunction.push(this.getParamOperationsRequiredOutputs);

        this.scoreList.push(
            {rule: "Use op to Convert Adjacent Params 2 (+)", ruleId: 58, 
                retain: false, skip: false, 
                excludeHelperRules: [67],
                score: 0, completionRound: -1, displayGroupBy: 3, max: 5, startRoundNum: 800, 
                outBlockStart: 0, outBlockLen: 16, inBlockStart: 0, 
                inBlockLen: 48,
                highIC: 16 * 14 + learnCodeAllowance,
                highIP: 120,
                sampleIn: [[
                    43,7,4, 43,19,18, 43,9,7, 43,4,109, 43,6,89, 43,91,92, 43,7,6, 43,8,9,
                    43,11,18, 43,56,14, 43,17,19, 43,78,105, 43,23,5, 43,27,9, 43,87,3, 43,8,11
                ]],
                sampleOut: [],
                paramsIn: [
                    [
                        43,5,2, 43,2,0, 43,3,20, 43,0,5, 43,4,100, 43,1,25, 43,15,91, 43,10,92,
                        43,6,3, 43,8,5, 43,9,15, 43,7,6, 43,12,45, 43,11,7, 43,14,76, 43,13,25
                    ],
                    [
                        43,9,2,  43,11,0, 43,3,20, 43,5,5, 43,0,100, 43,12,25, 43,13,91, 43,1,92,
                        43,15,3, 43,10,5, 43,9,16, 43,7,7, 43,4,45,  43,2,7,   43,8,76,  43,6,25
                    ]
                ],
                outputs: []
            }
        );
        this.ruleFunction.push(this.paramOperations);
        this.byteFunction.push(this.byteParamOperations);
        this.requiredOutputsFunction.push(this.getParamOperationsRequiredOutputs);

        this.scoreList.push(
            {rule: "Use op to Convert Adjacent Params 3 (-)", ruleId: 59, 
                retain: false, skip: false, 
                excludeHelperRules: [67],
                score: 0, completionRound: -1, displayGroupBy: 3, max: 5, startRoundNum: 800, 
                outBlockStart: 0, outBlockLen: 16, inBlockStart: 0, 
                inBlockLen: 48,
                highIC: 16 * 14 + learnCodeAllowance,
                highIP: 120,
                sampleIn: [[
                    45,9,11, 45,8,2, 45,7,3, 45,9,11, 45,12,10, 45,108,106, 45,87,81, 45,65,32,
                    45,8,7, 45,79,34, 45,87,65, 45,65,32, 45,217,111, 45,89,18, 45,19,11, 45,7,2
                ]],
                sampleOut: [],
                paramsIn: [
                    [
                        45,5,2, 45,2,0, 45,30,20, 45,10,5, 45,114,100, 45,1,2, 45,15,9, 45,10,2,
                        45,6,3, 45,8,5, 45,19,15, 45,70,6, 45,12,10,   45,1,7, 45,14,8, 45,13,2
                    ],
                    [
                        45,9,2,  45,11,0, 45,31,20, 45,5,5, 45,110,100, 45,120,25, 45,136,91, 45,190,92,
                        45,15,3, 45,10,5, 45,49,16, 45,7,7, 45,248,145, 45,20,7,   45,82,76,  45,36,25
                    ]
                ],
                outputs: []
            }
        );
        this.ruleFunction.push(this.paramOperations);
        this.byteFunction.push(this.byteParamOperations);
        this.requiredOutputsFunction.push(this.getParamOperationsRequiredOutputs);

        // Multiply
        this.scoreList.push(
            {rule: "Use op to Convert Adjacent Params 4 (*)", ruleId: 60, 
                retain: false, skip: false, 
                excludeHelperRules: [67],
                score: 0, completionRound: -1, displayGroupBy:3, 
                max: 5, startRoundNum: 800, 
                outBlockStart: 0, outBlockLen: 16, inBlockStart: 0, 
                inBlockLen: 48,
                highIC: 16 * 14 * 16 + learnCodeAllowance,
                highIP: 130,
                sampleIn: [[
                    42,2,3, 42,4,5, 42,0,9, 42,11,10, 42,21,4, 42,45,5, 42,48,6, 42,3,5,
                    42,6,5, 42,11,9, 42,90,2, 42,65,3, 42,6,24, 42,8,7, 42,9,10, 42,8,4
                ]],
                sampleOut: [],
                paramsIn: [
                    [
                        42,5,2, 42,2,0, 42,3,20, 42,3,5, 42,4,10,  42,1,25, 42,15,12, 42,10,9,
                        42,6,3, 42,8,5, 42,9,15, 42,7,6, 42,12,45, 42,11,7, 42,14,7,  42,13,16
                    ],
                    [
                        42,9,2,  42,11,0, 42,3,20, 42,5,5, 42,10,10, 42,3,25, 42,13,9, 42,3,9,
                        42,11,3, 42,10,5, 42,9,16, 42,7,7, 42,3,45,  42,2,7,  42,3,76, 42,6,25
                    ]
                ],
                outputs: []
            }
        );
        this.ruleFunction.push(this.paramOperations);
        this.byteFunction.push(this.byteParamOperations);
        this.requiredOutputsFunction.push(this.getParamOperationsRequiredOutputs);

        // Modulo
        this.scoreList.push(
            {rule: "Use op to Convert Adjacent Params 5 (%)", ruleId: 61, 
                retain: false, skip: false, 
                excludeHelperRules: [67],
                score: 0, completionRound: -1, displayGroupBy: 3,
                max: 5, startRoundNum: 800, 
                outBlockStart: 0, outBlockLen: 16, inBlockStart: 0, 
                inBlockLen: 60,
                insDistribution: [
                    {
                        ins: "SUB A, B",
                        countOpt: 1,
                        scanStart: 8,
                        scanEnd: 130
                    },
                    {
                        ins: "CMP A, B",
                        countOpt: 1,
                        scanStart: 8,
                        scanEnd: 130
                    }
                ],
                highIC: 16 * 14 * 16 + learnCodeAllowance,
                highIP: 130,
                sampleIn: [[
                    37,3,2, 37,9,3, 37,0,7, 37,96,78, 37,80,5, 37,87,17, 37,4,2, 37,18,5,
                    37,56,15, 37,112,16, 37,209,3, 37,76,86, 37,54,7, 37,12,4, 37,16,8, 37,19,21 
                ]],
                sampleOut: [],
                paramsIn: [
                    [
                        37,5,2, 37,2,0, 37,30,7, 37,100,9, 37,40,6, 37,45,25, 37,15,4, 37,108,9,
                        37,62,3, 37,87,5, 37,220,15, 37,96,6, 37,84,23, 37,31,7, 37,18,7, 37,13,5
                    ],
                    [
                        37,9,2, 37,11,0, 37,203,20, 37,5,5, 37,108,10, 37,53,25, 37,8,9, 37,33,9,
                        37,11,3, 37,10,5, 37,93,16, 37,7,7, 37,203,45, 37,29,7, 37,230,76, 37,66,25
                    ]
                ],
                outputs: []
            }
        );
        this.ruleFunction.push(this.paramOperations);
        this.byteFunction.push(this.byteParamOperations);
        this.requiredOutputsFunction.push(this.getParamOperationsRequiredOutputs);

        // Divide
        this.scoreList.push(
            {rule: "Use op to Convert Adjacent Params 6 (/)", ruleId: 62, 
                retain: false, skip: false, 
                excludeHelperRules: [67],
                score: 0, completionRound: -1, displayGroupBy: 3,
                max: 5, startRoundNum: 800, 
                outBlockStart: 0, outBlockLen: 16, inBlockStart: 0, 
                inBlockLen: 48,
                highIC: 16 * 14 * 16 + learnCodeAllowance,
                highIP: 130,
                sampleIn: [[
                    47,6,3, 47,9,0, 47,81,9, 47,90,10, 47,18,5, 47,27,3, 47,76,18, 47,87,8,
                    47,9,4, 47,101,10, 47,90,8, 47,21,25, 47,76,4, 47,24,6, 47,42,7, 47,87,9
                ]],
                sampleOut: [],
                paramsIn: [
                    [
                        47,5,2, 47,2,0, 47,30,7, 47,100,9, 47,40,6, 47,45,25, 47,15,4, 47,108,9,
                        47,62,3, 47,87,5, 47,220,15, 47,96,6, 47,84,23, 47,31,7, 47,18,7, 47,13,5
                    ],
                    [
                        47,9,2, 47,11,0, 47,203,20, 47,5,5, 47,108,10, 47,53,25, 47,8,9, 47,33,9,
                        47,11,3, 47,10,5, 47,93,16, 47,7,7, 47,203,45, 47,29,7, 47,230,76, 47,66,25
                    ]
                ],
                outputs: []
            }
        );
        this.ruleFunction.push(this.paramOperations);
        this.byteFunction.push(this.byteParamOperations);
        this.requiredOutputsFunction.push(this.getParamOperationsRequiredOutputs);

        this.scoreList.push(
            {rule: "Use op to Convert Adjacent Params 7", ruleId: 54, 
                retain: false, skip: false, 
                excludeHelperRules: [67],
                score: 0, completionRound: -1, displayGroupBy: 3,
                max: 5, startRoundNum: 800, 
                outBlockStart: 0, outBlockLen: 16, inBlockStart: 0, 
                inBlockLen: 48,
                highIC: 16 * 20 + learnCodeAllowance,
                highIP: 140,
                sampleIn: [[
                    61,5,2, 61,7,9, 61,2,3, 61,6,8, 61,0,19, 61,1,89, 61,4,7, 61,3,97,
                    43,17,9, 43,2,3, 43,5,6, 43,8,9, 43,21,45, 43,108,109, 43,87,15, 43,89,10
                ]],
                sampleOut: [],
                paramsIn: [
                    [
                        61,5,2,   61,2,0, 61,3,20, 61,0,5,   61,4,100, 61,1,25,
                        43,200,3, 43,5,6, 43,7,9,  43,7,100, 43,17,4,  43,18,11, 43,17,29, 43,27,3, 43,101,2, 43,65,76
                    ],
                    [
                        61,4,2,   61,1,0,  61,2,20, 61,0,7,    61,3,100, 61,5,25,  61,6,19,
                        43,204,3, 43,5,61, 43,71,9, 43,11,100, 43,18,4,  43,21,11, 43,19,29, 43,127,3, 43,111,2 
                    ]
                ],
                outputs: []
            }
        );
        this.ruleFunction.push(this.paramOperations);
        this.byteFunction.push(this.byteParamOperations);
        this.requiredOutputsFunction.push(this.getParamOperationsRequiredOutputs);

        this.scoreList.push(
            {rule: "Use op to Convert Adjacent Params 8", ruleId: 55, 
                retain: false, skip: false, 
                excludeHelperRules: [67],
                score: 0, completionRound: -1, displayGroupBy: 3,
                max: 5, startRoundNum: 800, 
                outBlockStart: 0, outBlockLen: 16, inBlockStart: 0, 
                inBlockLen: 48,
                highIC: 16 * 18 + learnCodeAllowance,
                highIP: 140,
                sampleIn: [[
                    43,200,10, 43,26,87, 43,18,9, 43,98,54, 43,76,87,
                    45,100,10, 45,4,3, 45,9,2, 45,96,4, 45,97,13, 45,73,63, 45,90,17, 45,91,81, 45,97,11, 45,96,10, 45,13,12
                ]],
                sampleOut: [],
                paramsIn: [
                    [
                        43,200,3, 43,5,6, 43,7,9,  43,7,100, 43,17,4,  43,18,11, 43,17,29, 43,27,3, 43,101,2, 43,65,76,
                        45,50,3, 45,51,6, 45,16,9, 45,11,15, 45,17,4,  45,212,11
                    ],
                    [
                        45,200,3, 45,5,6, 45,9,7,  45,100,9, 45,17,4,  45,18,11, 
                        43,50,3, 43,51,6, 43,16,9, 43,11,15, 43,17,4,  43,212,11, 43,11,17, 43,9,16, 43,89,11, 43,96,101
                    ]
                ],
                outputs: []
            }
        );
        this.ruleFunction.push(this.paramOperations);
        this.byteFunction.push(this.byteParamOperations);
        this.requiredOutputsFunction.push(this.getParamOperationsRequiredOutputs);

        this.scoreList.push(
            {rule: "Use op to Convert Adjacent Params 9", ruleId: 56, 
                retain: false, skip: false, 
                excludeHelperRules: [67],
                score: 0, completionRound: -1, displayGroupBy: 3,
                max: 5, startRoundNum: 800, 
                outBlockStart: 0, outBlockLen: 16, inBlockStart: 0, 
                inBlockLen: 48,
                highIC: 16 * 25 + learnCodeAllowance,
                highIP: 140,
                sampleIn: [[
                    43,3,4, 43,64,6, 43,76,9, 43,87,10, 43,12,11, 43,65,4,
                    42,65,5, 42,32,3, 42,10,8, 42,15,6, 42,17,15, 42,42,4, 42,6,7, 42,5,7, 42,98,2, 42,23,6
                ]],
                sampleOut: [],
                paramsIn: [
                    [
                        43,200,3, 43,5,6, 43,7,9,  43,7,100, 43,17,4,  43,18,11, 43,17,29, 43,27,3, 43,101,2, 43,65,76,
                        42,50,3, 42,11,6, 42,9,5,  42,11,10, 42,17,4,  42,21,7
                    ],
                    [
                        43,200,3, 43,5,6, 43,9,7,  43,100,9, 43,17,4,  43,18,11, 
                        42,50,3, 42,21,6, 42,16,9, 42,11,12, 42,17,4,  42,50,5,  42,40,4, 42,9,8, 42,5,11, 42,96,2
                    ]
                ],
                outputs: []
            }
        );
        this.ruleFunction.push(this.paramOperations);
        this.byteFunction.push(this.byteParamOperations);
        this.requiredOutputsFunction.push(this.getParamOperationsRequiredOutputs);

        // May need to break this into separate rules
        this.scoreList.push(
            {rule: "Use op to Convert Adjacent Params 10", ruleId: 31,
                retain: false, skip: false, 
                excludeHelperRules: [67],
                score: 0, completionRound: -1, displayGroupBy: 3,
                max: 20, startRoundNum: 800, 
                outBlockStart: 0, outBlockLen: 32,
                inBlockStart: 0, inBlockLen: 96,
                highIC: 5000 + learnCodeAllowance,
                highIP: 190,
                sampleIn: [[
                    61,4,5, 61,6,8, 61,5,10, 61,0,9, 61,3,19, 61,2,18, 61,1,24,
                    43,5,1, 43,9,10, 43,11,12, 43,90,91, 43,81,5, 43,76,5, 43,87,18, 43,19,11, 43,18,15,
                    45,8,3, 45,6,5, 45,4,6, 45,11,9, 45,90,61, 45,97,13,
                    42,2,3, 42,4,4, 42,11,11, 42,19,10, 42,25,11, 42,25,10, 42,67,4, 42,15,9, 42,17,3, 42,18,1
                ]],
                sampleOut: [],
                paramsIn: [
                    [
                        61,2,5,61,5,3,61,0,4,61,4,7,61,1,12,61,3,20,61,6,95, // 0:23 = a b
                        43,3,2,43,4,5,43,12,13,43,9,11,43,10,10,43,15,8,43,100,50,43,75,72,43,9,11, // 24:47 +
                        45,9,4,45,10,2,45,100,22,45,85,13,45,3,4,45,19,2, // 48:71 -
                        42,3,4,42,5,7,42,9,10,42,12,12,42,8,15,42,20,9,42,7,7,42,11,7,42,4,13,42,6,12 // 72:95 *    
                    ],
                    [
                        61,1,5,61,4,3,61,2,4,61,6,7,61,3,12,61,5,20,61,0,95,61,7,100,61,9,5,61,8,7, // 0:23 = a b
                        43,5,2,43,10,5,43,22,13,43,19,11,43,17,10,43,18,8, // 24:47 +
                        45,19,4,45,17,2,45,107,22,45,87,13,45,3,5,45,21,2,45,209,105, // 48:71 -
                        42,3,5,42,5,9,42,9,11,42,13,13,42,9,15,42,20,3,42,7,8,42,12,7,42,4,2 // 72:95 *
                    ]
                ],
                outputs: []
            }
        );
        this.ruleFunction.push(this.paramOperations);
        this.byteFunction.push(this.byteParamOperations);
        this.requiredOutputsFunction.push(this.getParamOperationsRequiredOutputs);

        this.scoreList.push(
            {rule: "Convert ASCII Numbers 1", ruleId: 32,
                retain: false, skip: false, 
                excludeHelperRules: [67],
                score: 0, completionRound: -1, max: 5, startRoundNum: 800,
                outBlockStart: 0, outBlockLen: 16,
                inBlockStart: 0, inBlockLen: 32,
                highIC: 16 * 10 + learnCodeAllowance,
                highIP: 90,
                ASCIISampleIn: [
                    "1;7;9;3;2;5;7;0;9;8;3;2;4;6;7;8;"
                ],
                sampleIn: [],
                sampleOut: [],
                ASCIIParamsIn: [
                    "5;6;7;0;8;9;3;2;5;4;9;6;2;1;0;9;",
                    "5;7;9;8;2;2;3;0;4;6;5;7;9;8;1;4;"
                ],
                paramsIn: [],
                outputs: []
            }
        );
        this.ruleFunction.push(this.convertASCIINumbers);
        this.byteFunction.push(this.byteConvertASCIINumbers);
        this.requiredOutputsFunction.push(this.getConvertASCIINumbersRequiredOutputs);

        this.scoreList.push(
            {rule: "Convert ASCII Numbers 2", ruleId: 33,
                retain: false, skip: false, 
                excludeHelperRules: [67],
                score: 0, completionRound: -1, displayGroupBy:3, 
                max: 5, startRoundNum: 800,
                outBlockStart: 0, outBlockLen: 16,
                inBlockStart: 0, inBlockLen: 48,
                highIC: 16 * 10 * 2 + learnCodeAllowance,
                highIP: 120,
                ASCIISampleIn: [
                    "12;23;45;56;91;24;10;11;15;47;63;72;25;28;84;57;"
                ],
                sampleIn: [],
                sampleOut: [],
                ASCIIParamsIn: [
                    "33;48;56;17;19;25;10;11;16;98;78;37;42;64;28;72;",
                    "36;17;91;85;83;48;92;18;20;22;75;87;43;57;45;59;"
                ],
                paramsIn: [],
                outputs: []
            }
        );
        this.ruleFunction.push(this.convertASCIINumbers);
        this.byteFunction.push(this.byteConvertASCIINumbers);
        this.requiredOutputsFunction.push(this.getConvertASCIINumbersRequiredOutputs);

        this.scoreList.push(
            {rule: "Convert ASCII Numbers 3", ruleId: 34,
                retain: false, skip: false, 
                excludeHelperRules: [67],
                score: 0, completionRound: -1, max: 5, startRoundNum: 800,
                outBlockStart: 0, outBlockLen: 16,
                inBlockStart: 0, inBlockLen: 64,
                highIC: 16 * 10 * 3 + learnCodeAllowance,
                highIP: 130,
                ASCIISampleIn: [
                    "112;135;201;197;243;217;179;165;143;122;119;107;104;190;221;254;"
                ],
                sampleIn: [],
                sampleOut: [],
                ASCIIParamsIn: [
                    "108;246;225;123;101;100;200;235;154;187;190;136;128;227;215;124;",
                    "109;107;121;189;176;105;100;201;209;230;147;156;159;190;103;122;"
                ],
                paramsIn: [],
                outputs: []
            }
        );
        this.ruleFunction.push(this.convertASCIINumbers);
        this.byteFunction.push(this.byteConvertASCIINumbers);
        this.requiredOutputsFunction.push(this.getConvertASCIINumbersRequiredOutputs);

        this.scoreList.push(
            {rule: "Convert ASCII Numbers 4", ruleId: 35,
                retain: false, skip: false, 
                excludeHelperRules: [67],
                score: 0, completionRound: -1, max: 5, startRoundNum: 800,
                outBlockStart: 0, outBlockLen: 16,
                inBlockStart: 0, inBlockLen: 48,
                highIC: 16 * 10 * 3 + learnCodeAllowance,
                highIP: 150,
                ASCIISampleIn: [
                    "1;12;15;9;71;101;124;213;5;9;8;85;17;11;202;105;"
                ],
                sampleIn: [],
                sampleOut: [],
                ASCIIParamsIn: [
                    "2;14;17;8;73;102;127;214;6;8;9;87;18;19;201;106;",
                    "3;13;16;7;75;109;121;216;2;4;7;88;16;13;200;109;"
                ],
                paramsIn: [],
                outputs: []
            }
        );
        this.ruleFunction.push(this.convertASCIINumbers);
        this.byteFunction.push(this.byteConvertASCIINumbers);
        this.requiredOutputsFunction.push(this.getConvertASCIINumbersRequiredOutputs);

        this.outputScoresItem = 112;
        this.scoreList.push(
            {rule: "Output Scores Equal", ruleId: 63, retain: true, skip: false, 
                score: 0, max: 2, startRoundNum: 0
            }
        );
        this.ruleFunction.push(this.outputScoresEqual);
        this.byteFunction.push(null);
        this.requiredOutputsFunction.push(null);

        this.diffScore = 113;
        this.scoreList.push(
            {rule: "Difference Between Outputs", ruleId: 36, retain: true, skip: false, 
                score: 0, max: 1, startRoundNum: 0
            }
        );
        this.ruleFunction.push(this.scoreOutputDiff);
        this.byteFunction.push(null);
        this.requiredOutputsFunction.push(null);

        this.setSequenceNumbers();

        this.initialiseOutputData();

        let maxScore = 0;
        let maxSequenceNum = 0;
        let index = 0;
        this.ruleRounds = [];
        for (let scoreItem of this.scoreList) {
            if (scoreItem.skip != true) {
                maxScore += scoreItem.max;
            }
            if (scoreItem.sequenceNum > maxSequenceNum) {
                maxSequenceNum = scoreItem.sequenceNum;
            }
            scoreItem.completionRound = -1;
            this.ruleRounds.push({completed: false, start: -1, end: 0, ruleLoopEnd: 0, used: 0});
            ++index;
        }
        this.maxScore = maxScore * 2;
        this.maxRuleSequenceNum = maxSequenceNum;
        this.getInterimMaxScore();

        // End Function
    },

    setSequenceNumbers() {
        // Set the sequence numbers in order of appearance in the definition
        let sequenceNum = 0;
        for (let item of this.scoreList) {
            if (!item.skip) {
                if (item.retain) {
                    item.sequenceNum = 0;
                }
                else {
                    item.sequenceNum = sequenceNum;
                    ++sequenceNum;
                }
            }
            else {
                item.sequenceNum = 0;
            }
        }
    },

    initialiseOutputData() {
        mathFuncs.init();

        for (let i = 0; i < this.scoreList.length; i++) {
            let rule = this.scoreList[i];

            if ("ASCIISampleIn" in rule) {
                rule.sampleIn = this.convertASCIILists(rule.ASCIISampleIn);
            }
            if ("ASCIIParamsIn" in rule) {
                rule.paramsIn = this.convertASCIILists(rule.ASCIIParamsIn);
            }

            if (this.requiredOutputsFunction[i] != null) {
                // Get sample outputs
                let sampleOut = this.requiredOutputsFunction[i](this, this.scoreList[i].sampleIn);
                this.scoreList[i].sampleOut = sampleOut;

                // Get actual outputs
                let outputList = this.requiredOutputsFunction[i](this, this.scoreList[i].paramsIn);
                this.scoreList[i].outputs = outputList;
                if (outputList.length > 1) {
                    let diffOpt = this.getDiffOpt(outputList);
                    this.scoreList[i].diffOpt = diffOpt;
                }
            }
        }
    },

    convertASCIILists(sourceList){
        let outputList = [];
        for (let source of sourceList) {
            let output = [];
            for (let p = 0; p < source.length; p++) {
                let v = source.charCodeAt(p);
                output.push(v);
            }
            outputList.push(output);
        }
        return outputList;
    },

    getDiffOpt(outputs) {
        let aList = outputs[0];
        let bList = outputs[1];

        let count = 0;
        for (let i = 0; i < aList.length; i++) {
            if (i < bList.length) {
                if (aList[i] != bList[i]) ++count;
            }
        }
        return count;
    },

    zeroScores() {
        for (let rule of this.scoreList) {
            rule.score = 0;
        }
    },

    getOutputByteScore(value, address, initialParams, params, outputValues, ruleSequenceNum, roundNum) {
        let totalScore = 0;
        let totalSignificance = 0;
        // For each rule applicable to the address
        let index = 0;
        for (let rule of this.scoreList) {
            if (this.byteFunction[index] != null) {
                if (rule.retain || rule.sequenceNum === ruleSequenceNum) {
                    if (rule.startRoundNum <= roundNum || this.ignoreRounds) {
                        if (address >= rule.outBlockStart && address < rule.outBlockStart + rule.outBlockLen) {
                            let score = this.byteFunction[index](this, rule, value, address, initialParams, params, outputValues);
                            if (isNaN(score)) {
                                console.error("Invalid byte score", score, index);
                            }
                            totalScore = score;
                            totalSignificance = rule.max;
                            break;
                        }
                    }
                }
            }
            ++index;
        }
        return {totalScore: totalScore, totalSignificance: totalSignificance};
        
    },

    getScore: function (bestSetHighScore, bestSetLowScore, instructionSet, memSpace, 
        codeFlags, initialParams, paramsIn, valuesOut, entityOutputs, executionCycle,
        IC, highestIP, sequenceNum, roundNum) {

        // Get the current maximum score
        this.currentMaxScore = this.getCurrentMaxScore(sequenceNum);

        // Reset the sequential rule execution scores
        if (entityOutputs.length === 1) {
            this.executionScores = [];
        }

        let dataParams = {
            instructionSet: instructionSet,
            memSpace: memSpace,
            codeFlags: codeFlags,
            initialParams: initialParams,
            paramsIn: paramsIn,
            valuesOut: valuesOut,
            entityOutputs: entityOutputs,
            executionCycle: executionCycle,
            IC: IC,
            highestIP: highestIP,
            sequenceNum: sequenceNum
        }
        let totalScore = 0;

        let mainRule = this.getRuleFromSequence(sequenceNum);
        let excludeRules = null;
        if ("excludeHelperRules" in mainRule) {
            excludeRules = mainRule.excludeHelperRules;
        }

        for (let i = 0; i < this.scoreList.length; i++) {
            if (!this.scoreList[i].skip) {
                let excludeRule = false;
                if (excludeRules != null) {
                    for (let j = 0; j < excludeRules.length; j++) {
                        if (excludeRules[j] === this.scoreList[i].ruleId) {
                            excludeRule = true;
                            break;
                        }
                    }
                }
                if (!excludeRule && (this.scoreList[i].retain || (this.scoreList[i].sequenceNum === sequenceNum))) {
                    if (this.ignoreRounds || this.scoreList[i].startRoundNum <= roundNum) {
                        let score;
                        if ("outputs" in this.scoreList[i]) {
                            score = this.getOutputComparisonScore(executionCycle, this.scoreList[i].outputs, valuesOut);
                        }
                        else {
                            score = this.ruleFunction[i](this, dataParams, this.scoreList[i]);
                        }
                        if (isNaN(score)) {
                            console.error("getScore: Erroneous Score:", i);
                        }
                        if (!this.scoreList[i].retain) {
                            this.executionScores.push(score);
                        }
                        score *= this.scoreList[i].max;
                        this.scoreList[i].score += score;
                        totalScore += score;
                    }
                }
            }
        }

        this.totalScore = totalScore;
        return {score: this.totalScore, scoreList: this.scoreList};
    },

    getInterimScore(instructionSet, memSpace, 
        codeFlags, initialParams, paramsIn, valuesOut, entityOutputs, 
        executionCycle, IC, highestIP, sequenceNum) 
    {
        let dataParams = {
            instructionSet: instructionSet,
            memSpace: memSpace,
            codeFlags: codeFlags,
            initialParams: initialParams,
            paramsIn: paramsIn,
            valuesOut: valuesOut,
            entityOutputs: entityOutputs,
            executionCycle: executionCycle,
            IC: IC,
            highestIP: highestIP,
            sequenceNum: sequenceNum
        }


        let maxScore = 0;
        let totalScore = 0;
        let i = 0;
        for (let rule of this.scoreList) {
            if (!rule.skip) {
                if ("interim" in rule) {
                    if (rule.interim) {
                        let score = this.ruleFunction[i](this, dataParams, rule);
                        score *= rule.max;
                        maxScore += rule.max;
                        totalScore += score;
                    }
                }
            }
            ++i;
        }

        let index = this.getRuleIndexFromSequence(this.ruleSequenceNum);
        let rule = this.scoreList[index];
        maxScore += rule.max;
        let score = 0;
        if ("outputs" in rule) {
            totalScore += rule.max * this.getOutputComparisonScore(executionCycle, rule.outputs, valuesOut);
        }
        else {
            totalScore += rule.max * this.ruleFunction[index](this, dataParams, rule);
        }

        totalScore = Math.floor((totalScore / maxScore) * 255);
        return totalScore;
    },

    getOutputComparisonScore(executionCycle, ruleOutputs, valuesOut) {
        let ruleOut = ruleOutputs[executionCycle];
        let output = valuesOut;
        let consecutiveCount = 0;
        for (let i = 0; i < ruleOut.length; i++) {
            let a = ruleOut[i];
            let b = output[i];
            if (a === b) {
                ++consecutiveCount;
            }
            else {
                break;
            }
        }
        // Get the consecutive score
        let opt = ruleOut.length;
        let max = opt;
        let min = 0;
        let s1 = 0.25 * this.doScore(opt, consecutiveCount, max, min);

        // Get hit score
        let count = 0;
        for (let i = 0; i < ruleOut.length; i++) {
            let a = ruleOut[i];
            let b = output[i];
            if (a === b) {
                ++count;
            }
        }
        let s2 = 0.75 * this.doScore(opt, count, max, min);

        let score = s1 + s2;
        return score;
    },

    getCurrentMaxScore(sequenceNum) {
        let mainRule = this.getRuleFromSequence(sequenceNum);
        let excludeRules = null;
        if ("excludeHelperRules" in mainRule) {
            excludeRules = mainRule.excludeHelperRules;
        }
        if ("paramsIn" in mainRule) {
            numInputParamBlocks = mainRule.paramsIn.length;
        }
        else {
            numInputParamBlocks = 2;
        }

        let maxScore = 0;

        for (let rule of this.scoreList) {
            if ("sequenceNum" in rule && !rule.skip) {
                if (rule.sequenceNum === sequenceNum || 
                    (rule.sequenceNum <= sequenceNum && rule.retain)) {
                    // Check whether this rule is excluded
                    let ruleExcluded = false;
                    if (excludeRules != null) {
                        for (let i = 0; i < excludeRules.length; i++) {
                            if (excludeRules[i] === rule.ruleId) {
                                ruleExcluded = true;
                                break;
                            }
                        }
                    }
                    if (!ruleExcluded) {
                        maxScore += rule.max * numInputParamBlocks;
                    }
                }
            }
        }
        // Allow for output difference and output scores equal
        if (numInputParamBlocks > 1) {
            let diffMax = this.scoreList[this.outputScoresItem].max;
            maxScore -= diffMax * (numInputParamBlocks - 1);
            diffMax = this.scoreList[this.diffScore].max;
            maxScore -= diffMax * (numInputParamBlocks - 1);
        }
        return (maxScore);
    },

    getInterimMaxScore() {
        let maxScore = 0;
        for (let rule of this.scoreList) {
            if (!rule.skip) {
                if ("interim" in rule) {
                    if (rule.interim) {
                        maxScore += rule.max;
                    }
                }
            }
        }
        this.interimMaxScore = maxScore;
        return maxScore;
    },

    outputScoresEqual(self, dataParams, ruleParams) {
        let score = 0;
        let rule = self.getRuleFromSequence(dataParams.sequenceNum);
        let numParamBlocks = 2;
        if ("paramsIn" in rule) {
            numParamBlocks = rule.paramsIn.length;
        }
        if (numParamBlocks === 1) {
            score = 1;
            return score;
        }
        if (dataParams.entityOutputs.length < numParamBlocks) {
            score = 0;
            return score;
        }
        // If the final output, compare the scores for each execution
        // Get the average score
        let sum = 0;
        let low = 0;
        let high = 0;
        let i = 0;
        for (let s of self.executionScores) {
            if (i === 0 || s < low) {
                low = s;
            }
            if (i === 0 || s > high) {
                high = s;
            }
            sum += s;
            ++i;
        }
        let ave = sum / self.executionScores.length;

        // Get the standard deviation for the scores
        // Get the sum of the squares of the variations
        let devSum = 0
        for (let n of self.executionScores) {
            let dev = (n - ave) ** 2;
            devSum += dev;
        }
        score = (1 - (devSum / self.executionScores.length) ** 0.5);
        // Debug
        if (score > 1) {
            console.error("Dev Score:", score);
            for (let i = 0; i < self.executionScores.length; i++) {
                console.error("rule score:", self.executionScores[i]);
            }
            throw "outputScoresEqual: Score Problem";
        }

        return score;
    },

    scoreOutputDiff(self, dataParams, ruleParams) {
        let outputs = dataParams.entityOutputs;
        // Get the number of input parameter blocks
        let rule = self.getRuleFromSequence(dataParams.sequenceNum);
        let numOutputBlocks = 0;
        if ("outputs" in rule) {
            numOutputBlocks = rule.outputs.length;
            ruleOutputs = rule.outputs;
        }
        let diffOpt = 0;
        if ("diffOpt" in rule) {
            diffOpt = rule.diffOpt;
        }

        if (numOutputBlocks < 2 || outputs.length < numOutputBlocks) {
            let score = 0;
            if (numOutputBlocks === 1) {
                score = 1;
            }
            return score;
        }


        let count = 0;
        for (let i = 0; i < ruleOutputs[0].length; i++) {
            let a = outputs[0][i];
            if (i < ruleOutputs[1].length) {
                let b = outputs[1][i];
                if (a != b) ++count;
            }
        }

        let opt = diffOpt;
        let max = ruleOutputs[0].length;
        let min = 0;
        let score = self.doScore(opt, count, max, min);
        return score;
    },

    insDistribution(self, dataParams, ruleParams) {
        let instructionSet = dataParams.instructionSet;
        let memSpace = dataParams.memSpace;
        if (memSpace.length != 256) {
            console.error("insDistribution: invalid memspace", memSpace.length);
        }

        let rule = self.getRuleFromSequence(dataParams.sequenceNum);
        if (typeof rule === 'undefined') {
            console.error("insDistribution: rule not found", dataParams.sequenceNum);
        }
        if (!("insDistribution" in rule)) {
            return 1;
        }
        let insSet = rule.insDistribution;
        let countMax = 0;
        let count = 0;
        // Count of occurrences
        for (let insData of insSet) {
            let ins = insData.ins;
            // Count the number of occurences of the instruction in the scan area
            let p = insData.scanStart;
            let itemCount = 0;
            while (p < insData.scanEnd && p < memSpace.length) {
                let code = memSpace[p];
                if (typeof code === 'undefined') {
                    console.error("insDistribution: ins code undefined");
                }
                let insItem = instructionSet.getInsDetails(code);
                if (insItem.name === ins && itemCount <= insData.countOpt) {
                    ++count;
                    ++itemCount;
                }
                p += insItem.insLen;
            }

            countMax += insData.countOpt;
        }

        let opt = countMax;
        let max = 256;
        let score = self.doScoreAtMost(opt, count, max);
        return score;
    },

    generalInsDistribution(self, dataParams, ruleParams) {
        let instructionSet = dataParams.instructionSet;
        let memSpace = dataParams.memSpace;
        if (memSpace.length != 256) {
            console.error("generalInsDistribution: invalid memspace", memSpace.length);
        }
        let insSet = ruleParams.insDistribution;
        let countMax = 0;
        let count = 0;
        // Count of occurrences
        for (let insData of insSet) {
            let ins = insData.ins;
            // Count the number of occurences of the instruction in the scan area
            let p = insData.scanStart;
            let itemCount = 0;
            while (p < insData.scanEnd && p < memSpace.length) {
                let code = memSpace[p];
                if (typeof code === 'undefined') {
                    console.error("insDistribution: ins code undefined");
                }
                let insItem = instructionSet.getInsDetails(code);
                if (insItem.name === ins && itemCount <= insData.countOpt) {
                    ++count;
                    ++itemCount;
                }
                p += insItem.insLen;
            }

            countMax += insData.countOpt;
        }

        let opt = countMax;
        let max = 256;
        let score = self.doScoreAtMost(opt, count, max);
        return score;

    },

    matchCASM(self, dataParams, ruleParams) {
        let instructionSet = dataParams.instructionSet;
        let memSpace = dataParams.memSpace;
        let codeFlags = dataParams.codeFlags;

        let score = 0;
        // Get Codes
        let SMcode = instructionSet.getInsCode("SM").code;
        let CASMcode = instructionSet.getInsCode("CASM").code;

        // Get the list of SM labels
        let SMLabels = self.getSMLabels(instructionSet, SMcode, memSpace);

        // Match any CASM commands with the SMLabels
        if (SMLabels.length === 0) {
            return score;
        }

        let count = 0;
        let p = 0;
        let done = false;
        while (!done) {
            let insCode = memSpace[p];
            if (insCode === CASMcode) {
                if (p + 1 < memSpace.length) {
                    let CASMLabel = memSpace[p + 1];
                    // Search SMLabels
                    let found = false;
                    for (let label of SMLabels) {
                        if (label === CASMLabel) {
                            found = true;
                            ++count;
                            if (codeFlags[p] > 0) ++count;
                            break;
                        }
                    }
                }
            }
            let insLen = instructionSet.getInsDetails(insCode).insLen;
            p += insLen;
            if (p >= memSpace.length) {
                done = true;
                break;
            }
        }
        let opt = 16;
        let min = 0;
        let max = Math.floor(memSpace.length / 4) * 2;
        score = self.doScore(opt, count, max, min)
        return score;
    },

    reverseJR(self, dataParams, ruleParams) {
        let memSpace = dataParams.memSpace;
        let codeFlags = dataParams.codeFlags;
        let instructionSet = dataParams.instructionSet;

        let done = false;
        let p = 0;
        let count = 0;
        while (!done) {
            ins = memSpace[p];
            insItem = instructionSet.getInsDetails(ins);
            if (insItem.name === "JR") {
                if (p < memSpace.length - 1) {
                    let jump = memSpace[p + 1];
                    if (jump >= 0x80) {
                        ++count;
                        if (codeFlags[p] > 0) ++count;
                    }
                }
            }
            p += insItem.insLen;
            if (p >= memSpace.length) {
                done = true;
                break;
            }
        }
        let opt = 12;
        let max = 40;
        let min = 0;
        let score = self.doScore(opt, count, max, min);
        return score;
    },

    getSMLabels(instructionSet, SMcode, memSpace) {
        let SMLabels = [];
        let done = false;
        let p = 0;
        while (!done) {
            let insCode = memSpace[p];
            if (insCode === SMcode && p + 1 < memSpace.length) {
                SMLabels.push(memSpace[p + 1]);
            }
            let insLen = instructionSet.getInsDetails(insCode).insLen;
            p += insLen;
            if (p >= memSpace.length) {
                done = true;
                break;
            }
        }
        return SMLabels;
    },

    instructionCount(self, dataParams, ruleParams) {
        let IC = dataParams.IC;
        let highestIC = dataParams.instructionSet.maxIC + 1;

        let f = 0;
        // Get initial params length
        let rule = self.getRuleFromSequence(dataParams.sequenceNum);
        if (!("highIC" in rule)) {
            f = rule.highIC;
            if (f > highestIC) f = highestIC;
        }
        else {
            f = highestIC;
        }

        let opt = f;
        let max = highestIC;
        let score = self.doScoreAtLeast(opt, IC, max);
        return score;

    },

    highestIPScore(self, dataParams, ruleParams) {
        let IP = dataParams.highestIP;
        let maxIP = dataParams.memSpace.length;

        // Get the optimum highIP from the current rule
        let rule = self.getRuleFromSequence(dataParams.sequenceNum);
        let opt = 35;
        if ("highIP" in rule) opt = rule.highIP;
        let max = maxIP - 1;
        let score = self.doScoreAtLeast(opt, IP, max);
        return score;
    },

    numInputReads(self, dataParams, ruleParams) {
        let memSpace = dataParams.memSpace;
        let instructionSet = dataParams.instructionSet;
    
        let scanCodeLength = 16;
        let rule = self.getRuleFromSequence(dataParams.sequenceNum);
        let opt = 3;
        if ("optNumInputReads" in rule) {
            opt = rule.optNumInputReads;
        }
        let count = 0;
        let p = 0;
        let insCount = 0;
        while (insCount < scanCodeLength) {
            let code = memSpace[p];
            let insItem = instructionSet.getInsDetails(code);
            if (insItem.name === "LDI A, (C)") ++count;
            p += insItem.insLen;
            ++insCount;
        }

        let max = scanCodeLength;
        let min = 0;
        let score = self.doScore(opt, count, max, min);
        return score;
    },

    valuesOutSet(self, dataParams, ruleParams) {
        let valuesOut = dataParams.valuesOut;
        let executionCycle = dataParams.executionCycle;

        // Obtain the current sequential rule
        let ruleSequenceNum = dataParams.sequenceNum;
        let rule = self.getRuleFromSequence(ruleSequenceNum);
        let outBlockLen = rule.outBlockLen;
        let outBlockStart = rule.outBlockStart;
        // Check whether required outputs present
        let opt = outBlockLen;
        if ("outputs" in rule) {
            // Get the current required and entity outputs
            let output = rule.outputs[executionCycle];
            outBlockLen = output.length;
            // Count the number of non-zero values in the output
            opt = 0;
            for (let v of output) {
                if (v != 0) ++opt;
            }
        }

        let count = 0;
        for (let i = outBlockStart; i < outBlockStart + outBlockLen; i++) {
            if (valuesOut[i] != 0) ++count;
        }
        let max = outBlockLen;
        let min = 0;
        let score = self.doScore(opt, count, max, min);
        return score;
    },

    valuesOutDifferent(self, dataParams, ruleParams) {
        let valuesOut = dataParams.valuesOut;
        let outBlockStart = ruleParams.outBlockStart;
        let outBlockLen = ruleParams.outBlockLen;

        let newSet = [];
        for (let i = outBlockStart; i < outBlockStart + outBlockLen; i++) {
            newSet.push(valuesOut[i]);
        }
        newSet.sort();
        let count = 0;
        for (let i = 0; i < newSet.length - 1; i++) {
            let n = newSet[i];
            let same = false;
            for (let j = i + 1; j < newSet.length; j++) {
                if (n === newSet[j]) {
                    same = true;
                    break;
                }
            }
            if (!same) ++count;
        }
        let max = newSet.length - 1;
        let min = 0;
        let score = self.doScore(newSet.length - 1, count, max, min);
        return score;
    },

    byteValuesOutDifferent(self, rule, value, address, initialParams, params, outputValues) {
        let score = 0;
        for (let i = 0; i < rule.outBlockLen; i++) {
            let a = outputValues[i + rule.outBlockStart];
            if (i != rule.outBlockStart + i) {
                if (value === a) {
                    score = 255;
                    break;
                }
            }
        }
        return score;
    },

    outputSeries(self, dataParams, ruleParams) {
        let initialParams = dataParams.paramsIn
        let valuesOut = dataParams.valuesOut;
        let outBlockStart = ruleParams.outBlockStart;
        
        let step = initialParams[0];
        let limit = initialParams[1];

        let count = 0;
        for (let i = 0; i < limit; i++) {
            let v = valuesOut[outBlockStart + i];
            let a = step * i;
            if (a === v) ++count;
        }
        let opt = limit;
        let max = opt;
        let min = 0
        let score = self.doScore(opt, count, max, min);
        return score;
    },

    getOutputSeriesRequiredOutputs(self, paramsList) {
        let outputList = [];
        
        for (inputs of paramsList) {
            let step = inputs[0];
            let limit = inputs[1];
            let v = 0;
            let output = [];
            for (let i = 0; i < limit; i++) {
                v = (i * step) & 255;
                output.push(v);
            }
            outputList.push(output);
        }
        return outputList;
    },

    byteOutputSeries(self, rule, value, address, initialParams, params, outputValues) {
        let offset = address - rule.outBlockStart;
        let a = initialParams[0];
        let r = a * offset;
        let score = self.doByteScore(r, value);
        return score;
    },

    outputSeriesOfSeries(self, dataParams, ruleParams) {
        let initialParams = dataParams.paramsIn
        let valuesOut = dataParams.valuesOut;
        let outBlockStart = ruleParams.outBlockStart;
        
        let step = initialParams[0];
        let range = initialParams[1];
        let repeats = initialParams[2];

        let count = 0;
        for (let i = 0; i < repeats * range; i++) {
            let v = valuesOut[outBlockStart + i];
            let a = step * (i % range);
            if (a === v) ++count;
        }
        let opt = repeats * range;
        let max = opt;
        let min = 0
        let score = self.doScore(opt, count, max, min);
        return score;
    },

    getOutputSeriesOfSeriesRequiredOutputs(self, paramsList) {
        let outputList = [];
        for (let i = 0; i < paramsList.length; i++) {
            let step = paramsList[i][0];
            let range = paramsList[i][1];
            let repeats = paramsList[i][2];
            let output = [];
            for (let j = 0; j < repeats; j++) {
                for (let k = 0; k < range; k++) {
                    let v = k * step;
                    output.push(v);
                }
            }
            outputList.push(output);
        }
        return outputList;
    },

    byteOutputSeriesOfSeries(self, rule, value, address, initialParams, params, outputValues) {
        let offset = address - rule.outBlockStart;
        let step = initialParams[0];
        let range = initialParams[1];
        let r = (offset % range) * step;
        let score = self.doByteScore(r, value);
        return score;
    },

    valuesOutFromParams(self, dataParams, ruleParams) {
        let paramsIn = dataParams.paramsIn;
        let valuesOut = dataParams.valuesOut;
        let outBlockStart = ruleParams.outBlockStart;
        let outBlockLen = ruleParams.outBlockLen;
        let inBlockStart = ruleParams.inBlockStart;

        let matchCount = 0;
        let oldC = -1;
        for (let i = 0; i < outBlockLen; i++) {
            let c = valuesOut[i + outBlockStart];
            if (c === paramsIn[i + inBlockStart] && c != oldC) ++matchCount;
            oldC = c;
        }
        let opt = outBlockLen;
        let max = outBlockLen;
        let min = 0;
        let score = self.doScore(opt, matchCount, max, min);
        return score;
    },

    byteValuesOutFromParams(self, rule, value, address, initialParams, params, outputValues) {
        let score = 255;
        let found = false;
        for (let i = rule.inBlockStart; i < rule.inBlockStart + rule.inBlockLen; i++) {
            if (params[i] === value) {
                found = true;
                break;
            }
        }
        if (!found && value != 0) {
            score = 1
        }
        else if (!found) {
            score = 255;
        }
        else {
            score = 0;
        }
        return score;
    },

    outputDifferentToInput(self, dataParams, ruleParams) {
        // Get the sequential rule
        let ruleSequenceNum = dataParams.sequenceNum;
        let rule = self.getRuleFromSequence(ruleSequenceNum);

        // Determine the difference optimum
        let executionCycle = dataParams.executionCycle;
        let inputs = rule.paramsIn[executionCycle];
        let outputs = rule.outputs[executionCycle];
        let actualOutputs = dataParams.entityOutputs[executionCycle];
        let opt = 0;
        let count = 0;
        for (let i = 0; i < inputs.length; i++) {
            let v1 = inputs[i];
            let v2 = outputs[i];
            let v3 = actualOutputs[i];
            if (v1 != v2) ++opt;
            if (v1 != v3) ++count;
        }

        let score = self.doScore(opt, count, inputs.length, 0);
        return score;
    },

    sumOfOutputs(self, dataParams, ruleParams){
        let ruleSequenceNum = dataParams.sequenceNum;
        let rule = rulesets.getRuleFromSequence(ruleSequenceNum);
        let executionCycle = dataParams.executionCycle;
        let outputs = rule.outputs[executionCycle];
        let actualOutputs = dataParams.valuesOut;

        let opt = 0;
        let count = 0;
        for (let i = 0; i < outputs.length; i++) {
            opt += outputs[i];
            count += actualOutputs[i];
        }
        let max = 255 * outputs.length;
        let min = 0;

        let score = self.doScore(opt, count, max, min);
        return score;
    },

    outputStandardDeviation(self, dataParams, ruleParams) {
        let ruleSequenceNum = dataParams.sequenceNum;
        let rule = rulesets.getRuleFromSequence(ruleSequenceNum);
        let executionCycle = dataParams.executionCycle;
        let outputs = rule.outputs[executionCycle];
        let actualOutputs = dataParams.valuesOut;

        // Get the list of actual outputs
        let actOutputs = [];
        let listLen = outputs.length;
        for (let i = 0; i < listLen; i++) {
            actOutputs.push(actualOutputs[i]);
        }

        let opt = self.getStandardDeviation(outputs);
        let actual = self.getStandardDeviation(actOutputs);
        let max = 255;
        let min = 0;
        let score = self.doScore(opt, actual, max, min);
        return score;
    },

    getStandardDeviation(list) {
        let numItems = list.length;

        // Get the mean
        let sum = 0;
        for (let v of list) {
            sum += v;
        }
        let mean = sum / numItems;

        // Get Deviations
        let sumDev = 0;
        for (let v of list) {
            let d = (v - mean) ** 2;
            sumDev += d;
        }
        let stdDev = (sumDev / numItems) ** 0.5;
        return stdDev;
    },

    valuesOutMatchInitialParams(self, dataParams, ruleParams) {
        let initialParams = dataParams.initialParams;
        let valuesOut = dataParams.valuesOut;
        let outBlockStart = ruleParams.outBlockStart;
        let outBlockLen = ruleParams.outBlockLen;
        let inBlockStart = ruleParams.inBlockStart;

        let count = 0;
        for (let i = 0; i < outBlockLen; i++) {
            if (initialParams[i + inBlockStart] === valuesOut[i + outBlockStart]) ++count;
        }
        let opt = outBlockLen;
        let max = outBlockLen;
        let min = 0;
        let score = self.doScore(opt, count, max, min);
        return score;
    },

    valuesOutMatchSampleInput(self, dataParams, ruleParams) {
        let valuesOut = dataParams.valuesOut;
        let sampleIn = ruleParams.sampleIn[0];
        let outBlockLen = ruleParams.outBlockLen;
        let count = 0;
        for (let i = 0; i < outBlockLen; i++) {
            if (sampleIn[i] === valuesOut[i]) {
                ++count;
            }
        }
        let opt = outBlockLen;
        let max = outBlockLen;
        let min = 0;
        let score = self.doScore(opt, count, max, min);
        return score;
    },

    valuesOutMatchSampleOutput(self, dataParams, ruleParams) {
        let valuesOut = dataParams.valuesOut;
        let sampleOut = ruleParams.sampleOut[0];
        let outBlockLen = ruleParams.outBlockLen;
        let count = 0;
        for (let i = 0; i < outBlockLen; i++) {
            if (sampleOut[i] === valuesOut[i]) {
                ++count;
            }
        }
        let opt = outBlockLen;
        let max = outBlockLen;
        let min = 0;
        let score = self.doScore(opt, count, max, min);
        return score;
    },

    byteValuesOutMatch(self, rule, value, address, initialParams, params, outputValues) {
        let score = 255;
        let offset = address - rule.outBlockStart;
        let param = initialParams[rule.inBlockStart + offset];
        if (value === param) {
            score = 0;
        }
        else {
            let opt = param;
            score = self.doByteScore(opt, value);
        }
        return score;
    },

    getValuesOutMatchRequiredOutputs(self, inputList) {
        let outputList = [];
        for (let inputs of inputList) {
            outputList.push(inputs.concat())
        };
        return outputList;
    },

    sampleOutGreaterThanSampleIn(self, dataParams, ruleParams) {
        let valuesOut = dataParams.valuesOut;
        let sampleIn = ruleParams.sampleIn;
        let sampleOut = ruleParams.sampleOut;
        let count = 0;
        let index = 0;
        for (let v1 of sampleIn) {
            let v2 = sampleOut[index];
            let v3 = valuesOut[index];
            if (v1 > v2 && v3 === 1) ++count;
            else if (v3 === 0) ++count;
            ++index;
        }
        let opt = sampleOut.length;
        let max = opt;
        let min = 0;
        let score = self.doScore(opt, count, max, min);
        return score;
    },

    sampleInMinusSampleOut(self, dataParams, ruleParams) {
        let valuesOut = dataParams.valuesOut;
        let sampleIn = ruleParams.sampleIn;
        let sampleOut = ruleParams.sampleOut;
        let count = 0;
        let index = 0;
        for (let v1 of sampleIn) {
            let v2 = sampleOut[index];
            let v3 = valuesOut[index];
            let v4 = (v1 - v2) & 255;
            if (v3 === v4) ++count;
            ++index;
        }
        let opt = sampleIn.length;
        let max = opt;
        let min = 0;
        let score = self.doScore(opt, count, max, min);
        return score;
    },

    compareSampleInSampleOut(self, dataParams, ruleParams) {
        let valuesOut = dataParams.valuesOut;
        let sampleIn = ruleParams.sampleIn;
        let sampleOut = ruleParams.sampleOut;
        let count = 0;
        let index = 0;
        for (let v1 of sampleIn) {
            let v2 = sampleOut[index];
            let v3 = valuesOut[index];
            let t1 = 0;
            if (v1 < v2) {
                t1 = 255;
            }
            else if (v1 > v2) {
                t1 = 1;
            }
            if (v3 === t1) ++count;
            ++index;
        }
        let opt = sampleIn.length;
        let max = opt;
        let min = 0;
        let score = self.doScore(opt, count, max, min);
        return score;
    },

    valuesOutFromInitialParams(self, dataParams, ruleParams) {
        let initialParams = dataParams.initialParams;
        let valuesOut = dataParams.valuesOut;
        let outBlockStart = ruleParams.outBlockStart;
        let outBlockLen = ruleParams.outBlockLen;
        let inBlockStart = ruleParams.inBlockStart;
        let inBlockLen = ruleParams.inBlockLen;

        let initSlice = initialParams.slice(inBlockStart, inBlockStart + inBlockLen);
        let outSlice = valuesOut.slice(outBlockStart, outBlockStart + outBlockLen);
        let inFlags = new Array(inBlockLen).fill(false);
        let count = 0;
        for (let v of outSlice) {
            for (let i = 0; i < inBlockLen; i++) {
                let c = initSlice[i];
                if (c === v) {
                    if (!inFlags[i]) {
                        inFlags[i] = true;
                        ++count;
                        break;
                    }
                }
            }
        }
        let max = outBlockLen;
        let min = 0;
        let opt = max;
        let score = self.doScore(opt, count, max, min);
        return score;
    },

    byteValuesOutFromInitialParams: function (self, rule, value, address, initialParams, params, outputValues) {
        let score = 255;
        let found = false;
        for (let i = rule.inBlockStart; i < rule.inBlockStart + rule.inBlockLen; i++) {
            if (value === initialParams[i]) {
                found = true;
            }
        }
        if (found) {
            score = 0;
        }
        else {
            score = 1;
        }
        return score;
    },

    initialParamsPreserved(self, dataParams, ruleParams) {
        let initialParams = dataParams.initialParams;
        let paramsIn = dataParams.paramsIn;

        let count = 0;
        for (let i = 0; i < initialParams.length; i++) {
            if (initialParams[i] === paramsIn[i]) {
                ++count;
            }
        }
        let opt = initialParams.length;
        let min = 0;
        let max = initialParams.length;
        let score = self.doScore(opt, count, max, min);
        return score;
    },

    paramsPlusN(self, dataParams, ruleParams) {
        let initialParams = dataParams.initialParams;
        let valuesOut = dataParams.valuesOut;
        let outBlockStart = ruleParams.outBlockStart;
        let outBlockLen = ruleParams.outBlockLen;
        let inBlockStart = ruleParams.inBlockStart;

        let n = ruleParams.n;
        let count = 0;
        for (let i = 0; i < outBlockLen; i++) {
            if (((initialParams[inBlockStart + i] + n) & 255) === valuesOut[i + outBlockStart]) ++count;
        }
        let opt = outBlockLen;
        let max = outBlockLen;
        let min = 0;
        let score = self.doScore(opt, count, max, min);
        return score;
    },

    byteParamsPlusN(self, rule, value, address, initialParams, params, outputValues) {
        let n = rule.n;
        let offset = address - rule.outBlockStart;
        let required = (initialParams[rule.inBlockStart + offset] + n) & 255;
        let opt = required;
        let score = self.doByteScore(opt, value);
        return score;
    },

    paramsMinusN(self, dataParams, ruleParams) {
        let initialParams = dataParams.initialParams;
        let valuesOut = dataParams.valuesOut;
        let outBlockStart = ruleParams.outBlockStart;
        let outBlockLen = ruleParams.outBlockLen;
        let inBlockStart = ruleParams.inBlockStart;

        let n = ruleParams.n;
        let count = 0;
        for (let i = 0; i < outBlockLen; i++) {
            let a = (initialParams[inBlockStart + i] - n) & 255;
            if (a === valuesOut[i + outBlockStart]) ++count;
        }
        let opt = outBlockLen;
        let max = outBlockLen;
        let min = 0;
        let score = self.doScore(opt, count, max, min);
        return score;
    },

    byteParamsMinusN(self, rule, value, address, initialParams, params, outputValues) {
        let n = rule.n;
        let offset = address - rule.outBlockStart;
        let required = (initialParams[rule.inBlockStart + offset] - n) & 255;
        let score = self.doByteScore(required, value);
        return score;
    },

    paramsTimesN(self, dataParams, ruleParams) {
        let initialParams = dataParams.initialParams;
        let valuesOut = dataParams.valuesOut;
        let outBlockStart = ruleParams.outBlockStart;
        let outBlockLen = ruleParams.outBlockLen;
        let inBlockStart = ruleParams.inBlockStart;

        let n = ruleParams.n;
        let count = 0;
        for (let i = 0; i < outBlockLen; i++) {
            let r = (n * initialParams[inBlockStart + i]) & 255;
            if (valuesOut[outBlockStart + i] === r) ++count;
        }
        let min = 0;
        let max = outBlockLen;
        let opt = max;
        let score = self.doScore(opt, count, max, min);
        return score;
    },

    byteParamsTimesN(self, rule, value, address, initialParams, params, outputValues) {
        let n = rule.n;
        let offset = address - rule.outBlockStart;
        let required = (initialParams[rule.inBlockStart + offset] * n) & 255;
        let score = self.doByteScore(required, value);
        return score;
    },

    paramsGreaterThanN(self, dataParams, ruleParams) {
        let initialParams = dataParams.initialParams;
        let valuesOut = dataParams.valuesOut;
        let outBlockStart = ruleParams.outBlockStart;
        let outBlockLen = ruleParams.outBlockLen;
        let inBlockStart = ruleParams.inBlockStart;

        let n = ruleParams.n;
        let count = 0;
        for (let i = 0; i < outBlockLen; i++) {
            let v = valuesOut[outBlockStart + i];
            let a = initialParams[inBlockStart + i];
            let r = 1;
            if (a > n) r = 3;
            if (v === r) ++count;
        }
        let opt = outBlockLen;
        let max = opt;
        let min = 0;
        let score = self.doScore(opt, count, max, min);
        return score;

    },

    byteParamsGreaterThanN(self, rule, value, address, initialParams, params, outputValues) {
        let offset = address - rule.outBlockStart;
        let a = initialParams[rule.inBlockStart + offset];
        let n = rule.n;
        let required = 1;
        if (a > n) required = 3;
        let score = self.doByteScore(required, value);
        return score;
    },

    paramsCompareN(self, dataParams, ruleParams) {
        let initialParams = dataParams.initialParams;
        let valuesOut = dataParams.valuesOut;
        let outBlockStart = ruleParams.outBlockStart;
        let outBlockLen = ruleParams.outBlockLen;
        let inBlockStart = ruleParams.inBlockStart;

        let n = ruleParams.n;
        let count = 0;
        for (let i = 0; i < outBlockLen; i++) {
            let v = valuesOut[outBlockStart + i];
            let a = initialParams[inBlockStart + i];
            let r = 1;
            if (a === n) r = 2;
            else if (a > n) r = 3;
            if (v === r) ++count;
        }
        let opt = outBlockLen;
        let max = opt;
        let min = 0;
        let score = self.doScore(opt, count, max, min);
        return score;
    },

    byteParamsCompareN(self, rule, value, address, initialParams, params, outputValues) {
        let offset = address - rule.outBlockStart;
        let a = initialParams[rule.inBlockStart + offset];
        let n = rule.n;
        let required = 1;
        if (a === n) required = 2;
        else if (a > n) required = 3;
        let score = self.doByteScore(required, value);
        return score;
    },

    getExtractFirstParamthInputsRequiredOutputs(self, inputList) {
        let outputList = [];

        for (let inputs of inputList) {
            let output = [];
            let n = inputs[0];
            for (let p = 0 + (n - 1); p < inputs.length; p += n) {
                output.push(inputs[p]);
            }
            outputList.push(output);
        }
        return outputList;
    },

    getAndFirstParamRequiredOutputs(self, inputList) {
        let outputList = [];

        for (let inputs of inputList) {
            let output = [];
            let n = inputs[0];
            for (let v of inputs) {
                let r = v & n;
                output.push(r);
            }
            outputList.push(output);
        }
        return outputList;
    },

    getOrFirstParamRequiredOutputs(self, inputList) {
        let outputList = [];

        for (let inputs of inputList) {
            let output = [];
            let n = inputs[0];
            for (let v of inputs) {
                let r = v | n;
                output.push(r);
            }
            outputList.push(output);
        }
        return outputList;
    },

    addFirstParam(self, dataParams, ruleParams) {
        let initialParams = dataParams.initialParams;
        let valuesOut = dataParams.valuesOut;
        let outBlockStart = ruleParams.outBlockStart;
        let outBlockLen = ruleParams.outBlockLen;
        let inBlockStart = ruleParams.inBlockStart;

        let a = initialParams[inBlockStart];
        let count = 0;
        for (let i = 0; i < outBlockLen; i++) {
            let r = (initialParams[inBlockStart + i] + a) & 255;
            let v = valuesOut[outBlockStart + i];
            if (v === r) ++count;
        }

        let opt = outBlockLen;
        let max = opt;
        let min = 0;
        let score = self.doScore(opt, count, max, min);
        return score;
    },

    getAddFirstParamRequiredOutputs(self, inputList) {
        let outputList = [];

        for (let input of inputList) {
            let a = input[0];
            let output = [];
            for (let n of input) {
                v = (n + a) & 255;
                output.push(v);
            }
            outputList.push(output);
        }
        return outputList;
    },

    byteAddFirstParam(self, rule, value, address, initialParams, params, outputValues) {
        let offset = address - rule.outBlockStart;
        let a = initialParams[rule.inBlockStart];
        let required = (a + initialParams[offset]) & 255;
        let score = self.doByteScore(required, value);
        return score;
    },

    subtractFirstParam(self, dataParams, ruleParams) {
        let initialParams = dataParams.initialParams;
        let valuesOut = dataParams.valuesOut;
        let outBlockStart = ruleParams.outBlockStart;
        let outBlockLen = ruleParams.outBlockLen;
        let inBlockStart = ruleParams.inBlockStart;

        let a = initialParams[inBlockStart];
        let count = 0;
        for (let i = 0; i < outBlockLen; i++) {
            let r = (initialParams[inBlockStart + i] - a) & 255;
            let v = valuesOut[outBlockStart + i];
            if (v === r) ++count;
        }

        let opt = outBlockLen;
        let max = opt;
        let min = 0;
        let score = self.doScore(opt, count, max, min);
        return score;
    },

    getSubtractFirstParamRequiredOutputs(self, inputList) {
        let outputList = [];

        for (let inputs of inputList) {
            let output = [];
            let a = inputs[0];
            for (let input of inputs) {
                let v = (input - a) & 255;
                output.push(v);
            }
            outputList.push(output);
        }
        return outputList;
    },

    byteSubtractFirstParam(self, rule, value, address, initialParams, params, outputValues) {
        let offset = address - rule.outBlockStart;
        let a = initialParams[rule.inBlockStart];
        let required = (initialParams[offset] - a) & 255;
        let score = self.doByteScore(required, value);
        return score;
    },

    getAddSumOfFirstAndSecondParamsRequiredOutputs(self, inputList) {
        let outputList = [];

        for (let inputs of inputList) {
            let output = [];
            let a = inputs[0];
            a += inputs[1];
            for (let v of inputs) {
                let r = (v + a) & 255;
                output.push(r); 
            }
            outputList.push(output);
        }
        return outputList;
    },

    getSubSumOfFirstAndSecondParamsRequiredOutputs(self, inputList) {
        let outputList = [];

        for (let inputs of inputList) {
            let output = [];
            let a = inputs[0];
            a += inputs[1];
            for (let v of inputs) {
                let r = (v - a) & 255;
                output.push(r); 
            }
            outputList.push(output);
        }
        return outputList;
    },

    getSelectLessThanFirstParamRequiredOutputs(self, inputList) {
        let outputList = [];

        for (let inputs of inputList) {
            let output = [];
            let n = inputs[0];
            for (let v of inputs) {
                if (v < n) output.push(v);
            }
            outputList.push(output);
        }
        return outputList;
    },

    getSelectGreaterThanFirstParamRequiredOutputs(self, inputList) {
        let outputList = [];

        for (let inputs of inputList) {
            let output = [];
            let n = inputs[0];
            for (let v of inputs) {
                if (v > n) output.push(v);
            }
            outputList.push(output);
        }
        return outputList;
    },

    oddAndEvenParams(self, dataParams, ruleParams) {
        let initialParams = dataParams.initialParams;
        let valuesOut = dataParams.valuesOut;
        let outBlockStart = ruleParams.outBlockStart;
        let outBlockLen = ruleParams.outBlockLen;
        let inBlockStart = ruleParams.inBlockStart;

        let count = 0;
        for (let i = 0; i < outBlockLen; i++) {
            let a = initialParams[inBlockStart + i];
            let b = a % 2;
            if (b === 1) r = 1;
            else r = 2;
            let v = valuesOut[outBlockStart + i];
            if (v === r) ++count;
        }
        let opt = outBlockLen;
        let max = opt;
        let min = 0;
        let score = self.doScore(opt, count, max, min);
        return score;
    },

    getOddAndEvenParamsRequiredOutputs(self, inputList) {
        let outputList = [];

        for (let inputs of inputList) {
            let output = [];
            for (let n of inputs) {
                let v;
                if (n % 2 === 1) v = 1;
                else v = 2;
                output.push(v);
            }
            outputList.push(output);
        }
        return outputList;
    },

    byteOddAndEvenParams(self, rule, value, address, initialParams, params, outputValues) {
        let offset = address - rule.outBlockStart;
        let a = initialParams[rule.inBlockStart + offset];
        if (a % 2 === 1) r = 1;
        else r = 2;
        let score = self.doByteScore(r, value);
        return score;
    },


    multiplyByFirstParam(self, dataParams, ruleParams) {
        let initialParams = dataParams.initialParams;
        let valuesOut = dataParams.valuesOut;
        let outBlockStart = ruleParams.outBlockStart;
        let outBlockLen = ruleParams.outBlockLen;
        let inBlockStart = ruleParams.inBlockStart;

        let a = initialParams[inBlockStart];
        let count = 0;
        for (let i = 0; i < outBlockLen; i++) {
            let r = (initialParams[inBlockStart + i] * a) & 255;
            let v = valuesOut[outBlockStart + i];
            if (v === r) ++count;
        }

        let opt = outBlockLen;
        let max = opt;
        let min = 0;
        let score = self.doScore(opt, count, max, min);
        return score;
    },

    getMultiplyByFirstParamRequiredOutputs(self, inputList) {
        let outputList = [];

        for (let inputs of inputList) {
            let output = [];
            let a = inputs[0];
            for (let n of inputs) {
                let v = (n * a) & 255;
                output.push(v);
            }
            outputList.push(output);
        }
        return outputList;
    },

    byteMultiplyByFirstParam(self, rule, value, address, initialParams, params, outputValues) {
        let offset = address - rule.outBlockStart;
        let a = initialParams[rule.inBlockStart];
        let required = (initialParams[rule.inblockStart + offset] * a) & 255;
        let score = self.doByteScore(required, value);
        return score;
    },

    getMultiplyParamsBy10RequiredOutputs(self, inputList) {
        let outputList = [];
        for (let inputs of inputList) {
            let output = [];
            for (let v of inputs) {
                let r = v * 10;
                output.push(r);
            }
            outputList.push(output);
        }
        return outputList;
    },

    getSixteenBitAddFirstParamRequiredOutputs(self, inputList) {
        let outputList = [];
        for (let inputs of inputList) {
            let output = [];
            let a = inputs[0];
            for (let v of inputs) {
                let r = v + a;
                let r1 = r & 255;
                let r2 = r >> 8;
                output.push(r2);
                output.push(r1);
            }
            outputList.push(output);
        }
        return outputList;
    },

    getSixteenBitAddFirstTwoParamsRequiredOutputs(self, inputList) {
        let outputList = [];
        for (let inputs of inputList) {
            let output = [];
            let a = inputs[0] << 8;
            let b = a + inputs[1];
            for (let i = 0; i < inputs.length; i += 2) {
                let r1 = inputs[i] << 8
                let r2 = r1 + inputs[i + 1];
                let r3 = r2 + b;
                let r4 = r3 & 255;
                let r5 = r3 >> 8;
                output.push(r5);
                output.push(r4);
            }
            outputList.push(output);
        }
        return outputList;

    },

    getMultiplyByFirstParamAddAdjacentRequiredOutputs(self, inputList) {
        let outputList = [];
        for (let inputs of inputList) {
            let output = [];
            let m = inputs[0];
            for (let i = 0; i < inputs.length; i += 2) {
                let v = inputs[i] * m + inputs[i + 1];
                output.push(v);
            }
            outputList.push(output);
        }
        return outputList;
    },

    getMultiplyByFirstParamMinusAdjacentRequiredOutputs(self, inputList) {
        let outputList = [];
        for (let inputs of inputList) {
            let output = [];
            let m = inputs[0];
            for (let i = 0; i < inputs.length; i += 2) {
                let v = inputs[i] * m - inputs[i + 1];
                output.push(v);
            }
            outputList.push(output);
        }
        return outputList;
    },

    getSubtractFirstParamSecondTimesRequiredOutputs(self, inputList) {
        let outputList = [];

        for (let inputs of inputList) {
            let output = [];
            let a = inputs[0];
            let b = inputs[1];
            for (let v of inputs) {
                let r = v;
                for (let i = 0; i < b; i++) {
                    r = (r - a) & 255;
                }
                output.push(r);
            }
            outputList.push(output);
        }
        return outputList;
    },

    moduloFirstParam(self, dataParams, ruleParams) {
        let initialParams = dataParams.initialParams;
        let valuesOut = dataParams.valuesOut;
        let outBlockStart = ruleParams.outBlockStart;
        let outBlockLen = ruleParams.outBlockLen;
        let inBlockStart = ruleParams.inBlockStart;

        let a = initialParams[inBlockStart];
        let count = 0;
        for (let i = 0; i < outBlockLen; i++) {
            let b = initialParams[inBlockStart + i];
            let r = b % a;
            let v = valuesOut[outBlockStart + i];
            if (v === r) ++count;
        }

        let opt = outBlockLen;
        let max = opt;
        let min = 0;
        let score = self.doScore(opt, count, max, min);
        return score;
    },

    getModuloFirstParamRequiredOutputs(self, inputList) {
        let outputList = [];

        for (let inputs of inputList) {
            let output = [];
            let a = inputs[0];
            for (let n of inputs) {
                v = n % a;
                output.push(v);
            }
            outputList.push(output);
        }
        return outputList;
    },

    byteModuloFirstParam(self, rule, value, address, initialParams, params, outputValues) {
        let offset = address - rule.outBlockStart;
        let a = initialParams[rule.inBlockStart];
        let required = (initialParams[rule.inblockStart + offset] % a);
        let score = self.doByteScore(required, value);
        return score;
    },

    getDivisibleByFirstParamRequiredOutputs(self, inputList) {
        let outputList = [];

        for (let inputs of inputList) {
            let output = [];
            let d = inputs[0];
            for (let v of inputs) {
                if (v % d === 0) {
                    output.push(1);
                }
                else {
                    output.push(0);
                }
            }
            outputList.push(output);
        }

        return outputList;
    },

    getNotDivisibleByFirstParamRequiredOutputs(self, inputList) {
        let outputList = [];

        for (let inputs of inputList) {
            let output = [];
            let d = inputs[0];
            for (let v of inputs) {
                if (v % d != 0) {
                    output.push(1);
                }
                else {
                    output.push(0);
                }
            }
            outputList.push(output);
        }

        return outputList;
    },

    divideByFirstParam(self, dataParams, ruleParams) {
        let initialParams = dataParams.initialParams;
        let valuesOut = dataParams.valuesOut;
        let outBlockStart = ruleParams.outBlockStart;
        let outBlockLen = ruleParams.outBlockLen;
        let inBlockStart = ruleParams.inBlockStart;

        let a = initialParams[inBlockStart];
        let count = 0;
        for (let i = 0; i < outBlockLen; i++) {
            let r = Math.floor(initialParams[inBlockStart + i] / a) & 255;
            let v = valuesOut[outBlockStart + i];
            if (v === r) ++count;
        }

        let opt = outBlockLen;
        let max = opt;
        let min = 0;
        let score = self.doScore(opt, count, max, min);
        return score;
    },

    getDivideByFirstParamRequiredOutputs(self, inputList) {
        let outputList = [];

        for (let inputs of inputList) {
            let output = [];
            let a = inputs[0];
            for (let n of inputs) {
                let v;
                if (a === 0) v = 0;
                else v = Math.floor(n/a);
                output.push(v);
            }
            outputList.push(output);
        }
        return outputList;
    },

    byteDivideByFirstParam(self, rule, value, address, initialParams, params, outputValues) {
        let offset = address - rule.outBlockStart;
        let a = initialParams[rule.inBlockStart];
        let required = Math.floor(initialParams[rule.inblockStart + offset] / a) & 255;
        let score = self.doByteScore(required, value);
        return score;
    },

    getIsPrimeRequiredOutputs(self, inputList) {
        let outputList = [];

        for (let inputs of inputList) {
            let output = [];
            for (let v of inputs) {
                if (mathFuncs.isPrime(v)) {
                    output.push(1)
                }
                else {
                    output.push(0);
                }
            }
            outputList.push(output);
        }
        return outputList;
    },

    getParamthPrimeRequiredOutputs(self, inputList) {
        let outputList = [];

        for (let inputs of inputList) {
            let output = [];

            for (let v of inputs) {
                let r = mathFuncs.primeTable[v];
                output.push(r);
            }
            outputList.push(output);
        }
        return outputList;
    },

    getPowerFirstParamRequiredOutputs(self, inputList) {
        let outputList = [];

        for (let inputs of inputList) {
            let output = [];
            let power = inputs[0];
            for (let v of inputs) {
                let r = (v ** power) & 255;
                output.push(r);
            }
            outputList.push(output);
        }
        return outputList;
    },

    getSquareRootsRequiredOutputs(self, inputList) {
        let outputList = [];
        for (let inputs of inputList) {
            let output = [];
            for (let v of inputs) {
                let r = Math.floor(Math.pow(v, 1/2));
                output.push(r);
            }
            outputList.push(output);
        }
        return outputList;
    },

    getCubeRootsRequiredOutputs(self, inputList) {
        let outputList = [];
        for (let inputs of inputList) {
            let output = [];
            for (let v of inputs) {
                let r = Math.floor(Math.pow(v, 1/3));
                output.push(r);
            }
            outputList.push(output);
        }
        return outputList;
    },

    getNumbersGreaterThanFirstRequiredOutputs(self, inputList) {
        let outputList = [];
        for (let inputs of inputList) {
            let output = [];
            let n = inputs[0];
            for (let v of inputs) {
                if (v > n) output.push(v);
            }
            outputList.push(output);
        }
        return outputList;
    },

    getNumbersLessThanFirstRequiredOutputs(self, inputList) {
        let outputList = [];
        for (let inputs of inputList) {
            let output = [];
            let n = inputs[0];
            for (let v of inputs) {
                if (v < n) output.push(v);
            }
            outputList.push(output);
        }
        return outputList;
    },

    getNumbersBetweenFirstTwoRequiredOutputs(self, inputList) {
        let outputList = [];
        for (let inputs of inputList) {
            let output = [];
            let n1 = inputs[0];
            let n2 = inputs[1];
            for (let v of inputs) {
                if (v > n1 && n2 > v) output.push(v);
            }
            outputList.push(output);
        }
        return outputList;
    },

    greaterThanFirstParam(self, dataParams, ruleParams) {
        let initialParams = dataParams.initialParams;
        let valuesOut = dataParams.valuesOut;
        let outBlockStart = ruleParams.outBlockStart;
        let outBlockLen = ruleParams.outBlockLen;
        let inBlockStart = ruleParams.inBlockStart;

        let a = initialParams[inBlockStart];
        let count = 0;
        for (let i = 0; i < outBlockLen; i++) {
            let b = initialParams[inBlockStart + i];
            let r = 1;
            if (b > a) r = 3;
            let v = valuesOut[outBlockStart + i];
            if (v === r) ++count;
        }

        let opt = outBlockLen;
        let max = opt;
        let min = 0;
        let score = self.doScore(opt, count, max, min);
        return score;
    },

    getGreaterThanFirstParamRequiredOutputs(self, inputList) {
        let outputList = [];

        for (let inputs of inputList) {
            let output = [];
            let a = inputs[0];
            for (let n of inputs) {
                let v;
                if (n > a) v = 3;
                else v = 1;
                output.push(v);
            }
            outputList.push(output);
        }
        return outputList;
    },

    getExtractEvenNumbersRequiredOutputs(self, inputList) {
        let outputList = [];

        for (let inputs of inputList) {
            let output = [];
            for (let v of inputs) {
                if (v % 2 === 0) {
                    output.push(v);
                }
            }
            outputList.push(output);
        }
        return outputList;
    },

    getExtractOddNumbersRequiredOutputs(self, inputList) {
        let outputList = [];

        for (let inputs of inputList) {
            let output = [];
            for (let v of inputs) {
                if (v % 2 === 1) {
                    output.push(v);
                }
            }
            outputList.push(output);
        }
        return outputList;
    },

    byteGreaterThanFirstParam(self, rule, value, address, initialParams, params, outputValues) {
        let offset = address - rule.outBlockStart;
        let a = initialParams[rule.inBlockStart];
        let b = initialParams[rule.inBlockStart + offset];
        let required = 1;
        if (b > a) required = 3;
        let score = self.doByteScore(required, value);
        return score;
    },

    compareFirstParam(self, dataParams, ruleParams) {
        let initialParams = dataParams.initialParams;
        let valuesOut = dataParams.valuesOut;
        let outBlockStart = ruleParams.outBlockStart;
        let outBlockLen = ruleParams.outBlockLen;
        let inBlockStart = ruleParams.inBlockStart;

        let a = initialParams[inBlockStart];
        let count = 0;
        for (let i = 0; i < outBlockLen; i++) {
            let b = initialParams[inBlockStart + i];
            let r = 1;
            if (b === a) r = 2;
            else if (b > a) r = 3;
            let v = valuesOut[outBlockStart + i];
            if (v === r) ++count;
        }

        let opt = outBlockLen;
        let max = opt;
        let min = 0;
        let score = self.doScore(opt, count, max, min);
        return score;
    },

    getCompareFirstParamRequiredOutputs(self, inputList) {
        let outputList = [];

        for (let inputs of inputList) {
            let output = [];
            let a = inputs[0];
            for (let n of inputs) {
                let v;
                if (n === a) v = 2;
                else if (n > a) v = 3;
                else v = 1;
                output.push(v);
            }
            outputList.push(output);
        }
        return outputList;
    },

    byteCompareFirstParam(self, rule, value, address, initialParams, params, outputValues) {
        let offset = address - rule.outBlockStart;
        let a = initialParams[rule.inBlockStart];
        let b = initialParams[rule.inBlockStart + offset];
        let required = 1;
        if (b === a) required = 2;
        else if (b > a) required = 3;
        let score = self.doByteScore(required, value);
        return score;
    },

    addSecondParam(self, dataParams, ruleParams) {
        let initialParams = dataParams.initialParams;
        let valuesOut = dataParams.valuesOut;
        let outBlockStart = ruleParams.outBlockStart;
        let outBlockLen = ruleParams.outBlockLen;
        let inBlockStart = ruleParams.inBlockStart;

        let a = initialParams[inBlockStart + 1];
        let count = 0;
        for (let i = 0; i < outBlockLen; i++) {
            let r = (initialParams[inBlockStart + i] + a) & 255;
            let v = valuesOut[outBlockStart + i];
            if (v === r) ++count;
        }

        let opt = outBlockLen;
        let max = opt;
        let min = 0;
        let score = self.doScore(opt, count, max, min);
        return score;
    },

    byteAddSecondParam(self, rule, value, address, initialParams, params, outputValues) {
        let offset = address - rule.outBlockStart;
        let a = initialParams[rule.inBlockStart + 1];
        let required = (a + initialParams[offset]) & 255;
        let score = self.doByteScore(required, value);
        return score;
    },

    duplicateParams(self, dataParams, ruleParams) {
        let initialParams = dataParams.initialParams;
        let valuesOut = dataParams.valuesOut;
        let outBlockStart = ruleParams.outBlockStart;
        let outBlockLen = ruleParams.outBlockLen;
        let inBlockStart = ruleParams.inBlockStart;
        let inBlockLen = ruleParams.inBlockLen;

        let count = 0;
        for (let i = 0; i < inBlockLen; i++) {
            let r = initialParams[inBlockStart + i];
            let v1 = valuesOut[outBlockStart + i * 2];
            if (v1 === r) ++count;
            let v2 = valuesOut[outBlockStart + i * 2 + 1];
            if (v2 === r) ++count;
        }

        let opt = outBlockLen;
        let max = opt;
        let min = 0;
        let score = self.doScore(opt, count, max, min);
        return score;
    },

    getDuplicateParamsRequiredOutputs(self, inputList) {
        let outputList = [];

        for (let inputs of inputList) {
            let output = [];
            for (let n of inputs) {
                output.push(n);
                output.push(n);
            }
            outputList.push(output);
        }
        return outputList;
    },

    byteDuplicateParams(self, rule, value, address, initialParams, params, outputValues) {
        let offset = address - rule.outBlockStart;
        let ip = Math.floor(offset / 2);
        let required = initialParams[rule.inBlockStart + ip];
        let score = self.doByteScore(required, value);
        return score;
    },

    skipAdjacentParams1(self, dataParams, ruleParams) {
        let initialParams = dataParams.initialParams;
        let valuesOut = dataParams.valuesOut;
        let outBlockStart = ruleParams.outBlockStart;
        let outBlockLen = ruleParams.outBlockLen;
        let inBlockStart = ruleParams.inBlockStart;

        let count = 0;
        for (let i = 0; i < outBlockLen; i++) {
            let v = valuesOut[outBlockStart + i];
            let v1 = initialParams[inBlockStart + (i * 2)];
            if (v1 === v) ++count;
        }

        let opt = outBlockLen;
        let max = opt;
        let min = 0;
        let score = self.doScore(opt, count, max, min);
        return score;

    },

    getSkipAdjacentParams1RequiredOutputs(self, inputList) {
        let outputList = [];

        for (let inputs of inputList) {
            let output = [];
            for (let i = 1; i < inputs.length; i += 2) {
                n = inputs[i];
                output.push(n);
            }
            outputList.push(output);
        }
        return outputList;
    },

    byteSkipAdjacentParams1(self, rule, value, address, initialParams, params, outputValues) {
        let outBlockStart = rule.outBlockStart;
        let inBlockStart = rule.inBlockStart;
        let offset = address - outBlockStart;
        let required = initialParams[inBlockStart + (offset * 2)];
        let score = self.doByteScore(required, value);
        return score;
    },

    skipAdjacentParams2(self, dataParams, ruleParams) {
        let initialParams = dataParams.initialParams;
        let valuesOut = dataParams.valuesOut;
        let outBlockStart = ruleParams.outBlockStart;
        let outBlockLen = ruleParams.outBlockLen;
        let inBlockStart = ruleParams.inBlockStart;

        let count = 0;
        for (let i = 0; i < outBlockLen; i++) {
            let v = valuesOut[outBlockStart + i];
            let v1 = initialParams[inBlockStart + (i * 2 + 1)];
            if (v1 === v) ++count;
        }

        let opt = outBlockLen;
        let max = opt;
        let min = 0;
        let score = self.doScore(opt, count, max, min);
        return score;

    },

    getSkipAdjacentParams2RequiredOutputs(self, inputList) {
        let outputList = [];

        for (let inputs of inputList) {
            let output = [];
            for (let i = 0; i < inputs.length; i += 2) {
                let n = inputs[i];
                output.push(n);
            }
            outputList.push(output);
        }
        return outputList;
    },

    byteSkipAdjacentParams2(self, rule, value, address, initialParams, params, outputValues) {
        let outBlockStart = rule.outBlockStart;
        let inBlockStart = rule.inBlockStart;
        let offset = address - outBlockStart;
        let required = initialParams[inBlockStart + (offset * 2 + 1)];
        let score = self.doByteScore(required, value);
        return score;
    },

    swapAdjacentParams(self, dataParams, ruleParams) {
        let initialParams = dataParams.initialParams;
        let valuesOut = dataParams.valuesOut;
        let outBlockStart = ruleParams.outBlockStart;
        let outBlockLen = ruleParams.outBlockLen;
        let inBlockStart = ruleParams.inBlockStart;

        let count = 0;
        let osc = 1;
        let p = 1;
        for (let i = 0; i < outBlockLen; i++) {
            let v = valuesOut[outBlockStart + i];
            let v1 = initialParams[inBlockStart + (i + p)];
            if (v1 === v) ++count;
            osc = i % 2;
            osc === 0 ? p = -1 : p = 1;
        }

        let opt = outBlockLen;
        let max = opt;
        let min = 0;
        let score = self.doScore(opt, count, max, min);
        return score;

    },

    getSwapAdjacentParamsRequiredOutputs(self, inputList) {
        let outputList = [];

        for (let inputs of inputList) {
            let output = [];
            for (let i = 0; i < inputs.length; i += 2) {
                let a = inputs[i];
                let b = inputs[i + 1];
                output.push(b);
                output.push(a);
            }
            outputList.push(output);
        }
        return outputList;
    },

    byteSwapAdjacentParams(self, rule, value, address, initialParams, params, outputValues) {
        let outBlockStart = rule.outBlockStart;
        let inBlockStart = rule.inBlockStart;
        let offset = address - outBlockStart;
        let osc = (offset + 1) % 2;
        if (osc === 0) osc = -1;
        let required = initialParams[inBlockStart + (offset + osc)];
        let score = self.doByteScore(required, value);
        return score;
    },

    getReverseParamsRequiredOutputs(self, inputList) {
        let outputList = [];

        for (let inputs of inputList) {
            let output = [];
            for (let i = inputs.length - 1; i >= 0; i--) {
                let r = inputs[i];
                output.push(r);
            }
            outputList.push(output);
        }
        return outputList;
    },

    getReverseParamTripletsRequiredOutputs(self, inputList) {
        let outputList = [];

        for (let inputs of inputList) {
            let output = [];
            for (let i = 0; i < inputs.length; i += 3) {
                let a = inputs[i];
                let b = inputs[i + 1];
                let c = inputs[i + 2];
                output.push(c);
                output.push(b);
                output.push(a);
            }
            outputList.push(output);
        }
        return outputList;
    },

    greaterOfAdjacentParams(self, dataParams, ruleParams) {
        let initialParams = dataParams.initialParams;
        let valuesOut = dataParams.valuesOut;
        let outBlockStart = ruleParams.outBlockStart;
        let outBlockLen = ruleParams.outBlockLen;
        let inBlockStart = ruleParams.inBlockStart;

        let count = 0;
        for (let i = 0; i < outBlockLen; i++) {
            let v1 = initialParams[inBlockStart + i * 2];
            let v2 = initialParams[inBlockStart + i * 2 + 1];
            let r = v1;
            if (v2 > v1) r = v2;
            if (valuesOut[outBlockStart + i] === r) ++count;
        }
        let opt = outBlockLen;
        let max = opt;
        let min = 0;
        let score = self.doScore(opt, count, max, min);
        return score;
    },

    getGreaterOfAdjacentParamsRequiredOutputs(self, inputList) {
        let outputList = [];

        for (let inputs of inputList) {
            let output = [];
            for (let i = 0; i < inputs.length; i += 2) {
                let a = inputs[i];
                let b = inputs[i + 1];
                let v = a;
                if (b > a) v = b;
                output.push(v);
            }
            outputList.push(output);
        }
        return outputList;
    },

    byteGreaterOfAdjacentParams(self, rule, value, address, initialParams, params, outputValues) {
        let outBlockStart = rule.outBlockStart;
        let inBlockStart = rule.inBlockStart;
        let offset = address - outBlockStart;
        let v1 = initialParams[inBlockStart + offset * 2];
        let v2 = initialParams[inBlockStart + offset * 2 + 1];
        let required = v1;
        if (v2 > v1) required = v2;
        let score = self.doByteScore(required, value);
        return score;
    },

    getGreaterOfThreeRequiredOutputs(self, inputList) {
        let outputList = [];

        for (let inputs of inputList) {
            let outputs = [];
            let p = 0;
            while (p < inputs.length) {
                let v1 = inputs[p];
                for (let i = 1; i < 3; i++) {
                    if (v1 < inputs[p + i]) {
                        v1 = inputs[p + i];
                    }
                }
                outputs.push(v1);
                p += 3;
            }
            outputList.push(outputs);
        }
        return outputList;
    },

    sortAdjacentParams(self, dataParams, ruleParams) {
        // Highest First Sort
        let initialParams = dataParams.initialParams;
        let valuesOut = dataParams.valuesOut;
        let outBlockStart = ruleParams.outBlockStart;
        let outBlockLen = ruleParams.outBlockLen;
        let inBlockStart = ruleParams.inBlockStart;

        let count = 0;
        let p = 0;
        for (let i = 0; i < outBlockLen; i++) {
            if (i > 0 && i % 2 === 0) p += 2;
            let in1 = initialParams[inBlockStart + p];
            let in2 = initialParams[inBlockStart + p + 1];
            let inOrd = [];
            if (in1 > in2) {
                inOrd.push(in1);
                inOrd.push(in2);
            }
            else {
                inOrd.push(in2);
                inOrd.push(in1);
            }

            let v = valuesOut[outBlockStart + i];
            if (v === inOrd[i % 2]) ++count;
        }
        let opt = outBlockLen;
        let max = opt;
        let min = 0;
        let score = self.doScore(opt, count, max, min);
        return score;
    },

    getSortAdjacentParamsRequiredOutputs(self, inputList) {
        let outputList = [];

        for (let inputs of inputList) {
            let output = [];
            for (let i = 0; i < inputs.length; i += 2) {
                let a = inputs[i];
                let b = inputs[i + 1];
                if (a > b) {
                    output.push(a);
                    output.push(b);
                }
                else {
                    output.push(b);
                    output.push(a);
                }
            }
            outputList.push(output);
        }
        return outputList;
    },

    getFindNumbersRequiredOutputs(self, inputList) {

        let outputList = [];
        for (let inputs of inputList) {
            let output = [];
            let inLen = inputs.length / 2;
            for (let i = 0; i < inLen; i++) {
                let v = inputs[i];
                for (let j = inLen; j < inputs.length; j++) {
                    if (inputs[j] === v) {
                        output.push(j);
                        break;
                    }
                }
            }
            outputList.push(output);
        }

        return outputList;
    },

    getFindNumberTripletsRequiredOutputs(self, inputList) {
        let outputList = [];
        for (let inputs of inputList) {
            let inputLen = inputs.length/2;
            let numTriplets = inputLen/3;
            let index = 0;
            let outputs = [];
            for (let i = 0; i < numTriplets; i++) {
                let v = inputs[i * 3];
                for (let j = inputLen; j < inputs.length; j += 3) {
                    let found = false;
                    if (v === inputs[j]) {
                        // Test the rest of the bytes
                        let s1 = i * 3 + 1;
                        let s2 = j + 1;
                        found = true;
                        for (let k = 0; k < 2; k++) {
                            if (inputs[s1 + k] != inputs[s2 + k]) {
                                found = false;
                                break;
                            } 
                        }
                    }
                    if (found) {
                        outputs.push(j);
                        break;
                    }
                }
            }
            outputList.push(outputs);
        }
        return outputList;
    },

    byteSortAdjacentParams(self, rule, value, address, initialParams, params, outputValues) {
        let outBlockStart = rule.outBlockStart;
        let inBlockStart = rule.inBlockStart;
        let offset = address - outBlockStart;
        let inPtr = inBlockStart + (Math.floor(offset / 2) * 2);
        let in1 = initialParams[inBlockStart + inPtr];
        let in2 = initialParams[inBlockStart + inPtr + 1];
        let inOrd = [];
        if (in1 > in2) {
            inOrd.push(in1);
            inOrd.push(in2);
        }
        else {
            inOrd.push(in2);
            inOrd.push(in1);
        }
        let p = offset % 2;
        let required = inOrd[p];
        let score = self.doByteScore(required, value);
        return score;
    },

    getSortTripletsRequiredOutputs(self, inputList) {
        let outputList = [];

        for (let inputs of inputList) {
            let a = inputs.concat();
            let b = [];
            let i = 0;
            while (i < a.length) {
                let triple = [];
                triple.push(a[i]);
                triple.push(a[i + 1]);
                triple.push(a[i + 2]);
                self.bubbleSort2(triple);
                b = b.concat(triple);
                i += 3;
            }
            outputList.push(b);
        }
        return outputList;
    },

    getSortParamsRequiredOutputs(self, inputList) {
        let outputList = [];

        for (let inputs of inputList) {
            let a = inputs.concat();
            self.bubbleSort2(a);
            outputList.push(a);
        }

        return outputList;
    },

    getAndAdjacentParamsRequiredOutputs(self, inputList) {
        let outputList = [];

        for (let inputs of inputList) {
            let output = [];
            for (let i = 0; i < inputs.length; i += 2) {
                let a = inputs[i];
                let b = inputs[i + 1];
                let r = a & b;
                output.push(r);
            }
            outputList.push(output);
        }
        return outputList;
    },

    getOrAdjacentParamsRequiredOutputs(self, inputList) {
        let outputList = [];

        for (let inputs of inputList) {
            let output = [];
            for (let i = 0; i < inputs.length; i += 2) {
                let a = inputs[i];
                let b = inputs[i + 1];
                let r = a | b;
                output.push(r);
            }
            outputList.push(output);
        }
        return outputList;
    },

    addAdjacentParams(self, dataParams, ruleParams) {
        let initialParams = dataParams.initialParams;
        let valuesOut = dataParams.valuesOut;
        let outBlockStart = ruleParams.outBlockStart;
        let outBlockLen = ruleParams.outBlockLen;
        let inBlockStart = ruleParams.inBlockStart;

        let count = 0;
        for (let i = 0; i < outBlockLen; i++) {
            let p = outBlockStart + i;
            let v = valuesOut[p];
            let q = inBlockStart + i * 2;
            let v1 = (initialParams[q] + initialParams[q + 1]) & 255;
            if (v === v1) {
                ++count;
            }
        }
        let opt = outBlockLen;
        let max = opt;
        let min = 0;
        let score = self.doScore(opt, count, max, min);
        return score;
    },

    getAddAdjacentParamsRequiredOutputs(self, inputList) {
        let outputList = [];

        for (let inputs of inputList) {
            let output = [];
            for (let i = 0; i < inputs.length; i += 2) {
                let a = inputs[i];
                let b = inputs[i + 1];
                let v = (a + b) & 255;
                output.push(v)
            }
            outputList.push(output);
        }
        return outputList;
    },

    byteAddAdjacentParams(self, rule, value, address, initialParams, params, outputValues) {
        let outBlockStart = rule.outBlockStart;
        let inBlockStart = rule.inBlockStart;
        let offset = address - outBlockStart;
        let p = inBlockStart + offset * 2;
        let v = (initialParams[p] + initialParams[p + 1]) & 255;
        let score = self.doByteScore(v, value);
        return score;
    },

    subtractAdjacentParams(self, dataParams, ruleParams) {
        let initialParams = dataParams.initialParams;
        let valuesOut = dataParams.valuesOut;
        let outBlockStart = ruleParams.outBlockStart;
        let outBlockLen = ruleParams.outBlockLen;
        let inBlockStart = ruleParams.inBlockStart;

        let count = 0;
        for (let i = 0; i < outBlockLen; i++) {
            let p = outBlockStart + i;
            let v = valuesOut[p];
            let q = inBlockStart + i * 2;
            let v1 = (initialParams[q] - initialParams[q + 1]) & 255;
            if (v === v1) {
                ++count;
            }
        }
        let opt = outBlockLen;
        let max = opt;
        let min = 0;
        let score = self.doScore(opt, count, max, min);
        return score;
    },

    getSubtractAdjacentParamsRequiredOutputs(self, inputList){
        let outputList = [];

        for (let inputs of inputList) {
            let output = [];
            for (let i = 0; i < inputs.length; i += 2) {
                let a = inputs[i];
                let b = inputs[i + 1];
                let v = (a - b) & 255
                output.push(v);
            }
            outputList.push(output);
        }
        return outputList;
    },

    byteSubtractAdjacentParams(self, rule, value, address, initialParams, params, outputValues) {
        let outBlockStart = rule.outBlockStart;
        let inBlockStart = rule.inBlockStart;
        let offset = address - outBlockStart;
        let p = inBlockStart + offset * 2;
        let v = (initialParams[p] - initialParams[p + 1]) & 255;
        let score = self.doByteScore(v, value);
        return score;
    },

    multiplyAdjacentParams(self, dataParams, ruleParams) {
        let initialParams = dataParams.initialParams;
        let valuesOut = dataParams.valuesOut;
        let outBlockStart = ruleParams.outBlockStart;
        let outBlockLen = ruleParams.outBlockLen;
        let inBlockStart = ruleParams.inBlockStart;

        let inputIndex = inBlockStart;
        let count = 0;
        for (let i = 0; i < outBlockLen; i++) {
            let v1 = initialParams[inputIndex];
            let v2 = initialParams[inputIndex + 1];
            let v3 = valuesOut[outBlockStart + i];
            if ((v1 * v2) && 255 === v3) ++count; 
            inputIndex += 2;
        }
        let opt = outBlockLen;
        let max = opt;
        let min = 0;
        let score = self.doScore(opt, count, max, min);
        return score;
    },

    getMultiplyAdjacentParamsRequiredOutputs(self, inputList) {
        let outputList = [];

        for (let inputs of inputList) {
            let output = [];
            for (let i = 0; i < inputs.length; i += 2) {
                let a = inputs[i];
                let b = inputs[i + 1];
                let v = (a * b) & 255;
                output.push(v);
            }
            outputList.push(output);
        }
        return outputList;
    },

    byteMultiplyParams(self, rule, value, address, initialParams, params, outputValues) {
        let offset = address - rule.outBlockStart;
        let a = initialParams[rule.inBlockStart + offset * 2];
        let b = initialParams[rule.inBlockStart + offset * 2 + 1];
        let required = (a * b) & 255;
        if (required > 255) {
            required = required & 255;
        }
        let score = self.doByteScore(required, value);
        return score;
    },

    divideAdjacentParams(self, dataParams, ruleParams) {
        let initialParams = dataParams.initialParams;
        let valuesOut = dataParams.valuesOut;
        let outBlockStart = ruleParams.outBlockStart;
        let outBlockLen = ruleParams.outBlockLen;
        let inBlockStart = ruleParams.inBlockStart;

        let count = 0;
        for (let i = 0; i < outBlockLen; i++) {
            let a = initialParams[i * 2 + inBlockStart];
            let b = initialParams[i * 2 + 1 + inBlockStart];
            let d = valuesOut[i + outBlockStart];
            if (b === 0 && d === 0) ++count; 
            else if (d === (Math.floor(a/b) & 255)) ++count;
        }
        let opt = outBlockLen;
        let max = opt;
        let min = 0;
        let score = self.doScore(opt, count, max, min);
        return score;
    },

    getDivideAdjacentParamsRequiredOutputs(self, inputList) {
        let outputList = [];

        for (let inputs of inputList) {
            let output = [];
            for (let i = 0; i < inputs.length; i += 2) {
                let a = inputs[i];
                let b = inputs[i + i];
                let v;
                if (b === 0) v = 0;
                else v = (Math.floor(a/b)) & 255;
                output.push(v);
            }
            outputList.push(output);
        }
        return outputList;
    },

    getSumOfThreeRequiredOutputs(self, inputList) {
        let outputList = [];

        for (let inputs of inputList) {
            let output = [];
            for (let p = 0; p < inputs.length; p += 3) {
                let t = 0;
                for (let i = p; i < p + 3; i++) {
                    t += inputs[i];
                }
                output.push(t);
            }
            outputList.push(output);
        }
        return outputList;
    },

    getAveOfThreeRequiredOutputs(self, inputList) {
        let outputList = [];

        for (let inputs of inputList) {
            let output = [];
            let c = Math.floor(inputs.length / 3);
            for (let i = 0; i < c; i++) {
                let t = 0;
                let p = i * 3;
                for (let j = 0; j < 3; j++) {
                    t += inputs[p + j];
                }
                let a = Math.floor(t / 3) & 255;
                output.push(a);
            }
            outputList.push(output);
        }
        return outputList;
    },

    byteDivideAdjacentParams(self, rule, value, address, initialParams, params, outputValues) {
        let offset = address - rule.outBlockStart;
        let a = initialParams[rule.inBlockStart + offset * 2];
        let b = initialParams[rule.inBlockStart + offset * 2 + 1];
        let required = 0;
        if (b != 0) {
            required = Math.floor(a/b) & 255;
        }
        let score = self.doByteScore(required, value);
        return score;
    },

    paramOperations(self, dataParams, ruleParams) {
        let initialParams = dataParams.initialParams;
        let valuesOut = dataParams.valuesOut;
        let outBlockStart = ruleParams.outBlockStart;
        let outBlockLen = ruleParams.outBlockLen;
        let inBlockStart = ruleParams.inBlockStart;

        let outAddr = outBlockStart;
        let inAddr = inBlockStart;
        let count = 0;
        for (let i = 0; i < outBlockLen; i++) {
            let op = initialParams[inAddr + i * 3];
            if (op === 61) { // =
                let p = initialParams[inAddr + i * 3 + 1];
                let q = initialParams[inAddr + i * 3 + 2];
                let v = valuesOut[p];
                if (v === q) ++count;
            }
            else {
                let v = valuesOut[outAddr + i];
                let a = initialParams[inAddr + i * 3 + 1];
                let b = initialParams[inAddr + i * 3 + 2];
                let r;
                switch (op) {
                    case 43: // +
                        r = (a + b) & 255;
                        break;
                    case 45: // -
                        r = (a - b) & 255;
                        break;
                    case 42: // *
                        r = (a * b) & 255;
                        break;
                    case 37: // %
                        if (b === 0) r = 0;
                        else r = (a % b) & 255;
                        break;
                    case 47: // /
                        if (b === 0) r = 0;
                        else r = Math.floor(a / b) & 255;
                        break;
                    default: 
                        console.error("op error in paramOperations rule at:", i, op, inAddr);
                        r = 0;
                }
                if (r === v) ++count;
            }
        }
        let opt = outBlockLen;
        let max = opt;
        let min = 0;
        let score = self.doScore(opt, count, max, min);
        return score;
    },

    getParamOperationsRequiredOutputs(self, inputList) {
        let outputList = [];

        for (let inputs of inputList) {
            let output = new Array(inputs.length/3).fill(0);
            let p = 0;
            for (let i = 0; i < inputs.length; i += 3) {
                let op = inputs[i];
                let a = inputs[i + 1];
                let b = inputs[i + 2];
                switch (op) {
                    case 61: // =
                        output[a] = b;
                        break;
                    case 43: // +
                        r = (a + b) & 255;
                        output[p] = r;
                        break;
                    case 45: // -
                        r = (a - b) & 255;
                        output[p] = r;
                        break;
                    case 42: // *
                        r = (a * b) & 255;
                        output[p] = r;
                        break;
                    case 37: // %
                        if (b === 0) r = 0;
                        else r = (a % b) & 255;
                        output[p] = r;
                        break;
                    case 47: // /
                        if (b === 0) r = 0;
                        else r = Math.floor(a / b) & 255;
                        output[p] = r;
                        break;
                    default: 
                        console.error("op error in paramOperations rule at:", i, op, inAddr);
                        r = 0;
                        throw "Invalid Op";
                }
                ++p;
            }
            outputList.push(output);
        }
        return outputList;
    },

    byteParamOperations(self, rule, value, address, initialParams, params, outputValues) {
        let score = 255;
        let offset = address - rule.outBlockStart;
        let inAddr = rule.inBlockStart;
        let r;
        // Check whether the address is in the range of the = operators
        let isEqualOp = false;
        let i;
        let addr;
        for (i = 0; i < initialParams.length; i += 3) {
            let op = initialParams[i];
            if (op === 61) {
                addr = initialParams[i + 1];
                if (addr === address) {
                    isEqualOp = true;
                    r = initialParams[i + 2];
                    break;
                }
            }
        }
        if (!isEqualOp) {
            let op = initialParams[inAddr + offset * 3];
            let a = initialParams[inAddr + offset * 3 + 1];
            let b = initialParams[inAddr + offset * 3 + 2];
            switch (op) {
                case 43: // +
                    r = (a + b) & 255;
                    break;
                case 45: // -
                    r = (a - b) & 255;
                    break;
                case 42: // *
                    r = (a * b) & 255;
                    break;
                case 37: // %
                    if (b === 0) r = 0;
                    else r = (a % b) & 255;
                    break;
                case 47: // /
                    if (b === 0) r = 0;
                    else r = Math.floor(a / b) & 255;
                    break;
                default: 
                    console.error("byteParamOperations: op error in paramOperations rule at:", i, addr, offset, op, address);
                    r = 0;
                    throw "op error";
            }
        }
        score = self.doByteScore(r, value);
    
        return score;
    },

    convertASCIINumbers(self, dataParams, ruleParams) {
        let valuesOut = dataParams.valuesOut;
        let iniParams = dataParams.initialParams;
        let outStart = ruleParams.outBlockStart;
        let outLen = ruleParams.outBlockLen;
        let inStart = ruleParams.inBlockStart;

        let count = 0;
        let p = inStart;
        for (let i = 0; i < outLen; i++) {
            let nObj = self.readAndConvertASCIIInput(p, iniParams);
            let n = nObj.n;
            p = nObj.p;
            if (n === valuesOut[outStart + i]) ++count;
        }
        let opt = outLen;
        let max = opt;
        let min = 0;

        let score = self.doScore(opt, count, max, min);
        return score;

    },

    getConvertASCIINumbersRequiredOutputs(self, inputList) {
        let outputList = [];

        for (let inputs of inputList) {
            let output = [];
            let p = 0;
            while (p < inputs.length) {
                nObj = self.readAndConvertASCIIInput(p, inputs);
                output.push(nObj.n);
                p = nObj.p;
            }
            outputList.push(output);
        }
        return outputList;
    },

    byteConvertASCIINumbers(self, rule, value, address, initialParams, params, outputValues) {
        let outStart = rule.outBlockStart;
        let offset = address - outStart;
        let inStart = rule.inBlockStart;

        // Find the matching input string
        let p = inStart;
        if (offset > 0) {
            let c = 0;
            let p1 = inStart;
            let found = false;
            while (c < offset && p1 < 256) {
                let b = String.fromCharCode(initialParams[p1]);
                if (b === ";") {
                    ++c;
                    found = true;
                }
                ++p1;
            }
            if (found) p = p1;
        }

        // Get the ascii number
        let score = 0;
        let nObj = self.readAndConvertASCIIInput(p, initialParams);
        let opt = nObj.n;
        score = self.doByteScore(opt, value); 

        return score;
    },

    readAndConvertASCIIInput(p, iniParams) {
        // Read the parameter
        let p1 = p;
        let s = "";
        let c = "";
        while (c != ";") {
            c = String.fromCharCode(iniParams[p1]);
            if (c != ";") {
                s += c;
                ++p1;
            }
            else {
                ++p1;
                break;
            }
        }
        // Get the numeric value
        let n = parseInt(s);
        return {n: n, p: p1}
    },

    bubbleSort(a) {

        let d = 0;
        let sorted = false;

        while (!sorted) {
            // Check for sort
            sorted = true;
            for (let i = d; i < a.length - (d + 1); i++) {
                let v1 = a[i];
                let v2 = a[i + 1];
                if (v2 < v1) {
                    sorted = false;
                    break;
                }
            }

            if (!sorted) {
                // Bubble up
                for (let i = d; i < a.length - (d + 1); i++) {
                    let v1 = a[i];
                    let v2 = a[i + 1];
                    if (v1 > v2) {
                        a[i] = v2;
                        a[i + 1] = v1;
                    }
                }

                // Bubble down
                for (let i = a.length - (d + 1); i > d; i--) {
                    let v1 = a[i];
                    let v2 = a[i - 1];
                    if (v1 < v2) {
                        a[i - 1] = v1;
                        a[i] = v2;
                    }
                }
            }
            ++d;
        }
    },

    bubbleSort2(a) {

        let p = 0;
        while (p < a.length) {
            let v1 = a[p];
            let v2 = a[p + 1];
            if (v2 < v1) {
                a[p] = v2;
                a[p + 1] = v1;
            }
            // Check for bubble down
            if (p > 0) {
                if (a[p-1] > a[p]) {
                    let p1 = p;
                    while (p1 > 0) {
                        v1 = a[p1];
                        v2 = a[p1 - 1];
                        if (v2 > v1) {
                            a[p1] = v2;
                            a[p1 - 1] = v1;
                        }
                        else {
                            break;
                        }
                        --p1;
                    }
                }
            }
            ++p;
        }
    },

    doScore: function (opt, actual, max, min) {
        let score;
        let x = opt - actual;
        if (x === 0) {
            score = 1;
        }
        else if (x > 0) {
            if (actual < min || (actual === min && min != opt)) score = 0;
            else {
                score = 1 - x/(opt - min);
            }
        }
        else {
            x = Math.abs(x);
            if (actual > max || (actual === max && max != opt)) score = 0;
            else {
                score = 1 - x/(max - opt);
            }
        }
        return score;
    },

    /**
     * In this case treat the minimum as 0, and score anything UPTO the optimum as 1
     * @param {*} opt 
     * @param {*} actual 
     * @param {*} max 
     */
    doScoreAtMost: function(opt, actual, max) {
        let score;
        if (actual <= opt) {
            score = 1;
        }
        else {
            score = 1 - ((actual - opt) / (max - opt));
        }
        return score;
    },

        /**
     * In this case treat the minimum as 0, and score anything from the optimum and above as 1
     * @param {*} opt 
     * @param {*} actual 
     * @param {*} max 
     */
    doScoreAtLeast: function(opt, actual, max) {
        let score;
        if (actual >= opt) {
            score = 1;
        }
        else {
            score = 1 - ((opt - actual) / (opt));
        }
        return score;
    },

    doByteScore(opt, value) {
        let score = 1; // Set to 1 for correct output address
        if (opt === value) score = 2;
        return score;
    },

    seedRuleUpdate(instructionSet, memSpace, score, roundNum) {
        let roundThresholdReached = false;
        let passMark = 0.95
        this.currentMaxScore = this.getCurrentMaxScore(this.ruleSequenceNum);
        let rule = this.getRuleFromSequence(this.ruleSequenceNum);
        let ruleIndex = this.getRuleIndexFromSequence(this.ruleSequenceNum);
        if ("passScore" in rule) {
            passMark = rule.passScore;
        }
        if (score >= this.currentMaxScore * passMark) {
            // Check for common program fragments
            if (this.seedRuleMemSpaces.length > 1) {
                this.updateSeedRuleFragments(instructionSet, memSpace);
                console.error("Fragment list updated:", this.seedRuleFragments.length);
            }

            this.insertSeedRule(memSpace);
            this.ruleRounds[ruleIndex].end = roundNum;
            this.ruleRounds[ruleIndex].ruleLoopEnd = this.numRuleLoops;
            this.ruleRounds[ruleIndex].completed = true;
            this.seedRuleSet = true;

            ++this.ruleSequenceNum;
            if (this.ruleSequenceNum > this.maxRuleSequenceNum) {
                this.ruleSequenceNum = 0;
                ++this.numRuleLoops;
            }
            this.ruleSequenceNum = this.findNextNonCompleteRule(this.ruleSequenceNum);
            let newRuleIndex = this.getRuleIndexFromSequence(this.ruleSequenceNum);
            // Find the next non-completed rule
            this.ruleRounds[newRuleIndex].start = roundNum;
            this.currentMaxScore = this.getCurrentMaxScore(this.ruleSequenceNum);
        }
        else if (roundNum >= this.ruleRounds[ruleIndex].start + this.maxRoundsPerRule) {
            // Save the sub-optimal result for reference
            let subOptRuleItem = {};
            let item = this.getRuleFromSequence(this.ruleSequenceNum);
            let ruleId = item.ruleId;
            subOptRuleItem.ruleId = ruleId;
            subOptRuleItem.memSpace = memSpace;
            this.subOptRuleMemSpaces.push(subOptRuleItem);
            this.subOptRuleSet = true;
            this.bestsStore.push(subOptRuleItem);
            // Rule exceeds limit for number of rounds to pass
            ++this.ruleSequenceNum;
            if (this.ruleSequenceNum > this.maxRuleSequenceNum) {
                // Max rule reached
                ++this.numRuleLoops;
                // Search for the first non-completed rule
                this.ruleSequenceNum = 0;
            }
            this.ruleSequenceNum = this.findNextNonCompleteRule(this.ruleSequenceNum);
            let newRuleIndex = this.getRuleIndexFromSequence(this.ruleSequenceNum);
            this.ruleRounds[newRuleIndex].start = roundNum;
            roundThresholdReached = true;
        }
        else {
            this.seedRuleSet = false;
        }
        return roundThresholdReached;
    },

    findNextNonCompleteRule(ruleSequenceNum) {
        let newRuleIndex = this.getRuleIndexFromSequence(ruleSequenceNum);
        let found = false;
        let i = newRuleIndex;
        let count = 0;
        for (count = 0; count < this.ruleRounds.length; count++) {
            if (!this.scoreList[i].retain && !this.scoreList[i].skip) {
                if (!this.ruleRounds[i].completed) {
                    found = true;
                    break;
                }
            }
            ++i;
            if (i > this.ruleRounds.length) { 
                i = 0;
            }
        }
        if (found) {
            ruleSequenceNum = this.scoreList[i].sequenceNum;
        }
        else {
            ruleSequenceNum = 0;
        }
        return ruleSequenceNum;
    },

    insertSeedRule(memSpace) {
        let seedRuleItem = {};
        let item = this.getRuleFromSequence(this.ruleSequenceNum);
        let ruleId = item.ruleId;
        seedRuleItem.ruleId = ruleId;
        seedRuleItem.memSpace = memSpace;
        // Check whether this rule is already listed
        let found = false;
        let index = 0;
        for (let m of this.seedRuleMemSpaces) {
            if (m.ruleId === ruleId) {
                found = true;
                break;
            }
            ++index;
        }
        if (found) {
            this.seedRuleMemSpaces[index] = seedRuleItem;
        }
        else {
            this.seedRuleMemSpaces.push(seedRuleItem);
        }
        this.seedRuleSet = true;
    },
    
    updateSeedRuleFragments(instructionSet, memSpace) {
        const maxSections = 30;
        let sectionList = [];

        for (let i = 0; i < maxSections; i++) {
            // Extract a section from the memspace
            let sectionObj = this.extractMemSpaceFragment(instructionSet, memSpace, sectionList);
            if (sectionObj.abandonned) {
                break;
            }
            else {
                let section = sectionObj.section;
                // Check whether this section already exists in the fragment list
                let sectionExists = this.getSeedFragmentListed(section);
                if (!sectionExists) { 
                    // Search the seed rules for this section
                    let fragmentMatched = this.searchRuleSeedForFragment(section);
                    if (fragmentMatched) {
                        // Add it to the list of fragments
                        this.seedRuleFragments.push(section);
                    }
                }
            }
        }
    },

    searchRuleSeedForFragment(section) {
        let sectionMatched = false;
        for (let ruleSeedItem of this.seedRuleMemSpaces) {
            let seedMemSpace = ruleSeedItem.memSpace;
            let p = 0;
            while (!sectionMatched && p < seedMemSpace.length - section.length) {
                if (seedMemSpace[p] === section[0]) {
                    let codeFound = true;
                    let p1 = p;
                    let sp = 0;
                    for (let i = 1; i < section.length; i++) {
                        let v1 = seedMemSpace[p1 + i];
                        let v2 = section[sp + i];
                        if (v1 != v2) {
                            codeFound = false;
                            break;
                        }
                    }
                    if (codeFound) {
                        sectionMatched = true;
                        break;
                    }
                }
                ++p;
            }
            if (sectionMatched) break;
        }
        return sectionMatched;
    },

    getSeedFragmentListed(section) {
        let sectionExists = false;
        for (let listedSection of this.seedRuleFragments) {
            if (listedSection.length === section.length) {
                let found = true;
                for (let i = 0; i < section.length; i++) {
                    if (section[i] != listedSection[i]) {
                        found = false;
                        break;
                    }
                }
                if (found) {
                    sectionExists = true;
                    break;
                }
            }
        }
        return sectionExists;
    },

    extractMemSpaceFragment(instructionSet, memSpace, sectionList) {
        let attemptCount = 0;
        let maxAttempts = 16;
        let sectionFound = false;
        let section = [];
        while (attemptCount < maxAttempts && !sectionFound) {
            // Choose a segment start and length
            section = [];
            let sectionStart = Math.floor(Math.random() * 120);
            let sectionLen = Math.floor(Math.random() * 14) + 3;
            // Check the sectionList for already done
            let sectionDone = false;
            for (let sectionDetails of sectionList) {
                if (sectionDetails.start === sectionStart && sectionDetails.len === sectionLen) {
                    sectionDone = true;
                    break;
                }
            }
            if (sectionDone) {
                ++attemptCount;
            }
            else {
                sectionList.push({start: sectionStart, len: sectionLen, used: false})
                // Extract the code section
                // Advance to the start position
                let insNum = 0;
                let p = 0;
                while (insNum < sectionStart) {
                    let code = memSpace[p];
                    let insItem = instructionSet.getInsDetails(code);
                    p += insItem.insLen;
                    ++insNum;
                }
                let sectionValid = true;
                // Get the code Section
                while (insNum < sectionStart + sectionLen && p < memSpace.length) {
                    let code = memSpace[p];
                    let insItem = instructionSet.getInsDetails(code);
                    if (insItem.name === "RETF") {
                        sectionValid = false;
                        break;
                    }
                    // Insert the instruction
                    section.push(code);
                    for(let i = 1; i < insItem.insLen; i++) {
                        let d = memSpace[p + i];
                        section.push(d);
                    }
                    p += insItem.insLen;
                    if (p >= memSpace.length) {
                        if (insNum < sectionStart + sectionLen) {
                            sectionValid = false;
                        }
                        break;
                    }
                    ++insNum;
                }
                // Validate the section
                if (sectionValid) {
                    p = 0;
                    let zeroCount = 0;
                    let lastZero = false;
                    while(sectionValid && p < section.length) {
                        let c = section[p];
                        if (c === 0) {
                            if (lastZero) ++zeroCount;
                            if (zeroCount >= 2) {
                                sectionValid = false;
                                break;
                            }
                            lastZero = true;
                        }
                        else {
                            lastZero = false;
                            zeroCount = 0;
                        }
                        ++p;
                    }
                }
                if (!sectionValid) {
                    ++attemptCount;
                }
                else {
                    sectionFound = true;
                    sectionList[sectionList.length - 1].used = true;
                    break;
                }
            }
        }
        if (!sectionFound) return {abandonned: true, section: []};
        return {abandonned: false, section: section};
    },

    getDescriptionFromSequence(sequenceNum) {
        let found = false;
        let rule = "";
        for (let item of this.scoreList) {
            if (item.sequenceNum === sequenceNum && item.retain === false && item.skip === false) {
                found = true;
                rule = item.rule;
                break;
            }
        }
        return rule;
    },

    getDescriptionFromRuleId(ruleId) {
        let found = false;
        let rule = "";
        for (let item of this.scoreList) {
            if (item.ruleId === ruleId) {
                found = true;
                rule = item.rule;
                break;
            }
        }
        return rule;
    },

    fetchRuleSequenceList() {
        this.initialise();
        let ruleList = [];
        for (let rule of this.scoreList) {
            if (!rule.skip) {
                if (!rule.retain) {
                    let item = {}
                    item.sequenceNum = rule.sequenceNum;
                    item.rule = rule.rule;
                    ruleList.push(item);
                }
            }
        }
        return ruleList;
    },

    testOutputByte(p, valuesOut, executionCycle, ruleSequenceNum) {
        let ruleIndex = this.getRuleIndexFromSequence(ruleSequenceNum);
        let rule = this.scoreList[ruleIndex];
        if ("outputs" in rule) {
            let output = rule.outputs[executionCycle];
            if (p >= 3) return 0;
            if (valuesOut[p] === output[p]) return 1;
            else return 0;

        }
        else {
            return 0;
        }
    },

    getRuleFromSequence(sequenceNum) {
        let rule;
        let found = false;
        for (rule of this.scoreList) {
            if (!rule.retain && !rule.skip) {
                if (rule.sequenceNum === sequenceNum) {
                    found = true;
                    break;
                }
            }
        }
        if (!found) {
            console.error("getRuleFromSequence: invalid sequence num - sequenceNum:", sequenceNum, this.scoreList[13]);
            throw "Invalid Rule Sequence Num";
        }
        return rule;
    },

    getRuleFromRuleId(ruleId) {
        for (let rule of this.scoreList) {
            if (rule.ruleId === ruleId) {
                return rule;
            }
        }
    },

    getRuleIndexFromSequence(sequenceNum) {
        let found = false;
        let index = 0;
        for (let rule of this.scoreList) {
            if (rule.sequenceNum === sequenceNum && !rule.retain && !rule.skip) {
                found = true;
                break;
            }
            ++index;
        }
        if (!found) return -1;
        return index;
    },

    getCurrentParamsIn() {
        let rule = this.getRuleFromSequence(this.ruleSequenceNum);
        let paramsIn = null;
        if ("paramsIn" in rule) paramsIn = rule.paramsIn;
        return paramsIn;
    },

    getParamsInFromRuleSequence(ruleSequenceNum) {
        let rule = this.getRuleFromSequence(ruleSequenceNum);
        let paramsIn = null;
        if ("paramsIn" in rule) {
            if (rule.paramsIn.length > 0) {
                paramsIn = rule.paramsIn;
            }
        }
        return paramsIn;
    },

    getCurrentRuleStartRound() {
        let ruleIndex = this.getRuleIndexFromSequence(this.ruleSequenceNum);
        let startRound = this.ruleRounds[ruleIndex].start;
        return startRound;
    }
}

module.exports = rulesets;