const { app } = require('electron');
const path = require('node:path');
const testObj = require(path.join(__dirname, 'testObj'));

const rulesets = {
    meanInsLen: 1.5,
    meanInsCount: 240 / 1.5,
    numOutputZones: 8,
    outputZoneLen: 8,
    numRules: 13,
    scoreList: [],
    ruleFunction: [],
    byteFunction: [],
    totalScore: 0,
    maxScore: 0,
    diffScore: 0,
    ignoreRounds: true,

    initialise() {

        this.scoreList = [];
        this.byteFunction = [];

        let scoreItem0 = {rule: "Instruction Distribution", ruleNum: 0, skip: false, 
            score: 0, max: 4, startRoundNum: 0};
        this.scoreList.push(scoreItem0);
        this.ruleFunction.push(this.insDistribution);
        this.byteFunction.push(null);

        let scoreItem1 = {rule: "Matching CASM Instruction", ruleNum: 1, skip: false,
            score: 0, max: 4, startRoundNum: 0};
        this.scoreList.push(scoreItem1);
        this.ruleFunction.push(this.matchCASM);
        this.byteFunction.push(null);

        let scoreItem2 = {rule: "Instruction Counter", ruleNum: 2, skip:false,
            score: 0, max: 1, startRoundNum: 0};
        this.scoreList.push(scoreItem2);
        this.ruleFunction.push(this.instructionCount);
        this.byteFunction.push(null);

        let scoreItem3 = {rule: "Highest IP", ruleNum: 3, skip: false,
            score: 0, max: 1, startRoundNum: 0};
        this.scoreList.push(scoreItem3);
        this.ruleFunction.push(this.highestIPScore);
        this.byteFunction.push(null);

        let scoreItem4 = {rule: "Params Preserved", ruleNum: 4, skip: false,
            score: 0, max: 3, startRoundNum: 0};
        this.scoreList.push(scoreItem4);
        this.ruleFunction.push(this.initialParamsPreserved);
        this.byteFunction.push(null);

        let scoreItem5 = {rule: "Values Out Set (0:111)", ruleNum: 5, skip: false,
            score: 0, max: 4, startRoundNum: 0, 
            outBlockStart: 0, outBlockLen: 112 
        };
        this.scoreList.push(scoreItem5);
        this.ruleFunction.push(this.valuesOutSet);
        this.byteFunction.push(this.byteValuesOutSet);

        let scoreItem6 = {rule: "Values Out From Params (0:7, 0:7)", ruleNum: 6, skip: false,
            score: 0, max: 4, startRoundNum: 2,
            outBlockStart: 0, outBlockLen: 8, inBlockStart: 0, inBlockLen: 8
        };
        this.scoreList.push(scoreItem6);
        this.ruleFunction.push(this.valuesOutFromParams)
        this.byteFunction.push(this.byteValuesOutFromParams);

        let scoreItem7 = {rule: "Values Out From Initial Params (0:8, 8:15)", ruleNum: 7, skip: false,
            score: 0, max: 4, 
            startRoundNum: 5,
            outBlockStart: 8, outBlockLen: 8, inBlockStart: 0, inBlockLen: 8
        };
        this.scoreList.push(scoreItem7);
        this.ruleFunction.push(this.valuesOutFromInitialParams);
        this.byteFunction.push(this.byteValuesOutFromInitialParams);

        let scoreItem8 = {rule:"Values Out Match Initial Params (0:8, 16:23)", ruleNum: 8, skip:false,
            score: 0, max: 4,
            startRoundNum: 10,
            outBlockStart: 16, outBlockLen: 8, inBlockStart: 0, inBlockLen: 8
        };
        this.scoreList.push(scoreItem8);
        this.ruleFunction.push(this.valuesOutMatchInitialParams);
        this.byteFunction.push(this.byteValuesOutMatch);

        let scoreItem9 = {rule: "Values Out Different (24:31)", ruleNum: 9, skip:false,
            score: 0, max: 1, startRoundNum: 15,
            outBlockStart: 24, outBlockLen: 8
        };
        this.scoreList.push(scoreItem9);
        this.ruleFunction.push(this.valuesOutDifferent);
        this.byteFunction.push(this.byteValuesOutDifferent);

        let scoreItem10 = {rule: "Values Out Series (32:39)", ruleNum: 7, skip:false,
            score: 0, max: 1, startRoundNum: 17,
            outBlockStart: 32, outBlockLen: 8
        };
        this.scoreList.push(scoreItem10);
        this.ruleFunction.push(this.valuesOutSeries);
        this.byteFunction.push(this.byteValuesOutSeries);

        let scoreItem11 = {rule: "Params Plus Three (0:7, 40:47)", ruleNum: 11, skip: false,
            score: 0, max: 4, startRoundNum: 22, 
            outBlockStart: 40, outBlockLen: 8, inBlockStart: 0, inBlockLen: 8
        };
        this.scoreList.push(scoreItem11);
        this.ruleFunction.push(this.paramsPlusThree);
        this.byteFunction.push(this.byteParamsPlusThree);

        let scoreItem12 = {rule: "Params Minus Three (0:7, 48:55)", ruleNum: 12, skip: false,
            score: 0, max: 4, startRoundNum: 30,
            outBlockStart: 48, outBlockLen: 8, inBlockStart: 0, inBlockLen: 8
        };
        this.scoreList.push(scoreItem12);
        this.ruleFunction.push(this.paramsMinusThree);
        this.byteFunction.push(this.byteParamsMinusThree);

        let scoreItem13 = {rule: "Params Times Two (0:7, 56:63)", ruleNum: 13, skip: false, 
            score: 0, max: 4, startRoundNum: 40,
            outBlockStart: 56, outBlockLen: 8, inBlockStart: 4, inBlockLen: 8
        };
        this.scoreList.push(scoreItem13);
        this.ruleFunction.push(this.paramsTimesTwo)
        this.byteFunction.push(this.byteParamsTimesTwo);

        let scoreItem14 = {rule: "Multiply Initial Params By Each Other (0:9, 64:68)", ruleNum: 14, 
            skip: false, score: 0, max: 4, startRoundNum: 50, 
            outBlockStart: 64, outBlockLen:5, 
            inBlockStart: 0, inBlockLen: 10
        };
        this.scoreList.push(scoreItem14);
        this.ruleFunction.push(this.multiplyInitialParamsByEachother);
        this.byteFunction.push(this.byteMultiplyParams);

        let scoreItem15 = {rule: "Divide Block of Inputs(1:6, 10:16, 72:77)", ruleNum: 15, 
            skip: false, score: 0, max: 4, startRoundNum: 60, 
            outBlockStart: 72, outBlockLen:6, inBlockStart: 1, 
            inBlockLen: 6, inBlockStart2: 10 
        };
        this.scoreList.push(scoreItem15);
        this.ruleFunction.push(this.divideByParams);
        this.byteFunction.push(this.byteDivideParams);

        let scoreItem16 = {rule: "Use op to Convert Params (16:114, 80:111)", ruleNum:16,
            skip: false, score: 0, max: 16, startRoundNum: 70, 
            outBlockStart: 80, outBlockLen: 32,
            inBlockStart: 16, inBlockLen: 96
        }
        this.scoreList.push(scoreItem16);
        this.ruleFunction.push(this.paramOperations);
        this.byteFunction.push(this.byteParamOperations);

        this.diffScore = 17;
        let scoreItem17 = {rule: "Difference Between Outputs", ruleNum: 17, skip: true, 
            score: 0, max: 4, startRoundNum: 0};
        this.scoreList.push(scoreItem17);
        this.byteFunction.push(null);

        let maxScore = 0;
        for (let scoreItem of this.scoreList) {
            maxScore += scoreItem.max;
        }
        this.maxScore = maxScore * 2 - this.scoreList[this.diffScore].max;

    },

    getOutputByteScore(value, address, initialParams, params, outputValues, roundNum) {
        let totalScore = 0;
        let totalSignificance = 0;
        // For each rule applicable to the address
        let index = 0;
        for (let rule of this.scoreList) {
            if (this.byteFunction[index] != null) {
                if (rule.startRoundNum <= roundNum || this.ignoreRounds) {
                    if (address >= rule.outBlockStart && address < rule.outBlockStart + rule.outBlockLen) {
                        let score = this.byteFunction[index](rule, value, address, initialParams, params, outputValues);
                        if (isNaN(score)) {
                            console.log("Invalid byte score", score, index);
                        }
                        totalScore += score;
                        totalSignificance += rule.max;
                    }
                }
            }
            ++index;
        }
        return {totalScore: totalScore, totalSignificance: totalSignificance};
        
    },

    getScore: function (bestSetHighScore, bestSetLowScore, instructionSet, memSpace, 
        initialParams, paramsIn, valuesOut, IC, highestIP, roundNum) {
        let totalScore = 0;

        let dataParams = {
            instructionSet: instructionSet,
            memSpace: memSpace,
            initialParams: initialParams,
            paramsIn: paramsIn,
            valuesOut: valuesOut,
            IC: IC,
            highestIP: highestIP
        }

        for (let i = 0; i < this.scoreList.length; i++) {
            if (!this.scoreList.skip) {
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

        this.totalScore = totalScore;

        // Check for originality
        if (bestSetHighScore > 0) {
            if (bestSetLowScore/bestSetHighScore < 0.95 && score/bestSetHighScore < 0.9 && score/bestSetHighScore > 0.8) {
                let score = (bestSetHighScore + bestSetLowScore) / 2;
                this.totalScore = score;
            }
        }
        return {score: this.totalScore, scoreList: this.scoreList};

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
        let opt = 8;
        let min = 0;
        let max = Math.floor(memSpace.length / 4);
        score = self.doScore(opt, count, max, min)
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

    byteValuesOutSet(rule, value, address, initialParams, params, outputValues) {
        let score = 0;
        if (value != 0 && address >= rule.outBlockStart && address < rule.outBlockStart + rule.outBlockLen) {
            score = 82;
        }
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

    byteValuesOutDifferent(rule, value, address, initialParams, params, outputValues) {
        let score = 82;
        for (let i = 0; i < rule.outBlockLen; i++) {
            let a = outputValues[i + rule.outBlockStart];
            if (i != rule.outBlockStart + i) {
                if (value === a) {
                    score = 0;
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

    byteValuesOutSeries(rule, value, address, initialParams, params, outputValues) {
        let score = 82;
        if (address === rule.outBlockStart) {
            let diff = Math.abs(outputValues[rule.outBlockStart + 2] - outputValues[rule.outBlockStart + 1]);
            if (diff === 0) {
                if (value != 0) {
                    score = 1;
                }
                else {
                    score = 0;
                }
            }
            else {
                let hitDiff = Math.abs(outputValues[rule.outBlockStart + 1] - value);
                if (hitDiff === 0) {
                    score = 0;
                }
                else {
                    score = Math.floor((255 - Math.abs(diff - hitDiff)) / 3);
                }
            }
        }
        else if (address === rule.outBlockStart + 1) {
            let diff = Math.abs(outputValues[rule.outBlockStart + 2] - outputValues[rule.outBlockStart + 3]);
            if (diff === 0) {
                if (value != 0) {
                    score = 1;
                }
                else {
                    score = 0;
                }
            }
            else {
                let hitDiff = Math.abs(outputValues[rule.outBlockStart] - value);
                if (hitDiff === 0) {
                    score = 0;
                }
                else {
                    score = Math.floor((255 - Math.abs(diff - hitDiff)) / 3);
                }
            }
        }
        else {
            let diff = Math.abs(outputValues[rule.outBlockStart + 1] - outputValues[rule.outBlockStart]);
            if (diff === 0) {
                if (value != 0) {
                    score = 1;
                }
                else {
                    score = 0;
                }
            }
            else {
                let hitDiff = Math.abs(outputValues[address - 1] - value);
                if (hitDiff === 0) {
                    score = 0;
                }
                else {
                    score = Math.floor((255 - Math.abs(diff - hitDiff)) / 3);
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

    byteValuesOutFromParams(rule, value, address, initialParams, params, outputValues) {
        let score = 0;
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
            score = 0;
        }
        else {
            score = 82;
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

    byteValuesOutMatch(rule, value, address, initialParams, params, outputValues) {
        let score = 0;
        let offset = address - rule.outBlockStart;
        let param = initialParams[rule.inBlockStart + offset];
        if (value === param) {
            score = 82;
        }
        else if (value != 0) {
            score = 1;
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

    byteValuesOutFromInitialParams: function (rule, value, address, initialParams, params, outputValues) {
        let score = 0;
        let found = false;
        for (let i = rule.inBlockStart; i < rule.inBlockStart + rule.inBlockLen; i++) {
            if (value === initialParams[i]) {
                found = true;
            }
        }
        if (found) {
            score = 82;
        }
        else if (value != 0) {
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

    byteParamsPlusThree(rule, value, address, initialParams, params, outputValues) {
        let offset = address - rule.outBlockStart;
        let required = initialParams[rule.inBlockStart + offset] + 3;
        if (required > 255) required = required & 255;
        let score = Math.floor((255 - Math.abs(value - required)) / 3);
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

    byteParamsMinusThree(rule, value, address, initialParams, params, outputValues) {
        let offset = address - rule.outBlockStart;
        let required = (initialParams[rule.inBlockStart + offset] - 3) & 255;
        let score = Math.floor((255 - Math.abs(value - required)) / 3);
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

    byteParamsTimesTwo(rule, value, address, initialParams, params, outputValues) {
        let offset = address - rule.outBlockStart;
        let required = initialParams[rule.inBlockStart + offset] * 2;
        let score = Math.floor((255 - Math.abs(value - required)) / 3);
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

    byteMultiplyParams(rule, value, address, initialParams, params, outputValues) {
        let offset = address - rule.outBlockStart;
        let a = initialParams[rule.inBlockStart + offset * 2];
        let b = initialParams[rule.inBlockStart + offset * 2 + 1];
        let required = a * b;
        if (required > 255) {
            required = required & 255;
        }
        let score = Math.floor((255 - Math.abs(value - required)) / 3);
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

    byteDivideParams(rule, value, address, initialParams, params, outputValues) {
        let offset = address - rule.outBlockStart;
        let a = initialParams[rule.inBlockStart + offset];
        let b = initialParams[rule.inBlockStart2 + offset];
        let required = Math.floor(b/a);
        let score = Math.floor((255 - Math.abs(value - required)) / 3);
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
                        r = a + b;
                        break;
                    case 45: // -
                        r = a - b;
                        break;
                    case 42: // *
                        r = a * b;
                        break;
                    default: 
                        console.log("op error in paramOperations rule at:", i, op, inAddr);
                        r = 0;
                }
                if (r < 0 || r > 255) r = Math.abs(r & 255);
                if (r === v) ++count;
            }
        }
        let opt = outBlockLen;
        let max = opt;
        let min = 0;
        let score = self.doScore(opt, count, max, min);
        return score;
    },

    byteParamOperations(rule, value, address, initialParams, params, outputValues) {
        let numCommandTypes = 4;
        let score = 0;
        let offset = address - rule.outBlockStart;
        if (offset < 8) {
            // = a b rule
            // Find the corresponding parameter command
            let found = false;
            for (let i = 0; i < rule.inBlockLen / numCommandTypes; i += 3) {
                let a = initialParams[rule.inBlockStart + i + 1];
                if (a === address) {
                    if (value === initialParams[rule.inBlockStart + i + 2]) {
                        found = true;
                        break;
                    }
                }
            }
            if (found) score = 64;
        }
        else {
            let inAddr = rule.inBlockStart;
            let op = initialParams[inAddr + offset * 3];
            let a = initialParams[inAddr + offset * 3 + 1];
            let b = initialParams[inAddr + offset * 3 + 2];
            let r;
            switch (op) {
                case 43: // +
                    r = a + b;
                    break;
                case 45: // -
                    r = a - b;
                    break;
                case 42: // *
                    r = a * b;
                    break;
                default: 
                    console.log("op error in paramOperations rule at:", i);
                    r = 0;
            }
            if (r < 0 || r > 255) r = Math.abs(r & 255);
            score = Math.floor((255 - Math.abs(value - r)) / 3);
        }
        return score;
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
                score = (1 - x/(max - min)) ** 2;
            }
        }
        else {
            x = Math.abs(x);
            if (actual > max || (actual === max && max != opt)) score = 0;
            else {
                score = (1 - x/(max - min)) ** 2;
            }
        }
        return score;
    }

}

module.exports = rulesets;