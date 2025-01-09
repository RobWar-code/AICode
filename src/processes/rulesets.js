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
    byteFunction: [],
    totalScore: 0,
    maxScore: 0,

    initialise() {

        this.scoreList = [];
        this.byteFunction = [];

        let scoreItem0 = {rule: "Instruction Distribution", ruleNum: 0, score: 0, max: 6};
        this.scoreList.push(scoreItem0);
        this.byteFunction.push(null);

        let scoreItem1 = {rule: "Matching CASM Instruction", ruleNum: 1, score: 0, max: 10};
        this.scoreList.push(scoreItem1);
        this.byteFunction.push(null);

        let scoreItem2 = {rule: "Instruction Counter", ruleNum: 2, score: 0, max: 1};
        this.scoreList.push(scoreItem2);
        this.byteFunction.push(null);

        let scoreItem3 = {rule: "Highest IP", ruleNum: 3, score: 0, max: 1};
        this.scoreList.push(scoreItem3);
        this.byteFunction.push(null);

        let scoreItem4 = {rule: "Params Preserved", ruleNum: 4, score: 0, max: 3};
        this.scoreList.push(scoreItem4);
        this.byteFunction.push(null);

        let scoreItem5 = {rule: "Values Out Set (0:111)", ruleNum: 5, score: 0, max: 4, 
            outBlockStart: 0, outBlockLen: 112 
        };
        this.scoreList.push(scoreItem5);
        this.byteFunction.push(this.byteValuesOutSet);

        let scoreItem6 = {rule: "Values Out Different (0:8)", ruleNum: 6, score: 0, max: 2,
            outBlockStart: 0, outBlockLen: 8
        };
        this.scoreList.push(scoreItem6);
        this.byteFunction.push(this.byteValuesOutDifferent);

        let scoreItem7 = {rule: "Values Out Series (8:15)", ruleNum: 7, score: 0, max: 4,
            outBlockStart: 8, outBlockLen: 8
        };
        this.scoreList.push(scoreItem7);
        this.byteFunction.push(this.byteValuesOutSeries);

        let scoreItem8 = {rule: "Values Out From Params (0:7, 16:23)", ruleNum: 8, score: 0, max: 6,
            outBlockStart: 16, outBlockLen: 8, inBlockStart: 0, inBlockLen: 8
        };
        this.scoreList.push(scoreItem8);
        this.byteFunction.push(this.byteValuesOutFromParams);

        let scoreItem9 = {rule: "Values Out From Initial Params (0:8, 24:31)", ruleNum: 9, score: 0, max: 6, 
            outBlockStart: 24, outBlockLen: 8, inBlockStart: 0, inBlockLen: 8
        };
        this.scoreList.push(scoreItem9);
        this.byteFunction.push(this.byteValuesOutFromInitialParams);

        let scoreItem10 = {rule:"Values Out Match Initial Params (0:8, 32:39)", ruleNum: 10, score: 0, max: 12,
            outBlockStart: 32, outBlockLen: 8, inBlockStart: 0, inBlockLen: 8
        };
        this.scoreList.push(scoreItem10);
        this.byteFunction.push(this.byteValuesOutMatch);

        let scoreItem11 = {rule: "Params Plus Three (0:7, 40:47)", ruleNum: 11, score: 0, max: 20, 
            outBlockStart: 40, outBlockLen: 8, inBlockStart: 0, inBlockLen: 8
        };
        this.scoreList.push(scoreItem11);
        this.byteFunction.push(this.byteParamsPlusThree);

        let scoreItem12 = {rule: "Params Minus Three (0:7, 48:55)", ruleNum: 12, score: 0, max: 20, 
            outBlockStart: 48, outBlockLen: 8, inBlockStart: 0, inBlockLen: 8
        };
        this.scoreList.push(scoreItem12);
        this.byteFunction.push(this.byteParamsMinusThree);

        let scoreItem13 = {rule: "Params Times Two (0:7, 56:63)", ruleNum: 13, score: 0, max: 18,
            outBlockStart: 56, outBlockLen: 8, inBlockStart: 4, inBlockLen: 8
        };
        this.scoreList.push(scoreItem13);
        this.byteFunction.push(this.byteParamsTimesTwo);

        let scoreItem14 = {rule: "Multiply Initial Params By Each Other (0:9, 64:68)", ruleNum: 14, 
            score: 0, max: 24, outBlockStart: 64, outBlockLen:5, 
            inBlockStart: 0, inBlockLen: 10
        };
        this.scoreList.push(scoreItem14);
        this.byteFunction.push(this.byteMultiplyParams);

        let scoreItem15 = {rule: "Divide Block of Inputs(1:6, 10:16, 72:77)", ruleNum: 15, 
            score: 0, max: 24, outBlockStart: 72, outBlockLen:6, inBlockStart: 1, 
            inBlockLen: 6, inBlockStart2: 10 
        };
        this.scoreList.push(scoreItem15);
        this.byteFunction.push(this.byteDivideParams);

        let scoreItem16 = {rule: "Use op to Convert Params (16:87, 80:103)", ruleNum:16,
            score: 0, max: 30, outBlockStart: 80, outBlockLen: 24,
            inBlockStart: 16, inBlockLen: 72
        }
        this.scoreList.push(scoreItem16);
        this.byteFunction.push(this.byteParamOperations);

        let maxScore = 0;
        for (let scoreItem of this.scoreList) {
            maxScore += scoreItem.max;
        }
        this.maxScore = maxScore * 2;

    },

    getOutputByteScore(value, address, initialParams, params, outputValues) {
        let totalScore = 0;
        let totalSignificance = 0;
        // For each rule applicable to the address
        let index = 0;
        for (let rule of this.scoreList) {
            if (this.byteFunction[index] != null) {
                if (address >= rule.outBlockStart && address < rule.outBlockStart + rule.outBlockLen) {
                    let score = this.byteFunction[index](rule, value, address, initialParams, params, outputValues);
                    if (isNaN(score)) {
                        console.log("Invalid byte score", score, index);
                    }
                    totalScore += score;
                    totalSignificance += rule.max;
                }
            }
            ++index;
        }
        return {totalScore: totalScore, totalSignificance: totalSignificance};
        
    },

    getScore: function (bestSetHighScore, bestSetLowScore, instructionSet, memSpace, 
        initialParams, paramsIn, valuesOut, IC, highestIP) {
        let totalScore = 0;
        let max;
        let score;

        let item = 0;
        score = this.scoreList[item].max * this.insDistribution(instructionSet, memSpace, memSpace.length);
        this.scoreList[item].score += score;
        totalScore += score;

        item = 1;
        score = this.scoreList[item].max * this.matchCASM(instructionSet, memSpace);
        this.scoreList[item].score += score;
        totalScore += score;

        item = 2;
        score = this.scoreList[item].max * this.instructionCount(IC);
        this.scoreList[item].score += score;
        totalScore += score;

        item = 3;
        score = this.scoreList[item].max * this.highestIPScore(highestIP, memSpace.length);
        this.scoreList[item].score += score;
        totalScore += score;

        item = 4;
        score = this.scoreList[item].max * this.initialParamsPreserved(initialParams, paramsIn);
        this.scoreList[item].score += score;
        totalScore += score;

        item = 5;
        score = this.scoreList[item].max * this.valuesOutSet(valuesOut, this.scoreList[item].outBlockStart,
            this.scoreList[item].outBlockLen
        );
        this.scoreList[item].score += score;
        totalScore += score;

        item = 6;
        score = this.scoreList[item].max * this.valuesOutDifferent(valuesOut,
            this.scoreList[item].outBlockStart, this.scoreList[item].outBlockLen
        );
        this.scoreList[item].score += score;
        totalScore += score;

        item = 7;
        score = this.scoreList[item].max * this.valuesOutSeries(valuesOut,
            this.scoreList[item].outBlockStart, this.scoreList[item].outBlockLen
        );
        this.scoreList[item].score += score;
        totalScore += score;

        item = 8;
        score = this.scoreList[item].max * this.valuesOutFromParams(paramsIn, valuesOut,
            this.scoreList[item].outBlockStart, this.scoreList[item].outBlockLen,
            this.scoreList[item].inBlockStart, this.scoreList[item].inBlockLen
        );
        this.scoreList[item].score += score;
        totalScore += score;

        item = 9;
        score = this.scoreList[item].max * this.valuesOutFromInitialParams(initialParams, valuesOut,
            this.scoreList[item].outBlockStart, this.scoreList[item].outBlockLen,
            this.scoreList[item].inBlockStart, this.scoreList[item].inBlockLen
        );
        this.scoreList[item].score += score;
        totalScore += score;

        item = 10;
        score = this.scoreList[item].max * this.valuesOutMatchInitialParams(initialParams, valuesOut,
            this.scoreList[item].outBlockStart, this.scoreList[item].outBlockLen,
            this.scoreList[item].inBlockStart, this.scoreList[item].inBlockLen
        );
        this.scoreList[item].score += score;
        totalScore += score;

        item = 11;
        score = this.scoreList[item].max * this.paramsPlusThree(initialParams, valuesOut,
            this.scoreList[item].outBlockStart, this.scoreList[item].outBlockLen,
            this.scoreList[item].inBlockStart, this.scoreList[item].inBlockLen
        );
        this.scoreList[item].score += score;
        totalScore += score;

        item = 12;
        score = this.scoreList[item].max * this.paramsMinusThree(initialParams, valuesOut,
            this.scoreList[item].outBlockStart, this.scoreList[item].outBlockLen,
            this.scoreList[item].inBlockStart, this.scoreList[item].inBlockLen
        );
        this.scoreList[item].score += score;
        totalScore += score;

        item = 13;
        score = this.scoreList[item].max * this.paramsTimesTwo(initialParams, valuesOut,
            this.scoreList[item].outBlockStart, this.scoreList[item].outBlockLen,
            this.scoreList[item].inBlockStart, this.scoreList[item].inBlockLen
        );
        this.scoreList[item].score += score;
        totalScore += score;

        item = 14;
        score = this.scoreList[item].max * this.multiplyInitialParamsByEachother(initialParams, valuesOut,
            this.scoreList[item].outBlockStart, this.scoreList[item].outBlockLen,
            this.scoreList[item].inBlockStart, this.scoreList[item].inBlockLen
        );
        this.scoreList[item].score += score;
        totalScore += score;

        item = 15;
        score = this.scoreList[item].max * this.divideByParams(initialParams, valuesOut,
            this.scoreList[item].outBlockStart, this.scoreList[item].outBlockLen,
            this.scoreList[item].inBlockStart, this.scoreList[item].inBlockLen, this.scoreList[item].inBlockStart2
        );
        this.scoreList[item].score += score;
        totalScore += score;

        item = 16;
        score = this.scoreList[item].max * this.paramOperations(initialParams, valuesOut,
            this.scoreList[item].outBlockStart, this.scoreList[item].outBlockLen,
            this.scoreList[item].inBlockStart, this.scoreList[item].inBlockLen
        );
        this.scoreList[item].score += score;
        totalScore += score;

        this.totalScore = score;

        // Check for originality
        if (bestSetHighScore > 0) {
            if (bestSetLowScore/bestSetHighScore < 0.95 && score/bestSetHighScore < 0.9 && score/bestSetHighScore > 0.8) {
                score = (bestSetHighScore + bestSetLowScore) / 2;
                this.totalScore = score;
            }
        }
        return {score: totalScore, scoreList: this.scoreList};

    },

    insDistribution: function (instructionSet, memSpace, codeLen) {
        insSet = [
            {
                ins: "LDI A, (MEM)",
                countOpt: 16,
                distributionOpt: 16
            },
            {
                ins: "SM",
                countOpt: this.meanInsCount / 16,
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
                countOpt: this.meanInsCount / 16,
                distributionOpt: 16

            },
            {
                ins: "RETF",
                countOpt: 3,
                distributionOpt: codeLen / 3
            }
        ];

        let totalScore = 0;

        // Count of occurrences
        for (let insData of insSet) {
            let ins = insData.ins;
            let count = instructionSet.countInsInMemSpace(memSpace, memSpace.length, ins);
            let opt = insData.countOpt;
            let max = this.meanInsCount;
            let min = 0;
            let score1 = this.doScore(opt, count, max, min);
            totalScore += score1;
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

    matchCASM(instructionSet, memSpace) {
        let score = 0;
        // Get Codes
        let SMcode = instructionSet.getInsCode("SM").code;
        let CASMcode = instructionSet.getInsCode("CASM").code;

        // Get the list of SM labels
        let SMLabels = this.getSMLabels(instructionSet, SMcode, memSpace);

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
        score = this.doScore(opt, count, max, min)
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

    instructionCount(IC) {

        let opt = 220;
        let max = 1000
        let min = 0;
        let score = this.doScore(opt, IC, max, min);
        return score;

    },

    highestIPScore(IP, maxIP) {
        let opt = maxIP + 1 / 10;
        let max = maxIP + 1;
        let min = 0;
        let score = this.doScore(opt, IP, max, min);
        return score;
    },

    valuesOutSet(valuesOut, outBlockStart, outBlockLen) {
        let count = 0;
        for (let i = outBlockStart; i < outBlockStart + outBlockLen; i++) {
            if (valuesOut[i] != 0) ++count;
        }
        let opt = outBlockLen;
        let max = opt;
        let min = 0;
        let score = this.doScore(opt, count, max, min);
        return score;
    },

    byteValuesOutSet(rule, value, address, initialParams, params, outputValues) {
        let score = 0;
        if (value != 0 && address >= rule.outBlockStart && address < rule.outBlockStart + rule.outBlockLen) {
            score = 82;
        }
        return score;
    },

    valuesOutDifferent(valuesOut, outBlockStart, outBlockLen) {
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
        let score = this.doScore(newSet.length - 1, count, max, min);
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

    valuesOutSeries(valuesOut, outBlockStart, outBlockLen) {
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
        let score = this.doScore(opt, count, max, min);
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

    valuesOutFromParams(paramsIn, valuesOut, outBlockStart, outBlockLen, inBlockStart, inBlockLen) {
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
        let score = this.doScore(opt, matchCount, max, min);
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

    valuesOutMatchInitialParams(initialParams, valuesOut, outBlockStart, outBlockLen, inBlockStart, inBlockLen) {
        let count = 0;
        for (let i = 0; i < outBlockLen; i++) {
            if (initialParams[i + inBlockStart] === valuesOut[i + outBlockStart]) ++count;
        }
        let opt = outBlockLen;
        let max = outBlockLen;
        let min = 0;
        let score = this.doScore(opt, count, max, min);
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

    valuesOutFromInitialParams(initialParams, valuesOut, outBlockStart, outBlockLen, inBlockStart, inBlockLen) {
        let initSlice = initialParams.slice(inBlockStart, inBlockStart + inBlockLen);
        let outSlice = valuesOut.slice(outBlockStart, outBlockStart + outBlockLen);
        // Create a unique list of the input
        initSlice.sort();
        let inList = [];
        let inCount = [];
        let oldVal;
        for (let i = 0; i < initSlice.length; i++) {
            let val = initSlice[i];
            if (i > 0) {
                if (oldVal != val) {
                    inList.push(val);
                    inCount.push(1);
                }
                else {
                    ++inCount[inCount.length - 1];
                }
            }
            else {
                inList.push(val);
                inCount.push(1);
            }
            oldVal = val;
        }

        let itemCount = new Array(inList.length).fill(0);
        let count = 0;
        for (let val of outSlice) {
            let p = inList.indexOf(val);
            if (p != -1) ++itemCount[p];
        }
        let index = 0;
        for (let c of itemCount) {
            if (c >= inCount[index]) count += inCount[index];
            else if (c > 0) {
                count += c;
            }
            ++index;
        }
        let max = inBlockLen;
        let min = 0;
        let opt = max;
        let score = this.doScore(opt, count, max, min);
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

    initialParamsPreserved(initialParams, paramsIn) {
        let count = 0;
        for (let i = 0; i < initialParams.length; i++) {
            if (initialParams[i] === paramsIn[i]) {
                ++count;
            }
        }
        let opt = initialParams.length;
        let min = 0;
        let max = initialParams.length;
        let score = this.doScore(opt, count, max, min);
        return score;
    },

    paramsPlusThree(initialParams, valuesOut, outBlockStart, outBlockLen, inBlockStart, inBlockLen) {
        let count = 0;
        for (let i = 0; i < outBlockLen; i++) {
            if (initialParams[inBlockStart + i] + 3 === valuesOut[i + outBlockStart]) ++count;
        }
        let opt = outBlockLen;
        let max = outBlockLen;
        let min = 0;
        let score = this.doScore(opt, count, max, min);
        return score;
    },

    byteParamsPlusThree(rule, value, address, initialParams, params, outputValues) {
        let offset = address - rule.outBlockStart;
        let required = initialParams[rule.inBlockStart + offset] + 3;
        if (required > 255) required = required & 255;
        let score = Math.floor((255 - Math.abs(value - required)) / 3);
        return score;
    },

    paramsMinusThree(initialParams, valuesOut, outBlockStart, outBlockLen, inBlockStart, inBlockLen) {
        let count = 0;
        for (let i = 0; i < outBlockLen; i++) {
            let a = (initialParams[inBlockStart + i] - 3) & 255;
            if (a === valuesOut[i + outBlockStart]) ++count;
        }
        let opt = outBlockLen;
        let max = outBlockLen;
        let min = 0;
        let score = this.doScore(opt, count, max, min);
        return score;
    },

    byteParamsMinusThree(rule, value, address, initialParams, params, outputValues) {
        let offset = address - rule.outBlockStart;
        let required = (initialParams[rule.inBlockStart + offset] - 3) & 255;
        let score = Math.floor((255 - Math.abs(value - required)) / 3);
        return score;
    },

    paramsTimesTwo(initialParams, valuesOut, outBlockStart, outBlockLen, inBlockStart, inBlockLen) {
        let count = 0;
        for (let i = 0; i < outBlockLen; i++) {
            if (valuesOut[outBlockStart + i] === 2 * initialParams[inBlockStart + i]) ++count;
        }
        let min = 0;
        let max = outBlockLen;
        let opt = max;
        let score = this.doScore(opt, count, max, min);
        return score;
    },

    byteParamsTimesTwo(rule, value, address, initialParams, params, outputValues) {
        let offset = address - rule.outBlockStart;
        let required = initialParams[rule.inBlockStart + offset] * 2;
        let score = Math.floor((255 - Math.abs(value - required)) / 3);
        return score;
    },

    multiplyInitialParamsByEachother(initialParams, valuesOut, outBlockStart, outBlockLen, inBlockStart, inBlockLen) {
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
        let score = this.doScore(opt, count, max, min);
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

    divideByParams(initialParams, valuesOut, outBlockStart, outBlockLen, inBlockStart, inBlockLen, inBlockStart2) {
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
        let score = this.doScore(opt, count, max, min);
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

    paramOperations(initialParams, valuesOut,
        outBlockStart, outBlockLen,
        inBlockStart, inBlockLen) {
        let outAddr = outBlockStart;
        let inAddr = inBlockStart;
        let count = 0;
        for (let i = 0; i < outBlockLen; i++) {
            let v = valuesOut[outAddr + i];
            let op = initialParams[inAddr + i * 3];
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
        let opt = outBlockLen;
        let max = opt;
        let min = 0;
        let score = this.doScore(opt, count, max, min);
        return score;
    },

    byteParamOperations(rule, value, address, initialParams, params, outputValues) {
        let offset = address - rule.outBlockStart;
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
        let score = Math.floor((255 - Math.abs(value - r)) / 3);
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
                score = 1 - x/(max - min);
            }
        }
        else {
            x = Math.abs(x);
            if (actual > max || (actual === max && max != opt)) score = 0;
            else {
                score = 1 - x/(max - min);
            }
        }
        return score;
    }

}

module.exports = rulesets;