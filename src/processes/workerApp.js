const readline = require('readline');
const path = require('node:path');
const { seedRuleMemSpaces } = require('./rulesets');
const MainProcess = require(path.join(__dirname, 'MainProcess.js'));
const Entity = require(path.join(__dirname, 'Entity.js'));
const InstructionSet = require(path.join(__dirname, 'InstructionSet.js'));
const rulesets = require(path.join(__dirname, 'rulesets.js'));
const {databaseType, processMode, workerDataTransfer} = require(path.join(__dirname, '../AICodeConfig.js'));
let dbConn;
if (databaseType === "sqlite") {
    dbConn = require(path.join(__dirname,'../database/dbConnSqlite.js'));
}
const dbTransactions = require(path.join(__dirname, '../database/dbTransactions.js'));
const fsTransactions = require(path.join(__dirname, '../database/fsTransactions.js'));

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
        this.seedTemplateBreedCount = 0;
        this.randomCount = 0;
        this.crossSetCount = 0;
        this.instructionSet = new InstructionSet();
        rulesets.initialise();
    }

    async startProcess(entityData) {
        await dbConn.openConnection();
        // Load the seed rule and fragments
        await dbTransactions.loadFragments();
        await dbTransactions.fetchRuleSeeds();
        if (workerDataTransfer === 'database') {
            await this.fetchBatchEntities();
        }
        else if (workerDataTransfer === 'fileSystem') {
            await this.fetchFSBatchEntities();
        }
        else {
            this.fetchStdioBatchEntities(entityData);
        }
        let mainProcess = new MainProcess(rulesets);
        mainProcess.mainLoop(this);
        if (workerDataTransfer === 'database') {
            await this.transferBatchEntities();
            await this.transferBatchData(this.batchNum);
        }
        else if (workerDataTransfer === 'fileSystem') {
            await this.transferFSBatchEntities();
            await this.transferFSBatchData(this.batchNum);
        }
        else {
            let jsonStr = 
                `{\"type\": \"entityData\", \"batchNum\": ${this.batchNum}, \"data\": ` +
                fsTransactions.prepareJSONEntitySet(this.bestSets, this.batchStart) +
                "}\n";
            process.stdout.write(jsonStr);

            let batchData = {
                monoclonalInsCount: this.monoclonalInsCount,
                monoclonalByteCount: this.monoclonalByteCount,
                interbreedCount: this.interbreedCount,
                interbreed2Count: this.interbreed2Count,
                interbreedFlaggedCount: this.interbreedFlaggedCount,
                interbreedInsMergeCount: this.interbreedInsMergeCount,
                selfBreedCount: this.selfBreedCount,
                seedRuleBreedCount: this.seedRuleBreedCount,
                seedTemplateBreedCount: this.seedTemplateBreedCount,
                randomCount: this.randomCount,
                crossSetCount: this.crossSetCount
            };
            jsonStr = JSON.stringify(batchData);
            jsonStr = "{\"type\": \"batchData\", \"data\": " + jsonStr + "}\n";
            process.stdout.write(jsonStr);
        }
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

    async fetchFSBatchEntities() {
        let batchSet = await fsTransactions.fetchBatchEntitySet(this.batchNum);
        this.setEntities(batchSet);
    }

    fetchStdioBatchEntities(entityData) {
        this.setEntities(entityData);
    }

    setEntities(batchSet) {
        for (let i = 0; i < batchSet.length; i++) {
            let set = [];
            for (let j = 0; j < batchSet[i].length; j++) {
                let item = batchSet[i][j];
                let asRandom = false;
                let seeded = false;
                let entity = new Entity(item.entityNumber, this.instructionSet, asRandom, seeded, item.birthCycle, 
                    this.ruleSequenceNum, this.roundNum, item.initialMemSpace);
                entity.memSpace = item.memSpace;
                entity.birthTime = item.birth_time;
                entity.birthDateTime = item.birth_date_time;
                entity.registers = item.registers;
                entity.score = item.score;
                set.push(entity);
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

    async transferFSBatchEntities() {
        await fsTransactions.clearTransferEntitySet(this.batchNum);
        await fsTransactions.transferBatchSet(this.bestSets, this.batchNum, this.batchStart);
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
            seedTemplateBreedCount: this.seedTemplateBreedCount,
            randomCount: this.randomCount,
            crossSetCount: this.crossSetCount
        };
        await dbTransactions.saveBatchData(batchNum, batchData);
    }

    async transferFSBatchData(batchNum) {
        await fsTransactions.clearBatchData(batchNum);
        let batchData = {
            monoclonalInsCount: this.monoclonalInsCount,
            monoclonalByteCount: this.monoclonalByteCount,
            interbreedCount: this.interbreedCount,
            interbreed2Count: this.interbreed2Count,
            interbreedFlaggedCount: this.interbreedFlaggedCount,
            interbreedInsMergeCount: this.interbreedInsMergeCount,
            selfBreedCount: this.selfBreedCount,
            seedRuleBreedCount: this.seedRuleBreedCount,
            seedTemplateBreedCount: this.seedTemplateBreedCount,
            randomCount: this.randomCount,
            crossSetCount: this.crossSetCount
        };
        await fsTransactions.saveBatchData(batchNum, batchData);
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

if (workerDataTransfer != "stdio") {
    batchProcess.startProcess();
}
else {
    // Setup to read JSON messages from parent
    const rl = readline.createInterface({
    input: process.stdin,
    terminal: false
    });

    rl.on('line', (line) => {
        let message;
        try {
            message = JSON.parse(line);
            console.error(`[LOG] Worker Got Data ${process.pid}`);
        } catch (err) {
            console.error(`[ERROR] Failed to parse input: ${err.message}`, line);
            throw "No input for worker";
        }
        if (message.type === "entityData") {
            batchProcess.startProcess(message.data);
        }
    });

}

