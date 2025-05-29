const path = require('node:path');
const { spawn } = require('child_process');
const readline = require('readline');
const os = require('os');

const { seedRuleMemSpaces } = require('./rulesets');
const Entity = require(path.join(__dirname, 'Entity.js'));
const InstructionSet = require(path.join(__dirname, 'InstructionSet.js'));
const rulesets = require(path.join(__dirname, 'rulesets.js'));
const dbTransactions = require(path.join(__dirname, '../database/dbTransactions.js'));
const fsTransactions = require(path.join(__dirname, '../database/fsTransactions.js'));
const {databaseType, processMode, workerDataTransfer, numProcessesSet} = 
    require(path.join(__dirname, '../AICodeConfig.js'));
const testObj = require(path.join(__dirname, 'testObj'));

class MainControlParallel {
    constructor (mainWindow) {
        this.mainWindow = mainWindow;
        this.bestEntitySetMax = 40;
        this.bestEntitySetCount = 0;
        this.bestEntitySet = [];
        this.numBestSets = 72;
        this.bestSets = new Array(this.numBestSets).fill([]);
        this.bestSetNum = 0;
        this.bestEntitySetFullCycle = new Array(this.numBestSets).fill(0);
        this.scoreHistory = new Array(this.numBestSets).fill([]);
        this.scoreHistoryCounter = new Array(this.numBestSets).fill(0);
        this.scoreHistoryCycle = 1;
        this.scoreHistoryMaxLen = 8;
        this.processEntitySetMax = 32;
        this.processEntitySet = [];
        this.crossSetRange = 7;
        this.seedEntity = null;
        this.lapCounter = 0;
        this.clearanceRound = 25;
        this.restartProportion = 0.7;
        this.cycleCounter = 0;
        this.numRounds = 0;
        this.entityNumber = 0;
        this.ruleSequenceNum = 0;
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
        this.startTime = Date.now();
        this.elapsedTime = 0;
        this.previousElapsedTime = 0;
        this.instructionSet = new InstructionSet;
        rulesets.initialise();
        dbTransactions.fetchRuleSeeds();
        dbTransactions.loadFragments();
        rulesets.currentMaxScore = rulesets.getCurrentMaxScore();
        this.setupBatchProcessing();
    }

    setupBatchProcessing() {
        // Get number of processors
        if (numProcessesSet === "auto") {
            this.numCPUs = os.cpus().length / 2;
        }
        else if (typeof numProcessesSet === 'number') {
            this.numCPUs = numProcessesSet;
        }
        else {
            this.numCPUs = 2;
        }
        console.log("Num cpus", this.numCPUs);

        // A batch is a group of best sets sent to an individual worker
        // A span is a set of batches sent to a set of worker apps
        // Spans are of equal length, other than, perhaps, the final span which has the
        // the remnant entities.
        this.bestSetsPerBatch = 4;
        this.spanLength  = this.numCPUs * this.bestSetsPerBatch
        this.numSpans = Math.floor(this.numBestSets / this.spanLength);
        this.spanRemnant = this.numBestSets % this.spanLength;
        this.finalNumBatches = 0;
        this.finalBatchLength = 0;
        if (this.spanRemnant != 0) {
            this.numSpans += 1;
            this.finalNumBatches = Math.floor(this.spanRemnant / this.bestSetsPerBatch);
            this.finalBatchLength = this.spanRemnant % this.bestSetsPerBatch;
            if (this.finalBatchLength > 0) {
                ++this.finalNumBatches;
            }
        }
        this.spanNum = 0;
        this.lastSpanStart = 0;
        this.spanStart = 0;
        this.batchProcessCount = 0;

        // Batch Process Constants
        this.maxCycles = 5; // 15;
        this.cyclesPerBatch = this.maxCycles * this.bestSetsPerBatch;
        this.finalNumCycles = this.maxCycles * this.finalBatchLength;
        this.cyclesPerSpan = this.spanLength
        this.maxBreedEntities = this.bestEntitySetMax / 2;
        this.maxBreedActions = 32;
        this.entitiesPerProcess = this.maxCycles * this.maxBreedEntities * this.maxBreedActions * this.bestSetsPerBatch;
        this.finalEntitiesPerProcess = this.maxCycles * this.maxBreedEntities * this.maxBreedActions * this.finalBatchLength;
    }

    async batchProcessLoop() {
        console.log("batchProcessLoop - numSpans:", this.numSpans, "spanNum:", this.spanNum);
        if (this.spanNum >= this.numSpans) {
            this.doEndOfRoundOperations();
        }

        this.batchProcessCount = 0;
        if (this.spanNum < this.numSpans - 1) {
            this.numProcesses = this.numCPUs;
        }
        else {
            if (this.spanRemnant > 0) {
                this.numProcesses = this.finalNumBatches;
            }
            else {
                this.numProcesses = this.numCPUs;
            }
        }

        for (let processNum = 0; processNum < this.numProcesses; processNum++) {
            let entityJSONData = "";

            // Transfer the best set entity data to the exchange tables
            if (workerDataTransfer === "database") {
                // Send via database
                await this.sendEntityExchangeData(this.spanNum, this.numProcesses, processNum);
            }
            else if (workerDataTransfer === "fileSystem") {
                // Send via file system
                await this.sendFSEntityExchangeData(this.spanNum, this.numProcesses, processNum);
            }
            else {
                // Send via stdio, get JSON data
                let batchStart = this.spanStart + processNum * this.bestSetsPerBatch;
                let batchLength = this.bestSetsPerBatch;
                if (this.spanNum === this.numSpans - 1 && processNum === this.numProcesses - 1 && this.finalBatchLength > 0) {
                    batchLength = this.finalBatchLength;
                }
                entityJSONData = 
                    "{\"type\":\"entityData\", \"data\":" + 
                    fsTransactions.parentPrepareBatchJSONSet(this.bestSets, batchStart, batchLength) +
                    "}\n";
            }
            // Spawn the processes
            this.spawnProcess(this.spanNum, this.numProcesses, processNum, entityJSONData);
        }
        
        this.mainWindow.webContents.send('batchDispatched', 0);
    }

    spawnProcess(spanNum, numProcesses, processNum, batchEntityJSON) {
        let batchLength = this.bestSetsPerBatch;
        if (spanNum === this.numSpans - 1 && processNum === numProcesses - 1 && this.finalBatchLength > 0) {
            batchLength = this.finalBatchLength
        }
        let batchStart = this.spanStart + this.bestSetsPerBatch * processNum;
        let batchCycle = processNum * this.cyclesPerBatch + this.cycleCounter;
        let batchEntityNumber = processNum * this.entitiesPerProcess + this.entityNumber;

        console.log("spawnProcess: batchCycle, batchEntityNumber", processNum, batchCycle, batchEntityNumber);
        const worker = spawn("node", ["src/processes/workerApp.js", processNum, batchStart, batchLength, 
            this.ruleSequenceNum, batchEntityNumber, batchCycle, this.roundNum]);

        if (workerDataTransfer === "stdio") {
            // Message interface (stdout)
            const rl = readline.createInterface({
                input: worker.stdout,
                terminal: false
            });

            rl.on('line', (line) => {
                let msg;
                let type;
                try {
                    msg = JSON.parse(line);
                    console.log(`[MESSAGE] From worker`);
                } catch (err) {
                    let slen = line.length;
                    console.error('[PARENT] Invalid JSON from worker:', line.substring(0,80));
                    console.error(line.substring(slen - 80, slen));
                    throw "Stdio JSON Error";
                }
                type = msg.type;
                console.log("type:", type);
                if (type === "message") {
                    console.log("worker message:", msg.message);
                }
                else if (type === "entityData") {
                    let entityData = msg.data;
                    this.collectStdioEntityData(entityData, processNum);
                }
                else if (type === "batchData") {
                    let batchData = msg.data;
                    this.collectStdioBatchData(batchData);
                    ++this.batchProcessCount;
                    if (this.batchProcessCount >= this.numProcesses) {
                        this.batchDataCollection();
                    }
                }
            });
        }
        else {
            worker.stdout.on("data", (data) => {
                console.log(`Worker ${processNum} stdout: ${data}`);
            });
        }
    
        worker.stderr.on("data", (data) => {
            console.error(`Worker ${processNum} stderr: ${data}`);
        });
    
        worker.on("exit", (code) => {
            if (code === 0 && workerDataTransfer != "stdio") {
                ++this.batchProcessCount;
                console.log ("Exited batch");
                if (this.batchProcessCount >= this.numProcesses) {
                    this.batchDataCollection();
                }
            }
            console.log(`Worker ${process} exited with code ${code}`);
        });

        // If using stdio, transfer the entity data
        if (workerDataTransfer === "stdio") {
            worker.stdin.write(batchEntityJSON);
        }
    
    }

    async batchDataCollection() {
        console.log("collecting batch process data");
        // Update entityNumber and cycleCounter
        if (this.spanNum < this.numSpans - 1 || this.spanRemnant === 0) {
            this.entityNumber += this.entitiesPerProcess * this.numCPUs;
            this.cycleCounter += this.cyclesPerBatch * this.numCPUs;
        }
        else {
            this.entityNumber += this.entitiesPerProcess * (this.finalNumBatches - 1) + this.finalEntitiesPerProcess;
            this.cycleCounter += this.cyclesPerBatch * (this.finalNumBatches - 1) + this.finalBatchLength * this.maxCycles;
        }
        if (workerDataTransfer === 'database') {
            await this.collectBatchData();
            await this.collectEntityData();
        }
        else if (workerDataTransfer === 'fileSystem') {
            await this.collectFSBatchData();
            await this.collectFSEntityData();
        }
        else {
            // stdio transfer
            let endTime = Date.now();
            let elapsedTime = endTime - this.startTime;
            this.elapsedTime = elapsedTime;
            this.displayEntity(null, this.spanStart, 0, false);
            this.spanStart += this.spanLength;
            ++this.spanNum;
        }
        this.collectScoreHistory();
        this.mainWindow.webContents.send("batchProcessed", 0);

    }

    async sendEntityExchangeData(spanNum, numProcesses, processNum) {
        let batchLength = this.bestSetsPerBatch;
        if (spanNum === this.numSpans - 1 && processNum === numProcesses - 1 && this.finalBatchLength > 0) {
            batchLength = this.finalBatchLength;
        }
        let batchStart = this.spanStart + this.bestSetsPerBatch * processNum;
        console.log("sendEntityExchangeData - batchStart:", batchStart, "spanStart:", this.spanStart, "spanNum:", this.spanNum);
        for (let bestSetNum = batchStart; bestSetNum < batchStart + batchLength; bestSetNum++) {
            // Clear this best set from the transfer entities
            await dbTransactions.clearTransferEntitySet(bestSetNum);
            // Save the entity set
            await dbTransactions.saveTransferEntitySet(bestSetNum, this.bestSets[bestSetNum]);
        }
    }

    async sendFSEntityExchangeData(spanNum, numProcesses, processNum) {
        let batchLength = this.bestSetsPerBatch;
        if (spanNum === this.numSpans - 1 && processNum === numProcesses - 1 && this.finalBatchLength > 0) {
            batchLength = this.finalBatchLength;
        }
        let batchStart = this.spanStart + this.bestSetsPerBatch * processNum;
        console.log("sendFSEntityExchangeData - batchStart:", batchStart, "spanStart:", 
            this.spanStart, "spanNum:", this.spanNum, "processNum:", processNum);
        await fsTransactions.clearTransferEntitySet(processNum);
        await fsTransactions.saveTransferEntitySet(this.bestSets, batchStart, batchLength, processNum);
    }

    // This is triggered by the exit event of the child processes.
    // This is only called once all of the child processes are done
    async collectEntityData() {
        // Get the best set data
        let setLen = this.spanLength;
        if (this.spanNum === this.numSpans - 1 && this.spanRemnant > 0) {
            setLen = this.spanRemnant;
        }
        let setNum = this.spanStart;
        while (setNum < this.spanStart + setLen && setNum < this.numBestSets) {
            let entityDataSet = await dbTransactions.fetchTransferEntities(setNum);
            this.bestSets[setNum] = [];
            if (entityDataSet != null) {
                let set = [];
                let entityNum = 0;
                for (let entityData of entityDataSet) {
                    let memSpace = this.stringToIntArray(entityData.mem_space);
                    let asRandom = false;
                    let seeded = false;
                    let entity = new Entity(entityData.entity_number, this.instructionSet, 
                        asRandom, seeded, entityData.creation_cycle, this.ruleSequenceNum, this.roundNum, memSpace);
                    entity.score = entityData.score;
                    entity.birthTime = entityData.birth_time;
                    entity.birthDateTime = entityData.birth_date_time;
                    entity.roundNum = entityData.round_num;
                    entity.breedMethod = entityData.breed_method;
                    // Registers
                    entity.registers.A = entityData.reg_a;
                    entity.registers.B = entityData.reg_b;
                    entity.registers.C = entityData.reg_c;
                    entity.registers.CF = entityData.reg_cf;
                    entity.registers.ZF = entityData.reg_zf;
                    entity.registers.SP = entityData.reg_sp;
                    entity.registers.IP = entityData.reg_ip;
                    entity.registers.IC = entityData.reg_ic;
                    // Collect the final memSpace block
                    let finalMemSpace = this.stringToIntArray(entityData.final_mem_space);
                    entity.memSpace = finalMemSpace;
                    // Collect the transfer entity output data
                    // let oldValuesOut = await dbTransactions.fetchTransferEntityOutputs(setNum, entityNum);
                    // entity.oldValuesOut = oldValuesOut;
                    // Collect the transfer entity input data
                    // let oldParams = await dbTransactions.fetchTransferEntityInputs(setNum, entityNum);
                    // entity.oldParams = oldParams;
                    set.push(entity);
                    ++entityNum;
                }
                this.bestSets[setNum] = set;
            }
            ++setNum;
        }
        // Display the first entity of the span
        let endTime = Date.now();
        let elapsedTime = endTime - this.startTime;
        this.elapsedTime = elapsedTime;
        elapsedTime = (elapsedTime + this.previousElapsedTime) / (3600 * 1000);
        // Find the nearest non-empty best-set to the span start
        let p = this.spanStart;
        let allEmpty = true;
        for (let i = 0; i < this.numBestSets; i++) {
            if (this.bestSets[p].length > 0) {
                allEmpty = false;
                break;
            }
            ++p;
            if (p >= this.numBestSets) p = 0;
        }

        if (!allEmpty) {
            let terminateProcessing = false;
            this.displayEntity(null, p, 0, terminateProcessing);
        }
        ++this.spanNum;
        this.lastSpanStart = this.spanStart;
        this.spanStart += setLen;
        // This returns to the server event loop
    }

    async collectFSEntityData() {
        let setLen = this.spanLength;
        if (this.spanNum === this.numSpans - 1 && this.spanRemnant > 0) {
            setLen = this.spanRemnant;
        }
        await fsTransactions.fetchSpanEntities(this.numProcesses, this.spanStart, 
            this.bestSets, this.ruleSequenceNum, this.instructionSet);
        // Display the first entity of the span
        let endTime = Date.now();
        let elapsedTime = endTime - this.startTime;
        this.elapsedTime = elapsedTime;
        elapsedTime = (elapsedTime + this.previousElapsedTime) / (3600 * 1000);
        // Find the nearest non-empty best-set to the span start
        let p = this.spanStart;
        let allEmpty = true;
        for (let i = 0; i < this.numBestSets; i++) {
            if (this.bestSets[p].length > 0) {
                allEmpty = false;
                break;
            }
            ++p;
            if (p >= this.numBestSets) p = 0;
        }

        if (!allEmpty) {
            let terminateProcessing = false;
            this.displayEntity(null, p, 0, terminateProcessing);
        }
        ++this.spanNum;
        this.lastSpanStart = this.spanStart;
        this.spanStart += setLen;
        // This returns to the server event loop
    }

    collectStdioEntityData(entityData, batchNum) {
        let batchStart = this.spanStart + this.bestSetsPerBatch * batchNum;
        console.log("batchStart: ", batchStart, "batchNum:", batchNum);
        let setIndex = 0;
        for (let eset of entityData) {
            let entityIndex = 0;
            let outSet = [];
            for (let entity of eset) {
                let asRandom = false;
                let seeded = false;
                let newEntity = new Entity(entity.entityNumber, this.instructionSet, asRandom, seeded, 
                    entity.birthCycle, this.ruleSequenceNum, entity.roundNum, entity.initialMemSpace);
                newEntity.score = entity.score;
                newEntity.memSpace = entity.memSpace;
                newEntity.breedMethod = entity.breedMethod;
                newEntity.birthTime = entity.birthTime;
                newEntity.birthDateTime = entity.birthDateTime;
                newEntity.birthCycle = entity.birthCycle;
                newEntity.registers = entity.registers;
                outSet.push(newEntity);
                ++entityIndex;
            }
            this.bestSets[batchStart + setIndex] = outSet;
            ++setIndex;
        }
    }

    async collectBatchData() {
        let numBatches = this.numCPUs;
        if (this.spanNum === this.numSpans - 1) {
            numBatches = this.finalNumBatches;
        }
        for (let batchNum = 0; batchNum < numBatches; batchNum++) {
            let results = await dbTransactions.fetchBatchData(batchNum);
            if (results) {
                this.monoclonalInsCount += results[0].monoclonal_ins_count;
                this.monoclonalByteCount += results[0].monoclonal_byte_count;
                this.interbreedCount += results[0].interbreed_count;
                this.interbreed2Count += results[0].interbreed2_count;
                this.interbreedFlaggedCount += results[0].interbreed_flagged_count;
                this.interbreedInsMergeCount += results[0].interbreed_ins_merge_count;
                this.selfBreedCount += results[0].self_breed_count;
                this.seedRuleBreedCount += results[0].seed_rule_breed_count;
                this.seedTemplateBreedCount += results[0].seed_template_breed_count;
                this.randomCount += results[0].random_count;
                this.crossSetCount += results[0].cross_set_count;
            }
        }
    }

    async collectFSBatchData() {
        let numBatches = this.numCPUs;
        if (this.spanNum === this.numSpans - 1) {
            numBatches = this.finalNumBatches;
        }
        for (let i = 0; i < numBatches; i++) {
            let batchData = await fsTransactions.fetchBatchData(i);
            this.monoclonalInsCount += batchData.monoclonalInsCount;
            this.monoclonalByteCount += batchData.monoclonalByteCount;
            this.interbreedCount += batchData.interbreedCount;
            this.interbreed2Count += batchData.interbreed2Count;
            this.interbreedFlaggedCount += batchData.interbreedFlaggedCount;
            this.interbreedInsMergeCount += batchData.interbreedInsMergeCount;
            this.selfBreedCount += batchData.selfBreedCount;
            this.seedRuleBreedCount += batchData.seedRuleBreedCount;
            this.seedTemplateBreedCount += batchData.seedTemplateBreedCount;
            this.randomCount += batchData.randomCount;
            this.crossSetCount += batchData.crossSetCount;
        }
    }

    collectStdioBatchData(batchData) {
        this.monoclonalInsCount += batchData.monoclonalInsCount;
        this.monoclonalByteCount += batchData.monoclonalByteCount;
        this.interbreedCount += batchData.interbreedCount;
        this.interbreed2Count += batchData.interbreed2Count;
        this.interbreedFlaggedCount += batchData.interbreedFlaggedCount;
        this.interbreedInsMergeCount += batchData.interbreedInsMergeCount;
        this.selfBreedCount += batchData.selfBreedCount;
        this.seedRuleBreedCount += batchData.seedRuleBreedCount;
        this.seedTemplateBreedCount += batchData.seedTemplateBreedCount;
        this.randomCount += batchData.randomCount;
        this.crossSetCount += batchData.crossSetCount;
    }

    collectScoreHistory() {
        let numEntitySets = this.spanLength;
        if (this.spanNum === this.numSpans && this.spanRemnant > 0) {
            numEntitySets = this.spanRemnant;
        }
        for (let i = 0; i < numEntitySets; i++) {
            this.updateScoreHistory(i + this.lastSpanStart);
        }
    }

    doEndOfRoundOperations() {
        this.spanNum = 0;
        this.spanStart = 0;
        console.log("Got to doEndOfRoundOperations");
        this.saveBestScore();
        ++this.numRounds;
        dbTransactions.saveSession(this.mainWindow, this, rulesets.ruleSequenceNum);
        // Check for rule threshold reached
        let thresholdReached = this.checkRuleThreshold();
    
        ++this.lapCounter;
        if (!thresholdReached && this.numRounds > 0 && (this.numRounds % this.clearanceRound === 0 && this.bestSetNum === 0)) {
            console.log("Clearance Round");
            // Clearance Pass
            this.restartSets();
        }
        else if (thresholdReached && this.runningSingleRule) return;
        else {
            this.shuffleSets();
        }
    }

    shuffleSets() {
        let numShuffles = 2;
        for (let i = 0; i < numShuffles; i++) {
            let same = true;
            let a, b;
            while (same) {
                a = Math.floor(Math.random() * this.numBestSets);
                b = Math.floor(Math.random() * this.numBestSets);
                same = (a === b);
            }
            let set = this.bestSets[a];
            this.bestSets[a] = this.bestSets[b];
            this.bestSets[b] = set;
        }
    }

    saveBestScore() {
        // Get the best scoring index
        let bestScore = 0;
        let best = 0;
        let index = 0;
        for (let set of this.bestSets) {
            if (set.length > 0) {
                let score = set[0].score;
                if (score > bestScore) {
                    bestScore = score;
                    best = index; 
                }
            }
            ++index;
        }
        // Update the rule set
        rulesets.bestEntity = this.bestSets[best][0]; 
    }

    checkRuleThreshold() {
        // Get the best set scores
        let index = 0;
        let highScore = 0;
        let highIndex = -1;
        for (let set of this.bestSets) {
            if (set.length > 0) {
                let e = set[0];
                let score = e.score;
                if (score > highScore) {
                    highIndex = index;
                    highScore = score;
                }
            }
            ++index;
        }

        // Check whether the score threshold has been reached
        let set = this.bestSets[highIndex];
        let entity = set[0];

        // Check for single rule run
        if (this.runningSingleRule) {
            let passMark = 0.95;
            let rule = rulesets.getRuleFromSequence(rulesets.ruleSequenceNum);
            if ("passScore" in rule) {
                passMark = rule.passScore;
            }
            if (entity.score >= rulesets.currentMaxScore * passMark) {
                let setNum = highIndex;
                let terminateProcessing = true;
                this.displayEntity(null, setNum, 0, terminateProcessing);
                return true;
            }
        }
        else {
            let memSpace = entity.initialMemSpace.concat();
            let score = entity.score;
            rulesets.seedRuleUpdate(this.instructionSet, memSpace, score, this.numRounds);
            if (rulesets.seedRuleSet) {
                if (rulesets.ruleSequenceNum <= rulesets.maxRuleSequenceNum) {
                    // Clear down all best sets to use only the seed rules or random
                    console.log("Clearing best sets");
                    for (let i = 0; i < this.numBestSets; i++) {
                        this.bestSets[i] = [];
                    }
                }
                else {
                    // End of rules - Terminate the processing, display the best entity
                    let terminateProcessing = true;
                    this.displayEntity(null, highIndex, 0, terminateProcessing)
                }
                this.ruleSequenceNum = rulesets.ruleSequenceNum;
                rulesets.seedRuleSet = false;
                return true;
            }
        }

        return false;
    }

    restartSets() {
        // Sort the bestSet scores
        // Get the best set scores
        let scoreList = [];
        let index = 0;
        for (let set of this.bestSets) {
            if (set.length > 0) {
                let score = set[0].score;
                scoreList.push({index: index, score: score});
            }
            ++index;
        }
        scoreList.sort((a, b) => b.score - a.score);

        // Eliminate the lower entries
        let start = Math.floor(this.numBestSets * this.restartProportion);
        for (let i = start; i < scoreList.length; i++) {
            let index = scoreList[i].index;
            this.bestSets[index] = [];
            this.scoreHistory[index] = [];
        }

        // Eliminate duplicate scores
        this.eliminateDuplicateScores(scoreList);

        // Eliminate duplicate score best set entries
        // this.eliminateDuplicateOutput();
        
    }

    eliminateDuplicateScores(scoreList) {
        let maxSame = 3;
        let count = 0;
        let currentScore = 0;
        for (let item of scoreList) {
            let index = item.index;
            let set = this.bestSets[index];
            if (set.length > 0) {
                let score = set[0].score;
                if (currentScore === 0) {
                    currentScore = score;
                }
                else if (score === currentScore) {
                    ++count;
                    if (count > maxSame) {
                        this.bestSets[index] = [];
                        this.scoreHistory[index] = [];
                    }
                }
                else {
                    count = 0;
                    currentScore = 0;
                }
            }
        }
    }

    eliminateDuplicateOutput() {
        let maxSame = 3;
        for (let i = 0; i < this.numBestSets - maxSame; i++) {
            let set = this.bestSets[i];
            if (set.length > 0) {
                let e1 = set[0];
                let valuesOut1 = e1.oldValuesOut;
                let matchCount = 0;
                let matchSet = [];
                for (let j = i + 1; j < this.numBestSets; j++) {
                    let set2 = this.bestSets[j];
                    if (set2.length > 0) {
                        let e2 = set2[0];
                        let valuesOut2 = e2.oldValuesOut;
                        // Compare the values out
                        let diff = compareValues(valuesOut1, valuesOut2);
                        if (!diff) {
                            ++matchCount;
                            matchSet.push({index: j, score: e2.score});
                        }
                    }
                }
                // If more than the limit of matches found
                if (matchCount >= maxSame) {
                    matchSet.push({index: i, score: e1.score});
                    // Sort the match set by score
                    matchSet.sort((a, b) => b.score - a.score);
                    // Eliminate all the entries past the max
                    for (let i = maxSame; i < matchSet.length; i++) {
                        let index = matchSet[i].index;
                        this.bestSets[index] = [];
                    }
                }
            }
        }

        function compareValues(v1, v2) {
            let diff = false;
            for (let i = 0; i < v1.length; i++) {
                for (let j = 0; j < v1[i].length; j++) {
                    if (v1[i][j] != v2[i][j]) {
                        diff = true;
                        break;
                    }
                }
                if (diff) break;
            }
            return diff;
        }
    }

    updateScoreHistory(bestSetNum) {
        if (this.bestSets[bestSetNum].length > 0) {
            let score = this.bestSets[bestSetNum][0].score;
            if (this.scoreHistory[bestSetNum].length < this.scoreHistoryMaxLen) {
                let a = this.scoreHistory[bestSetNum].concat();
                a.push(score);
                this.scoreHistory[bestSetNum] = a;
            }
            else {
                let a = this.scoreHistory[bestSetNum].concat();
                a.splice(0, 1);
                a.push(score);
                this.scoreHistory[bestSetNum] = a;
            }
        }
        ++this.scoreHistoryCounter[bestSetNum];
    }

    loadAndExecuteSeed(seedProgram) {
        let insSet = new InstructionSet();
        // Compile the seed program
        let memSpace = new Array(256).fill(0);
        insSet.compileTestCode(seedProgram.program, memSpace);
        // Create the test entity
        let asRandom = false;
        let seeded = false;
        let ruleSequenceNum = null;
        let entity = new Entity(this.entityNumber, insSet, asRandom, seeded, this.cycleCounter, 
            ruleSequenceNum, this.numRounds, memSpace, this.mainWindow);
        this.seedEntity = entity;
        let memObj = entity.execute(0, 0);
        // Get the display details
        let seedDisplayData = entity.getSeedDisplayData(seedProgram);
        return seedDisplayData;
    }

    loadAndExecuteSeedRule(seedRuleId) {
        let insSet = new InstructionSet();
        // Fetch the seed rule program
        let found = false;
        let memSpace = null;
        for (let item of rulesets.seedRuleMemSpaces) {
            if (item.ruleId === seedRuleId) {
                memSpace = item.memSpace.concat();
                found = true;
                break;
            }
        }
        if (!found) {
            console.log("loadAndExecuteSeedRule - Seed Rule Not Matched:", seedRuleId);
        }
        let rule = rulesets.getRuleFromRuleId(seedRuleId);
        let ruleSequenceNum = rule.sequenceNum;
        this.ruleSequenceNum = ruleSequenceNum;
        console.log("loadAndExecuteSeedRule - ruleNum:", seedRuleId, "ruleSequenceNum:", ruleSequenceNum);
        let asRandom = false;
        let seeded = false;
        let entity = new Entity(this.entityNumber, insSet, asRandom, seeded, this.cycleCounter, 
            ruleSequenceNum, this.numRounds, memSpace);
        this.seedEntity = entity;
        let memObj = entity.execute(0, 0);
        // Get the display details
        let seedProgram = {};
        seedProgram.name = "Rule Id: " + seedRuleId;
        let seedRuleDescription = rulesets.getDescriptionFromRuleId(seedRuleId);
        seedProgram.description = seedRuleDescription;
        let seedDisplayData = entity.getSeedDisplayData(seedProgram);
        return seedDisplayData;
    }

    insertSeed(seedSetNum) {
        let insSet = new InstructionSet();
        seedSetNum = parseInt(seedSetNum);
        if (seedSetNum < 0 || this.numBestSets <= seedSetNum) return;
        let memSpace = this.seedEntity.initialMemSpace;
        // Create a new entity from the seed entity
        let asRandom = false;
        let seeded = false;
        console.log("Inserting seed entity, ruleSequenceNum", rulesets.ruleSequenceNum);
        let entity = new Entity(this.entityNumber, insSet, asRandom, seeded, this.cycleCounter, 
            rulesets.ruleSequenceNum, this.numRounds, memSpace);
        this.ruleSequenceNum = rulesets.ruleSequenceNum;
        entity.bestSetEntityNum = 0;
        ++this.entityNumber;
        entity.breedMethod = "Seeded";
        let a = [];
        // Re-execute to get score
        entity.execute(0,0);
        a.push(entity);
        this.bestSets[seedSetNum] = a;
    }

    /**
     * Load and reset the best set entity details
     * 
     * @param {*} session -session database record
     * @param {*} entities - entity database records
     */
    loadRestart(session, entities, seedRules) {
        // Set session details
        this.cycleCounter = session.cycle_counter;
        this.numRounds = session.num_rounds;
        this.previousElapsedTime = session.elapsed_time;
        this.startTime = Date.now();
        this.entityNumber = session.entity_number;
        this.bestSetNum = 0;
        this.bestSets = new Array(this.numBestSets).fill([]);
        const insSet = new InstructionSet();

        // Get rule/seed details
        rulesets.ruleSequenceNum = session.rule_sequence_num;
        this.ruleSequenceNum = session.rule_sequence_num;
        rulesets.seedRuleMemSpace = null;
        if (session.seed_rule_mem_space != null) {
            rulesets.seedRuleMemSpace = this.stringToIntArray(session.seed_rule_mem_space);
        }

        // Insert the new entities
        for (let e of entities) {
            let bestSetNum = e.best_set_num;
            // Collect the entity array data
            let initialParams1 = this.stringToIntArray(e.initial_params_1);
            let initialParams2 = this.stringToIntArray(e.initial_params_2);
            let initialMemSpace = this.stringToIntArray(e.initial_mem_space);
            let asRandom = false;
            let seeded = false;
            let entity = new Entity(e.entity_number, insSet, asRandom, seeded, e.birth_cycle, 
                rulesets.ruleSequenceNum, this.numRounds, initialMemSpace);
            let memObj = entity.execute(0, 0);
            entity.birthTime = e.birth_time;
            entity.birthDateTime = e.birth_date_time;
            entity.breedMethod = e.breed_method;
            entity.bestSetEntityNum = 0;
            let set = [entity];
            this.bestSets[bestSetNum] = set;
        }
        console.log("Entities Loaded");

        // Load the seed rules
        for (let item of seedRules) {
            let memStr = item.seed_rule_mem_space;
            let memArray = this.stringToIntArray(memStr);
            let ruleId = item.rule_id;
            // Search the existing seed rules
            let found = false;
            for (let item of rulesets.seedRuleMemSpaces) {
                if (item.ruleId === ruleId) {
                    found = true;
                    break;
                }
            }
            if (!found) {
                let item = {};
                item.ruleId = ruleId;
                item.memSpace = memArray;
                rulesets.seedRuleMemSpaces.push(item);
            }
        }
    }

    stringToIntArray(str) {
        let a = [];
        for (let i = 0; i < str.length; i++) {
            a.push(str.charCodeAt(i));
        }
        return a;
    }

    startAtRule(ruleSequenceNum) {
        console.log("ruleSequenceNum:", ruleSequenceNum);
        this.ruleSequenceNum = ruleSequenceNum;
        rulesets.ruleSequenceNum = ruleSequenceNum;
        this.bestSetNum = 0;
        this.bestSets = new Array(this.numBestSets).fill([]);
        this.setupBatchProcessing();
        this.batchProcessLoop();
    }

    startSelectedRule(ruleNum) {
        this.ruleSequenceNum = ruleNum;
        rulesets.ruleSequenceNum = ruleNum;
        this.runningSingleRule = true;
        this.runRuleNum = ruleNum;

        // Restart Processing
        this.numRounds = 0;
        this.cycleCounter = 0;
        this.numTrials = 0;
        this.bestSetNum = 0;
        this.bestSets = new Array(this.numBestSets).fill([]);
        this.scoreHistory = new Array(this.numBestSets).fill([]);
        this.scoreHistoryCounter = new Array(this.numBestSets).fill(0);
        this.elapsedTime = 0;
        this.previousElapsedTime = 0;
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
        this.startTime = Date.now();

        this.setupBatchProcessing();
        this.batchProcessLoop();
    }

    /**
     * 
     * @param {*} entity  - if null, use the setNum and entity index
     * @param {*} setNum 
     * @param {*} entityIndex 
     * @param {*} terminateProcessing 
     */
    displayEntity(entity, setNum, entityIndex, terminateProcessing) {
        // Prepare and re-execute the entity
        let e2;
        if (entity === null) {
            let e1 = this.bestSets[setNum][entityIndex];
            let memSpace = e1.initialMemSpace;
            let asRandom = false;
            let seeded = false;
            let currentCycle = e1.birthCycle;
            e2 = new Entity(e1.entityNumber, this.instructionSet, asRandom, seeded, currentCycle, 
                this.ruleSequenceNum, this.roundNum, memSpace);
            e2.breedMethod = e1.breedMethod;
        }
        else {
            e2 = entity;
        }
        e2.execute(0, 0);
        let displayData = e2.display(setNum, entityIndex);

        // Sample Data
        let rule = rulesets.getRuleFromSequence(this.ruleSequenceNum);
        displayData.sampleIn = rule.sampleIn;
        displayData.sampleOut = rule.sampleOut;

        // Details
        displayData.terminateProcessing = terminateProcessing;
        displayData.numTrials = this.entityNumber;
        displayData.currentCycle = this.cycleCounter;
        displayData.numRounds = this.numRounds;
        displayData.ruleSequenceNum = this.ruleSequenceNum;
        displayData.currentMaxScore = rulesets.currentMaxScore;
        displayData.maxScore = rulesets.maxScore;
        let etime = this.elapsedTime / (3600 * 1000);
        displayData.elapsedTime = Math.floor(etime * 10000)/10000;
        displayData.randomCount = this.randomCount;
        displayData.monoclonalInsCount = this.monoclonalInsCount;
        displayData.monoclonalByteCount = this.monoclonalByteCount;
        displayData.interbreedCount = this.interbreedCount;
        displayData.interbreed2Count = this.interbreed2Count;
        displayData.interbreedFlaggedCount = this.interbreedFlaggedCount;
        displayData.interbreedInsMergeCount = this.interbreedInsMergeCount;
        displayData.selfBreedCount = this.selfBreedCount;
        displayData.seedRuleBreedCount = this.seedRuleBreedCount;
        console.log("displayEntity: this.seedTemplateBreedCount", this.seedTemplateBreedCount);
        displayData.seedTemplateBreedCount = this.seedTemplateBreedCount;
        displayData.crossSetCount = this.crossSetCount;
        displayData.currentRule = this.ruleSequenceNum + " - " + rulesets.getDescriptionFromSequence(this.ruleSequenceNum);
        displayData.scoreList = rulesets.scoreList;
        displayData.ruleCompletionRound = rulesets.ruleCompletionRound;

        // Get the display grouping for inputs and outputs
        if ("displayGroupBy" in rule) {
            displayData.displayGroupBy = rule.displayGroupBy;
        }
        else {
            displayData.displayGroupBy = 4;
        }

        this.mainWindow.webContents.send('displayEntity', displayData);
        
    }
    
}

module.exports = MainControlParallel;