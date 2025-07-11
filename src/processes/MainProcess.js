const path = require('node:path');
const Entity = require(path.join(__dirname, 'Entity.js'));
const seedTemplates = require(path.join(__dirname, 'seedTemplates.js'));

class MainProcess {
    constructor(rulesets) {
        this.rulesets = rulesets;
    }

    mainLoop(self) {
        for (let i = 0; i < self.mainCycle; i++) {
            let bestEntitySet = self.bestSets[self.bestSetNum];
            bestEntitySet = this.processLoop(self, bestEntitySet, self.bestSetNum, self.absBestSetNum);
            self.bestSets[self.bestSetNum] = bestEntitySet;
            ++self.bestSetNum;
        }
    }

    processLoop(self, bestEntitySet, bestSetNum, absBestSetNum) {
        const maxBreedEntities = self.bestEntitySetMax / 2;
        const maxBreedActions = 32;
        const currentEntitySetMaxLen = 3;
        let inSeedbed = false;
        let gotSeedbedEntity = false;
        let seedbedEntity = null;
        if (absBestSetNum >= self.seedbedStart) inSeedbed = true; 
        for (let cycle = 0; cycle < self.maxCycles; cycle++) {
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
                    if (!inSeedbed && bestEntitySet.length < self.bestEntitySetMax) {
                        breedMode = "random";
                    }
                    else if (inSeedbed && bestEntitySet.length === 0 && !gotSeedbedEntity) {
                        breedMode = "seedbedInsert"
                    }
                    else if (inSeedbed && bestEntitySet.length < self.bestEntitySetMax && gotSeedbedEntity && 
                        seedbedEntity != null) {
                        breedMode = "seedbedStarted"
                    }

                    if (breedMode === "seedRule") {
                        let r = Math.floor(Math.random() * this.rulesets.seedRuleMemSpaces.length);
                        memSpace = this.rulesets.seedRuleMemSpaces[r].memSpace;
                        asRandom = false;
                        entity = new Entity(self.entityNumber, self.instructionSet, asRandom, seeded, 
                            self.cycleCounter, this.rulesets.ruleSequenceNum, self.numRounds, memSpace);
                        entity.qualityControlIns("seedRule", memSpace);
                        entity.breedMethod = "SeedRule";
                    }
                    else if (breedMode === "seedTemplate") {
                        memSpace = seedTemplates.getSeedTemplate();
                        asRandom = false;
                        entity = new Entity(self.entityNumber, self.instructionSet, asRandom, seeded, 
                            self.cycleCounter, this.rulesets.ruleSequenceNum, self.numRounds, memSpace);
                        entity.breedMethod = "SeedTemplate";
                    }
                    else if (breedMode === "seedbedInsert") {
                        // Fetch a seed memspace for the seed bed
                        let memSpaceObj = this.fetchSeedbedSeed(self, absBestSetNum, bestSetNum);
                        memSpace = memSpaceObj.memSpace;
                        let breedMethod = memSpaceObj.breedMethod;
                        asRandom = false;
                        entity = new Entity(self.entityNumber, self.instructionSet, asRandom, seeded, 
                            self.cycleCounter, this.rulesets.ruleSequenceNum, self.numRounds, memSpace);
                        entity.breedMethod = breedMethod;
                        // Copy entity for the seedbedEntity
                        seedbedEntity = new Entity(self.entityNumber, self.instructionSet, asRandom, seeded, 
                            self.cycleCounter, this.rulesets.ruleSequenceNum, self.numRounds, memSpace);
                        gotSeedbedEntity = true;
                    }
                    else if (breedMode === "seedbedStarted") {
                        // Do monoclonal breeds from the original seedbed entity
                        let mate = null;
                        entity = seedbedEntity.breed(self.entityNumber, mate, gotCrossMate, 
                            self.cycleCounter, self.numRounds);
                    }
                    else if (breedMode === "reproduction") {
                        // Set-up for a breed operation 
                        // select the parent entities
                        let p1 = Math.floor(Math.random() * bestEntitySet.length);
                        let p1Entity = bestEntitySet[p1];
                        let p2Entity;
                        // Check for a mate from an alternative set
                        if (Math.random() < 0.001) {
                            let r = this.chooseBestSetMate(self.crossSetRange, bestSetNum, self.numBestSets);
                            let b = bestSetNum + r;
                            if (self.bestSets[b].length != 0) {
                                let e = Math.floor(Math.random() * self.bestSets[b].length);
                                p2Entity = self.bestSets[b][e];
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
                        entity = p1Entity.breed(self.entityNumber, p2Entity, gotCrossMate, 
                            self.cycleCounter, self.numRounds);
                    }
                    else {
                        let seeded = false;
                        // Seeding on first pass.
                        // if (cycle === 0 && i === 0 && j === 0) seeded = true;
                        entity = new Entity(self.entityNumber, self.instructionSet, asRandom, seeded, 
                            self.cycleCounter, this.rulesets.ruleSequenceNum, self.numRounds, memSpace);
                    }
                    // Update breed method tallies
                    switch (entity.breedMethod) {
                        case "MonoclonalIns" :
                            ++self.monoclonalInsCount;
                            break;
                        case "MonoclonalByte" :
                            ++self.monoclonalByteCount;
                            break;
                        case "Interbreed" :
                            ++self.interbreedCount;
                            if (gotCrossMate) ++self.crossSetCount;
                            break;
                        case "Interbreed2" :
                            ++self.interbreed2Count;
                            if (gotCrossMate) ++self.crossSetCount;
                            break;
                        case "InterbreedFlagged" :
                            ++self.interbreedFlaggedCount;
                            if (gotCrossMate) ++self.crossSetCount;
                            break;
                        case "InterbreedInsMerge" :
                            ++self.interbreedInsMergeCount;
                            if (gotCrossMate) ++self.crossSetCount;
                        case "Self-breed" :
                            ++self.selfBreedCount;
                            break;
                        case "SeedRule" :
                            ++self.seedRuleBreedCount;
                            break;
                        case "SeedTemplate" :
                            ++self.seedTemplateBreedCount;
                            break;
                        default:
                            ++self.randomCount;
                            break;
                    }
                    if (entity.crossSetBreed) ++self.crossSetCount;

                    let bestSetHighScore, bestSetLowScore;
                    if (self.bestEntitySet.length < 2) {
                        bestSetHighScore = 0;
                        bestSetLowScore = 0;
                    }
                    else {
                        bestSetHighScore = bestEntitySet[0].score;
                        bestSetLowScore = bestEntitySet[self.bestEntitySet.length - 1].score;
                    }
                    let memObj = entity.execute(bestSetHighScore, bestSetLowScore);
                    // Check whether a rule set threshold was reached
                    if (this.rulesets.seedRuleSet) {
                        self.ruleSequenceNum = this.rulesets.ruleSequenceNum;
                        rulesets.seedRuleSet = false;
                    }
                    // Add to current set
                    currentEntitySet = this.addEntityToCurrentSet(currentEntitySet, currentEntitySetMaxLen, 
                        entity, entity.score);
                    ++self.entityNumber;
                }
                bestEntitySet = this.addEntitiesToBestSet(bestEntitySet, self.bestEntitySetMax, 
                    currentEntitySet);
                if (bestEntitySet.length >= self.bestEntitySetMax && self.bestEntitySetFullCycle[bestSetNum] === 0) {
                    self.bestEntitySetFullCycle[bestSetNum] = self.cycleCounter;
                }
            }
            ++self.cycleCounter;
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

    fetchSeedbedSeed(self, absBestSetNum, bestSetNum) {
        let breedMethod;
        let memSpace;
        let seedIndex;
        // Get the position within the batch
        let seedbedEntityNum = absBestSetNum - self.seedbedStart + bestSetNum;
        // Select the seed
        // Select the seed type
        let seedbedDataObj = {};
        let seedType = "SeedRule";
        if (Math.random() < 0.25 || this.rulesets.seedRuleMemSpaces.length === 0) {
            seedType = "Template";
        }
        // If template is chosen
        if (seedType === "Template") {
            seedIndex = this.selectSeedbedSeed(self.templateSeedbedLog);
            memSpace = seedTemplates.getSeedTemplate(seedIndex);
            breedMethod = "SeedTemplate";
            // Update the log
            let t = self.templateSeedbedLog[seedIndex];
            t.numAttempts += 1;
            t.current += 1;
        }
        else {
            seedIndex = this.selectSeedbedSeed(self.seedRuleSeedbedLog);
            memSpace = this.rulesets.seedRuleMemSpaces[seedIndex].memSpace;
            breedMethod = "SeedRule"
            let t = self.seedRuleSeedbedLog[seedIndex];
            t.numAttempts += 1;
            t.current += 1;
        }
        // Set the seedbed data
        seedbedDataObj.seedType = seedType;
        seedbedDataObj.seedIndex = seedIndex;
        seedbedDataObj.startRound = self.numRounds;
        seedbedDataObj.promotedRound = 0;
        self.seedbedData[seedbedEntityNum] = seedbedDataObj;
        return {memSpace: memSpace, breedMethod: breedMethod};
    }

    selectSeedbedSeed(log) {
        let seedIndex;
        // Get the unused templates
        let unused = [];
        let index = 0;
        for (let item of log) {
            if (item.numAttempts === 0 && item.current === 0) {
                unused.push(index);
            }
            ++index;
        }
        if (unused.length > 0) {
            seedIndex = unused[Math.floor(Math.random() * unused.length)];
        }
        else {
            // Select non-current seed
            let nonCurrent = [];
            let index = 0;
            for (let item of log) {
                if (item.current === 0 && item.numFailedAttempts < 2) {
                    nonCurrent.push(index);
                }
                ++index;
            }
            if (nonCurrent.length > 0) {
                seedIndex = nonCurrent[Math.floor(Math.random() * nonCurrent.length)];
            }
            else {
                // Choose a seed at random
                seedIndex = Math.floor(Math.random() * log.length);
            }
        }
        return seedIndex;
    }
    
    addEntityToCurrentSet(currentEntitySet, currentEntitySetMaxLen, entity, score) {
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
        return newSet;
    }

    addEntitiesToBestSet(bestEntitySet, bestEntitySetMax, currentEntitySet) {
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
                if (newSet.length >= bestEntitySetMax || (bestIndex >= bestEntitySet.length && 
                    currentIndex >= currentEntitySet.length)) {
                    ended = true;
                }
            }
        }
        return newSet;
    }
}

module.exports = MainProcess;