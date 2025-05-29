const path = require('node:path');
const fs = require('fs').promises;

const Entity = require(path.join(__dirname,"../processes/Entity.js"));

const fsTransactions = {
    async clearTransferEntitySet(processNum) {

        const filepath = "src/database/workerTransfer/transferSet" + processNum + ".json";
        
        try {
            await fs.access(filepath);
        }
        catch (err) {
            return;
        }

        try {
            await fs.unlink(filepath);
        }
        catch (err) {
            console.error("clearTransferEntitySet: Could not delete file:", filepath);
        }
    },

    async saveTransferEntitySet(bestSets, batchStart, batchLength, processNum) {
        // Prepare JSON entity set
        let jsonStr = this.parentPrepareBatchJSONSet(bestSets, batchStart, batchLength);

        // Create the transfer file
        const filepath = "src/database/workerTransfer/transferSet" + processNum + ".json";
       
        try {
            await fs.writeFile(filepath, jsonStr, 'utf8');
        }
        catch (err) {
            console.error("saveTransferEntitySet: could not write file: ", filepath);
        }
    },

    parentPrepareBatchJSONSet(bestSets, batchStart, batchLength) {
        let jsonObj = [];
        for (let i = 0; i < batchLength; i++) {
            let entitySet = [];
            let sourceSet = bestSets[batchStart + i];
            for (let j = 0; j < sourceSet.length; j++) {
                let srcEntity = sourceSet[j];
                let destEntity = {};
                destEntity.bestSetNum = batchStart + i;
                destEntity.score = srcEntity.score;
                destEntity.entityNumber = srcEntity.entityNumber;
                destEntity.breedMethod = srcEntity.breedMethod;
                destEntity.birthTime = srcEntity.birthTime;
                destEntity.birthDateTime = srcEntity.birthDateTime;
                destEntity.birthCycle = srcEntity.birthCycle;
                destEntity.roundNum = srcEntity.roundNum;
                destEntity.registers = srcEntity.registers;
                destEntity.initialMemSpace = srcEntity.initialMemSpace;
                destEntity.memSpace = srcEntity.memSpace;
                entitySet.push(destEntity);
            }
            jsonObj.push(entitySet);
        }
        let jsonStr = JSON.stringify(jsonObj);
        return jsonStr;
    },

    async fetchSpanEntities(numProcesses, spanStart, bestSets, ruleSequenceNum, instructionSet) {

        let setNum = spanStart;
        for (let i = 0; i < numProcesses; i++) {
            // Fetch the json file
            const filepath = "src/database/workerTransfer/transferSet" + i + ".json";
            let jsonObj;
            try {
                let jsonStr = await fs.readFile(filepath, 'utf8');
                jsonObj = JSON.parse(jsonStr);
            }
            catch (err) {
                console.error("fetchSpanEntities: Could not read transfer file:", filepath);
            }
            // Update the best set
            for (let entitySet of jsonObj) {
                let set = []; 
                for (let entity of entitySet) {
                    let asRandom = false;
                    let seeded = false;
                    let newEntity = new Entity(entity.entityNumber, instructionSet, asRandom, seeded, 
                        entity.birthCycle, ruleSequenceNum, entity.roundNum, entity.initialMemSpace);
                    newEntity.score = entity.score;
                    newEntity.memSpace = entity.memSpace;
                    newEntity.breedMethod = entity.breedMethod;
                    newEntity.birthTime = entity.birthTime;
                    newEntity.birthDateTime = entity.birthDateTime;
                    newEntity.birthCycle = entity.birthCycle;
                    newEntity.registers = entity.registers;
                    set.push(newEntity);
                }
                bestSets[setNum] = set;
                ++setNum;
            }
        }
    },

    async clearBatchData(batchNum) {
        const filepath = "src/database/workerTransfer/batchData" + batchNum + ".json";
        try {
            await fs.access(filepath);
        }
        catch (err) {
            return;
        }

        try {
            await fs.unlink(filepath);
        }
        catch (err) {
            console.error("clearBatchData: Could not delete file:", filepath);
        }
    },

    async fetchBatchData(processNum) {
        try {
            // Fetch the json file
            const filepath = "src/database/workerTransfer/batchData" + processNum + ".json";
            let batchDataJson = await fs.readFile(filepath, 'utf8');
            let batchData = JSON.parse(batchDataJson);
            return batchData;
        }
        catch (err) {
            console.error("fetchBatchData: Could not read batch data file:", filepath);
        }
    },

    async fetchBatchEntitySet(batchNum) {
        try {
            const filepath = "src/database/workerTransfer/transferSet" + batchNum + ".json";
            const setDataJson = await fs.readFile(filepath, 'utf8');
            let setData = JSON.parse(setDataJson);
            return setData;
        }
        catch (err) {
            console.error("fetchBatchEntitySet: Could not read file:", filepath);
        }
    },

    async transferBatchSet(bestSets, batchNum, batchStart) {
        // Child Worker for Parent
        // Prepare JSON entity set
        let jsonStr = this.prepareJSONEntitySet(bestSets, batchStart);

        // Create the transfer file
        const filepath = "src/database/workerTransfer/transferSet" + batchNum + ".json";
       
        try {
            await fs.writeFile(filepath, jsonStr, 'utf8');
        }
        catch (err) {
            console.error("saveTransferEntitySet: could not write file: ", filepath);
        }
    },

    prepareJSONEntitySet(bestSets, batchStart) {
        let jsonObj = [];
        for (let i = 0; i < bestSets.length; i++) {
            let entitySet = [];
            let sourceSet = bestSets[i];
            for (let j = 0; j < sourceSet.length; j++) {
                let srcEntity = sourceSet[j];
                let destEntity = {};
                destEntity.bestSetNum = batchStart + i;
                destEntity.score = srcEntity.score;
                destEntity.entityNumber = srcEntity.entityNumber;
                destEntity.breedMethod = srcEntity.breedMethod;
                destEntity.birthTime = srcEntity.birthTime;
                destEntity.birthDateTime = srcEntity.birthDateTime;
                destEntity.birthCycle = srcEntity.birthCycle;
                destEntity.roundNum = srcEntity.roundNum;
                destEntity.registers = srcEntity.registers;
                destEntity.initialMemSpace = srcEntity.initialMemSpace;
                destEntity.memSpace = srcEntity.memSpace;
                entitySet.push(destEntity);
            }
            jsonObj.push(entitySet);
        }
        let jsonStr = JSON.stringify(jsonObj);
        return jsonStr;
    },

    async saveBatchData(batchNum, batchData) {
        const filepath = "src/database/workerTransfer/batchData" + batchNum + ".json";
        const batchDataJson = JSON.stringify(batchData);
        try {
            await fs.writeFile(filepath, batchDataJson, 'utf8');
        }
        catch (err) {
            console.error("saveBatchData: Could not save batch data:", filepath);
        }
    }
}

module.exports = fsTransactions;