const path = require('node:path');
const Entity = require(path.join(__dirname, 'Entity.js'));
const InstructionSet = require(path.join(__dirname, 'InstructionSet.js'));
const rulesets = require(path.join(__dirname, 'rulesets.js'));
const dbTransactions = require(path.join(__dirname, '../database/dbTransactions.js'));
const testObj = require(path.join(__dirname, 'testObj'));

class MainControl {
    constructor (mainWindow) {
        this.mainWindow = mainWindow;
        this.bestEntitySetMax = 40;
        this.bestEntitySetCount = 0;
        this.bestEntitySet = [];
        this.numBestSets = 48;
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
        this.restartLap = this.numBestSets * 10;
        this.restartProportion = 0.6;
        this.cycleCounter = 0;
        this.numRounds = 0;
        this.entityNumber = 0;
        this.monoclonalInsCount = 0;
        this.monoclonalByteCount = 0;
        this.interbreedCount = 0;
        this.interbreed2Count = 0;
        this.interbreedFlaggedCount = 0;
        this.selfBreedCount = 0;
        this.randomCount = 0;
        this.crossSetCount = 0;
        this.startTime = Date.now();
        this.elapsedTime = 0;
        this.previousElapsedTime = 0;
        rulesets.initialise();
    }

    mainLoop() {
        let bestEntitySet = this.bestSets[this.bestSetNum];
        bestEntitySet = this.processLoop(bestEntitySet, this.bestSetNum);
        this.bestSets[this.bestSetNum] = bestEntitySet;
        this.updateScoreHistory();
        ++this.bestSetNum;
        if (this.bestSetNum >= this.numBestSets) {
            this.bestSetNum = 0;
            ++this.numRounds;
            dbTransactions.saveSession(this.mainWindow, this);
        }
        if (this.lapCounter > 0 && this.lapCounter % (this.restartLap + 
            this.numBestSets * Math.floor(this.lapCounter / (4 * this.restartLap))) === 0) {
            console.log("Clearance Pass");
            // Clearance Pass
            this.restartSets();
        }
        ++this.lapCounter;
    }

    restartSets() {
        // Sort the bestSet scores
        // Get the best set scores
        let scoreList = [];
        let index = 0;
        for (let set of this.bestSets) {
            let score = set[0].score;
            scoreList.push({index: index, score: score});
            ++index;
        }
        scoreList.sort((a, b) => b.score - a.score);

        // Eliminate the low entries
        let start = Math.floor(this.numBestSets * this.restartProportion);
        for (let i = start; i < scoreList.length; i++) {
            let index = scoreList[i].index;
            this.bestSets[index] = [];
            this.scoreHistory[index] = [];
        }

        // Eliminate duplicate score best set entries
        let hiScore = scoreList[0].score;
        for (let i = 1; i < start; i++) {
            if (scoreList[i].score === hiScore) {
                let index = scoreList[i].index;
                this.bestSets[index] = [];
                this.scoreHistory[index] = [];
            }
        }

        // Eliminate cases of more than three occurences of the same
        // output values
        this.eliminateDuplicateOutputs();
    }

    eliminateDuplicateOutputs() {
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

    updateScoreHistory() {
        if (this.bestSets[this.bestSetNum].length > 0) {
            let score = this.bestSets[this.bestSetNum][0].score;
            if (this.scoreHistory[this.bestSetNum].length < this.scoreHistoryMaxLen) {
                let a = this.scoreHistory[this.bestSetNum].concat();
                a.push(score);
                this.scoreHistory[this.bestSetNum] = a;
            }
            else {
                let a = this.scoreHistory[this.bestSetNum].concat();
                a.splice(0, 1);
                a.push(score);
                this.scoreHistory[this.bestSetNum] = a;
            }
        }
        ++this.scoreHistoryCounter[this.bestSetNum];
    }

    processLoop(bestEntitySet, bestSetNum) {
        const maxCycles = 10; // 15;
        const maxBreedEntities = this.bestEntitySetMax / 2;
        const maxBreedActions = 32;
        const currentEntitySetMaxLen = 3;
        let insSet = new InstructionSet();
        for (let cycle = 0; cycle < maxCycles; cycle++) {
            for (let i = 0; i < maxBreedEntities; i++) {
                let currentEntitySet = [];
                for (let j = 0; j < maxBreedActions; j++) {
                    // Create new entity
                    const asRandom = true; 
                    const memSpace = null;
                    let entity = null;
                    let gotCrossMate = false;
                    // Debug
                    // bestEntitySet.length >= this.bestEntitySetMax
                    // Determine whether random breed
                    let randomBreed = false;
                    if (bestEntitySet.length < this.bestEntitySetMax) {
                        randomBreed = true;
                    }
                    else {
                        if (this.cycleCounter < this.bestEntitySetFullCycle[bestSetNum] + 20 && Math.random() < 0.5) {
                            randomBreed = true;
                        }
                    }
                    if (!randomBreed) {
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
                            while(!found) {
                                p2 = Math.floor(Math.random() * bestEntitySet.length);
                                if (p2 != p1) found = true;
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
                            this.cycleCounter, this.numRounds, memSpace);
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
                        case "Self-breed" :
                            ++this.selfBreedCount;
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
        let endTime = Date.now();
        let elapsedTime = endTime - this.startTime;
        this.elapsedTime = elapsedTime;
        elapsedTime = (elapsedTime + this.previousElapsedTime) / (3600 * 1000);
        bestEntitySet[0].display(this.mainWindow, bestSetNum, elapsedTime, this.entityNumber, this.randomCount, 
            this.monoclonalInsCount, this.monoclonalByteCount,
            this.interbreedCount, this.interbreed2Count, this.interbreedFlaggedCount, 
            this.selfBreedCount, this.crossSetCount, 
            this.cycleCounter, this.numRounds);
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

    loadAndExecuteSeed(seedProgram) {
        let insSet = new InstructionSet();
        // Compile the seed program
        let memSpace = new Array(256).fill(0);
        insSet.compileTestCode(seedProgram.program, memSpace);
        // Create the test entity
        let asRandom = false;
        let seeded = false;
        let entity = new Entity(this.entityNumber, insSet, asRandom, seeded, this.cycleCounter, 
            this.numRounds, memSpace, this.mainWindow);
        this.seedEntity = entity;
        let memObj = entity.execute(0, 0);
        // Get the display details
        let seedDisplayData = entity.getSeedDisplayData(seedProgram);
        return seedDisplayData;
    }

    insertSeed(seedSetNum) {
        if (seedSetNum < 0 || this.numBestSets <= seedSetNum) return;
        this.seedEntity.breedMethod = "Seeded";
        let a = [];
        a.push(this.seedEntity);
        this.bestSets[seedSetNum] = a;
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

    /**
     * Load and reset the best set entity details
     * 
     * @param {*} session -session database record
     * @param {*} entities - entity database records
     */
    loadRestart(session, entities) {
        // Set session details
        this.cycleCounter = session.cycle_counter;
        this.numRounds = session.num_rounds;
        this.previousElapsedTime = session.elapsed_time;
        this.startTime = Date.now();
        this.entityNumber = session.entity_number;
        this.bestSetNum = 0;
        this.bestSets = new Array(this.numBestSets).fill([]);
        const insSet = new InstructionSet();

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
                this.numRounds, initialMemSpace);
            let memObj = entity.execute(0, 0);
            entity.birthTime = e.birth_time;
            entity.birthDateTime = e.birth_date_time;
            entity.breedMethod = e.breed_method;
            entity.bestSetEntityNum = 0;
            let set = [entity];
            this.bestSets[bestSetNum] = set;
        }
        console.log("Entities Loaded");
    }

    stringToIntArray(str) {
        let a = [];
        for (let i = 0; i < str.length; i++) {
            a.push(str.charCodeAt(i));
        }
        return a;
    }
}

module.exports = MainControl;