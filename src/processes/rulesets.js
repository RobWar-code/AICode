const { app } = require('electron');
const path = require('node:path');
const testObj = require(path.join(__dirname, 'testObj'));
const dbConn = require(path.join(__dirname, "../database/dbConn.js"));
const dbTransactions = require(path.join(__dirname, "../database/dbTransactions.js"));

const rulesets = {
    meanInsLen: 1.5,
    meanInsCount: 240 / 1.5,
    numOutputZones: 8,
    outputZoneLen: 8,
    numRules: 29,
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
    ruleCompletionRound: new Array(29).fill(-1),
    seedRuleNum: 9,
    seedRuleMemSpaces: [],
    seedRuleSet: false,

    initialise() {

        this.scoreList = [];
        this.ruleFunction = [];
        this.byteFunction = [];

        let scoreItem0 = {rule: "Instruction Distribution", ruleNum: 0, skip: true, 
            score: 0, max: 4, startRoundNum: 800};
        this.scoreList.push(scoreItem0);
        this.ruleFunction.push(this.insDistribution);
        this.byteFunction.push(null);

        let scoreItem1 = {rule: "Matching CASM Instruction", ruleNum: 1, skip: true, sequenceNum: 0,
            score: 0, max: 4, startRoundNum: 0};
        this.scoreList.push(scoreItem1);
        this.ruleFunction.push(this.matchCASM);
        this.byteFunction.push(null);

        let scoreItem2 = {rule: "Number of reverse JR ins", ruleNum: 2, skip: true, sequenceNum: 0,
            score: 0, max: 4, startRoundNum: 0
        }
        this.scoreList.push(scoreItem2);
        this.ruleFunction.push(this.reverseJR);
        this.byteFunction.push(null);

        let scoreItem3 = {rule: "Instruction Counter", ruleNum: 3, skip: true,
            score: 0, max: 1, startRoundNum: 800};
        this.scoreList.push(scoreItem3);
        this.ruleFunction.push(this.instructionCount);
        this.byteFunction.push(null);

        let scoreItem4 = {rule: "Highest IP", ruleNum: 4, skip: true,
            score: 0, max: 1, startRoundNum: 800};
        this.scoreList.push(scoreItem4);
        this.ruleFunction.push(this.highestIPScore);
        this.byteFunction.push(null);

        let scoreItem5 = {rule: "Params Preserved", ruleNum: 5, skip: false, sequenceNum: 0,
            retain: true, score: 0, max: 3, startRoundNum: 0};
        this.scoreList.push(scoreItem5);
        this.ruleFunction.push(this.initialParamsPreserved);
        this.byteFunction.push(null);

        let scoreItem6 = {rule: "Values Out Set (0:111)", ruleNum: 6, skip: false, sequenceNum: 0,
            retain: true, score: 0, max: 2, startRoundNum: 0, 
            outBlockStart: 0, outBlockLen: 128 
        };
        this.scoreList.push(scoreItem6);
        this.ruleFunction.push(this.valuesOutSet);
        this.byteFunction.push(null);

        let scoreItem7 = {rule: "Values Out From Params (0:7, 0:7)", ruleNum: 7, skip: true,
            score: 0, max: 4, startRoundNum: 800,
            outBlockStart: 0, outBlockLen: 8, inBlockStart: 0, inBlockLen: 8
        };
        this.scoreList.push(scoreItem7);
        this.ruleFunction.push(this.valuesOutFromParams)
        this.byteFunction.push(this.byteValuesOutFromParams);

        let scoreItem8 = {rule: "Values Out From Initial Params (0:8, 8:15)", ruleNum: 8, skip: true,
            score: 0, max: 4, 
            startRoundNum: 800,
            outBlockStart: 0, outBlockLen: 8, inBlockStart: 0, inBlockLen: 8
        };
        this.scoreList.push(scoreItem8);
        this.ruleFunction.push(this.valuesOutFromInitialParams);
        this.byteFunction.push(this.byteValuesOutFromInitialParams);

        let scoreItem9 = {rule:"Values Out Match Initial Params (0:8, 16:23)", ruleNum: 9, skip:false, sequenceNum: 0,
            retain: false, score: 0, completionRound: -1, max: 4,
            startRoundNum: 0,
            outBlockStart: 0, outBlockLen: 8, inBlockStart: 0, inBlockLen: 8
        };
        this.scoreList.push(scoreItem9);
        this.ruleFunction.push(this.valuesOutMatchInitialParams);
        this.byteFunction.push(this.byteValuesOutMatch);

        let scoreItem10 = {rule: "Values Out Different (24:31)", ruleNum: 10, skip:true,
            score: 0, max: 1, startRoundNum: 800,
            outBlockStart: 0, outBlockLen: 8
        };
        this.scoreList.push(scoreItem10);
        this.ruleFunction.push(this.valuesOutDifferent);
        this.byteFunction.push(this.byteValuesOutDifferent);

        let scoreItem11 = {rule: "Values Out Series (32:39)", ruleNum: 11, skip: true,
            score: 0, max: 1, startRoundNum: 800,
            outBlockStart: 0, outBlockLen: 8
        };
        this.scoreList.push(scoreItem11);
        this.ruleFunction.push(this.valuesOutSeries);
        this.byteFunction.push(this.byteValuesOutSeries);

        let scoreItem12 = {rule: "Params Plus Three (0:7, 40:47)", ruleNum: 12, skip: false, sequenceNum: 1,
            retain: false, score: 0, completionRound: -1, max: 4, startRoundNum: 28, 
            outBlockStart: 0, outBlockLen: 8, inBlockStart: 0, inBlockLen: 8
        };
        this.scoreList.push(scoreItem12);
        this.ruleFunction.push(this.paramsPlusThree);
        this.byteFunction.push(this.byteParamsPlusThree);

        let scoreItem13 = {rule: "Params Minus Three (0:7, 48:55)", ruleNum: 13, skip: false, sequenceNum: 2,
            retain: false, score: 0, completionRound: -1, max: 4, startRoundNum: 56,
            outBlockStart: 0, outBlockLen: 8, inBlockStart: 0, inBlockLen: 8
        };
        this.scoreList.push(scoreItem13);
        this.ruleFunction.push(this.paramsMinusThree);
        this.byteFunction.push(this.byteParamsMinusThree);

        let scoreItem14 = {rule: "Params Times Two (0:7, 56:63)", ruleNum: 14, skip: false, sequenceNum: 3,
            retain: false, score: 0, completionRound: -1, max: 4, startRoundNum: 84,
            outBlockStart: 0, outBlockLen: 8, inBlockStart: 0, inBlockLen: 8
        };
        this.scoreList.push(scoreItem14);
        this.ruleFunction.push(this.paramsTimesTwo)
        this.byteFunction.push(this.byteParamsTimesTwo);

        // Rules with interaction between parameters
        let scoreItem15 = {rule: "Add First Param", ruleNum: 15,
            retain: false, skip: false, sequenceNum: 4, 
            score: 0, completionRound: -1, max: 4, startRoundNum: 800,
            outBlockStart: 0, outBlockLen: 8,
            inBlockStart: 0, inBlockLen: 8
        };
        this.scoreList.push(scoreItem15);
        this.ruleFunction.push(this.addFirstParam);
        this.byteFunction.push(this.byteAddFirstParam);

        let scoreItem16 = {rule: "Add Second Param", ruleNum: 16,
            retain: false, skip: false, sequenceNum: 5, 
            score: 0, completionRound: -1, max: 4, startRoundNum: 800,
            outBlockStart: 0, outBlockLen: 8,
            inBlockStart: 0, inBlockLen: 8
        };
        this.scoreList.push(scoreItem16);
        this.ruleFunction.push(this.addSecondParam);
        this.byteFunction.push(this.byteAddSecondParam);

        // Rules with separate input and output pointers
        let scoreItem17 = {rule: "Duplicate Params", ruleNum: 17,
            retain: false, skip: false, sequenceNum: 6, 
            score: 0, completionRound: -1, max: 4, startRoundNum: 800,
            outBlockStart: 0, outBlockLen: 8,
            inBlockStart: 0, inBlockLen: 4
        };
        this.scoreList.push(scoreItem17);
        this.ruleFunction.push(this.duplicateParams);
        this.byteFunction.push(this.byteDuplicateParams);

        // Rules relating adjacent parameters
        let scoreItem18 = {rule: "Skip Adjacent Params 1", ruleNum: 18,
            retain: false, skip: false, sequenceNum: 7, 
            score: 0, completionRound: -1, max: 4, startRoundNum: 800,
            outBlockStart: 0, outBlockLen: 8,
            inBlockStart: 0, inBlockLen: 16
        };
        this.scoreList.push(scoreItem18);
        this.ruleFunction.push(this.skipAdjacentParams1);
        this.byteFunction.push(this.byteSkipAdjacentParams1);

        let scoreItem19 = {rule: "Skip Adjacent Params 2", ruleNum: 19,
            retain: false, skip: false, sequenceNum: 8, 
            score: 0, completionRound: -1, max: 4, startRoundNum: 800,
            outBlockStart: 0, outBlockLen: 8,
            inBlockStart: 0, inBlockLen: 16
        };
        this.scoreList.push(scoreItem19);
        this.ruleFunction.push(this.skipAdjacentParams2);
        this.byteFunction.push(this.byteSkipAdjacentParams2);

        let scoreItem20 = {rule: "Swap Adjacent Params", ruleNum: 20,
            retain: false, skip: false, sequenceNum: 9, 
            score: 0, completionRound: -1, max: 4, startRoundNum: 800,
            outBlockStart: 0, outBlockLen: 8,
            inBlockStart: 0, inBlockLen: 8
        };
        this.scoreList.push(scoreItem20);
        this.ruleFunction.push(this.swapAdjacentParams);
        this.byteFunction.push(this.byteSwapAdjacentParams);

        let scoreItem21 = {rule: "Sort Adjacent Params", ruleNum: 21,
            retain: false, skip: false, sequenceNum: 10, 
            score: 0, completionRound: -1, max: 4, startRoundNum: 800,
            outBlockStart: 0, outBlockLen: 8,
            inBlockStart: 0, inBlockLen: 8
        };
        this.scoreList.push(scoreItem21);
        this.ruleFunction.push(this.sortAdjacentParams);
        this.byteFunction.push(this.byteSortAdjacentParams);


        let scoreItem22 = {rule: "Add Adjacent Params", ruleNum: 22,
            retain: false, skip: false, sequenceNum: 11, 
            score: 0, completionRound: -1, max: 4, startRoundNum: 800,
            outBlockStart: 0, outBlockLen: 8,
            inBlockStart: 0, inBlockLen: 16
        };
        this.scoreList.push(scoreItem22);
        this.ruleFunction.push(this.addAdjacentParams);
        this.byteFunction.push(this.byteAddAdjacentParams);

        let scoreItem23 = {rule: "Subtract Adjacent Params", ruleNum: 23,
            retain: false, skip: false, sequenceNum: 12, 
            score: 0, completionRound: -1, max: 4, startRoundNum: 800,
            outBlockStart: 0, outBlockLen: 8,
            inBlockStart: 0, inBlockLen: 16
        };
        this.scoreList.push(scoreItem23);
        this.ruleFunction.push(this.subtractAdjacentParams);
        this.byteFunction.push(this.byteSubtractAdjacentParams);

        let scoreItem24 = {rule: "Multiply Adjacent Params", ruleNum: 24, 
            retain: false, skip: false, sequenceNum: 13, 
            score: 0, completionRound: -1, max: 4, startRoundNum: 800, 
            outBlockStart: 0, outBlockLen: 8, 
            inBlockStart: 0, inBlockLen: 16
        };
        this.scoreList.push(scoreItem24);
        this.ruleFunction.push(this.multiplyInitialParamsByEachother);
        this.byteFunction.push(this.byteMultiplyParams);

        let scoreItem25 = {rule: "Divide Block of Inputs(1:6, 10:16, 72:77)", ruleNum: 25, 
            retain: false, skip: false, sequenceNum: 14, 
            score: 0, completionRound: -1, max: 4, startRoundNum: 800, 
            outBlockStart: 0, outBlockLen:6, inBlockStart: 1, 
            inBlockLen: 6, inBlockStart2: 10 
        };
        this.scoreList.push(scoreItem25);
        this.ruleFunction.push(this.divideByParams);
        this.byteFunction.push(this.byteDivideParams);

        let scoreItem26 = {rule: "Use op to Convert Params (16:111, 80:111)", ruleNum: 26,
            retain: false, skip: false, sequenceNum: 15, 
            score: 0, completionRound: -1, max: 16, startRoundNum: 800, 
            outBlockStart: 0, outBlockLen: 32,
            inBlockStart: 16, inBlockLen: 96
        };
        this.scoreList.push(scoreItem26);
        this.ruleFunction.push(this.paramOperations);
        this.byteFunction.push(this.byteParamOperations);

        let scoreItem27 = {rule: "Convert ASCII Numbers (112:146, 112:127)", ruleNum: 27,
            retain: false, skip: false, sequenceNum: 16, 
            score: 0, completionRound: -1, max: 8, startRoundNum: 800,
            outBlockStart: 0, outBlockLen: 16,
            inBlockStart: 112, inBlockLen: 38
        };
        this.scoreList.push(scoreItem27);
        this.ruleFunction.push(this.convertASCIINumbers);
        this.byteFunction.push(this.byteConvertASCIINumbers);

        this.diffScore = 28;
        let scoreItem28 = {rule: "Difference Between Outputs", ruleNum: 28, skip: true, 
            retain: true, score: 0, max: 2, startRoundNum: 0};
        this.scoreList.push(scoreItem28);
        this.byteFunction.push(null);

        let maxScore = 0;
        let maxSequenceNum = 0;
        let index = 0;
        for (let scoreItem of this.scoreList) {
            maxScore += scoreItem.max;
            if (scoreItem.sequenceNum > maxSequenceNum) {
                maxSequenceNum = scoreItem.sequenceNum;
            }
            scoreItem.completionRound = this.ruleCompletionRound[index];
            ++index;
        }
        this.maxScore = maxScore * 2 - this.scoreList[this.diffScore].max;
        this.maxRuleSequenceNum = maxSequenceNum;

    },

    getOutputByteScore(value, address, initialParams, params, outputValues, roundNum) {
        let totalScore = 0;
        let totalSignificance = 0;
        // For each rule applicable to the address
        let index = 0;
        for (let rule of this.scoreList) {
            if (this.byteFunction[index] != null) {
                if (rule.retain || rule.sequenceNum === this.ruleSequenceNum) {
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
        codeFlags, initialParams, paramsIn, valuesOut, IC, highestIP, roundNum) {
        let totalScore = 0;

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

        for (let i = 0; i < this.scoreList.length; i++) {
            if (!this.scoreList[i].skip) {
                if (this.scoreList[i].retain || this.scoreList[i].sequenceNum === this.ruleSequenceNum) {
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
                    (rule.sequenceNum < this.ruleSequenceNum && rule.retain)) {
                    maxScore += rule.max * 2;
                }
            }
        }
        maxScore += this.scoreList[this.scoreList.length - 1].max;
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

    paramsPlusThree(self, dataParams, ruleParams) {
        let initialParams = dataParams.initialParams;
        let valuesOut = dataParams.valuesOut;
        let outBlockStart = ruleParams.outBlockStart;
        let outBlockLen = ruleParams.outBlockLen;
        let inBlockStart = ruleParams.inBlockStart;

        let count = 0;
        for (let i = 0; i < outBlockLen; i++) {
            if (initialParams[inBlockStart + i] + 3 === valuesOut[i + outBlockStart]) ++count;
        }
        let opt = outBlockLen;
        let max = outBlockLen;
        let min = 0;
        let score = self.doScore(opt, count, max, min);
        return score;
    },

    byteParamsPlusThree(self, rule, value, address, initialParams, params, outputValues) {
        let offset = address - rule.outBlockStart;
        let required = (initialParams[rule.inBlockStart + offset] + 3) & 255;
        let opt = required;
        let score = self.doByteScore(opt, value);
        return score;
    },

    paramsMinusThree(self, dataParams, ruleParams) {
        let initialParams = dataParams.initialParams;
        let valuesOut = dataParams.valuesOut;
        let outBlockStart = ruleParams.outBlockStart;
        let outBlockLen = ruleParams.outBlockLen;
        let inBlockStart = ruleParams.inBlockStart;

        let count = 0;
        for (let i = 0; i < outBlockLen; i++) {
            let a = (initialParams[inBlockStart + i] - 3) & 255;
            if (a === valuesOut[i + outBlockStart]) ++count;
        }
        let opt = outBlockLen;
        let max = outBlockLen;
        let min = 0;
        let score = self.doScore(opt, count, max, min);
        return score;
    },

    byteParamsMinusThree(self, rule, value, address, initialParams, params, outputValues) {
        let offset = address - rule.outBlockStart;
        let required = (initialParams[rule.inBlockStart + offset] - 3) & 255;
        let score = self.doByteScore(required, value);
        return score;
    },

    paramsTimesTwo(self, dataParams, ruleParams) {
        let initialParams = dataParams.initialParams;
        let valuesOut = dataParams.valuesOut;
        let outBlockStart = ruleParams.outBlockStart;
        let outBlockLen = ruleParams.outBlockLen;
        let inBlockStart = ruleParams.inBlockStart;

        let count = 0;
        for (let i = 0; i < outBlockLen; i++) {
            if (valuesOut[outBlockStart + i] === 2 * initialParams[inBlockStart + i]) ++count;
        }
        let min = 0;
        let max = outBlockLen;
        let opt = max;
        let score = self.doScore(opt, count, max, min);
        return score;
    },

    byteParamsTimesTwo(self, rule, value, address, initialParams, params, outputValues) {
        let offset = address - rule.outBlockStart;
        let required = (initialParams[rule.inBlockStart + offset] * 2) & 255;
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
            let r = initialParams[inBlockStart + i] + a;
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
        let required = a + initialParams[offset];
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
            let r = initialParams[inBlockStart + i] + a;
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
        let required = a + initialParams[offset];
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
            let r = initialParams[i];
            let v1 = valuesOut[i * 2];
            if (v1 === r) ++count;
            let v2 = valuesOut[i * 2 + 1];
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
        let required = initialParams[ip];
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
            if (v1 * v2 === v3) ++count; 
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
        let required = a * b;
        if (required > 255) {
            required = required & 255;
        }
        let score = self.doByteScore(required, value);
        return score;
    },

    divideByParams(self, dataParams, ruleParams) {
        let initialParams = dataParams.initialParams;
        let valuesOut = dataParams.valuesOut;
        let outBlockStart = ruleParams.outBlockStart;
        let outBlockLen = ruleParams.outBlockLen;
        let inBlockStart = ruleParams.inBlockStart;
        let inBlockStart2 = ruleParams.inBlockStart2;

        let count = 0;
        for (let i = 0; i < outBlockLen; i++) {
            let a = initialParams[i + inBlockStart];
            let b = initialParams[i + inBlockStart2];
            let d = valuesOut[i + outBlockStart];
            if (a === 0 && d === 0) ++count; 
            else if (d === Math.floor(b/a)) ++count;
        }
        let opt = outBlockLen;
        let max = opt;
        let min = 0;
        let score = self.doScore(opt, count, max, min);
        return score;
    },

    byteDivideParams(self, rule, value, address, initialParams, params, outputValues) {
        let offset = address - rule.outBlockStart;
        let a = initialParams[rule.inBlockStart + offset];
        let b = initialParams[rule.inBlockStart2 + offset];
        let required = Math.floor(b/a) & 255;
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
                score = (1 - x/(opt - min)) ** 1.01;
            }
        }
        else {
            x = Math.abs(x);
            if (actual > max || (actual === max && max != opt)) score = 0;
            else {
                score = (1 - x/(max - opt)) ** 1.01;
            }
        }
        return score;
    },

    doByteScore(opt, value) {
        let score = 255;
        if (opt === value) score = 0;
        return score;
    },

    seedRuleUpdate(bestEntity, roundNum) {
        console.log("Got to seedRuleUpdate", bestEntity.score, this.currentMaxScore);
        if (bestEntity.score >= this.currentMaxScore * (19/20) && this.ruleSequenceNum < this.maxRuleSequenceNum) {
            console.log("Doing seedRuleUpdate");
            // Save the seed entity from the current rule
            this.seedRuleMemSpaces.push(bestEntity.initialMemSpace.concat());
            console.log("seedRuleMemSpace", this.seedRuleMemSpaces.length);
            this.seedRuleSet = true;
            ++this.ruleSequenceNum;
            dbTransactions.saveSeedRule(this.ruleSequenceNum, bestEntity.initialMemSpace.concat());
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
            if (item.sequenceNum === sequenceNum && item.retain === false) {
                found = true;
                rule = item.rule;
                break;
            }
        }
        return rule;
    }
}

module.exports = rulesets;