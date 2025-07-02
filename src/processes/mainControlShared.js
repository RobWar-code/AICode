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
                
                let setNum = self.seedbedStart + self.batchLen * batchNum;
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
    }

}

module.exports = mainControlShared;