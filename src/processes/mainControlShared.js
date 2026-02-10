const path = require('node:path');
const rulesets = require(path.join(__dirname, 'rulesets.js'));
const seedTemplates = require(path.join(__dirname, 'seedTemplates.js'));
const dbTransactions = require(path.join(__dirname,'../database/dbTransactions.js'));

const mainControlShared = {

    async fileInitialisations(self) {
        await dbTransactions.fetchRuleSeeds();
        await dbTransactions.loadFragments();
        this.initialiseSeedbedLogs(self);
    },

    initialiseSeedbedLogs(self) {
        // Initialise Template Log
        self.templateSeedbedLog = [];
        for (let i = 0; i < seedTemplates.templates.length; i++) {
            let logItem = {
                numAttempts: 0,
                numFailedAttempts: 0,
                numSuccessfulAttempts: 0,
                current: 0
            }
            self.templateSeedbedLog.push(logItem);
        }

        // Initialise seed rule log
        self.seedRuleSeedbedLog = [];
        for (let i = 0; i < rulesets.seedRuleMemSpaces.length; i++) {
            let logItem = {
                numAttempts: 0,
                numFailedAttempts: 0,
                numSuccessfulAttempts: 0,
                current: 0
            }
            self.seedRuleSeedbedLog.push(logItem);
        }
    },

    resetSeedbedData(self, index) {
        if (index < self.seedbedStart) {
            return;
        }
        index -= self.seedbedStart;
        // Get the seed item
        let seedIndex = self.seedbedData[index].seedIndex;
        let seedType = self.seedbedData[index].seedType;
        let item = null;
        if (seedType === "Template") {
            item = self.templateSeedbedLog[seedIndex];
        }
        else {
            if (self.seedRuleSeedbedLog.length === 0) return;
            item = self.seedRuleSeedbedLog[seedIndex];
        }
        item.current -= 1;
        item.numFailedAttempts += 1;

        // Reset the seedbedData entry
        self.seedbedData[index] = {seedType: "", seedIndex:0, startRound: 0, promotedRound: 0};
    },
    
    checkSeedbedThresholds(self) {
        for (let batchNum = 0; batchNum < self.numSeedbeds; batchNum++) {
            // Check whether the round limit has been reached
            let seedType = self.seedbedData[batchNum].seedType;
            if (seedType != "") {
                let seedIndex = self.seedbedData[batchNum].seedIndex;
                let startRound = self.seedbedData[batchNum].startRound;
                let promotedRound = self.seedbedData[batchNum].promotedRound;
                let logItem;
                if (seedType === "Template") {
                    logItem = self.templateSeedbedLog[seedIndex];
                }
                else {
                    logItem = self.seedRuleSeedbedLog[seedIndex];
                }

                let clearBatch = false;
                if (self.numRounds >= startRound + self.seedbedMaxRoundsToTarget && promotedRound === 0) {
                    // If the time limit is reached, clear-down the batch
                    logItem.numFailedAttempts += 1;
                    logItem.current -= 1;
                    // Clear the seedBedData
                    self.seedbedData[batchNum].seedType = "";
                    self.seedbedData[batchNum].seedIndex = 0;
                    self.seedbedData[batchNum].startRound = 0;
                    self.seedbedData[batchNum].promotedRound = 0;
                    // Clear down the batch
                    clearBatch = true;
                }
                
                let setNum = self.seedbedStart + batchNum;
                for (let i = 0; i < self.batchLen; i++) {
                    if (clearBatch) {
                        self.bestSets[setNum] = [];
                    }
                    else {
                        // Check for score threshold promotion
                        if (self.bestSets[setNum].length > 0) {
                            let entity = self.bestSets[setNum][0];
                            let score = entity.score;
                            if (score > self.targetSeedbedScore * rulesets.currentMaxScore
                                && self.seedbedData[batchNum].promotedRound === 0) {
                                let donePromotion = this.promoteSeedbedEntity(self, entity, batchNum);
                                if (donePromotion) {
                                    logItem.numSuccessfulAttempts += 1;
                                    self.seedbedData[batchNum].promotedRound = self.numRounds;
                                    break;
                                }
                            }
                        }
                    }
                    ++setNum;
                }
            }
        }
    },

    promoteSeedbedEntity(self, entity, batchNum) {
        let promotionDone = false;
        let score = entity.score;
        for (let i = 0; i < self.seedbedStart; i++) {
            if (typeof self.bestSets[i][0] != "undefined") {
                let eScore = self.bestSets[i][0].score;
                if (eScore < score) {
                    // Clone the entity
                    let newEntity = entity.cloneEntity();
                    // Copy the entity to the bestSet
                    self.bestSets[i][0] = newEntity;
                    promotionDone = true;
                    break;
                }
            }
        }
        return promotionDone;
    },

    fetchBreedTable(program) {
        const bestSets = program.bestSets;

        // Breed Methods
        let breedTableData = [
            {
                method: "BestsStore",
                usedCount: program.bestsStoreBreedCount,
                extantCount: 0
            },
            {
                method: "Inserted",
                usedCount: 0,
                extantCount: 0,
            },
            {
                method: "Interbreed",
                usedCount: program.interbreedCount,
                extantCount: 0
            },
            {
                method: "Interbreed2",
                usedCount: program.interbreed2Count,
                extantCount: 0
            },
            {
                method: "InterbreedFlagged",
                usedCount: program.interbreedFlaggedCount,
                extantCount: 0
            },
            {
                method: "InterbreedInsMerge",
                usedCount: program.interbreedInsMergeCount,
                extantCount: 0
            },
            {
                method: "MonoclonalIns",
                usedCount: program.monoclonalInsCount,
                extantCount: 0
            },
            {
                method: "MonoclonalByte",
                usedCount: program.monoclonalByteCount,
                extantCount: 0
            },
            {
                method: "Random",
                usedCount: program.randomCount,
                extantCount: 0,
            },
            {
                method: "Seeded",
                usedCount: 0,
                extantCount: 0,
            },
            {
                method: "SeedRule",
                usedCount: program.seedRuleBreedCount,
                extantCount: 0
            },
            {
                method: "SeedTemplate",
                usedCount: program.seedTemplateBreedCount,
                extantCount: 0
            },
            {
                method: "Self-breed",
                usedCount: program.selfBreedCount,
                extantCount: 0
            },
            {
                method: "WeightedMonoclonalByte",
                usedCount: program.weightedMonoclonalByteCount,
                extantCount: 0
            },
            {
                method: "WeightedRandom",
                usedCount: program.weightedRandomBreedCount,
                extantCount: 0,
            }
        ];

        // Collect Data
        for (let set of bestSets) {
            for (let entity of set) {
                let breedMethod = entity.breedMethod;
                // Search List
                let found = false;
                let item = null;
                for (item of breedTableData) {
                    if (breedMethod === item.method) {
                        found = true;
                        break;
                    }
                }
                if (found) {
                    ++item.extantCount;
                }
            }
        }
        return breedTableData;
    }

}

module.exports = mainControlShared;