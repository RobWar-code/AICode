const { app } = require('electron');
const path = require('node:path');
const testObj = require(path.join(__dirname, 'testObj'));

const rulesets = {
    meanInsLen: 1.5,
    meanInsCount: 240 / 1.5,
    numOutputZones: 8,
    outputZoneLen: 8,
    numRules: 67,
    maxRuleId: 66,
    scoreList: [],
    ruleFunction: [],
    byteFunction: [],
    requiredOutputsFunction: [],
    totalScore: 0,
    currentMaxScore: 0,
    maxScore: 0,
    diffScore: 0,
    ignoreRounds: true,
    bestEntity: null,
    ruleSequenceNum: 0,
    maxRuleSequenceNum: 0,
    ruleCompletionRound: new Array(67).fill(-1),
    seedRuleNum: 9,
    seedRuleMemSpaces: [],
    seedRuleFragments: [],
    seedRuleSet: false,
    executionScores: [],

    initialise() {

        this.scoreList = [];
        this.ruleFunction = [];
        this.byteFunction = [];
        this.requiredOutputsFunction = [];

        let scoreItem0 = {rule: "Instruction Distribution", ruleId: 0, skip: true, retain: true, 
            sequenceNum: 0, score: 0, max: 2, startRoundNum: 800};
        this.scoreList.push(scoreItem0);
        this.ruleFunction.push(this.insDistribution);
        this.byteFunction.push(null);
        this.requiredOutputsFunction.push(null);

        let scoreItem1 = {rule: "Matching CASM Instruction", ruleId: 1, skip: true, sequenceNum: 0,
            score: 0, max: 4, startRoundNum: 0};
        this.scoreList.push(scoreItem1);
        this.ruleFunction.push(this.matchCASM);
        this.byteFunction.push(null);
        this.requiredOutputsFunction.push(null);

        let scoreItem2 = {rule: "Number of reverse JR ins", ruleId: 2, skip: true, sequenceNum: 0,
            score: 0, max: 4, startRoundNum: 0
        }
        this.scoreList.push(scoreItem2);
        this.ruleFunction.push(this.reverseJR);
        this.byteFunction.push(null);
        this.requiredOutputsFunction.push(null);

        // It would be better to do this rule as a rule specific estimate
        let scoreItem3 = {rule: "Instruction Counter", ruleId: 3, skip: false, retain: true,
            sequenceNum: 0, score: 0, max: 0.5, startRoundNum: 800};
        this.scoreList.push(scoreItem3);
        this.ruleFunction.push(this.instructionCount);
        this.byteFunction.push(null);
        this.requiredOutputsFunction.push(null);

        let scoreItem4 = {rule: "Highest IP", ruleId: 4, skip: false, retain: true,
            sequenceNum: 0, score: 0, max: 1, startRoundNum: 800};
        this.scoreList.push(scoreItem4);
        this.ruleFunction.push(this.highestIPScore);
        this.byteFunction.push(null);
        this.requiredOutputsFunction.push(null);

        let scoreItem5 = {rule: "Number of Input Reads", ruleId: 53, skip: true, retain: true,
            sequenceNum: 0, score: 0, max: 2, startRoundNum: 0
        }
        this.scoreList.push(scoreItem5);
        this.ruleFunction.push(this.numInputReads);
        this.byteFunction.push(null);
        this.requiredOutputsFunction.push(null);

        let scoreItem6 = {rule: "Params Preserved", ruleId: 5, skip: true, sequenceNum: 0,
            retain: true, score: 0, max: 3, startRoundNum: 0};
        this.scoreList.push(scoreItem6);
        this.ruleFunction.push(this.initialParamsPreserved);
        this.byteFunction.push(null);
        this.requiredOutputsFunction.push(null);

        let scoreItem7 = {rule: "Values Out Set", ruleId: 6, skip: false, sequenceNum: 0,
            retain: true, score: 0, max: 1, startRoundNum: 0, 
            outBlockStart: 0, outBlockLen: 128 
        };
        this.scoreList.push(scoreItem7);
        this.ruleFunction.push(this.valuesOutSet);
        this.byteFunction.push(null);
        this.requiredOutputsFunction.push(null);

        let scoreItem8 = {rule: "Values Out From Params", ruleId: 7, skip: true,
            score: 0, max: 4, startRoundNum: 800,
            outBlockStart: 0, outBlockLen: 8, inBlockStart: 0, inBlockLen: 8
        };
        this.scoreList.push(scoreItem8);
        this.ruleFunction.push(this.valuesOutFromParams)
        this.byteFunction.push(this.byteValuesOutFromParams);
        this.requiredOutputsFunction.push(null);

        let scoreItem9 = {rule: "Values Out From Initial Params", ruleId: 8, skip: true,
            score: 0, max: 4, 
            startRoundNum: 800,
            outBlockStart: 0, outBlockLen: 8, inBlockStart: 0, inBlockLen: 8
        };
        this.scoreList.push(scoreItem9);
        this.ruleFunction.push(this.valuesOutFromInitialParams);
        this.byteFunction.push(this.byteValuesOutFromInitialParams);
        this.requiredOutputsFunction.push(null);

        let scoreItem10 = {rule:"Values Out Match Initial Params", ruleId: 9, skip: false, sequenceNum: 0,
            retain: false, score: 0, completionRound: -1, max: 5,
            startRoundNum: 0,
            outBlockStart: 0, outBlockLen: 16, inBlockStart: 0, inBlockLen: 16,
            highIC: 7 * 16 + 4 * 100,
            sampleIn: [7,5,4,18,19,36,220,190,5,18,19,35,65,72,84,92],
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
        };
        this.scoreList.push(scoreItem10);
        this.ruleFunction.push(this.valuesOutMatchInitialParams);
        this.byteFunction.push(this.byteValuesOutMatch);
        this.requiredOutputsFunction.push(this.getValuesOutMatchRequiredOutputs);

        let scoreItem11 = {rule: "Values Out Different", ruleId: 10, skip:true,
            score: 0, max: 1, startRoundNum: 800,
            outBlockStart: 0, outBlockLen: 8
        };
        this.scoreList.push(scoreItem11);
        this.ruleFunction.push(this.valuesOutDifferent);
        this.byteFunction.push(this.byteValuesOutDifferent);
        this.requiredOutputsFunction.push(null);

        let scoreItem12 = {rule: "Output Series", ruleId: 11, retain: false, skip: false,
            sequenceNum: 1, score: 0, max: 5, startRoundNum: 800,
            outBlockStart: 0, outBlockLen: 16,
            highIC: 7 * 16 + 5 * 100,
            insDistribution: [
                {
                    ins: "LDI A, (C)",
                    countOpt: 2,
                    scanStart: 0,
                    scanEnd: 16
                },
                {
                    ins: "JRNZ",
                    countOpt: 2,
                    scanStart: 24,
                    scanEnd: 42
                }
            ],
            sampleIn: [3,4],
            sampleOut: [],
            paramsIn: [
                [2,8],
                [5,12],
                [7,5],
                [10,16]
            ],
            outputs: []
        };
        this.scoreList.push(scoreItem12);
        this.ruleFunction.push(this.outputSeries);
        this.byteFunction.push(this.byteOutputSeries);
        this.requiredOutputsFunction.push(this.getOutputSeriesRequiredOutputs);

        let scoreItem13 = {rule: "Output Series Of Series 1", ruleId: 52, retain: false, skip: false,
            sequenceNum: 2, score: 0, max: 5, startRoundNum: 800,
            outBlockStart: 0, outBlockLen: 64,
            optICFactor: 37,
            highIC: 9 * 16 * 5,
            sampleIn: [3,16,3],
            sampleOut: [],
            paramsIn: [
                [2,16,5],
                [5,16,5],
                [7,16,5],
                [10,16,5]
            ],
            outputs: []
        };
        this.scoreList.push(scoreItem13);
        this.ruleFunction.push(this.outputSeriesOfSeries);
        this.byteFunction.push(this.byteOutputSeriesOfSeries);
        this.requiredOutputsFunction.push(this.getOutputSeriesOfSeriesRequiredOutputs);

        let scoreItem14 = {rule: "Output Series Of Series 2", ruleId: 51, retain: false, skip: false,
            sequenceNum: 3, score: 0, max: 5, startRoundNum: 800,
            outBlockStart: 0, outBlockLen: 64,
            highIC: 9 * 16 * 5,
            sampleIn: [3,15,3],
            sampleOut: [],
            paramsIn: [
                [2,16,3],
                [5,16,2],
                [7,16,4],
                [10,16,5]
            ],
            outputs: []
        };
        this.scoreList.push(scoreItem14);
        this.ruleFunction.push(this.outputSeriesOfSeries);
        this.byteFunction.push(this.byteOutputSeriesOfSeries);
        this.requiredOutputsFunction.push(this.getOutputSeriesOfSeriesRequiredOutputs);

        let scoreItem15 = {rule: "Output Series Of Series 3", ruleId: 50, retain: false, skip: false,
            sequenceNum: 4, highIP: 42, score: 0, max: 5, startRoundNum: 800,
            outBlockStart: 0, outBlockLen: 20,
            highIC: 9 * 12 * 5,
            sampleIn: [4,10,3],
            sampleOut: [],
            paramsIn: [
                [3,12,5],
                [6,4,4],
                [9,7,4],
                [11,3,5]
            ]
        };
        this.scoreList.push(scoreItem15);
        this.ruleFunction.push(this.outputSeriesOfSeries);
        this.byteFunction.push(this.byteOutputSeriesOfSeries);
        this.requiredOutputsFunction.push(this.getOutputSeriesOfSeriesRequiredOutputs);

        let scoreItem16 = {rule: "Add First Param", ruleId: 12,
            retain: false, skip: false, sequenceNum: 5, 
            score: 0, completionRound: -1, max: 5, startRoundNum: 800,
            outBlockStart: 0, outBlockLen: 16,
            inBlockStart: 0, inBlockLen: 16,
            highIC: 9 * 16 + 100 * 4,
            sampleIn: [12,3,19,24,190,87,65,221,120,95,86,38,72,86,254,112],
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
        };
        this.scoreList.push(scoreItem16);
        this.ruleFunction.push(this.addFirstParam);
        this.byteFunction.push(this.byteAddFirstParam);
        this.requiredOutputsFunction.push(this.getAddFirstParamRequiredOutputs);

        let scoreItem17 = {rule: "Subtract First Param", ruleId: 13,
            retain: false, skip: false, sequenceNum: 6, 
            score: 0, completionRound: -1, max: 5, startRoundNum: 800,
            outBlockStart: 0, outBlockLen: 16,
            inBlockStart: 0, inBlockLen: 16,
            highIC: 9 * 16 + 100 * 4,
            sampleIn: [10,25,34,65,53,98,87,110,5,86,93,63,76,81,24,32],
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
        };
        this.scoreList.push(scoreItem17);
        this.ruleFunction.push(this.subtractFirstParam);
        this.byteFunction.push(this.byteSubtractFirstParam);
        this.requiredOutputsFunction.push(this.getSubtractFirstParamRequiredOutputs);

        let scoreItem18 = {rule: "Odd And Even Params", ruleId: 14,
            retain: false, skip: false, sequenceNum: 7, 
            score: 0, completionRound: -1, max: 5, startRoundNum: 800,
            outBlockStart: 0, outBlockLen: 16,
            inBlockStart: 0, inBlockLen: 16,
            highIC: 9 * 16 + 100 * 4,
            sampleIn: [3,4,7,9,8,10,12,5,29,31,85,2,4,15,91,84],
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
        };
        this.scoreList.push(scoreItem18);
        this.ruleFunction.push(this.oddAndEvenParams);
        this.byteFunction.push(this.byteOddAndEvenParams);
        this.requiredOutputsFunction.push(this.getOddAndEvenParamsRequiredOutputs);

        let scoreItem19 = {rule: "Multiply By First Param 1", ruleId: 15,
            retain: false, skip: false, sequenceNum: 8, 
            score: 0, completionRound: -1, max: 5, startRoundNum: 800,
            outBlockStart: 0, outBlockLen: 16,
            inBlockStart: 0, inBlockLen: 16,
            highIC: 4 * 10 * 16 + 100 * 4,
            sampleIn: [4,6,51,23,25,31,18,10,12,65,32,43,14,21,31,7],
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
        };
        this.scoreList.push(scoreItem19);
        this.ruleFunction.push(this.multiplyByFirstParam);
        this.byteFunction.push(this.byteMultiplyByFirstParam);
        this.requiredOutputsFunction.push(this.getMultiplyByFirstParamRequiredOutputs);

        let scoreItem20 = {rule: "Multiply By First Param 2", ruleId: 16,
            retain: false, skip: false, sequenceNum: 9, 
            score: 0, completionRound: -1, max: 5, startRoundNum: 800,
            outBlockStart: 0, outBlockLen: 16,
            inBlockStart: 0, inBlockLen: 16,
            highIC: 6 * 10 * 16 + 100 * 4,
            sampleIn: [5,3,12,34,43,53,42,13,21,27,32,19,8,7,6,4],
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
        };
        this.scoreList.push(scoreItem20);
        this.ruleFunction.push(this.multiplyByFirstParam);
        this.byteFunction.push(this.byteMultiplyByFirstParam);
        this.requiredOutputsFunction.push(this.getMultiplyByFirstParamRequiredOutputs);

        let scoreItem21 = {rule: "Multiply By First Param 3", ruleId: 17,
            retain: false, skip: false, sequenceNum: 10, 
            score: 0, completionRound: -1, max: 5, startRoundNum: 800,
            outBlockStart: 0, outBlockLen: 16,
            inBlockStart: 0, inBlockLen: 16,
            highIC: 9 * 10 * 16 + 100 * 4,
            sampleIn: [8,3,5,20,24,30,35,19,17,6,4,5,8,11,17,19],
            sampleOut: [],
            paramsIn: [
                [
                    5,20,15,11,96,3,8,200,128,255,27,29,31,14,16,21
                ],
                [
                    9,22,43,67,69,81,72,186,215,4,9,15,22,38,104,126
                ]
            ]
        };
        this.scoreList.push(scoreItem21);
        this.ruleFunction.push(this.multiplyByFirstParam);
        this.byteFunction.push(this.byteMultiplyByFirstParam);
        this.requiredOutputsFunction.push(this.getMultiplyByFirstParamRequiredOutputs);

        let scoreItem22 = {rule: "Modulo First Param 1", ruleId: 43,
            retain: false, skip: false, sequenceNum: 11, 
            score: 0, completionRound: -1, max: 5, startRoundNum: 800,
            outBlockStart: 0, outBlockLen: 16,
            inBlockStart: 0, inBlockLen: 16,
            highIC: 50 * 9 * 16 + 100 * 4,
            sampleIn: [4,19,30,65,207,191,3,18,20,48,64,76,54,19,32,17],
            sampleOut: [], 
            paramsIn: [
                [
                    2,20,15,11,96,3,8,200,128,255,27,29,31,14,16,21
                ],
                [
                    4,22,43,67,69,81,72,186,215,4,9,15,22,38,104,126
                ]
            ]
        };
        this.scoreList.push(scoreItem22);
        this.ruleFunction.push(this.moduloFirstParam);
        this.byteFunction.push(this.byteModuloFirstParam);
        this.requiredOutputsFunction.push(this.getModuloFirstParamRequiredOutputs);

        let scoreItem23 = {rule: "Modulo First Param 2", ruleId: 46,
            retain: false, skip: false, sequenceNum: 12, 
            score: 0, completionRound: -1, max: 5, startRoundNum: 800,
            outBlockStart: 0, outBlockLen: 16,
            inBlockStart: 0, inBlockLen: 16,
            highIC: 30 * 9 * 16 + 100 * 4,
            sampleIn: [5,5,8,90,180,217,86,64,32,54,98,118,96,17,24,23],
            sampleOut: [],
            paramsIn: [
                [
                    3,20,15,11,96,3,8,200,128,255,27,29,31,14,16,21
                ]
            ],
            outputs: []
        };
        this.scoreList.push(scoreItem23);
        this.ruleFunction.push(this.moduloFirstParam);
        this.byteFunction.push(this.byteModuloFirstParam);
        this.requiredOutputsFunction.push(this.getModuloFirstParamRequiredOutputs);

        let scoreItem24 = {rule: "Modulo First Param 3", ruleId: 47,
            retain: false, skip: false, sequenceNum: 13, 
            score: 0, completionRound: -1, max: 5, startRoundNum: 800,
            outBlockStart: 0, outBlockLen: 16,
            inBlockStart: 0, inBlockLen: 16,
            highIC: 20 * 9 * 16 + 100 * 4,
            sampleIn: [7,19,24,87,196,216,86,96,54,49,24,8,19,43,72,12],
            sampleOut: [],
            paramsIn: [
                [
                    5,20,15,11,96,3,8,200,128,255,27,29,31,14,16,21
                ]
            ],
            outputs: []
        };
        this.scoreList.push(scoreItem24);
        this.ruleFunction.push(this.moduloFirstParam);
        this.byteFunction.push(this.byteModuloFirstParam);
        this.requiredOutputsFunction.push(this.getModuloFirstParamRequiredOutputs);

        let scoreItem25 = {rule: "Modulo First Param 4", ruleId: 48,
            retain: false, skip: false, sequenceNum: 14, 
            score: 0, completionRound: -1, max: 5, startRoundNum: 800,
            outBlockStart: 0, outBlockLen: 16,
            inBlockStart: 0, inBlockLen: 16,
            highIC: 16 * 9 * 16 + 100 * 4,
            sampleIn: [9,18,24,5,78,196,112,90,76,63,24,87,18,93,75,202],
            sampleOut: [],
            paramsIn: [
                [
                    6,20,15,11,96,3,8,200,128,255,27,29,31,14,16,21
                ]
            ],
            outputs: []
        };
        this.scoreList.push(scoreItem25);
        this.ruleFunction.push(this.moduloFirstParam);
        this.byteFunction.push(this.byteModuloFirstParam);
        this.requiredOutputsFunction.push(this.getModuloFirstParamRequiredOutputs);

        let scoreItem26 = {rule: "Modulo First Param 5", ruleId: 49,
            retain: false, skip: false, sequenceNum: 15, 
            score: 0, completionRound: -1, max: 5, startRoundNum: 800,
            outBlockStart: 0, outBlockLen: 16,
            inBlockStart: 0, inBlockLen: 16,
            highIC: 15 * 9 * 16 + 100 * 4,
            sampleIn: [12,45,37,98,147,56,215,54,76,85,180,17,54,9,11,19],
            sampleOut: [],
            paramsIn: [
                [
                    7,20,15,11,96,3,8,200,128,255,27,29,31,14,16,21
                ]
            ],
            outputs: []
        };
        this.scoreList.push(scoreItem26);
        this.ruleFunction.push(this.moduloFirstParam);
        this.byteFunction.push(this.byteModuloFirstParam);
        this.requiredOutputsFunction.push(this.getModuloFirstParamRequiredOutputs);

        let scoreItem27 = {rule: "Modulo First Param 6", ruleId: 45,
            retain: false, skip: false, sequenceNum: 16, 
            score: 0, completionRound: -1, max: 5, startRoundNum: 800,
            outBlockStart: 0, outBlockLen: 16,
            inBlockStart: 0, inBlockLen: 16,
            highIC: 20 * 9 * 16 + 100 * 4,
            sampleIn: [15,87,45,13,91,100,95,30,76,84,83,82,19,8,21,24],
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
        };
        this.scoreList.push(scoreItem27);
        this.ruleFunction.push(this.moduloFirstParam);
        this.byteFunction.push(this.byteModuloFirstParam);
        this.requiredOutputsFunction.push(this.getModuloFirstParamRequiredOutputs);

        let scoreItem28 = {rule: "Modulo First Param 7", ruleId: 44,
            retain: false, skip: false, sequenceNum: 17, 
            score: 0, completionRound: -1, max: 5, startRoundNum: 800,
            outBlockStart: 0, outBlockLen: 16,
            inBlockStart: 0, inBlockLen: 16,
            highIC: 33 * 9 * 16 + 100 * 4,
            sampleIn: [11,121,48,76,198,212,86,245,75,190,15,17,11,12,13,85],
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
        };
        this.scoreList.push(scoreItem28);
        this.ruleFunction.push(this.moduloFirstParam);
        this.byteFunction.push(this.byteModuloFirstParam);
        this.requiredOutputsFunction.push(this.getModuloFirstParamRequiredOutputs);

        let scoreItem29 = {rule: "Divide by First Param 1", ruleId: 18,
            retain: false, skip: false, sequenceNum: 18, 
            score: 0, completionRound: -1, max: 5, startRoundNum: 800,
            outBlockStart: 0, outBlockLen: 16,
            inBlockStart: 0, inBlockLen: 16,
            highIC: 50 * 9 * 16 + 100 * 4,
            highIP: 60,
            sampleIn: [5,10,15,20,31,33,87,121,64,236,119,125,64,63,62,12],
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
        };
        this.scoreList.push(scoreItem29);
        this.ruleFunction.push(this.divideByFirstParam);
        this.byteFunction.push(this.byteDivideByFirstParam);
        this.requiredOutputsFunction.push(this.getDivideByFirstParamRequiredOutputs);

        let scoreItem30 = {rule: "Divide by First Param 2", ruleId: 39,
            retain: false, skip: false, sequenceNum: 19, 
            score: 0, completionRound: -1, max: 5, startRoundNum: 800,
            outBlockStart: 0, outBlockLen: 16,
            inBlockStart: 0, inBlockLen: 16,
            highIC: 30 * 9 * 16 + 100 * 4,
            highIP: 60,
            sampleIn: [3,9,12,18,36,48,87,180,53,64,97,237,181,18,64,17],
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
        };
        this.scoreList.push(scoreItem30);
        this.ruleFunction.push(this.divideByFirstParam);
        this.byteFunction.push(this.byteDivideByFirstParam);
        this.requiredOutputsFunction.push(this.getDivideByFirstParamRequiredOutputs);

        let scoreItem31 = {rule: "Divide by First Param 3", ruleId: 41,
            retain: false, skip: false, sequenceNum: 20, 
            score: 0, completionRound: -1, max: 5, startRoundNum: 800,
            outBlockStart: 0, outBlockLen: 16,
            inBlockStart: 0, inBlockLen: 16,
            highIC: 16 * 9 * 16 + 100 * 4,
            highIP: 60,
            sampleIn: [6,8,9,64,53,27,98,247,45,85,17,24,45,46,76,32],
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
        };
        this.scoreList.push(scoreItem31);
        this.ruleFunction.push(this.divideByFirstParam);
        this.byteFunction.push(this.byteDivideByFirstParam);
        this.requiredOutputsFunction.push(this.getDivideByFirstParamRequiredOutputs);

        let scoreItem32 = {rule: "Divide by First Param 4", ruleId: 42,
            retain: false, skip: false, sequenceNum: 21, 
            score: 0, completionRound: -1, max: 5, startRoundNum: 800,
            outBlockStart: 0, outBlockLen: 16,
            inBlockStart: 0, inBlockLen: 16,
            highIC: 16 * 9 * 16 + 100 * 4,
            highIP: 60,
            sampleIn: [12,144,87,86,50,212,119,8,65,76,86,17,18,34,36,17],
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
        };
        this.scoreList.push(scoreItem32);
        this.ruleFunction.push(this.divideByFirstParam);
        this.byteFunction.push(this.byteDivideByFirstParam);
        this.requiredOutputsFunction.push(this.getDivideByFirstParamRequiredOutputs);

        let scoreItem33 = {rule: "Divide by First Param 5", ruleId: 40,
            retain: false, skip: false, sequenceNum: 22, 
            score: 0, completionRound: -1, max: 5, startRoundNum: 800,
            outBlockStart: 0, outBlockLen: 16,
            inBlockStart: 0, inBlockLen: 16,
            highIC: 13 * 9 * 16 + 100 * 4,
            highIP: 60,
            sampleIn: [7,49,56,90,87,14,32,54,86,197,230,145,86,185,82,19],
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
        };
        this.scoreList.push(scoreItem33);
        this.ruleFunction.push(this.divideByFirstParam);
        this.byteFunction.push(this.byteDivideByFirstParam);
        this.requiredOutputsFunction.push(this.getDivideByFirstParamRequiredOutputs);

        let scoreItem34 = {rule: "Divide by First Param 6", ruleId: 37,
            retain: false, skip: false, sequenceNum: 23, 
            score: 0, completionRound: -1, max: 5, startRoundNum: 800,
            outBlockStart: 0, outBlockLen: 16,
            inBlockStart: 0, inBlockLen: 16,
            highIC: 16 * 9 * 16 + 100 * 4,
            highIP: 60,
            sampleIn: [8,64,86,90,108,84,25,32,65,64,72,89,150,160,12,16],
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
        };
        this.scoreList.push(scoreItem34);
        this.ruleFunction.push(this.divideByFirstParam);
        this.byteFunction.push(this.byteDivideByFirstParam);
        this.requiredOutputsFunction.push(this.getDivideByFirstParamRequiredOutputs);

        let scoreItem35 = {rule: "Divide by First Param 7", ruleId: 38,
            retain: false, skip: false, sequenceNum: 24, 
            score: 0, completionRound: -1, max: 5, startRoundNum: 800,
            outBlockStart: 0, outBlockLen: 16,
            inBlockStart: 0, inBlockLen: 16,
            highIC: 10 * 9 * 16 + 100 * 4,
            highIP: 60,
            sampleIn: [7,49,87,90,14,17,21,34,57,86,98,87,119,212,81,43],
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
        };
        this.scoreList.push(scoreItem35);
        this.ruleFunction.push(this.divideByFirstParam);
        this.byteFunction.push(this.byteDivideByFirstParam);
        this.requiredOutputsFunction.push(this.getDivideByFirstParamRequiredOutputs);

        let scoreItem36 = {rule: "Greater than First Param", ruleId: 19,
            retain: false, skip: false, sequenceNum: 25, 
            score: 0, completionRound: -1, max: 5, startRoundNum: 800,
            outBlockStart: 0, outBlockLen: 16,
            inBlockStart: 0, inBlockLen: 16,
            highIC: 16 * 8 + 100 * 4,
            sampleIn: [17,98,4,86,15,17,19,12,10,9,54,3,45,12,13,91],
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
        };
        this.scoreList.push(scoreItem36);
        this.ruleFunction.push(this.greaterThanFirstParam);
        this.byteFunction.push(this.byteGreaterThanFirstParam);
        this.requiredOutputsFunction.push(this.getGreaterThanFirstParamRequiredOutputs);

        let scoreItem37 = {rule: "Compare First Param", ruleId: 20,
            retain: false, skip: false, sequenceNum: 26, 
            score: 0, completionRound: -1, max: 5, startRoundNum: 800,
            outBlockStart: 0, outBlockLen: 16,
            inBlockStart: 0, inBlockLen: 16,
            highIC: 16 * 14 + 100 * 4,
            sampleIn: [36,17,19,45,59,75,17,24,34,76,90,112,211,89,12,32],
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
        };
        this.scoreList.push(scoreItem37);
        this.ruleFunction.push(this.compareFirstParam);
        this.byteFunction.push(this.byteCompareFirstParam);
        this.requiredOutputsFunction.push(this.getCompareFirstParamRequiredOutputs);

        // Rules with separate input and output pointers
        let scoreItem38 = {rule: "Duplicate Params", ruleId: 21,
            retain: false, skip: false, sequenceNum: 27, 
            score: 0, completionRound: -1, max: 5, startRoundNum: 800,
            outBlockStart: 0, outBlockLen: 16,
            inBlockStart: 0, inBlockLen: 8,
            highIC: 8 * 10 + 100 * 4,
            sampleIn: [2,7,9,19,108,43,22,17],
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
        };
        this.scoreList.push(scoreItem38);
        this.ruleFunction.push(this.duplicateParams);
        this.byteFunction.push(this.byteDuplicateParams);
        this.requiredOutputsFunction.push(this.getDuplicateParamsRequiredOutputs);

        // Rules relating adjacent parameters
        let scoreItem39 = {rule: "Skip Adjacent Params 1", ruleId: 22,
            retain: false, skip: false, sequenceNum: 28, 
            score: 0, completionRound: -1, max: 5, startRoundNum: 800,
            outBlockStart: 0, outBlockLen: 16,
            inBlockStart: 0, inBlockLen: 32,
            highIC: 16 * 8 + 100 * 4,
            sampleIn: [
                17,16,90,34,76,65,39,86,12,45,97,112,86,19,87,17,
                23,65,87,83,67,73,19,29,32,54,12,90,198,74,86,61
            ],
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
        };
        this.scoreList.push(scoreItem39);
        this.ruleFunction.push(this.skipAdjacentParams1);
        this.byteFunction.push(this.byteSkipAdjacentParams1);
        this.requiredOutputsFunction.push(this.getSkipAdjacentParams1RequiredOutputs);

        let scoreItem40 = {rule: "Skip Adjacent Params 2", ruleId: 23,
            retain: false, skip: false, sequenceNum: 29, 
            score: 0, completionRound: -1, max: 5, startRoundNum: 800,
            outBlockStart: 0, outBlockLen: 16,
            inBlockStart: 0, inBlockLen: 32,
            highIC: 16 * 8 + 100 * 4,
            sampleIn: [
                43,54,76,81,17,19,21,40,80,120,256,103,96,75,81,84,
                23,24,25,26,18,30,90,40,50,121,212,170,86,64,79,18
            ],
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
        };
        this.scoreList.push(scoreItem40);
        this.ruleFunction.push(this.skipAdjacentParams2);
        this.byteFunction.push(this.byteSkipAdjacentParams2);
        this.requiredOutputsFunction.push(this.getSkipAdjacentParams2RequiredOutputs);

        let scoreItem41 = {rule: "Swap Adjacent Params", ruleId: 24,
            retain: false, skip: false, sequenceNum: 30, 
            score: 0, completionRound: -1, max: 5, startRoundNum: 800,
            outBlockStart: 0, outBlockLen: 16,
            inBlockStart: 0, inBlockLen: 16,
            highIC: 16 * 10 + 100 * 4,
            sampleIn: [87,64,54,12,67,43,109,85,205,173,86,94,17,19,18,57],
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
        };
        this.scoreList.push(scoreItem41);
        this.ruleFunction.push(this.swapAdjacentParams);
        this.byteFunction.push(this.byteSwapAdjacentParams);
        this.requiredOutputsFunction.push(this.getSwapAdjacentParamsRequiredOutputs);

        let scoreItem42 = {rule: "Greater of Adjacent Params", ruleId: 25,
            retain: false, skip: false, sequenceNum: 31, 
            score: 0, completionRound: -1, max: 5, startRoundNum: 800,
            outBlockStart: 0, outBlockLen: 16,
            inBlockStart: 0, inBlockLen: 32,
            highIC: 16 * 12 + 100 * 4,
            sampleIn: [
                37,17,86,86,85,32,64,17,90,110,87,65,87,88,109,110,
                43,87,65,76,94,83,52,18,91,111,86,83,87,19,106,201
            ],
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
        };
        this.scoreList.push(scoreItem42);
        this.ruleFunction.push(this.greaterOfAdjacentParams);
        this.byteFunction.push(this.byteGreaterOfAdjacentParams);
        this.requiredOutputsFunction.push(this.getGreaterOfAdjacentParamsRequiredOutputs);

        let scoreItem43 = {rule: "Greater of Three", ruleId: 66,
            retain: false, skip: false, sequenceNum: 32, 
            score: 0, completionRound: -1, max: 5, startRoundNum: 800,
            outBlockStart: 0, outBlockLen: 8,
            inBlockStart: 0, inBlockLen: 24,
            highIC: 8 * 18,
            sampleIn: [
                37,17,86,86,85,32,64,17,90,110,87,65,87,88,109,110,
                43,87,65,76,94,83,52,18
            ],
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
        };
        this.scoreList.push(scoreItem43);
        this.ruleFunction.push(null);
        this.byteFunction.push(null);
        this.requiredOutputsFunction.push(this.getGreaterOfThreeRequiredOutputs);

        let scoreItem44 = {rule: "Sort Adjacent Params", ruleId: 26,
            retain: false, skip: false, sequenceNum: 33, 
            score: 0, completionRound: -1, max: 10, startRoundNum: 800,
            outBlockStart: 0, outBlockLen: 16,
            inBlockStart: 0, inBlockLen: 16,
            highIC: 16 * 15,
            highIP: 85,
            sampleIn: [17,4,67,98,19,30,11,17,21,29,89,93,12,11,74,17],
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
        };
        this.scoreList.push(scoreItem44);
        this.ruleFunction.push(this.sortAdjacentParams);
        this.byteFunction.push(this.byteSortAdjacentParams);
        this.requiredOutputsFunction.push(this.getSortAdjacentParamsRequiredOutputs);

        let scoreItem45 = {rule: "Sort Triplets", ruleId: 65,
            retain: false, skip: false, sequenceNum: 34, 
            score: 0, displayGroupBy: 3, completionRound: -1, 
            max: 10, startRoundNum: 800,
            outBlockStart: 0, outBlockLen: 18,
            inBlockStart: 0, inBlockLen: 18,
            highIC: 16 * 15 * 8,
            highIP: 80,
            sampleIn: [17,4,67,98,19,30,11,17,21,29,89,93,12,11,74,17,21,9],
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
        };
        this.scoreList.push(scoreItem45);
        this.ruleFunction.push(null);
        this.byteFunction.push(null);
        this.requiredOutputsFunction.push(this.getSortTripletsRequiredOutputs);

        let scoreItem46 = {rule: "Sort Params", ruleId: 64,
            retain: false, skip: false, sequenceNum: 35, 
            score: 0, completionRound: -1, max: 5, passScore: 0.8, startRoundNum: 800,
            outBlockStart: 0, outBlockLen: 16,
            inBlockStart: 0, inBlockLen: 16,
            highIC: 16 * 15 * 8,
            highIP: 105,
            sampleIn: [45,46,12,19,164,84,23,17,96,98,99,12,10,11,13,14],
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
        };
        this.scoreList.push(scoreItem46);
        this.ruleFunction.push(null);
        this.byteFunction.push(null);
        this.requiredOutputsFunction.push(this.getSortParamsRequiredOutputs);

        let scoreItem47 = {rule: "Add Adjacent Params", ruleId: 27,
            retain: false, skip: false, sequenceNum: 36, 
            score: 0, completionRound: -1, max: 5, startRoundNum: 800,
            outBlockStart: 0, outBlockLen: 16,
            inBlockStart: 0, inBlockLen: 32,
            highIC: 16 * 9 + 100 * 4,
            highIP: 36,
            sampleIn: [
                4,5,8,9,90,91,103,12,76,76,87,87,54,12,17,19,
                4,3,90,109,76,87,16,15,97,17,3,3,8,7,11,12,
            ],
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
        };
        this.scoreList.push(scoreItem47);
        this.ruleFunction.push(this.addAdjacentParams);
        this.byteFunction.push(this.byteAddAdjacentParams);
        this.requiredOutputsFunction.push(this.getAddAdjacentParamsRequiredOutputs);


        let scoreItem48 = {rule: "Subtract Adjacent Params", ruleId: 28,
            retain: false, skip: false, sequenceNum: 37, 
            score: 0, completionRound: -1, max: 5, startRoundNum: 800,
            outBlockStart: 0, outBlockLen: 16,
            inBlockStart: 0, inBlockLen: 32,
            highIC: 16 * 9 + 100 * 4,
            highIP: 36,
            sampleIn: [
                8,9,87,43,54,25,23,13,8,9,78,76,87,14,100,10,
                76,65,87,85,85,87,54,17,15,8,9,6,7,7,19,12
            ],
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
        };
        this.scoreList.push(scoreItem48);
        this.ruleFunction.push(this.subtractAdjacentParams);
        this.byteFunction.push(this.byteSubtractAdjacentParams);
        this.requiredOutputsFunction.push(this.getSubtractAdjacentParamsRequiredOutputs);

        let scoreItem49 = {rule: "Multiply Adjacent Params", ruleId: 29, 
            retain: false, skip: false, sequenceNum: 38, 
            score: 0, completionRound: -1, max: 5, startRoundNum: 800, 
            outBlockStart: 0, outBlockLen: 16, 
            inBlockStart: 0, inBlockLen: 32,
            highIC: 16 * 18 * 20 + 100 * 4,
            highIP: 80,
            sampleIn: [
                3,2,4,5,6,4,89,2,86,3,86,2,12,2,13,3,
                43,3,32,5,76,2,19,6,21,4,45,3,16,0,17,1
            ],
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
        };
        this.scoreList.push(scoreItem49);
        this.ruleFunction.push(this.multiplyAdjacentParams);
        this.byteFunction.push(this.byteMultiplyParams);
        this.requiredOutputsFunction.push(this.getMultiplyAdjacentParamsRequiredOutputs);

        let scoreItem50 = {rule: "Divide Adjacent Params", ruleId: 30, 
            retain: false, skip: false, sequenceNum: 39, 
            score: 0, completionRound: -1, max: 5, startRoundNum: 800, 
            outBlockStart: 0, outBlockLen: 16, inBlockStart: 0, 
            inBlockLen: 32,
            highIC: 16 * 18 * 25 + 100 * 4,
            highIP: 85,
            sampleIn: [
                56,3,32,4,9,0,8,2,76,21,63,9,87,7,140,20,
                43,8,40,8,76,17,78,9,144,12,46,19,82,2,14,7
            ],
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
        };
        this.scoreList.push(scoreItem50);
        this.ruleFunction.push(this.divideAdjacentParams);
        this.byteFunction.push(this.byteDivideAdjacentParams);
        this.requiredOutputsFunction.push(this.getDivideAdjacentParamsRequiredOutputs);

        let scoreItem51 = {rule: "Use op to Convert Adjacent Params 1", ruleId: 57, 
            retain: false, skip: false, sequenceNum: 40, 
            score: 0, completionRound: -1, displayGroupBy: 3, max: 5, startRoundNum: 800, 
            outBlockStart: 0, outBlockLen: 16, inBlockStart: 0, 
            inBlockLen: 48,
            highIC: 16 * 14 + 100 * 4,
            highIP: 65,
            sampleIn: [
                61,7,8, 61,9,7, 61,0,9, 61,2,4, 61,3,11, 61,12,90, 61,10,56, 61,11,16,
                61,8,19, 61,4,12, 61,13,86, 61,15,45, 61,6,15, 61,5,14, 61,1,65, 61,9,11
            ],
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
        };
        this.scoreList.push(scoreItem51);
        this.ruleFunction.push(this.paramOperations);
        this.byteFunction.push(this.byteParamOperations);
        this.requiredOutputsFunction.push(this.getParamOperationsRequiredOutputs);

        let scoreItem52 = {rule: "Use op to Convert Adjacent Params 2", ruleId: 58, 
            retain: false, skip: false, sequenceNum: 41, 
            score: 0, completionRound: -1, displayGroupBy: 3, max: 5, startRoundNum: 800, 
            outBlockStart: 0, outBlockLen: 16, inBlockStart: 0, 
            inBlockLen: 48,
            highIC: 16 * 14 + 100 * 4,
            highIP: 65,
            sampleIn: [
                43,7,4, 43,19,18, 43,9,7, 43,4,109, 43,6,89, 43,91,92, 43,7,6, 43,8,9,
                43,11,18, 43,56,14, 43,17,19, 43,78,105, 43,23,5, 43,27,9, 43,87,3, 43,8,11
            ],
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
        };
        this.scoreList.push(scoreItem52);
        this.ruleFunction.push(this.paramOperations);
        this.byteFunction.push(this.byteParamOperations);
        this.requiredOutputsFunction.push(this.getParamOperationsRequiredOutputs);

        let scoreItem53 = {rule: "Use op to Convert Adjacent Params 3", ruleId: 59, 
            retain: false, skip: false, sequenceNum: 42, 
            score: 0, completionRound: -1, displayGroupBy: 3, max: 5, startRoundNum: 800, 
            outBlockStart: 0, outBlockLen: 16, inBlockStart: 0, 
            inBlockLen: 48,
            highIC: 16 * 14 + 100 * 4,
            highIP: 65,
            sampleIn: [
                45,9,11, 45,8,2, 45,7,3, 45,9,11, 45,12,10, 45,108,106, 45,87,81, 45,65,32,
                45,8,7, 45,79,34, 45,87,65, 45,65,32, 45,217,111, 45,89,18, 45,19,11, 45,7,2
            ],
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
        };
        this.scoreList.push(scoreItem53);
        this.ruleFunction.push(this.paramOperations);
        this.byteFunction.push(this.byteParamOperations);
        this.requiredOutputsFunction.push(this.getParamOperationsRequiredOutputs);

        // Multiply
        let scoreItem54 = {rule: "Use op to Convert Adjacent Params 4", ruleId: 60, 
            retain: false, skip: false, sequenceNum: 43, 
            score: 0, completionRound: -1, displayGroupBy:3, 
            max: 5, startRoundNum: 800, 
            outBlockStart: 0, outBlockLen: 16, inBlockStart: 0, 
            inBlockLen: 48,
            highIC: 16 * 14 * 16 + 100 * 4,
            highIP: 85,
            sampleIn: [
                42,2,3, 42,4,5, 42,0,9, 42,11,10, 42,21,4, 42,45,5, 42,48,6, 42,3,5,
                42,6,5, 42,11,9, 42,90,2, 42,65,3, 42,6,24, 42,8,7, 42,9,10, 42,8,4
            ],
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
        };
        this.scoreList.push(scoreItem54);
        this.ruleFunction.push(this.paramOperations);
        this.byteFunction.push(this.byteParamOperations);
        this.requiredOutputsFunction.push(this.getParamOperationsRequiredOutputs);

        // Modulo
        let scoreItem55 = {rule: "Use op to Convert Adjacent Params 5", ruleId: 61, 
            retain: false, skip: false, sequenceNum: 44, 
            score: 0, completionRound: -1, displayGroupBy: 3,
            max: 5, startRoundNum: 800, 
            outBlockStart: 0, outBlockLen: 16, inBlockStart: 0, 
            inBlockLen: 48,
            highIC: 16 * 14 * 16 + 100 * 4,
            highIP: 85,
            sampleIn: [
                37,3,2, 37,9,3, 37,0,7, 37,96,78, 37,80,5, 37,87,17, 37,4,2, 37,18,5,
                37,56,15, 37,112,16, 37,209,3, 37,76,86, 37,54,7, 37,12,4, 37,16,8, 37,19,21 
            ],
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
        };
        this.scoreList.push(scoreItem55);
        this.ruleFunction.push(this.paramOperations);
        this.byteFunction.push(this.byteParamOperations);
        this.requiredOutputsFunction.push(this.getParamOperationsRequiredOutputs);

        // Divide
        let scoreItem56 = {rule: "Use op to Convert Adjacent Params 6", ruleId: 62, 
            retain: false, skip: false, sequenceNum: 45, 
            score: 0, completionRound: -1, displayGroupBy: 3,
            max: 5, startRoundNum: 800, 
            outBlockStart: 0, outBlockLen: 16, inBlockStart: 0, 
            inBlockLen: 48,
            highIC: 16 * 14 * 16,
            highIP: 85,
            sampleIn: [
                47,6,3, 47,9,0, 47,81,9, 47,90,10, 47,18,5, 47,27,3, 47,76,18, 47,87,8,
                47,9,4, 47,101,10, 47,90,8, 47,21,25, 47,76,4, 47,24,6, 47,42,7, 47,87,9
            ],
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
        };
        this.scoreList.push(scoreItem56);
        this.ruleFunction.push(this.paramOperations);
        this.byteFunction.push(this.byteParamOperations);
        this.requiredOutputsFunction.push(this.getParamOperationsRequiredOutputs);

        let scoreItem57 = {rule: "Use op to Convert Adjacent Params 7", ruleId: 54, 
            retain: false, skip: false, sequenceNum: 46, 
            score: 0, completionRound: -1, displayGroupBy: 3,
            max: 5, startRoundNum: 800, 
            outBlockStart: 0, outBlockLen: 16, inBlockStart: 0, 
            inBlockLen: 48,
            highIC: 16 * 18 + 100 * 4,
            highIP: 100,
            sampleIn: [
                61,5,2, 61,7,9, 61,2,3, 61,6,8, 61,0,19, 61,1,89, 61,4,7, 61,3,97,
                43,17,9, 43,2,3, 43,5,6, 43,8,9, 43,21,45, 43,108,109, 43,87,15, 43,89,10
            ],
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
        };
        this.scoreList.push(scoreItem57);
        this.ruleFunction.push(this.paramOperations);
        this.byteFunction.push(this.byteParamOperations);
        this.requiredOutputsFunction.push(this.getParamOperationsRequiredOutputs);

        let scoreItem58 = {rule: "Use op to Convert Adjacent Params 8", ruleId: 55, 
            retain: false, skip: false, sequenceNum: 47, 
            score: 0, completionRound: -1, displayGroupBy: 3,
            max: 5, startRoundNum: 800, 
            outBlockStart: 0, outBlockLen: 16, inBlockStart: 0, 
            inBlockLen: 48,
            highIC: 16 * 18 + 100 * 4,
            highIP: 100,
            sampleIn: [
                43,200,10, 43,26,87, 43,18,9, 43,98,54, 43,76,87,
                45,100,10, 45,4,3, 45,9,2, 45,96,4, 45,97,13, 45,73,63, 45,90,17, 45,91,81, 45,97,11, 45,96,10, 45,13,12
            ],
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
        };
        this.scoreList.push(scoreItem58);
        this.ruleFunction.push(this.paramOperations);
        this.byteFunction.push(this.byteParamOperations);
        this.requiredOutputsFunction.push(this.getParamOperationsRequiredOutputs);

        let scoreItem59 = {rule: "Use op to Convert Adjacent Params 9", ruleId: 56, 
            retain: false, skip: false, sequenceNum: 48, 
            score: 0, completionRound: -1, displayGroupBy: 3,
            max: 5, startRoundNum: 800, 
            outBlockStart: 0, outBlockLen: 16, inBlockStart: 0, 
            inBlockLen: 48,
            highIC: 16 * 25 + 100 * 4,
            highIP: 100,
            sampleIn: [
                43,3,4, 43,64,6, 43,76,9, 43,87,10, 43,12,11, 43,65,4,
                42,65,5, 42,32,3, 42,10,8, 42,15,6, 42,17,15, 42,42,4, 42,6,7, 42,5,7, 42,98,2, 42,23,6
            ],
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
        };
        this.scoreList.push(scoreItem59);
        this.ruleFunction.push(this.paramOperations);
        this.byteFunction.push(this.byteParamOperations);
        this.requiredOutputsFunction.push(this.getParamOperationsRequiredOutputs);

        // May need to break this into separate rules
        let scoreItem60 = {rule: "Use op to Convert Adjacent Params 10", ruleId: 31,
            retain: false, skip: false, sequenceNum: 49, 
            score: 0, completionRound: -1, displayGroupBy: 3,
            max: 20, startRoundNum: 800, 
            outBlockStart: 0, outBlockLen: 32,
            inBlockStart: 0, inBlockLen: 96,
            highIC: 5000,
            highIP: 120,
            sampleIn: [
                61,4,5, 61,6,8, 61,5,10, 61,0,9, 61,3,19, 61,2,18, 61,1,24,
                43,5,1, 43,9,10, 43,11,12, 43,90,91, 43,81,5, 43,76,5, 43,87,18, 43,19,11, 43,18,15,
                45,8,3, 45,6,5, 45,4,6, 45,11,9, 45,90,61, 45,97,13,
                42,2,3, 42,4,4, 42,11,11, 42,19,10, 42,25,11, 42,25,10, 42,67,4, 42,15,9, 42,17,3, 42,18,1
            ],
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
        };
        this.scoreList.push(scoreItem60);
        this.ruleFunction.push(this.paramOperations);
        this.byteFunction.push(this.byteParamOperations);
        this.requiredOutputsFunction.push(this.getParamOperationsRequiredOutputs);

        let sampleASCII1 = this.getASCIIParams(5);
        let asciiParams1 = this.getASCIIParams(1);
        let scoreItem61 = {rule: "Convert ASCII Numbers 1", ruleId: 32,
            retain: false, skip: false, sequenceNum: 50, 
            score: 0, completionRound: -1, max: 5, startRoundNum: 800,
            outBlockStart: 0, outBlockLen: 16,
            inBlockStart: 0, inBlockLen: 32,
            sampleIn: sampleASCII1,
            sampleOut: [],
            paramsIn: asciiParams1,
            outputs: []
        };
        this.scoreList.push(scoreItem61);
        this.ruleFunction.push(this.convertASCIINumbers);
        this.byteFunction.push(this.byteConvertASCIINumbers);
        this.requiredOutputsFunction.push(this.getConvertASCIINumbersRequiredOutputs);

        let sampleASCII2 = this.getASCIIParams(6);
        let asciiParams2 = this.getASCIIParams(2);
        let scoreItem62 = {rule: "Convert ASCII Numbers 2", ruleId: 33,
            retain: false, skip: false, sequenceNum: 51, 
            score: 0, completionRound: -1, displayGroupBy:3, 
            max: 5, startRoundNum: 800,
            outBlockStart: 0, outBlockLen: 16,
            inBlockStart: 0, inBlockLen: 32,
            sampleIn: sampleASCII2,
            sampleOut: [],
            paramsIn: asciiParams2,
            outputs: []
        };
        this.scoreList.push(scoreItem62);
        this.ruleFunction.push(this.convertASCIINumbers);
        this.byteFunction.push(this.byteConvertASCIINumbers);
        this.requiredOutputsFunction.push(this.getConvertASCIINumbersRequiredOutputs);

        let sampleASCII3 = this.getASCIIParams(7);
        let asciiParams3 = this.getASCIIParams(3);
        let scoreItem63 = {rule: "Convert ASCII Numbers 3", ruleId: 34,
            retain: false, skip: false, sequenceNum: 52, 
            score: 0, completionRound: -1, max: 5, startRoundNum: 800,
            outBlockStart: 0, outBlockLen: 16,
            inBlockStart: 0, inBlockLen: 32,
            sampleIn: sampleASCII3,
            sampleOut: [],
            paramsIn: asciiParams3,
            outputs: []
        };
        this.scoreList.push(scoreItem63);
        this.ruleFunction.push(this.convertASCIINumbers);
        this.byteFunction.push(this.byteConvertASCIINumbers);
        this.requiredOutputsFunction.push(this.getConvertASCIINumbersRequiredOutputs);

        let sampleASCII4 = this.getASCIIParams(8);
        let asciiParams4 = this.getASCIIParams(4);
        let scoreItem64 = {rule: "Convert ASCII Numbers 4", ruleId: 35,
            retain: false, skip: false, sequenceNum: 53, 
            score: 0, completionRound: -1, max: 5, startRoundNum: 800,
            outBlockStart: 0, outBlockLen: 16,
            inBlockStart: 0, inBlockLen: 32,
            sampleIn: sampleASCII4,
            sampleOut: [],
            paramsIn: asciiParams4,
            outputs: []
        };
        this.scoreList.push(scoreItem64);
        this.ruleFunction.push(this.convertASCIINumbers);
        this.byteFunction.push(this.byteConvertASCIINumbers);
        this.requiredOutputsFunction.push(this.getConvertASCIINumbersRequiredOutputs);

        this.outputScoresItem = 65;
        let scoreItem65 = {rule: "Output Scores Equal", ruleId: 63, retain: true, skip: false, 
            sequenceNum: 0, score: 0, max: 2, startRoundNum: 0};
        this.scoreList.push(scoreItem65);
        this.ruleFunction.push(this.outputScoresEqual);
        this.byteFunction.push(null);
        this.requiredOutputsFunction.push(null);

        this.diffScore = 66;
        let scoreItem66 = {rule: "Difference Between Outputs", ruleId: 36, retain: true, skip: false, 
            sequenceNum: 0, score: 0, max: 1, startRoundNum: 0};
        this.scoreList.push(scoreItem66);
        this.ruleFunction.push(this.scoreOutputDiff);
        this.byteFunction.push(null);
        this.requiredOutputsFunction.push(null);

        this.initialiseOutputData();

        let maxScore = 0;
        let maxSequenceNum = 0;
        let index = 0;
        for (let scoreItem of this.scoreList) {
            if (scoreItem.skip != true) {
                maxScore += scoreItem.max;
            }
            if (scoreItem.sequenceNum > maxSequenceNum) {
                maxSequenceNum = scoreItem.sequenceNum;
            }
            scoreItem.completionRound = this.ruleCompletionRound[index];
            ++index;
        }
        this.maxScore = maxScore * 2;
        this.maxRuleSequenceNum = maxSequenceNum;

    },

    initialiseOutputData() {
        for (let i = 0; i < this.scoreList.length; i++) {
            if (this.requiredOutputsFunction[i] != null) {
                // Get sample outputs
                let sampleList = [];
                sampleList.push(this.scoreList[i].sampleIn);
                let sampleOut = this.requiredOutputsFunction[i](this, sampleList);
                this.scoreList[i].sampleOut = sampleOut[0];

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

    getASCIIParams(setNum) {
        let paramsBlock = [];

        let set1;
        let set2 = null;

        if (setNum === 1) {
            set1 = ["1","5","7","6","9;","0","8","3","5","9","0","6","3","8","4","2"];
            set2 = ["2","4","8","7","5","9","0","6","1","3","8","7","4","2","0","1"];
        }
        else if (setNum === 2) {
            set1 = [
                "12","26","94","18","17","35","64","20",
                "42","48","15","17","19","21","75","29"
            ]
            set2 = [
                "22","46","74","16","19","55","44","30",
                "47","38","75","12","15","51","95","49"
            ]
        }
        else if (setNum === 3) {
            set1 = [
                "112","226","194","218","217","135","164","220",
                "242","148","115","217","219","121","175","129"
            ]
            set2 = [
                "222","146","174","216","219","255","144","130",
                "247","138","175","212","215","151","195","149"
            ]
        }
        else if (setNum === 4) {
            set1 = [
                "1","26","194","18","217","135","64","120",
                "2","9","11","3","219","21","75","29"
            ]
            set2 = [
                "2","146","174","216","19","55","144","13",
                "3","138","8","17","15","151","9","6"
            ]
        }
        else if (setNum === 5) {
            set1 = [
                "1","9","3","5","2","0","8","7",
                "2","5","5","6","4","7","0","6"
            ]
        }
        else if (setNum === 6) {
            set1 = [
                "21","19","10","81","17","56","81","90",
                "17","34","57","74","27","29","38","19"
            ]
        }
        else if (setNum === 7) {
            set1 = [
                "219","124","242","167","209","108","165","143",
                "182","118","136","196","192","202","214","173"
            ]
        }
        else if (setNum === 8) {
            set1 = [
                "1","14","134","54","2","3","34","19",
                "104","213","111","36","75","89","91","8"
            ]
        }

        if (set2 != null) {
            let params1 = insertAsciiStrings(set1);
            paramsBlock.push(params1);
            let params2 = insertAsciiStrings(set2);
            paramsBlock.push(params2);

            return paramsBlock;
        }
        else {
            let outputs = insertAsciiStrings(set1);
            return outputs;
        }

        function insertAsciiStrings(set) {
            let p = [];
            for (let numStr of set) {
                for (let i = 0; i < numStr.length; i++) {
                    let c = numStr.charCodeAt(i);
                    p.push(c);
                }
                let s = ";";
                p.push(s.charCodeAt(0));
            }
            if (p.length >= 256) {
                console.log("initial params too long");
            }
            return p;
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
                                console.log("Invalid byte score", score, index);
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
        codeFlags, initialParams, paramsIn, valuesOut, entityOutputs, IC, highestIP, sequenceNum, roundNum) {

        // Get the current maximum score
        this.currentMaxScore = this.getCurrentMaxScore();

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
            IC: IC,
            highestIP: highestIP,
            sequenceNum: sequenceNum
        }
        let totalScore = 0;

        for (let i = 0; i < this.scoreList.length; i++) {
            if (!this.scoreList[i].skip) {
                if (this.scoreList[i].retain || (this.scoreList[i].sequenceNum === sequenceNum)) {
                    if (this.ignoreRounds || this.scoreList[i].startRoundNum <= roundNum) {
                        let score;
                        if ("outputs" in this.scoreList[i]) {
                            score = this.getOutputComparisonScore(this.scoreList[i].outputs, entityOutputs);
                        }
                        else {
                            score = this.ruleFunction[i](this, dataParams, this.scoreList[i]);
                        }
                        if (isNaN(score)) {
                            console.log("getScore: Erroneous Score:", i);
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

    getOutputComparisonScore(ruleOutputs, entityOutputs) {
        let outputNum = entityOutputs.length - 1;
        let ruleOut = ruleOutputs[outputNum];
        let output = entityOutputs[outputNum]
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

    getCurrentMaxScore() {
        let maxScore = 0;
        // Find the current rule to get the number of parameter inputs
        let numInputParamBlocks = 2;
        for (let rule of this.scoreList) {
            if ("sequenceNum" in rule && !rule.skip && !rule.retain) {
                if (rule.sequenceNum === this.ruleSequenceNum) {
                    if ("paramsIn" in rule) {
                        numInputParamBlocks = rule.paramsIn.length;
                    }
                    else {
                        numInputParamBlocks = 2;
                    }
                }
            }
        }

        for (let rule of this.scoreList) {
            if ("sequenceNum" in rule && !rule.skip) {
                if (rule.sequenceNum === this.ruleSequenceNum || 
                    (rule.sequenceNum <= this.ruleSequenceNum && rule.retain)) {
                    maxScore += rule.max * numInputParamBlocks;
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
            console.log("Dev Score:", score);
            for (let i = 0; i < self.executionScores.length; i++) {
                console.log("rule score:", self.executionScores[i]);
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

    insDistribution (self, dataParams, ruleParams) {
        let instructionSet = dataParams.instructionSet;
        let memSpace = dataParams.memSpace;
        insSet = [
            {
                ins: "LDI A, (MEM)",
                countOpt: 3,
                scanStart: 0,
                scanEnd: 18
            },
            {
                ins: "LDI A, (C)",
                countOpt: 1,
                scanStart: 0,
                scanEnd: 18
            },
            {
                ins: "JRNZ",
                countOpt: 3,
                scanStart: 24,
                scanEnd: 42
            },
            {
                ins: "CALL",
                countOpt: 0,
                scanStart: 0,
                scanEnd: 42
            }
        ];

        let totalScore = 0;

        let rule = self.getRuleFromSequence(dataParams.sequenceNum);
        // Count of occurrences
        for (let insData of insSet) {
            let ins = insData.ins;
            // Check whether the rule defines the criteria
            if ("insDistribution" in rule) {
                let found = false;
                for (let i = 0; i < rule.insDistribution.length; i++) {
                    if (ins.ins === rule.insDistribution[i].ins) {
                        found = true;
                        insData = rule.insDistribution[i];
                        ins = insData.ins;
                        break;
                    }
                }
            }
            // Count the number of occurences of the instruction in the scan area
            let p = insData.scanStart;
            let count = 0;
            while (p < insData.scanEnd) {
                let code = memSpace[p];
                let insItem = instructionSet.getInsDetails(code);
                if (insItem.name === ins) ++count;
                p += insItem.insLen;
            }

            let opt = insData.countOpt;
            let max = insData.scanEnd - insData.scanStart;
            let min = 0;
            let score1 = self.doScore(opt, count, max, min);
            totalScore += score1;
        }

        let opt = insSet.length;
        let max = opt;
        let min = 0;
        let score = self.doScore(opt, totalScore, max, min);
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
        let highestIC = dataParams.instructionSet.maxIC;

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
        let min = 0;
        let score = self.doScore(opt, IC, max, min);
        return score;

    },

    highestIPScore(self, dataParams, ruleParams) {
        let IP = dataParams.highestIP;
        let maxIP = dataParams.memSpace.length;

        // Get the optimum highIP from the current rule
        let rule = self.getRuleFromSequence(dataParams.sequenceNum);
        let opt = 28;
        if ("highIP" in rule) opt = rule.highIP;
        let max = maxIP - 1;
        let min = 0;
        let score = self.doScore(opt, IP, max, min);
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
        let entityOutputs = dataParams.entityOutputs;

        // Obtain the current sequential rule
        let ruleSequenceNum = dataParams.sequenceNum;
        let rule = self.getRuleFromSequence(ruleSequenceNum);
        let outBlockLen = rule.outBlockLen;
        let outBlockStart = rule.outBlockStart;
        // Check whether required outputs present
        let opt = outBlockLen;
        if ("outputs" in rule) {
            // Get the current required and entity ouputs
            let p = entityOutputs.length - 1;
            let output = rule.outputs[p];
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
                v = i * step;
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
                        console.log("op error in paramOperations rule at:", i, op, inAddr);
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
                        console.log("op error in paramOperations rule at:", i, op, inAddr);
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
                    console.log("byteParamOperations: op error in paramOperations rule at:", i, addr, offset, op, address);
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

    doByteScore(opt, value) {
        let score = 1; // Set to 1 for correct output address
        if (opt === value) score = 2;
        return score;
    },

    seedRuleUpdate(instructionSet, memSpace, score, roundNum) {
        let passMark = 0.9;
        let rule = this.getRuleFromSequence(this.ruleSequenceNum);
        if ("passScore" in rule) {
            passMark = rule.passScore;
        }
        if ((score >= this.currentMaxScore * passMark) && this.ruleSequenceNum < this.maxRuleSequenceNum) {
            // Check for common program fragments
            if (this.seedRuleMemSpaces.length > 1) {
                this.updateSeedRuleFragments(instructionSet, memSpace);
                console.log("Fragment list updated:", this.seedRuleFragments.length);
            }
            let seedRuleItem = {};
            let item = this.getRuleFromSequence(this.ruleSequenceNum);
            let ruleId = item.ruleId;
            console.log("seedRuleUpdate: rule:", item.rule, ruleId);
            seedRuleItem.ruleId = ruleId;
            seedRuleItem.memSpace = memSpace;
            this.seedRuleMemSpaces.push(seedRuleItem);
            this.seedRuleSet = true;

            ++this.ruleSequenceNum;
            // Get the new current rule number
            let index = 0;
            for (let rule of this.scoreList) {
                if (!rule.skip) {
                    if (!rule.retain && this.ruleSequenceNum === rule.sequenceNum) {
                        this.seedRuleNum = rule.rule_num;
                        break;
                    }
                    if (!rule.retain && this.ruleSequenceNum - 1 === rule.sequenceNum) {
                        this.ruleCompletionRound[index] = roundNum;
                        console.log("seedRuleUpdate: - update rule completion round:", this.ruleCompletionRound[index]);
                    }
                }
                ++index;
            }
            this.currentMaxScore = this.getCurrentMaxScore();
        }
        else {
            this.seedRuleSet = false;
        }
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
            if (item.sequenceNum === sequenceNum && item.retain === false && !rule.skip) {
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
            console.log("getRuleFromSequence: invalid sequence num - sequenceNum:", sequenceNum, this.scoreList[13]);
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

    getCurrentParamsIn() {
        let rule = this.getRuleFromSequence(this.ruleSequenceNum);
        let paramsIn = null;
        if ("paramsIn" in rule) paramsIn = rule.paramsIn;
        return paramsIn;
    },

    getParamsInFromRuleSequence(ruleSequenceNum) {
        let rule = this.getRuleFromSequence(ruleSequenceNum);
        let paramsIn = null;
        if ("paramsIn" in rule) paramsIn = rule.paramsIn;
        return paramsIn;
    }
}

module.exports = rulesets;