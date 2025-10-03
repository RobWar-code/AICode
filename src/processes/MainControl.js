const path = require('node:path');
const { seedRuleMemSpaces } = require('./rulesets');
const MainProcess = require(path.join(__dirname, 'MainProcess.js'));
const instructionSetLists = require(path.join(__dirname, "instructionSetLists.js"));
const Entity = require(path.join(__dirname, 'Entity.js'));
const InstructionSet = require(path.join(__dirname, 'InstructionSet.js'));
const rulesets = require(path.join(__dirname, 'rulesets.js'));
const seedTemplates = require(path.join(__dirname, "seedTemplates.js"));
const dbTransactions = require(path.join(__dirname, '../database/dbTransactions.js'));
const mainControlShared = require(path.join(__dirname, 'mainControlShared.js'));
const testObj = require(path.join(__dirname, 'testObj'));

class MainControl {
    constructor (mainWindow) {
        this.mainWindow = mainWindow;
        this.bestEntitySetMax = 40;
        this.bestEntitySetCount = 0;
        this.bestEntitySet = [];
        this.numBestSets = 72;
        this.bestSets = new Array(this.numBestSets).fill([]);
        this.bestSetNum = 0;

        // Seed bed data
        this.absBestSetNum = 0;
        this.seedbedStart = 60;
        this.numSeedbeds = 12;
        this.seedbedMaxRoundsToTarget = 25;
        this.targetSeedbedScore = 0.8;
        this.batchLen = 4;
        this.seedbedData = new Array(this.numSeedbeds).fill({seedType: "", seedIndex:0, startRound: 0, promotedRound: 0});
        this.templateSeedbedLog = [];
        this.seedRuleSeedbedLog = [];
        
        this.bestEntitySetFullCycle = new Array(this.numBestSets).fill(0);
        this.scoreHistory = new Array(this.numBestSets).fill([]);
        this.scoreHistoryCounter = new Array(this.numBestSets).fill(0);
        this.scoreHistoryCycle = 1;
        this.scoreHistoryMaxLen = 8;
        this.processEntitySetMax = 32;
        this.processEntitySet = [];
        this.crossSetRange = 7;
        this.seedEntity = null;
        this.mainCycle = 4;
        this.maxCycles = 4;
        this.lapCounter = 0;
        this.clearanceRound = 40;
        this.restartProportion = 0.6;
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
        this.instructionSet = new InstructionSet();
        instructionSetLists.init(this.instructionSet);
        rulesets.initialise();
        mainControlShared.fileInitialisations(this);
        this.mainProcess = new MainProcess(rulesets);
    }

    resetArrays() {
        rulesets.seedRuleMemSpaces = [];
        rulesets.seedRuleFragments = [];
        this.seedbedData = new Array(this.numSeedbeds).fill({seedType: "", seedIndex:0, startRound: 0, promotedRound: 0});
        this.seedRuleSeedbedLog = [];
    }

    doProcess() {
        let startBestSetNum = this.bestSetNum;
        this.absBestSetNum = this.bestSetNum;
        this.mainProcess.mainLoop(this);
        for (let i = startBestSetNum; i < this.bestSetNum; ++i) {
            this.updateScoreHistory(i);
        }
        // Display Best Entity of current set
        let endTime = Date.now();
        let elapsedTime = endTime - this.startTime;
        this.elapsedTime = elapsedTime;
        let currentRule = rulesets.getDescriptionFromSequence(this.ruleSequenceNum);
        let terminateProcessing = false;
        if (this.bestSets[startBestSetNum].length > 0) {
            let terminateProcessing = false;
            this.displayEntity(null, startBestSetNum, 0, terminateProcessing);
        }
        ++this.lapCounter;
        let thresholdReached = false;
        if (this.bestSetNum >= this.numBestSets) {
            this.bestSetNum = 0;
            this.saveBestScore();
            ++this.numRounds;
            dbTransactions.saveSession(this.mainWindow, this, rulesets.ruleSequenceNum);
            // Check for rule threshold reached
            thresholdReached = this.checkRuleThreshold();
            if (!thresholdReached) {
                mainControlShared.checkSeedbedThresholds(this);
            }
            if (rulesets.ruleSequenceNum > rulesets.maxRuleSequenceNum) {
                return;           
            }
        }
        if (!thresholdReached && this.numRounds > 0 && (this.numRounds % this.clearanceRound === 0 && 
            this.bestSetNum === 0)) {
            console.log("Clearance Round");
            // Clearance Pass
            this.restartSets();
        }
        else if (thresholdReached && this.runningSingleRule) return;
        else if (thresholdReached) {
            // Reset the seedbed data and logs
            this.seedbedData = new Array(this.numSeedbeds).fill({seedType: "", seedIndex:0, startRound: 0, promotedRound: 0});
            mainControlShared.initialiseSeedbedLogs(this);
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
        let setNum = highIndex;
        let entity = set[0];
        let passScore = 0.95;

        // Check for single rule run
        if (this.runningSingleRule) {
            if (entity.score >= rulesets.currentMaxScore * passScore) {
                let setNum = highIndex;
                let currentRule = rulesets.getDescriptionFromSequence(this.runRuleNum);
                let terminateProcessing = true;
                this.displayEntity(null, setNum, 0, terminateProcessing);
                return true;
            }
        }
        else {
            let memSpace = entity.initialMemSpace.concat();
            let score = entity.score;
            let roundThresholdReached = rulesets.seedRuleUpdate(this.instructionSet, memSpace, score, this.numRounds);
            if (rulesets.seedRuleSet || roundThresholdReached) {
                console.log("Clearing best sets");
                if (rulesets.ruleSequenceNum <= rulesets.maxRuleSequenceNum) {
                    // Clear down all best sets to use only the seed rules or random
                    for (let i = 0; i < this.numBestSets; i++) {
                        this.bestSets[i] = [];
                    }
                }
                else {
                    // Terminate the processing, display the best entity
                    let terminateProcessing = true;
                    this.displayEntity(null, setNum, 0, terminateProcessing);
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
            mainControlShared.resetSeedbedData(this, index);
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

    updateScoreHistory(setNum) {
        if (this.bestSets[setNum].length > 0) {
            let score = this.bestSets[setNum][0].score;
            if (this.scoreHistory[setNum].length < this.scoreHistoryMaxLen) {
                let a = this.scoreHistory[setNum].concat();
                a.push(score);
                this.scoreHistory[setNum] = a;
            }
            else {
                let a = this.scoreHistory[setNum].concat();
                a.splice(0, 1);
                a.push(score);
                this.scoreHistory[setNum] = a;
            }
        }
        ++this.scoreHistoryCounter[setNum];
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
        seedDisplayData.scoreList = rulesets.scoreList;
        seedDisplayData.ruleRounds = rulesets.ruleRounds;

        return seedDisplayData;
    }

    loadAndExecuteSeedRule(option, seedRuleId) {
        let insSet = new InstructionSet();
        // Fetch the seed rule program
        let found = false;
        let memSpace = null;
        let list;
        if (option === "seed") {
            list = rulesets.seedRuleMemSpaces;
        }
        else {
            list = rulesets.subOptRuleMemSpaces;
        }
        for (let item of list) {
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
        seedDisplayData.scoreList = rulesets.scoreList;
        seedDisplayData.ruleRounds = rulesets.ruleRounds;
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
    loadRestart(session, entities, seedRules, subOptRules) {
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

        // Load the sub-opt rules
        for (let item of subOptRules) {
            let memStr = item.sub_opt_rule_mem_space;
            let memArray = this.stringToIntArray(memStr);
            let ruleId = item.rule_id;
            // Search the existing seed rules
            let found = false;
            for (let item of rulesets.subOptRuleMemSpaces) {
                if (item.ruleId === ruleId) {
                    found = true;
                    break;
                }
            }
            if (!found) {
                let item = {};
                item.ruleId = ruleId;
                item.memSpace = memArray;
                rulesets.subOptRuleMemSpaces.push(item);
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
        this.doProcess();
        this.mainWindow.webContents.send("mainCycleCompleted", 0);
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

        this.doProcess();
        this.mainWindow.webContents.send("mainCycleCompleted", 0);
    }

    /**
     * 
     * @param {*} entity  - if null, use the setNum and entity index
     * @param {*} setNum 
     * @param {*} entityIndex 
     * @param {*} terminateProcessing 
     */
    displayEntity(entity, setNum, entityIndex, terminateProcessing) {
        let ruleSequenceNum = this.ruleSequenceNum;
        if (ruleSequenceNum > rulesets.maxRuleSequenceNum) {
            ruleSequenceNum = rulesets.maxRuleSequenceNum;
            console.log("displayEntity: ruleSequenceNum - ", ruleSequenceNum, rulesets.maxRuleSequenceNum);
        }
        // Prepare and re-execute the entity
        let e2;
        if (entity === null) {
            let e1 = this.bestSets[setNum][entityIndex];
            let memSpace = e1.initialMemSpace;
            let asRandom = false;
            let seeded = false;
            let currentCycle = e1.birthCycle;
            e2 = new Entity(e1.entityNumber, this.instructionSet, asRandom, seeded, currentCycle, 
                ruleSequenceNum, this.roundNum, memSpace);
            e2.breedMethod = e1.breedMethod;
        }
        else {
            e2 = entity;
        }
        e2.execute(0, 0);
        let displayData = e2.display(setNum, entityIndex);

        // Sample Data
        let rule = rulesets.getRuleFromSequence(ruleSequenceNum);
        displayData.sampleIn = rule.sampleIn;
        displayData.sampleOut = rule.sampleOut;

        // Details
        displayData.terminateProcessing = terminateProcessing;
        displayData.numTrials = this.entityNumber;
        displayData.currentCycle = this.cycleCounter;
        displayData.numRounds = this.numRounds;
        displayData.ruleSequenceNum = ruleSequenceNum;
        let startRound = rulesets.getCurrentRuleStartRound();
        let roundsThisRule = this.numRounds - startRound;
        displayData.roundsThisRule = roundsThisRule;
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
        displayData.seedTemplateBreedCount = this.seedTemplateBreedCount;
        displayData.crossSetCount = this.crossSetCount;
        displayData.currentRule = ruleSequenceNum + " - " + rulesets.getDescriptionFromSequence(ruleSequenceNum);
        displayData.scoreList = rulesets.scoreList;
        displayData.ruleRounds = rulesets.ruleRounds;

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

module.exports = MainControl;