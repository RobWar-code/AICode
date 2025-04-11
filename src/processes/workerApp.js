const path = require('node:path');
const { seedRuleMemSpaces } = require('./rulesets');
const Entity = require(path.join(__dirname, 'Entity.js'));
const InstructionSet = require(path.join(__dirname, 'InstructionSet.js'));
const rulesets = require(path.join(__dirname, 'rulesets.js'));
const dbTransactions = require(path.join(__dirname, '../database/dbTransactions.js'));
const testObj = require(path.join(__dirname, 'testObj'));

// See Main Program for the start up

class BatchProcess {
    constructor (batchNum, batchStart, batchLength, ruleSequenceNum, entityNumber, cycleCounter) {
        this.bestEntitySetMax = 40;
        this.bestEntitySetCount = 0;
        this.bestEntitySet = [];
        this.maxCycles = 5;
        this.batchNum = batchNum;
        this.batchStart = batchStart;
        this.numBestSets = batchLength;
        this.bestSets = new Array(this.numBestSets).fill([]);
        this.bestSetNum = 0;
        this.bestEntitySetFullCycle = new Array(this.numBestSets).fill(0);
        this.scoreHistory = new Array(this.numBestSets).fill([]);
        this.scoreHistoryCounter = new Array(this.numBestSets).fill(0);
        this.scoreHistoryCycle = 1;
        this.scoreHistoryMaxLen = 8;
        this.processEntitySetMax = 32;
        this.processEntitySet = [];
        this.crossSetRange = 4;
        this.seedEntity = null;
        this.lapCounter = 0;
        this.clearanceRound = 20;
        this.restartProportion = 0.6;
        this.cycleCounter = cycleCounter;
        this.numRounds = 0;
        this.entityNumber = entityNumber;
        this.ruleSequenceNum = ruleSequenceNum;
        rulesets.ruleSequenceNum = ruleSequenceNum;
        this.runningSingleRule = false;
        this.runRuleNum = 0;
        this.monoclonalInsCount = 0;
        this.monoclonalByteCount = 0;
        this.interbreedCount = 0;
        this.interbreed2Count = 0;
        this.interbreedFlaggedCount = 0;
        this.interbreedInsMergeCount = 0;
        this.selfBreedCount = 0;
        this.seedRuleBreedCount = 0;
        this.randomCount = 0;
        this.crossSetCount = 0;
        this.instructionSet = new InstructionSet();
        rulesets.initialise();
    }

    async startProcess() {
        // Load the seed rule and fragments
        await dbTransactions.loadFragments();
        await dbTransactions.fetchRuleSeeds();
        console.log("Seed Rule List:", rulesets.seedRuleMemSpaces.length);
        await this.fetchBatchEntities();
        console.log("Start Process: Entity Number", this.entityNumber);
        this.mainLoop();
        this.transferBatchEntities();
        this.transferBatchData(this.batchNum);
    }

    async fetchBatchEntities() {
        for (let i = 0; i < this.numBestSets; i++) {
            let set = [];
            let bestSetNum = this.batchStart + i;
            let results = await dbTransactions.fetchTransferBestEntitySet(bestSetNum);
            if (results.length > 0) {
                let entityNum = 0;
                for (let item of results) {
                    let memStr = item.mem_space;
                    let memSpace = dbTransactions.stringToIntArray(memStr);
                    let finalMemStr = item.final_mem_space;
                    let finalMemSpace = dbTransactions.stringToIntArray(finalMemStr);
                    let score = item.score;
                    let entityNumber = item.entity_number;
                    let birthCycle = item.creation_cycle;
                    let asRandom = false;
                    let seeded = false;
                    let entity = new Entity(entityNumber, this.instructionSet, asRandom, seeded, birthCycle, 
                        this.ruleSequenceNum, this.roundNum, memSpace);
                    entity.birthTime = item.birth_time;
                    entity.birthDateTime = item.birth_date_time;
                    entity.roundNum = item.round_num;
                    // Registers
                    entity.registers.A = item.reg_a;
                    entity.registers.B = item.reg_b;
                    entity.registers.C = item.reg_c;
                    entity.registers.CF = item.reg_cf;
                    entity.registers.ZF = item.reg_zf;
                    entity.registers.SP = item.reg_sp;
                    entity.registers.IP = item.reg_ip;
                    entity.registers.IC = item.reg_ic;
                    // Final memSpace
                    entity.memSpace = finalMemSpace;
                    // Fetch the transfer entity outputs
                    // let oldValuesOut = await dbTransactions.fetchTransferEntityOutputs(bestSetNum, entityNum);
                    // entity.oldValuesOut = oldValuesOut;
                    // let oldParams = await dbTransactions.fetchTransferEntityInputs(bestSetNum, entityNum);
                    // entity.oldParams = oldParams;
                    entity.score = score;
                    set.push(entity);
                    ++entityNum;
                }
            }
            this.bestSets[i] = set;
        }
    }

    async transferBatchEntities() {
        for (let i = 0; i < this.numBestSets; i++) {
            let set = this.bestSets[i];
            let setNum = this.batchStart + i;
            await dbTransactions.clearTransferEntitySet(setNum);
            await dbTransactions.saveTransferEntitySet(setNum, set);
        }
    }

    async transferBatchData(batchNum) {
        let batchData = {
            monoclonalInsCount: this.monoclonalInsCount,
            monoclonalByteCount: this.monoclonalByteCount,
            interbreedCount: this.interbreedCount,
            interbreed2Count: this.interbreed2Count,
            interbreedFlaggedCount: this.interbreedFlaggedCount,
            interbreedInsMergeCount: this.interbreedInsMergeCount,
            selfBreedCount: this.selfBreedCount,
            seedRuleBreedCount: this.seedRuleBreedCount,
            randomCount: this.randomCount,
            crossSetCount: this.crossSetCount
        };
        await dbTransactions.saveBatchData(batchNum, batchData);
    }

    mainLoop() {
        let mainCycle = this.numBestSets;
        console.log("mainCycle:", mainCycle);
        for (let i = 0; i < mainCycle; i++) {
            this.bestSetNum = i;
            let bestEntitySet = this.bestSets[this.bestSetNum];
            bestEntitySet = this.processLoop(bestEntitySet, this.bestSetNum);
            this.bestSets[this.bestSetNum] = bestEntitySet;
        }
    }

    processLoop(bestEntitySet, bestSetNum) {
        const maxBreedEntities = this.bestEntitySetMax / 2;
        const maxBreedActions = 32;
        const currentEntitySetMaxLen = 3;
        let insSet = new InstructionSet();
        for (let cycle = 0; cycle < this.maxCycles; cycle++) {
            for (let i = 0; i < maxBreedEntities; i++) {
                let currentEntitySet = [];
                for (let j = 0; j < maxBreedActions; j++) {
                    // Create new entity
                    let breedMode = "reproduction";
                    let asRandom = true; 
                    let seeded = false;
                    let memSpace = null;
                    let entity = null;
                    let gotCrossMate = false;
                    // Debug
                    // bestEntitySet.length >= this.bestEntitySetMax
                    // Determine whether random breed
                    if (j === 0 && rulesets.seedRuleMemSpaces.length > 0 && bestEntitySet.length < 10 && Math.random() < 0.5) {
                        breedMode = "seedRule";
                    }
                    else if (bestEntitySet.length < this.bestEntitySetMax) {
                        breedMode = "random";
                    }
                    else {
                        if (this.cycleCounter < this.bestEntitySetFullCycle[bestSetNum] + 20 && Math.random() < 0.5) {
                            breedMode = "random";
                        }
                    }

                    if (breedMode === "seedRule") {
                        let r = Math.floor(Math.random() * rulesets.seedRuleMemSpaces.length);
                        memSpace = rulesets.seedRuleMemSpaces[r].memSpace;
                        asRandom = false;
                        entity = new Entity(this.entityNumber, insSet, asRandom, seeded, 
                            this.cycleCounter, rulesets.ruleSequenceNum, this.numRounds, memSpace);
                        entity.breedMethod = "SeedRule";
                    }
                    else if (breedMode === "reproduction") {
                        // Set-up for a breed operation 
                        // select the parent entities
                        let p1 = Math.floor(Math.random() * bestEntitySet.length);
                        let p1Entity = bestEntitySet[p1];
                        let p2Entity;
                        // Check for a mate from an alternative set
                        if (Math.random() < 0.001) {
                            let r = this.chooseBestSetMate(this.crossSetRange, bestSetNum, this.numBestSets);
                            let b = bestSetNum + r;
                            if (this.bestSets[b].length != 0) {
                                let e = Math.floor(Math.random() * this.bestSets[b].length);
                                p2Entity = this.bestSets[b][e];
                                gotCrossMate = true;
                            }
                        }
                        if (!gotCrossMate){
                            let p2 = -1;
                            let found = false;
                            if (bestEntitySet.length === 1) {
                                p2 = 0;
                            }
                            else {
                                while(!found) {
                                    p2 = Math.floor(Math.random() * bestEntitySet.length);
                                    if (p2 != p1) found = true;
                                }
                            }
                            p2Entity = bestEntitySet[p2];
                        }
                        entity = p1Entity.breed(this.entityNumber, p2Entity, gotCrossMate, 
                            this.cycleCounter, this.numRounds);
                    }
                    else {
                        let seeded = false;
                        // Seeding on first pass.
                        // if (cycle === 0 && i === 0 && j === 0) seeded = true;
                        entity = new Entity(this.entityNumber, insSet, asRandom, seeded, 
                            this.cycleCounter, rulesets.ruleSequenceNum, this.numRounds, memSpace);
                    }
                    // Update breed method tallies
                    switch (entity.breedMethod) {
                        case "MonoclonalIns" :
                            ++this.monoclonalInsCount;
                            break;
                        case "MonoclonalByte" :
                            ++this.monoclonalByteCount;
                            break;
                        case "Interbreed" :
                            ++this.interbreedCount;
                            if (gotCrossMate) ++this.crossSetCount;
                            break;
                        case "Interbreed2" :
                            ++this.interbreed2Count;
                            if (gotCrossMate) ++this.crossSetCount;
                            break;
                        case "InterbreedFlagged" :
                            ++this.interbreedFlaggedCount;
                            if (gotCrossMate) ++this.crossSetCount;
                            break;
                        case "InterbreedInsMerge" :
                            ++this.interbreedInsMergeCount;
                            if (gotCrossMate) ++this.crossSetCount;
                        case "Self-breed" :
                            ++this.selfBreedCount;
                            break;
                        case "SeedRule" :
                            ++this.seedRuleBreedCount;
                            break;
                        default:
                            ++this.randomCount;
                            break;
                    }
                    if (entity.crossSetBreed) ++this.crossSetCount;

                    let bestSetHighScore, bestSetLowScore;
                    if (this.bestEntitySet.length < 2) {
                        bestSetHighScore = 0;
                        bestSetLowScore = 0;
                    }
                    else {
                        bestSetHighScore = bestEntitySet[0].score;
                        bestSetLowScore = bestEntitySet[this.bestEntitySet.length - 1].score;
                    }
                    let memObj = entity.execute(bestSetHighScore, bestSetLowScore);
                    // Check whether a rule set threshold was reached
                    if (rulesets.seedRuleSet) {
                        this.ruleSequenceNum = rulesets.ruleSequenceNum;
                        rulesets.seedRuleSet = false;
                    }
                    // Add to current set
                    currentEntitySet = this.addEntityToCurrentSet(currentEntitySet, currentEntitySetMaxLen, entity, entity.score);
                    ++this.entityNumber;
                    // Debug
                    testObj.firstEntityDone = true;
                }
                bestEntitySet = this.addEntitiesToBestSet(bestEntitySet, currentEntitySet, currentEntitySetMaxLen);
                if (bestEntitySet.length >= this.bestEntitySetMax && this.bestEntitySetFullCycle[bestSetNum] === 0) {
                    this.bestEntitySetFullCycle[bestSetNum] = this.cycleCounter;
                }
            }
            ++this.cycleCounter;
        }

        return bestEntitySet;
    }

    chooseBestSetMate(crossSetRange, bestSetNum, numBestSets) {
        let n = crossSetRange; // range of selection
        let d = Math.floor(n/2);
        if (bestSetNum < d) {
            n = n - (d - bestSetNum);
            d = bestSetNum;
        }
        else if (bestSetNum >= numBestSets - d) {
            n = n - ((d + 1) - (numBestSets - bestSetNum));
        }
        let r = Math.floor(Math.random() * n) - d;
        if (r === 0) {
            if (bestSetNum - 1 < 0) r = 1;
            else if (bestSetNum + 1 >= numBestSets) r = -1;
            else r = (Math.floor(Math.random() * 2) * 2) - 1; 
        }
        return r;
    }

    addEntityToCurrentSet(currentEntitySet, currentEntitySetMaxLen, entity, score) {
        let hasAcceptableScore = true;
        let scorePosition = 0;
        let newSet = [];
        let found = false;
        if (currentEntitySet.length === 0) {
            newSet.push(entity);
        }
        else {
            for (let j = 0; j < currentEntitySet.length; j++) {
                if (score >= currentEntitySet[j].score && !found) {
                    newSet.push(entity);
                    found = true;
                }
                if (newSet.length < currentEntitySetMaxLen) {
                    newSet.push(currentEntitySet[j]);
                }
            }
            if (newSet.length < currentEntitySetMaxLen && !found) {
                newSet.push(entity);
            }
        }
        // Debug
        /*
        console.log("newSet score:", score);
        for (let i = 0; i < newSet.length; i++) {
            console.log(newSet[i].score);
        }
        console.log("-----------");
        */
        return newSet;
    }

    addEntitiesToBestSet(bestEntitySet, currentEntitySet) {
        // Debug
        /*
        for (let i = 0; i < currentEntitySet.length; i++) {
            console.log(currentEntitySet[i].score);
        }
        console.log("-----------------")
        */
        let score = 0;
        let currentIndex = 0;
        let bestIndex = 0;
        let newSet = [];
        if (bestEntitySet.length === 0) {
            for (let i = 0; i < currentEntitySet.length; i++) {
                currentEntitySet[i].bestSetEntityNum = i;
                newSet.push(currentEntitySet[i]);
            }
        }
        else {
            let ended = false;
            while (!ended) {
                if (bestIndex < bestEntitySet.length && currentIndex < currentEntitySet.length) {
                    let oldScore = bestEntitySet[bestIndex].score;
                    let newScore = currentEntitySet[currentIndex].score;
                    if (newScore > oldScore) {
                        currentEntitySet[currentIndex].bestSetEntityNum = newSet.length;
                        newSet.push(currentEntitySet[currentIndex]);
                        ++currentIndex;
                    }
                    else if (newScore === oldScore) {
                        // Skip if the same
                        bestEntitySet[bestIndex].bestSetEntityNum = newSet.length;
                        newSet.push(bestEntitySet[bestIndex]);
                        ++bestIndex;
                        ++currentIndex;
                    }
                    else {
                        bestEntitySet[bestIndex].bestSetEntityNum = newSet.length;
                        newSet.push(bestEntitySet[bestIndex]);
                        ++bestIndex;
                    }
                }
                else if (currentIndex >= currentEntitySet.length) {
                    bestEntitySet[bestIndex].bestSetEntityNum = newSet.length;
                    newSet.push(bestEntitySet[bestIndex]);
                    ++bestIndex;
                }
                else {
                    currentEntitySet[currentIndex].bestSetEntityNum = newSet.length;
                    newSet.push(currentEntitySet[currentIndex]);
                    ++currentIndex;
                }
                if (newSet.length >= this.bestEntitySetMax || (bestIndex >= bestEntitySet.length && currentIndex >= currentEntitySet.length)) {
                    ended = true;
                }
            }
        }
        return newSet;
    }

    stringToIntArray(str) {
        let a = [];
        for (let i = 0; i < str.length; i++) {
            a.push(str.charCodeAt(i));
        }
        return a;
    }

}

// Main Program
// This program is a worker app run by MainControlParallel class instance
// Expected Command Line Arguments:
//  batchNum, batchStart, batchLength, ruleSequenceNum, entityNumber, cycleCounter, roundNum
 
let batchNum = parseInt(process.argv[2]);
let batchStart = parseInt(process.argv[3]);
let batchLength = parseInt(process.argv[4]);
let ruleSequenceNum = parseInt(process.argv[5]);
let entityNumber = parseInt(process.argv[6]);
let cycleCounter = parseInt(process.argv[7]);
let roundNum = parseInt(process.argv[8]);

let batchProcess = new BatchProcess(batchNum, batchStart, batchLength, ruleSequenceNum, entityNumber, cycleCounter, roundNum);
batchProcess.startProcess();

