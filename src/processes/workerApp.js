const path = require('node:path');
const { seedRuleMemSpaces } = require('./rulesets');
const MainProcess = require(path.join(__dirname, 'MainProcess.js'));
const Entity = require(path.join(__dirname, 'Entity.js'));
const InstructionSet = require(path.join(__dirname, 'InstructionSet.js'));
const rulesets = require(path.join(__dirname, 'rulesets.js'));
const {databaseType} = require(path.join(__dirname, '../AICodeConfig.js'));
let dbConn;
if (databaseType === "sqlite") {
    dbConn = require(path.join(__dirname,'../database/dbConnSqlite.js'));
}
const dbTransactions = require(path.join(__dirname, '../database/dbTransactions.js'));

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
        this.mainCycle = 4;
        this.maxCycles = 5;
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
        await dbConn.openConnection();
        // Load the seed rule and fragments
        await dbTransactions.loadFragments();
        await dbTransactions.fetchRuleSeeds();
        console.log("Seed Rule List:", rulesets.seedRuleMemSpaces.length);
        await this.fetchBatchEntities();
        console.log("Start Process: Entity Number", this.entityNumber);
        let mainProcess = new MainProcess(rulesets);
        mainProcess.mainLoop(this);
        await this.transferBatchEntities();
        await this.transferBatchData(this.batchNum);
        await dbConn.close();
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

