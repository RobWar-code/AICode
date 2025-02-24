const { app } = require('electron');
const path = require('node:path');
const testObj = require(path.join(__dirname, 'testObj'));

const rulesets = {
    meanInsLen: 1.5,
    meanInsCount: 240 / 1.5,
    numOutputZones: 8,
    outputZoneLen: 8,
    numRules: 46,
    maxRuleId: 45,
    scoreList: [],
    ruleFunction: [],
    byteFunction: [],
    totalScore: 0,
    currentMaxScore: 0,
    maxScore: 0,
    diffScore: 0,
    ignoreRounds: true,
    bestEntity: null,
    ruleSequenceNum: 0,
    maxRuleSequenceNum: 0,
    ruleCompletionRound: new Array(46).fill(-1),
    seedRuleNum: 9,
    seedRuleMemSpaces: [],
    seedRuleSet: false,

    initialise() {

        this.scoreList = [];
        this.ruleFunction = [];
        this.byteFunction = [];

        let scoreItem0 = {rule: "Instruction Distribution", ruleId: 0, skip: true, 
            score: 0, max: 4, startRoundNum: 800};
        this.scoreList.push(scoreItem0);
        this.ruleFunction.push(this.insDistribution);
        this.byteFunction.push(null);

        let scoreItem1 = {rule: "Matching CASM Instruction", ruleId: 1, skip: true, sequenceNum: 0,
            score: 0, max: 4, startRoundNum: 0};
        this.scoreList.push(scoreItem1);
        this.ruleFunction.push(this.matchCASM);
        this.byteFunction.push(null);

        let scoreItem2 = {rule: "Number of reverse JR ins", ruleId: 2, skip: true, sequenceNum: 0,
            score: 0, max: 4, startRoundNum: 0
        }
        this.scoreList.push(scoreItem2);
        this.ruleFunction.push(this.reverseJR);
        this.byteFunction.push(null);

        let scoreItem3 = {rule: "Instruction Counter", ruleId: 3, skip: true,
            score: 0, max: 1, startRoundNum: 800};
        this.scoreList.push(scoreItem3);
        this.ruleFunction.push(this.instructionCount);
        this.byteFunction.push(null);

        let scoreItem4 = {rule: "Highest IP", ruleId: 4, skip: true,
            score: 0, max: 1, startRoundNum: 800};
        this.scoreList.push(scoreItem4);
        this.ruleFunction.push(this.highestIPScore);
        this.byteFunction.push(null);

        let scoreItem5 = {rule: "Params Preserved", ruleId: 5, skip: true, sequenceNum: 0,
            retain: true, score: 0, max: 3, startRoundNum: 0};
        this.scoreList.push(scoreItem5);
        this.ruleFunction.push(this.initialParamsPreserved);
        this.byteFunction.push(null);

        let scoreItem6 = {rule: "Values Out Set", ruleId: 6, skip: false, sequenceNum: 0,
            retain: true, score: 0, max: 1, startRoundNum: 0, 
            outBlockStart: 0, outBlockLen: 128 
        };
        this.scoreList.push(scoreItem6);
        this.ruleFunction.push(this.valuesOutSet);
        this.byteFunction.push(null);

        let scoreItem7 = {rule: "Values Out From Params", ruleId: 7, skip: true,
            score: 0, max: 4, startRoundNum: 800,
            outBlockStart: 0, outBlockLen: 8, inBlockStart: 0, inBlockLen: 8
        };
        this.scoreList.push(scoreItem7);
        this.ruleFunction.push(this.valuesOutFromParams)
        this.byteFunction.push(this.byteValuesOutFromParams);

        let scoreItem8 = {rule: "Values Out From Initial Params", ruleId: 8, skip: true,
            score: 0, max: 4, 
            startRoundNum: 800,
            outBlockStart: 0, outBlockLen: 8, inBlockStart: 0, inBlockLen: 8
        };
        this.scoreList.push(scoreItem8);
        this.ruleFunction.push(this.valuesOutFromInitialParams);
        this.byteFunction.push(this.byteValuesOutFromInitialParams);

        let scoreItem9 = {rule:"Values Out Match Initial Params", ruleId: 9, skip: false, sequenceNum: 0,
            retain: false, score: 0, completionRound: -1, max: 5,
            startRoundNum: 0,
            outBlockStart: 0, outBlockLen: 16, inBlockStart: 0, inBlockLen: 16
        };
        this.scoreList.push(scoreItem9);
        this.ruleFunction.push(this.valuesOutMatchInitialParams);
        this.byteFunction.push(this.byteValuesOutMatch);

        let scoreItem10 = {rule: "Values Out Different", ruleId: 10, skip:true,
            score: 0, max: 1, startRoundNum: 800,
            outBlockStart: 0, outBlockLen: 8
        };
        this.scoreList.push(scoreItem10);
        this.ruleFunction.push(this.valuesOutDifferent);
        this.byteFunction.push(this.byteValuesOutDifferent);

        let scoreItem11 = {rule: "Values Out Series", ruleId: 11, skip: true,
            score: 0, max: 1, startRoundNum: 800,
            outBlockStart: 0, outBlockLen: 8
        };
        this.scoreList.push(scoreItem11);
        this.ruleFunction.push(this.valuesOutSeries);
        this.byteFunction.push(this.byteValuesOutSeries);

        let scoreItem12 = {rule: "Add First Param", ruleId: 12,
            retain: false, skip: false, sequenceNum: 1, 
            score: 0, completionRound: -1, max: 5, startRoundNum: 800,
            outBlockStart: 0, outBlockLen: 16,
            inBlockStart: 0, inBlockLen: 16,
            paramsIn: [
                [
                    5,20,15,11,96,3,8,200,128,255,27,29,31,14,16,21
                ],
                [
                    12,22,43,67,69,81,72,186,215,4,9,15,22,38,104,126
                ]
            ]
        };
        this.scoreList.push(scoreItem12);
        this.ruleFunction.push(this.addFirstParam);
        this.byteFunction.push(this.byteAddFirstParam);

        let scoreItem13 = {rule: "Subtract First Param", ruleId: 13,
            retain: false, skip: false, sequenceNum: 2, 
            score: 0, completionRound: -1, max: 5, startRoundNum: 800,
            outBlockStart: 0, outBlockLen: 16,
            inBlockStart: 0, inBlockLen: 16,
            paramsIn: [
                [
                    6,20,15,11,96,3,8,200,128,255,27,29,31,14,16,21
                ],
                [
                    13,22,43,67,69,81,72,186,215,4,9,15,22,38,104,126
                ]
            ]
        };
        this.scoreList.push(scoreItem13);
        this.ruleFunction.push(this.subtractFirstParam);
        this.byteFunction.push(this.byteSubtractFirstParam);

        let scoreItem14 = {rule: "Odd And Even Params", ruleId: 14,
            retain: false, skip: false, sequenceNum: 3, 
            score: 0, completionRound: -1, max: 5, startRoundNum: 800,
            outBlockStart: 0, outBlockLen: 16,
            inBlockStart: 0, inBlockLen: 16,
            paramsIn: [
                [
                    1,20,15,11,96,3,8,200,128,255,27,29,31,14,16,21
                ],
                [
                    4,22,43,62,69,81,72,186,215,4,9,15,22,38,104,126
                ]
            ]
        };
        this.scoreList.push(scoreItem14);
        this.ruleFunction.push(this.oddAndEvenParams);
        this.byteFunction.push(this.byteOddAndEvenParams);

        let scoreItem15 = {rule: "Multiply By First Param 1", ruleId: 15,
            retain: false, skip: false, sequenceNum: 4, 
            score: 0, completionRound: -1, max: 5, startRoundNum: 800,
            outBlockStart: 0, outBlockLen: 16,
            inBlockStart: 0, inBlockLen: 16,
            paramsIn: [
                [
                    2,20,15,11,96,3,8,200,128,255,27,29,31,14,16,21
                ],
                [
                    4,22,43,67,69,81,72,186,215,4,9,15,22,38,104,126
                ]
            ]
        };
        this.scoreList.push(scoreItem15);
        this.ruleFunction.push(this.multiplyByFirstParam);
        this.byteFunction.push(this.byteMultiplyByFirstParam);

        let scoreItem16 = {rule: "Multiply By First Param 2", ruleId: 16,
            retain: false, skip: false, sequenceNum: 5, 
            score: 0, completionRound: -1, max: 5, startRoundNum: 800,
            outBlockStart: 0, outBlockLen: 16,
            inBlockStart: 0, inBlockLen: 16,
            paramsIn: [
                [
                    3,20,15,11,96,3,8,200,128,255,27,29,31,14,16,21
                ],
                [
                    6,22,43,67,69,81,72,186,215,4,9,15,22,38,104,126
                ]
            ]
        };
        this.scoreList.push(scoreItem16);
        this.ruleFunction.push(this.multiplyByFirstParam);
        this.byteFunction.push(this.byteMultiplyByFirstParam);

        let scoreItem17 = {rule: "Multiply By First Param 3", ruleId: 17,
            retain: false, skip: false, sequenceNum: 6, 
            score: 0, completionRound: -1, max: 5, startRoundNum: 800,
            outBlockStart: 0, outBlockLen: 16,
            inBlockStart: 0, inBlockLen: 16,
            paramsIn: [
                [
                    5,20,15,11,96,3,8,200,128,255,27,29,31,14,16,21
                ],
                [
                    9,22,43,67,69,81,72,186,215,4,9,15,22,38,104,126
                ]
            ]
        };
        this.scoreList.push(scoreItem17);
        this.ruleFunction.push(this.multiplyByFirstParam);
        this.byteFunction.push(this.byteMultiplyByFirstParam);

        let scoreItem18 = {rule: "Modulo First Param 1", ruleId: 43,
            retain: false, skip: false, sequenceNum: 7, 
            score: 0, completionRound: -1, max: 5, startRoundNum: 800,
            outBlockStart: 0, outBlockLen: 16,
            inBlockStart: 0, inBlockLen: 16,
            paramsIn: [
                [
                    2,20,15,11,96,3,8,200,128,255,27,29,31,14,16,21
                ],
                [
                    4,22,43,67,69,81,72,186,215,4,9,15,22,38,104,126
                ]
            ]
        };
        this.scoreList.push(scoreItem18);
        this.ruleFunction.push(this.moduloFirstParam);
        this.byteFunction.push(this.byteModuloFirstParam);

        let scoreItem19 = {rule: "Modulo First Param 2", ruleId: 45,
            retain: false, skip: false, sequenceNum: 8, 
            score: 0, completionRound: -1, max: 5, startRoundNum: 800,
            outBlockStart: 0, outBlockLen: 16,
            inBlockStart: 0, inBlockLen: 16,
            paramsIn: [
                [
                    5,20,15,11,96,3,8,200,128,255,27,29,31,14,16,21
                ],
                [
                    10,22,43,67,69,81,72,186,215,4,9,15,22,38,104,126
                ]
            ]
        };
        this.scoreList.push(scoreItem19);
        this.ruleFunction.push(this.moduloFirstParam);
        this.byteFunction.push(this.byteModuloFirstParam);

        let scoreItem20 = {rule: "Modulo First Param 3", ruleId: 44,
            retain: false, skip: false, sequenceNum: 9, 
            score: 0, completionRound: -1, max: 5, startRoundNum: 800,
            outBlockStart: 0, outBlockLen: 16,
            inBlockStart: 0, inBlockLen: 16,
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

            ]
        };
        this.scoreList.push(scoreItem20);
        this.ruleFunction.push(this.moduloFirstParam);
        this.byteFunction.push(this.byteModuloFirstParam);

        let scoreItem21 = {rule: "Divide by First Param 1", ruleId: 18,
            retain: false, skip: false, sequenceNum: 10, 
            score: 0, completionRound: -1, max: 5, startRoundNum: 800,
            outBlockStart: 0, outBlockLen: 16,
            inBlockStart: 0, inBlockLen: 16,
            paramsIn: [
                [
                    2,20,15,11,96,3,8,200,128,255,27,29,31,14,16,21
                ],
                [
                    4,22,43,67,69,81,72,186,215,4,9,15,22,38,104,126
                ]
            ]
        };
        this.scoreList.push(scoreItem21);
        this.ruleFunction.push(this.divideByFirstParam);
        this.byteFunction.push(this.byteDivideByFirstParam);

        let scoreItem22 = {rule: "Divide by First Param 2", ruleId: 39,
            retain: false, skip: false, sequenceNum: 11, 
            score: 0, completionRound: -1, max: 5, startRoundNum: 800,
            outBlockStart: 0, outBlockLen: 16,
            inBlockStart: 0, inBlockLen: 16,
            paramsIn: [
                [
                    2,20,15,11,96,3,8,200,128,255,27,29,31,14,16,21
                ],
                [
                    3,22,43,67,69,81,72,186,215,4,9,15,22,38,104,126
                ]
            ]
        };
        this.scoreList.push(scoreItem22);
        this.ruleFunction.push(this.divideByFirstParam);
        this.byteFunction.push(this.byteDivideByFirstParam);

        let scoreItem23 = {rule: "Divide by First Param 3", ruleId: 41,
            retain: false, skip: false, sequenceNum: 12, 
            score: 0, completionRound: -1, max: 5, startRoundNum: 800,
            outBlockStart: 0, outBlockLen: 16,
            inBlockStart: 0, inBlockLen: 16,
            paramsIn: [
                [
                    3,20,15,11,96,3,8,200,128,255,27,29,31,14,16,21
                ],
                [
                    4,22,43,67,69,81,72,186,215,4,9,15,22,38,104,126
                ]
            ]
        };
        this.scoreList.push(scoreItem23);
        this.ruleFunction.push(this.divideByFirstParam);
        this.byteFunction.push(this.byteDivideByFirstParam);

        let scoreItem24 = {rule: "Divide by First Param 4", ruleId: 42,
            retain: false, skip: false, sequenceNum: 13, 
            score: 0, completionRound: -1, max: 5, startRoundNum: 800,
            outBlockStart: 0, outBlockLen: 16,
            inBlockStart: 0, inBlockLen: 16,
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
            ]
        };
        this.scoreList.push(scoreItem24);
        this.ruleFunction.push(this.divideByFirstParam);
        this.byteFunction.push(this.byteDivideByFirstParam);

        let scoreItem25 = {rule: "Divide by First Param 5", ruleId: 40,
            retain: false, skip: false, sequenceNum: 14, 
            score: 0, completionRound: -1, max: 5, startRoundNum: 800,
            outBlockStart: 0, outBlockLen: 16,
            inBlockStart: 0, inBlockLen: 16,
            paramsIn: [
                [
                    4,20,15,11,96,3,8,200,128,255,27,29,31,14,16,21
                ],
                [
                    6,22,43,67,69,81,72,186,215,4,9,15,22,38,104,126
                ]
            ]
        };
        this.scoreList.push(scoreItem25);
        this.ruleFunction.push(this.divideByFirstParam);
        this.byteFunction.push(this.byteDivideByFirstParam);

        let scoreItem26 = {rule: "Divide by First Param 6", ruleId: 37,
            retain: false, skip: false, sequenceNum: 15, 
            score: 0, completionRound: -1, max: 5, startRoundNum: 800,
            outBlockStart: 0, outBlockLen: 16,
            inBlockStart: 0, inBlockLen: 16,
            paramsIn: [
                [
                    3,20,15,11,96,3,8,200,128,255,27,29,31,14,16,21
                ],
                [
                    6,22,43,67,69,81,72,186,215,4,9,15,22,38,104,126
                ]
            ]
        };
        this.scoreList.push(scoreItem26);
        this.ruleFunction.push(this.divideByFirstParam);
        this.byteFunction.push(this.byteDivideByFirstParam);

        let scoreItem27 = {rule: "Divide by First Param 7", ruleId: 38,
            retain: false, skip: false, sequenceNum: 16, 
            score: 0, completionRound: -1, max: 5, startRoundNum: 800,
            outBlockStart: 0, outBlockLen: 16,
            inBlockStart: 0, inBlockLen: 16,
            paramsIn: [
                [
                    5,20,15,11,96,3,8,200,128,255,27,29,31,14,16,21
                ],
                [
                    9,22,43,67,69,81,72,186,215,4,9,15,22,38,104,126
                ]
            ]
        };
        this.scoreList.push(scoreItem27);
        this.ruleFunction.push(this.divideByFirstParam);
        this.byteFunction.push(this.byteDivideByFirstParam);

        let scoreItem28 = {rule: "Greater than First Param", ruleId: 19,
            retain: false, skip: false, sequenceNum: 17, 
            score: 0, completionRound: -1, max: 5, startRoundNum: 800,
            outBlockStart: 0, outBlockLen: 16,
            inBlockStart: 0, inBlockLen: 16,
            paramsIn: [
                [
                    20,20,15,11,96,3,8,200,128,255,27,29,31,14,16,21
                ],
                [
                    38,22,43,67,69,81,72,186,215,4,9,15,22,38,104,126
                ]
            ]
        };
        this.scoreList.push(scoreItem28);
        this.ruleFunction.push(this.greaterThanFirstParam);
        this.byteFunction.push(this.byteGreaterThanFirstParam);

        let scoreItem29 = {rule: "Compare First Param", ruleId: 20,
            retain: false, skip: false, sequenceNum: 18, 
            score: 0, completionRound: -1, max: 5, startRoundNum: 800,
            outBlockStart: 0, outBlockLen: 16,
            inBlockStart: 0, inBlockLen: 16,
            paramsIn: [
                [
                    20,20,15,11,96,3,8,200,128,255,27,29,31,14,16,21
                ],
                [
                    38,22,43,67,69,81,72,186,215,4,9,15,22,38,104,126
                ]
            ]
        };
        this.scoreList.push(scoreItem29);
        this.ruleFunction.push(this.compareFirstParam);
        this.byteFunction.push(this.byteCompareFirstParam);

        // Rules with separate input and output pointers
        let scoreItem30 = {rule: "Duplicate Params", ruleId: 21,
            retain: false, skip: false, sequenceNum: 19, 
            score: 0, completionRound: -1, max: 5, startRoundNum: 800,
            outBlockStart: 0, outBlockLen: 16,
            inBlockStart: 0, inBlockLen: 8
        };
        this.scoreList.push(scoreItem30);
        this.ruleFunction.push(this.duplicateParams);
        this.byteFunction.push(this.byteDuplicateParams);

        // Rules relating adjacent parameters
        let scoreItem31 = {rule: "Skip Adjacent Params 1", ruleId: 22,
            retain: false, skip: false, sequenceNum: 20, 
            score: 0, completionRound: -1, max: 5, startRoundNum: 800,
            outBlockStart: 0, outBlockLen: 16,
            inBlockStart: 0, inBlockLen: 32
        };
        this.scoreList.push(scoreItem31);
        this.ruleFunction.push(this.skipAdjacentParams1);
        this.byteFunction.push(this.byteSkipAdjacentParams1);

        let scoreItem32 = {rule: "Skip Adjacent Params 2", ruleId: 23,
            retain: false, skip: false, sequenceNum: 21, 
            score: 0, completionRound: -1, max: 5, startRoundNum: 800,
            outBlockStart: 0, outBlockLen: 16,
            inBlockStart: 0, inBlockLen: 32
        };
        this.scoreList.push(scoreItem32);
        this.ruleFunction.push(this.skipAdjacentParams2);
        this.byteFunction.push(this.byteSkipAdjacentParams2);

        let scoreItem33 = {rule: "Swap Adjacent Params", ruleId: 24,
            retain: false, skip: false, sequenceNum: 22, 
            score: 0, completionRound: -1, max: 5, startRoundNum: 800,
            outBlockStart: 0, outBlockLen: 16,
            inBlockStart: 0, inBlockLen: 16
        };
        this.scoreList.push(scoreItem33);
        this.ruleFunction.push(this.swapAdjacentParams);
        this.byteFunction.push(this.byteSwapAdjacentParams);

        let scoreItem34 = {rule: "Greater of Adjacent Params", ruleId: 25,
            retain: false, skip: false, sequenceNum: 23, 
            score: 0, completionRound: -1, max: 5, startRoundNum: 800,
            outBlockStart: 0, outBlockLen: 16,
            inBlockStart: 0, inBlockLen: 32
        };
        this.scoreList.push(scoreItem34);
        this.ruleFunction.push(this.greaterOfAdjacentParams);
        this.byteFunction.push(this.byteGreaterOfAdjacentParams);

        let scoreItem35 = {rule: "Sort Adjacent Params", ruleId: 26,
            retain: false, skip: false, sequenceNum: 24, 
            score: 0, completionRound: -1, max: 10, startRoundNum: 800,
            outBlockStart: 0, outBlockLen: 16,
            inBlockStart: 0, inBlockLen: 16
        };
        this.scoreList.push(scoreItem35);
        this.ruleFunction.push(this.sortAdjacentParams);
        this.byteFunction.push(this.byteSortAdjacentParams);

        let scoreItem36 = {rule: "Add Adjacent Params", ruleId: 27,
            retain: false, skip: false, sequenceNum: 25, 
            score: 0, completionRound: -1, max: 5, startRoundNum: 800,
            outBlockStart: 0, outBlockLen: 16,
            inBlockStart: 0, inBlockLen: 32
        };
        this.scoreList.push(scoreItem36);
        this.ruleFunction.push(this.addAdjacentParams);
        this.byteFunction.push(this.byteAddAdjacentParams);

        let scoreItem37 = {rule: "Subtract Adjacent Params", ruleId: 28,
            retain: false, skip: false, sequenceNum: 26, 
            score: 0, completionRound: -1, max: 5, startRoundNum: 800,
            outBlockStart: 0, outBlockLen: 16,
            inBlockStart: 0, inBlockLen: 32
        };
        this.scoreList.push(scoreItem37);
        this.ruleFunction.push(this.subtractAdjacentParams);
        this.byteFunction.push(this.byteSubtractAdjacentParams);

        let scoreItem38 = {rule: "Multiply Adjacent Params", ruleId: 29, 
            retain: false, skip: false, sequenceNum: 27, 
            score: 0, completionRound: -1, max: 5, startRoundNum: 800, 
            outBlockStart: 0, outBlockLen: 16, 
            inBlockStart: 0, inBlockLen: 32
        };
        this.scoreList.push(scoreItem38);
        this.ruleFunction.push(this.multiplyInitialParamsByEachother);
        this.byteFunction.push(this.byteMultiplyParams);

        let scoreItem39 = {rule: "Divide Adjacent Params", ruleId: 30, 
            retain: false, skip: false, sequenceNum: 28, 
            score: 0, completionRound: -1, max: 5, startRoundNum: 800, 
            outBlockStart: 0, outBlockLen: 16, inBlockStart: 0, 
            inBlockLen: 32,
            paramsIn: [
                [
                    10,2,  20,2, 36,9, 3,2,   12,0, 15,5,  60,12, 47,3,
                    200,3, 3,6,  7,9,  120,7, 17,4, 18,11, 96,17, 27,3
                ],
                [
                    15,7,  18,9, 21,3, 90,5, 17,0, 200,4, 240,12, 190,3,
                    17,11, 64,6, 17,9, 19,7, 24,3, 96,3,  85,4,   180,26 
                ]
            ]
        };
        this.scoreList.push(scoreItem39);
        this.ruleFunction.push(this.divideAdjacentParams);
        this.byteFunction.push(this.byteDivideAdjacentParams);

        let scoreItem40 = {rule: "Use op to Convert Params", ruleId: 31,
            retain: false, skip: false, sequenceNum: 29, 
            score: 0, completionRound: -1, max: 20, startRoundNum: 800, 
            outBlockStart: 0, outBlockLen: 32,
            inBlockStart: 0, inBlockLen: 96,
            paramsIn: [
                [
                    61,82,5,61,85,3,61,80,4,61,86,7,61,81,12,61,84,20,61,87,95,61,83,100, // 0:23 = a b
                    43,3,2,43,4,5,43,12,13,43,9,11,43,10,10,43,15,8,43,100,50,43,75,72, // 24:47 +
                    45,9,4,45,10,2,45,100,22,45,85,13,45,3,4,45,19,2,45,201,105,45,222,37, // 48:71 -
                    42,3,4,42,5,7,42,9,10,42,12,12,42,8,15,42,20,9,42,7,7,42,11,7 // 72:95 *    
                ],
                [
                    61,81,5,61,84,3,61,82,4,61,86,7,61,83,12,61,85,20,61,80,95,61,87,100, // 0:23 = a b
                    43,5,2,43,10,5,43,22,13,43,19,11,43,17,10,43,18,8,43,109,50,43,77,72, // 24:47 +
                    45,19,4,45,17,2,45,107,22,45,87,13,45,3,5,45,21,2,45,209,105,45,217,37, // 48:71 -
                    42,3,5,42,5,9,42,9,11,42,13,13,42,9,15,42,20,3,42,7,8,42,12,7 // 72:95 *
                ]
            ]
        };
        this.scoreList.push(scoreItem40);
        this.ruleFunction.push(this.paramOperations);
        this.byteFunction.push(this.byteParamOperations);

        let asciiParams1 = this.getASCIIParams(1);
        let scoreItem41 = {rule: "Convert ASCII Numbers 1", ruleId: 32,
            retain: false, skip: false, sequenceNum: 30, 
            score: 0, completionRound: -1, max: 5, startRoundNum: 800,
            outBlockStart: 0, outBlockLen: 16,
            inBlockStart: 0, inBlockLen: 32,
            paramsIn: asciiParams1
        };
        this.scoreList.push(scoreItem41);
        this.ruleFunction.push(this.convertASCIINumbers);
        this.byteFunction.push(this.byteConvertASCIINumbers);

        let asciiParams2 = this.getASCIIParams(2);
        let scoreItem42 = {rule: "Convert ASCII Numbers 2", ruleId: 33,
            retain: false, skip: false, sequenceNum: 31, 
            score: 0, completionRound: -1, max: 5, startRoundNum: 800,
            outBlockStart: 0, outBlockLen: 16,
            inBlockStart: 0, inBlockLen: 32,
            paramsIn: asciiParams2
        };
        this.scoreList.push(scoreItem42);
        this.ruleFunction.push(this.convertASCIINumbers);
        this.byteFunction.push(this.byteConvertASCIINumbers);

        let asciiParams3 = this.getASCIIParams(3);
        let scoreItem43 = {rule: "Convert ASCII Numbers 2", ruleId: 34,
            retain: false, skip: false, sequenceNum: 32, 
            score: 0, completionRound: -1, max: 5, startRoundNum: 800,
            outBlockStart: 0, outBlockLen: 16,
            inBlockStart: 0, inBlockLen: 32,
            paramsIn: asciiParams3
        };
        this.scoreList.push(scoreItem43);
        this.ruleFunction.push(this.convertASCIINumbers);
        this.byteFunction.push(this.byteConvertASCIINumbers);

        let asciiParams4 = this.getASCIIParams(4);
        let scoreItem44 = {rule: "Convert ASCII Numbers 2", ruleId: 35,
            retain: false, skip: false, sequenceNum: 33, 
            score: 0, completionRound: -1, max: 5, startRoundNum: 800,
            outBlockStart: 0, outBlockLen: 16,
            inBlockStart: 0, inBlockLen: 32,
            paramsIn: asciiParams4
        };
        this.scoreList.push(scoreItem44);
        this.ruleFunction.push(this.convertASCIINumbers);
        this.byteFunction.push(this.byteConvertASCIINumbers);

        this.diffScore = 45;
        let scoreItem45 = {rule: "Difference Between Outputs", ruleId: 36, skip: true, 
            retain: true, score: 0, max: 1, startRoundNum: 0};
        this.scoreList.push(scoreItem45);
        this.ruleFunction.push(null);
        this.byteFunction.push(null);

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

    getASCIIParams(setNum) {
        let paramsBlock = [];

        let set1, set2;
        if (setNum === 1) {
            set1 = ["1;","5","7","6","9;","0","8","3","5","9","0","6","3","8","4","2"];
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
        let params1 = insertAsciiStrings(set1);
        paramsBlock.push(params1);
        let params2 = insertAsciiStrings(set2);
        paramsBlock.push(params2);

        return paramsBlock;

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
        codeFlags, initialParams, paramsIn, valuesOut, IC, highestIP, sequenceNum, roundNum) {

        // Get the current maximum score
        this.currentMaxScore = this.getCurrentMaxScore();

        let dataParams = {
            instructionSet: instructionSet,
            memSpace: memSpace,
            codeFlags: codeFlags,
            initialParams: initialParams,
            paramsIn: paramsIn,
            valuesOut: valuesOut,
            IC: IC,
            highestIP: highestIP
        }
        let totalScore = 0;

        for (let i = 0; i < this.scoreList.length; i++) {
            if (!this.scoreList[i].skip) {
                if (this.scoreList[i].retain || (this.scoreList[i].sequenceNum === sequenceNum)) {
                    if (this.ignoreRounds || this.scoreList[i].startRoundNum <= roundNum) {
                        let score = this.ruleFunction[i](this, dataParams, this.scoreList[i]);
                        if (isNaN(score)) {
                            console.log("Erroneous Score:", i);
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

    getCurrentMaxScore() {
        let maxScore = 0;
        for (let rule of this.scoreList) {
            if ("sequenceNum" in rule && !rule.skip) {
                if (rule.sequenceNum === this.ruleSequenceNum || 
                    (rule.sequenceNum <= this.ruleSequenceNum && rule.retain)) {
                    maxScore += rule.max * 2;
                }
            }
        }
        return (maxScore);
    },

    scoreOutputDiff(outputs) {
        let count = 0;
        let l = outputs.length;
        for (let i = 0; i < outputs[0].length; i++) {
            let v = outputs[0][i];
            for (let j = 1; j < l; j++) {
                if (i < outputs[j].length) {
                    if (v != outputs[j][i]) {
                        ++count;
                        break;
                    }
                }
            }
        }
        let opt = outputs[0].length;
        let max = opt;
        let min = 0;
        let score = this.doScore(opt, count, max, min);
        score = score * this.scoreList[this.diffScore].max;
        this.scoreList[this.diffScore].score = score;
        return score;
    },

    insDistribution: function (self, dataParams, ruleParams) {
        let instructionSet = dataParams.instructionSet;
        let memSpace = dataParams.memSpace;
        insSet = [
            {
                ins: "LDI A, (MEM)",
                countOpt: 16,
                distributionOpt: 16
            },
            {
                ins: "SM",
                countOpt: self.meanInsCount / 16,
                distributionOpt: 16
            },
            {
                ins: "CALL",
                countOpt: 16,
                distributionOpt: 8
            },
            {
                ins: "CASM",
                countOpt: 16,
                distributionOpt: 8
            },
            {
                ins: "JR",
                countOpt: 8,
                distributionOpt: 14
            },
            {
                ins: "JRC",
                countOpt: 8,
                distributionOpt: 14
            },
            {
                ins: "JRZ",
                countOpt: 8,
                distributionOpt: 14
            },
            {   
                ins: "RET",
                countOpt: self.meanInsCount / 16,
                distributionOpt: 16

            },
            {
                ins: "RETF",
                countOpt: 3,
                distributionOpt: (memSpace.length) / 3
            }
        ];

        let totalScore = 0;

        // Count of occurrences
        for (let insData of insSet) {
            let ins = insData.ins;
            let count = instructionSet.countInsInMemSpace(memSpace, memSpace.length, ins);
            let opt = insData.countOpt;
            let max = self.meanInsCount;
            let min = 0;
            let score1 = self.doScore(opt, count, max, min);
            totalScore += score1;
            if (isNaN(score1)) {
                console.log("error in insDistribution first part", score1, count, max, opt);
                break;
            }
        }
        let score = totalScore * 0.5 / insSet.length;

        // Distributions
        totalScore = 0;
        for (let insData of insSet) {
            let ins = insData.ins;
            let opt = insData.distributionOpt;
            let score1 = instructionSet.scoreDistribution(ins, opt, memSpace, memSpace.length);
            totalScore += score1;
        }
        totalScore = totalScore/(2 * insSet.length);
        score += totalScore;

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

        let opt = 800;
        let max = 2000;
        let min = 0;
        let score = self.doScore(opt, IC, max, min);
        return score;

    },

    highestIPScore(self, dataParams, ruleParams) {
        let IP = dataParams.highestIP;
        let maxIP = dataParams.memSpace.length;

        let opt = Math.floor((maxIP + 1) * 0.8);
        let max = maxIP + 1;
        let min = 0;
        let score = self.doScore(opt, IP, max, min);
        return score;
    },

    valuesOutSet(self, dataParams, ruleParams) {
        let valuesOut = dataParams.valuesOut;
        let outBlockStart = ruleParams.outBlockStart;
        let outBlockLen = ruleParams.outBlockLen;

        let count = 0;
        for (let i = outBlockStart; i < outBlockStart + outBlockLen; i++) {
            if (valuesOut[i] != 0) ++count;
        }
        let opt = outBlockLen;
        let max = opt;
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

    valuesOutSeries(self, dataParams, ruleParams) {
        let valuesOut = dataParams.valuesOut;
        let outBlockStart = ruleParams.outBlockStart;
        let outBlockLen = ruleParams.outBlockLen;

        let count = 0;
        let oldD;
        for (let i = 1; i < outBlockLen; i++) {
            let d = valuesOut[outBlockStart + i] - valuesOut[outBlockStart + i - 1];
            if (i > 1 && d === oldD && d != 0) ++count;
            oldD = d;
        }
        let opt = outBlockLen - 2;
        let max = opt;
        let min = 0
        let score = self.doScore(opt, count, max, min);
        return score;
    },

    byteValuesOutSeries(self, rule, value, address, initialParams, params, outputValues) {
        let score = 255;
        if (address === rule.outBlockStart) {
            let diff = Math.abs(outputValues[rule.outBlockStart + 2] - outputValues[rule.outBlockStart + 1]);
            if (diff != 0) {
                let hitDiff = Math.abs(outputValues[rule.outBlockStart + 1] - value);
                if (hitDiff === diff) {
                    score = 0;
                }
            }
        }
        else if (address === rule.outBlockStart + 1) {
            let diff = Math.abs(outputValues[rule.outBlockStart + 3] - outputValues[rule.outBlockStart + 2]);
            if (diff != 0) {
                let hitDiff = Math.abs(outputValues[rule.outBlockStart] - value);
                if (hitDiff === diff) {
                    score = 0;
                }
            }
        }
        else {
            let diff = Math.abs(outputValues[rule.outBlockStart + 1] - outputValues[rule.outBlockStart]);
            if (diff != 0) {
                let hitDiff = Math.abs(outputValues[address - 1] - value);
                if (hitDiff === diff) {
                    score = 0;
                }
            }
        }
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

    byteSubtractAdjacentParams(self, rule, value, address, initialParams, params, outputValues) {
        let outBlockStart = rule.outBlockStart;
        let inBlockStart = rule.inBlockStart;
        let offset = address - outBlockStart;
        let p = inBlockStart + offset * 2;
        let v = (initialParams[p] - initialParams[p + 1]) & 255;
        let score = self.doByteScore(v, value);
        return score;
    },

    multiplyInitialParamsByEachother(self, dataParams, ruleParams) {
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
            if (op === 61) {
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

    byteParamOperations(self, rule, value, address, initialParams, params, outputValues) {
        let numCommandTypes = 4;
        let score = 255;
        let offset = address - rule.outBlockStart;
        let required = 0;
        if (offset < 8) {
            // = a b rule
            // Find the corresponding parameter command
            let found = false;
            for (let i = 0; i < rule.inBlockLen / numCommandTypes; i += 3) {
                let a = initialParams[rule.inBlockStart + i + 1];
                if (a === address) {
                    required = initialParams[rule.inBlockStart + i + 2];
                    found = true;
                    break;
                }
            }
            if (found) {
                score = self.doByteScore(required, value);
            }
        }
        else {
            let inAddr = rule.inBlockStart;
            let op = initialParams[inAddr + offset * 3];
            let a = initialParams[inAddr + offset * 3 + 1];
            let b = initialParams[inAddr + offset * 3 + 2];
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
                default: 
                    console.log("op error in paramOperations rule at:", i);
                    r = 0;
            }
            score = self.doByteScore(r, value);
        }
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

    seedRuleUpdate(memSpace, score, roundNum) {
        if ((score >= this.currentMaxScore * (9.9/10)) && this.ruleSequenceNum < this.maxRuleSequenceNum) {
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
        for (let rule of this.scoreList) {
            if (!rule.retain && !rule.skip) {
                if (rule.sequenceNum === sequenceNum) {
                    return rule;
                }
            }
        }
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