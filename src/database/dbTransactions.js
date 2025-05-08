const mysql = require('mysql2/promise');
const path = require('node:path');
const rulesets = require(path.join(__dirname, '../processes/rulesets.js'));
const {databaseType} = require(path.join(__dirname, '../AICodeConfig.js'));
let dbConn;
if (databaseType === "sqlite") {
    dbConn = require(path.join(__dirname, 'dbConnSqlite.js'));
}
else {
    dbConn = require(path.join(__dirname, "dbConn.js"));
}

const dbTransactions = {
    async saveSession(mainWindow, program, ruleSequenceNum) {

        const dbConnection = await dbConn.openConnection();
        if (dbConnection === null) {
            return false;
        };

        const timeNow = Date.now();
        const elapsedTime = (timeNow - program.startTime) + program.previousElapsedTime;
        let sessionId = null;

        // Insert the program session details
        try {
            let sql = "INSERT INTO session (cycle_counter, num_rounds, elapsed_time, ";
            sql +=  "entity_number, rule_sequence_num) "; 
            sql += "VALUES (?, ?, ?, ?, ?)";
            const [results] = await dbConnection.execute(sql, [program.cycleCounter, program.numRounds, 
                elapsedTime, program.entityNumber, ruleSequenceNum]);
            console.log ("session saved -id", results.insertId);
            sessionId = results.insertId;
        }
        catch (err) {
            console.error("saveSession: problem saving session details");
            throw err;
        }
    
        // Save the entities
        let resultOK = await this.saveEntities(program, sessionId, dbConnection);

        if (resultOK) {
            // Save the seed rules
            resultOK = await this.saveSeedRules(sessionId, dbConnection);
        }

        await this.deleteOtherRecords(dbConnection, sessionId);

        if (resultOK) {
            resultOK = await this.saveRules(dbConnection);
        }

        if (resultOK) {
            resultOK = await this.saveFragments(dbConnection);
        }

        await dbConnection.end();

        if (resultOK) {
            mainWindow.webContents.send("saveDone", 0);
        }

        
    },

    async saveEntities(program, sessionId, dbConnection) {
        let count = 0;
        // For each entity
        for (let i = 0; i < program.numBestSets; i++) {
            if (program.bestSets[i].length > 0) {
                let entity = program.bestSets[i][0];
                let entityNum = entity.entityNumber;
                let birthTime = entity.birthTime;
                let birthDateTime = entity.birthDateTime;
                let birthCycle = entity.birthCycle;
                let roundNum = entity.roundNum;
                let breedMethod = entity.breedMethod;
                let score = entity.score;
                let initialParams1 = this.intArrayToString(entity.initialParamsList[0], 256);
                let initialParams2 = this.intArrayToString(entity.initialParamsList[1], 256);
                let initialMemSpace = this.intArrayToString(entity.initialMemSpace, 256);

                // Save the entity data
                try {
                    let sql = "INSERT INTO entity (";
                    sql += "session_id, best_set_num, entity_number, birth_time, birth_date_time, birth_cycle, ";
                    sql += "round_num, breed_method, score, "
                    sql += "initial_params_1, initial_params_2, initial_mem_space) ";
                    sql += "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
                    const [results] = await dbConnection.execute(sql, [
                        sessionId, i, entityNum, birthTime, birthDateTime, birthCycle,
                        roundNum, breedMethod, score,
                        initialParams1, initialParams2, initialMemSpace
                    ]);
                    ++count;
                }
                catch (err) {
                    console.error("saveEntities: problem saving entity details");
                    console.error("entityNum: ", entityNum);
                    console.error("birthTime: ", birthTime);
                    console.error("birthDateTime: ", birthDateTime);
                    console.error("birthCycle: ", birthCycle);
                    console.error("roundNum: ", roundNum);
                    console.error("breedMethod: ", breedMethod);
                    console.error("score: ", score);
                    throw err;
                }
            }
        }
        if (count > 0) {
            console.log("Entities Saved");
            return true;
        }
        else {
            return false;
        }
    },

    intArrayToString(a, length) {
        let str = "";
        let end = false;
        let index = 0;
        while (!end) {
            let c = String.fromCharCode(a[index]);
            str += c;
            if (str.length >= length) end = true;
            ++index;
            if (index >= a.length) end = true;
        }
        if (str.length < length) {
            let padding = (String.fromCharCode(0)).repeat(length - str.length);
            str += padding;
        }
        return str;
    },

    async deleteOtherRecords(dbConnection, sessionId) {

        // Delete Entities
        try {
            const sql = 'DELETE FROM entity WHERE session_id != ?';
            const [results] = await dbConnection.execute(sql, [sessionId]);
            console.log("Deleted old entities");
        } catch (err) {
            console.error('Error during DELETE entities operation:', err.message);
        }

        // Delete Sessions
        try {
            const sql = 'DELETE FROM session WHERE id != ?';
            const [results] = await dbConnection.execute(sql, [sessionId]);
            console.log("Deleted old sessions");
        } catch (err) {
            console.error('Error during DELETE sessions operation:', err.message);
        }
    },

    async loadSession(mainWindow, program) {
        const dbConnection = await dbConn.openConnection();
        if (dbConnection === null) {
            console.log ("Could not open db connection");
            return;
        }

        let sessions;
        // Get most recent session
        try {
            [sessions] = await dbConnection.execute(
                'SELECT * FROM session ORDER BY id DESC LIMIT 1'
            );
            console.log("Loaded Session");
        } catch (err) {
            console.error('loadSession: Error retrieving most recent record:', err.message);
            throw err;
        }
        if (sessions.length === 0) return;
        let sessionId = sessions[0].id;

        // Get Entities
        let entities;
        try {
            [entities] = await dbConnection.execute(
                `SELECT * FROM entity WHERE session_id = ${sessionId}`
            );
            console.log('loaded entities - entities length', entities.length, sessionId);
        } catch (err) {
            console.error('Error retrieving most recent record:', err.message);
            throw err;
        }

        // Get seed rule memspace
        let seedRules;
        try {
            [seedRules] = await dbConnection.execute(
                `SELECT * FROM seed_rule ORDER BY rule_sequence_num`
            );
        }
        catch (error) {
            console.error("Could not read from seed_rule table.", error.message);
        }
        await dbConnection.end();

        // Rules
        await this.loadRules();

        // Seed Rule Fragments
        await this.loadFragments();

        program.loadRestart(sessions[0], entities, seedRules);

        mainWindow.webContents.send("loadDone", 0);
    },

    async saveSeedRules(sessionId, dbConnection) {

        let seedRules = rulesets.seedRuleMemSpaces;
        if (seedRules.length === 0) return true;

        let ruleSequenceNum = 0;
        for (let seedRuleItem of seedRules) {
            let ruleId = seedRuleItem.ruleId;
            let seedRuleMemSpace = seedRuleItem.memSpace;
            let result = await this.saveSeedRule(dbConnection, sessionId, ruleId, ruleSequenceNum, seedRuleMemSpace);
            if (!result) return false;
            ++ruleSequenceNum;
        }

        console.log("saved seed rules");

        return true;

    },

    async saveSeedRule(dbConnection, sessionId, ruleId, ruleSequenceNum, seedRuleMemSpace) {
        // Delete any existing record for this rule sequence number
        sql = `DELETE FROM seed_rule WHERE rule_id = ${ruleId}`;
        await dbConnection.query(sql);

        let memSpaceStr = this.intArrayToString(seedRuleMemSpace, seedRuleMemSpace.length);
        try {
            sql = "INSERT INTO seed_rule (session_id, rule_id, rule_sequence_num, seed_rule_mem_space) VALUES (?, ?, ?, ?)";
            const [results] = await dbConnection.execute(sql, [sessionId, ruleId, ruleSequenceNum, memSpaceStr]);
            return true;
        }
        catch (error) {
            console.error("Failed to insert seed_rule", error.message);
            throw error;
        }
    },

    async saveRules(dbConnection) {
        let sql = "DELETE FROM rule";
        await dbConnection.query(sql);

        for (let i = 0; i < rulesets.ruleCompletionRound.length; i++) {
            try {
                sql = "INSERT INTO rule (rule_num, completion_round) VALUES (?, ?)";
                const [results] = await dbConnection.execute(sql, [i, rulesets.ruleCompletionRound[i]]);
            }
            catch (error) {
                console.log("saveRules: Could not insert ruleCompletionRound[]:", i);
                throw error.message;
            }
        }

        return true;
    },

    async saveFragments(dbConnection) {
        let sql = "DELETE FROM seed_rule_fragment";
        await dbConnection.query(sql);

        let fragmentList = rulesets.seedRuleFragments;
        for (let fragment of fragmentList) {
            // Create the char representation
            let frag = "";
            for (let i = 0; i < fragment.length; i++) {
                let v = fragment[i];
                let c = String.fromCharCode(v);
                frag += c;
            }
            // Insert into database
            try {
                sql = "INSERT INTO seed_rule_fragment (fragment) VALUES (?)";
                const [results] = await dbConnection.execute(sql, [frag])
            }
            catch (error) {
                console.error("saveFragments: Problem with insert fragment");
                throw error;
            }
        }

        console.log("Saved Seed Rule Fragments");
        return true;
    },

    async fetchSeedRuleList() {
        const dbConnection = await dbConn.openConnection();
        if (dbConnection === null) {
            console.log ("Could not open db connection");
            return;
        }

        let seedList = [];
        try {
            let sql = "SELECT rule_id FROM seed_rule";
            const [results] = await dbConnection.query(sql);

            // Get the rule descriptions
            if (results.length > 0) {
                for (let row of results) {
                    let seedListItem = {};
                    let name = rulesets.getDescriptionFromRuleId(row.rule_id);
                    seedListItem.ruleId = row.rule_id;
                    seedListItem.name = name;
                    seedList.push(seedListItem);
                }
            }
            await dbConnection.end();
            return seedList;
        }
        catch (error) {
            console.error("fetchSeedRuleList: Could not read seed_rule table:", error.message);
            throw error;
        }
    },

    async insertRuleSeed(ruleSeedList) {
        const dbConnection = await dbConn.openConnection();
        if (dbConnection === null) {
            console.log ("Could not open db connection");
            return;
        }
        
        let seedList = rulesets.seedRuleMemSpaces;
        for (let ruleId of ruleSeedList) {
            // Check Whether already present
            let found = false;
            for (let item of seedList) {
                if (item.ruleId === ruleId) {
                    found = true;
                    break;
                }
            }
            if (!found) {
                // Get the seed rule from the database
                try {
                    let sql = `SELECT seed_rule_mem_space FROM seed_rule WHERE rule_id = ${ruleId}`;
                    let [results] = await dbConnection.query(sql);
                    let item = {};
                    item.ruleId = ruleId;
                    let memSpace = this.stringToIntArray(results[0].seed_rule_mem_space);
                    item.memSpace = memSpace;
                    seedList.push(item);

                }
                catch (error) {
                    console.error("insertRuleSeed: could not fetch ruleId", ruleId, error.message);
                    throw error;
                }
            }
        }
        rulesets.seedRuleMemSpaces = seedList;

        await dbConnection.end();

    },

    async fetchRuleSeeds() {
        const dbConnection = await dbConn.openConnection();
        if (dbConnection === null) {
            console.log ("Could not open db connection");
            return;
        }

        try {
            sql = "SELECT rule_id, seed_rule_mem_space FROM seed_rule";
            [results] = await dbConnection.query(sql);
        }
        catch (error) {
            console.log("fetchRuleSeeds: Problem with select");
            throw error;
        }

        await dbConnection.end();
        
        rulesets.seedRuleMemSpaces = [];
        for (let item of results) {
            let entry = {};
            entry.ruleId = item.rule_id;
            entry.memSpace = this.stringToIntArray(item.seed_rule_mem_space);
            rulesets.seedRuleMemSpaces.push(entry);
        }
    },

    async loadRules() {
        const dbConnection = await dbConn.openConnection();
        if (dbConnection === null) {
            console.log ("Could not open db connection");
            return;
        }

        let sql = "SELECT rule_num, completion_round FROM rule";
        try {
            [results] = await dbConnection.query(sql);
            for (let item of results) {
                rulesets.ruleCompletionRound[item.rule_num] = item.completion_round; 
            }
        }
        catch (error) {
            console.log("loadRules: Could not load rule data");
            throw error;
        }

        await dbConnection.end();
    },

    async loadFragments() {
        const dbConnection = await dbConn.openConnection();
        if (dbConnection === null) {
            console.log ("Could not open db connection");
            return;
        }

        let fragmentList = [];
        let sql = "SELECT fragment FROM seed_rule_fragment";
        let [results] = await dbConnection.query(sql);
        for (let row of results) {
            let fragmentStr = row.fragment;
            let fragment = this.stringToIntArray(fragmentStr);
            fragmentList.push(fragment);
        }
        rulesets.seedRuleFragments = fragmentList;

        await dbConnection.end();
    },

    async clearTransferEntitySet(bestSetNum) {
        const dbConnection = await dbConn.openConnection();
        if (dbConnection === null) {
            console.log ("Could not open db connection");
            return;
        }

        let sql;
        try {
            sql = `DELETE FROM transfer_entity_output WHERE best_set_num = ${bestSetNum}`;
            [results] = await dbConnection.query(sql);
        }
        catch (error) {
            console.log("clearTransferEntitySet - problem deleting output", bestSetNum);
            throw error;
        }

        try {
            sql = `DELETE FROM transfer_entity_input WHERE best_set_num = ${bestSetNum}`;
            [results] = await dbConnection.query(sql); 
        }
        catch (error) {
            console.log("clearTransferEntitySet - problem deleting input", bestSetNum);
            throw error;
        }

        try {
            sql = `DELETE FROM transfer_entity WHERE best_set_num = ${bestSetNum}`;
            [results] = await dbConnection.query(sql);
        }
        catch (error) {
            console.log("clearTransferEntitySet: Problem clearing entity set");
            throw error;
        }

        await dbConnection.end();
    },

    async saveTransferEntity(bestSetNum, index, entityNumber, breedMethod, birthTime, birthDateTime, birthCycle, 
        roundNum, registers, memSpace, 
        finalMemSpace, oldValuesOut, oldParams, score) {
        const dbConnection = await dbConn.openConnection();
        if (dbConnection === null) {
            console.log ("Could not open db connection");
            return;
        }

        // Delete the previous transfer entity output blocks
        try {
            let sql = `DELETE FROM transfer_entity_output WHERE best_set_num = ${bestSetNum} AND best_set_inx = ${index}`;
            [results] = await dbConnection.query(sql);
        }
        catch (error) {
            console.log("saveTransferEntity: Could not delete transfer_entity_output", bestSetNum, index);
            throw error;
        }

        // Delete the previous transfer entity parameter blocks
        try {
            let sql = `DELETE FROM transfer_entity_input WHERE best_set_num = ${bestSetNum} AND best_set_inx = ${index}`;
            [results] = await dbConnection.query(sql);
        }
        catch (error) {
            console.log("saveTransferEntity: Could not delete transfer_entity_input", bestSetNum, index);
            throw error;
        }

        // Delete the previous transfer entity
        try {
            let sql = `DELETE FROM transfer_entity WHERE best_set_num = ${bestSetNum} AND inx = ${index}`;
            [results] = await dbConnection.query(sql);
        }
        catch (error) {
            console.log("saveTransferEntity: problem clearing entity");
            throw error;
        }

        // Save the transfer Entity
        // Prepare the memspace string
        let memSpaceStr = this.intArrayToString(memSpace, memSpace.length);
        let finalMemSpaceStr = this.intArrayToString(finalMemSpace, finalMemSpace.length);
        let transferEntityId = null;

        try {
            let sql = "INSERT INTO transfer_entity (best_set_num, inx, entity_number, breed_method,";
            sql += "birth_time, birth_date_time, creation_cycle, round_num, score, reg_a, reg_b, reg_c, ";
            sql += "reg_cf, reg_zf, reg_sp, reg_ip, reg_ic,";
            sql += "mem_space, final_mem_space) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
            [results] = await dbConnection.execute(sql, [bestSetNum, index, entityNumber, 
                breedMethod, birthTime, birthDateTime, birthCycle, roundNum, score, registers.A, 
                registers.B, registers.C, registers.CF,
                registers.ZF, registers.SP, registers.IP, registers.IC, memSpaceStr, finalMemSpaceStr]);
            transferEntityId = results.insertId;
        }
        catch (error) {
            console.log("saveTransferEntity: problem inserting transfer entity", bestSetNum, index);
            throw error;
        }

        // Save the transfer entity output blocks
        await this.saveTransferEntityOutputs(dbConnection, transferEntityId, bestSetNum, index, oldValuesOut);

        // Save the transfer entity input blocks
        await this.saveTransferEntityInputs(dbConnection, transferEntityId, bestSetNum, index, oldParams);

        await dbConnection.end();
    },

    async saveTransferEntityOutputs(dbConnection, transferEntityId, bestSetNum, index, oldValuesOut) {
        let inx = 0;
        for (let output of oldValuesOut) {
            let outputStr = this.intArrayToString(output);
            try {
                sql = "INSERT INTO transfer_entity_output (transfer_entity_id, best_set_num, best_set_inx, ";
                sql += "inx, output_block) VALUES (?, ?, ?, ?, ?)";
                [results] = await dbConnection.execute(sql, [transferEntityId, bestSetNum, index, inx, outputStr]);
            }
            catch (error) {
                console.log("saveTransferEntityOutputs: Problem saving output block - ", bestSetNum, index, inx);
                throw error;
            }
            ++inx;
        }
    },

    async saveTransferEntityInputs(dbConnection, transferEntityId, bestSetNum, index, oldParams) {
        let inx = 0;
        for (let input of oldParams) {
            let inputStr = this.intArrayToString(input);
            try {
                sql = "INSERT INTO transfer_entity_input (transfer_entity_id, best_set_num, best_set_inx, ";
                sql += "inx, input_block) VALUES (?, ?, ?, ?, ?)";
                [results] = await dbConnection.execute(sql, [transferEntityId, bestSetNum, index, inx, inputStr]);
            }
            catch (error) {
                console.log("saveTransferEntityOutputs: Problem saving output block - ", bestSetNum, index, inx);
                throw error;
            }
            ++inx;
        }
    },

    async fetchTransferEntities(bestSetNum) {
        const dbConnection = await dbConn.openConnection();
        if (dbConnection === null) {
            console.log ("Could not open db connection");
            return;
        }

        sql = `SELECT * FROM transfer_entity WHERE best_set_num = ${bestSetNum} ORDER BY inx`;
        try {
            [results] = await dbConnection.query(sql);
        }
        catch (error) {
            console.log("fetchTransferEntities: problem using select statement");
            throw error;
        }

        await dbConnection.end();
        return results;

    },

    async fetchTransferEntityOutputs(bestSetNum, index) {
        const dbConnection = await dbConn.openConnection();
        if (dbConnection === null) {
            console.log ("Could not open db connection");
            return;
        }

        let outputs = [];
        let sql = `SELECT * FROM transfer_entity_output WHERE best_set_num = ${bestSetNum} AND best_set_inx = ${index}`;
        sql += " ORDER BY inx";
        try {
            [results] = await dbConnection.query(sql);
        }
        catch (error) {
            console.log("fetchTransferEntityOutputs: Could not collect transfer entity outputs", bestSetNum, index);
            throw error;
        }

        for (let row of results) {
            let outputStr = row.output_block;
            let outputData = this.stringToIntArray(outputStr);
            outputs.push(outputData); 
        }

        await dbConnection.end();

        return outputs;
    },

    async fetchTransferEntityInputs(bestSetNum, index) {
        const dbConnection = await dbConn.openConnection();
        if (dbConnection === null) {
            console.log ("Could not open db connection");
            return;
        }

        let inputs = [];
        let sql = `SELECT * FROM transfer_entity_input WHERE best_set_num = ${bestSetNum} AND best_set_inx = ${index}`;
        sql += " ORDER BY inx";
        try {
            [results] = await dbConnection.query(sql);
        }
        catch (error) {
            console.log("fetchTransferEntityInputs: Could not collect transfer entity inputs", bestSetNum, index);
            throw error;
        }

        for (let row of results) {
            let inputStr = row.input_block;
            let inputData = this.stringToIntArray(inputStr);
            inputs.push(inputData); 
        }

        await dbConnection.end();

        return inputs;
    },

    async fetchTransferBestEntitySet(setNum) {
        const dbConnection = await dbConn.openConnection();
        if (dbConnection === null) {
            console.log ("Could not open db connection");
            return;
        }

        let sql = `SELECT * FROM transfer_entity WHERE best_set_num = ${setNum} ORDER BY inx`;
        try {
            [results] = await dbConnection.query(sql);
        }
        catch (error) {
            console.log('fetchTransferBestEntitySet: problem with select');
            throw error;
        }

        await dbConnection.end();
        return results;
    },

    async saveTransferEntitySet(setNum, set) {
        const dbConnection = await dbConn.openConnection();
        if (dbConnection === null) {
            console.log ("Could not open db connection");
            return;
        }

        // Clear the transfer entity outputs for this set
        // let sql = `DELETE FROM transfer_entity_output WHERE best_set_num = ${setNum}`;
        // [results] = await dbConnection.query(sql);

        // Clear the transfer entity inputs for this set
        // sql = `DELETE FROM transfer_entity_input WHERE best_set_num = ${setNum}`;
        // [results] = await dbConnection.query(sql);

        // Clear the transfer entities for this best set
        sql = `DELETE FROM transfer_entity WHERE best_set_num = ${setNum}`;
        [results] = await dbConnection.query(sql);

        let index = 0;
        for (let entity of set) {
            let score = entity.score;
            let entityNumber = entity.entityNumber;
            let birthTime = entity.birthTime;
            let birthDateTime = entity.birthDateTime;
            let creationCycle = entity.birthCycle;
            let roundNum = entity.roundNum;
            let breedMethod = entity.breedMethod;
            let registers = entity.registers;
            let memSpace = entity.initialMemSpace;
            let memStr = this.intArrayToString(memSpace, memSpace.length);
            let finalMemSpace = entity.memSpace;
            let finalMemStr = this.intArrayToString(finalMemSpace, finalMemSpace.length);
            let transferEntityId = null;
            try {
                sql = "INSERT INTO transfer_entity (best_set_num, inx, score, entity_number,";
                sql += "breed_method, birth_time, birth_date_time, creation_cycle, round_num, ";
                sql += "reg_a, reg_b, reg_c, reg_cf, reg_zf, reg_sp, reg_ip, reg_ic, ";
                sql += "mem_space, final_mem_space) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
                [results] = await dbConnection.execute(sql, [setNum, index, score, 
                    entityNumber, breedMethod, birthTime, birthDateTime, creationCycle, roundNum,
                    registers.A, registers.B, registers.C, registers.CF, registers.ZF, 
                    registers.SP, registers.IP, registers.IC, memStr, finalMemStr]);
                transferEntityId = results.insertId;
            }
            catch (error) {
                console.log('saveTransferEntitySet: Problem with insert');
                throw error;
            }

            // Save the entity output blocks
            // await this.saveTransferEntityOutputs(dbConnection, transferEntityId, setNum, index, entity.oldValuesOut);

            // Save the transfer entity input blocks
            // await this.saveTransferEntityInputs(dbConnection, transferEntityId, setNum, index, entity.oldParams);

            ++index;
        }

        await dbConnection.end();
    },

    async saveBatchData(batchNum, batchData) {
        const dbConnection = await dbConn.openConnection();
        if (dbConnection === null) {
            console.log ("Could not open db connection");
            return;
        }

        let sql = `DELETE FROM batch_data WHERE batch_num = ${batchNum}`;
        [results] = await dbConnection.query(sql);

        try {
            sql = "INSERT INTO batch_data (batch_num, monoclonal_ins_count, monoclonal_byte_count, interbreed_count,";
            sql += "interbreed2_count, interbreed_flagged_count, interbreed_ins_merge_count, self_breed_count,";
            sql += "seed_rule_breed_count, random_count, cross_set_count) ";
            sql += "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
            [results] = await dbConnection.execute(sql, [batchNum, batchData.monoclonalInsCount, 
                batchData.monoclonalByteCount, batchData.interbreedCount, batchData.interbreed2Count,
                batchData.interbreedFlaggedCount, batchData.interbreedInsMergeCount,
                batchData.selfBreedCount, batchData.seedRuleBreedCount, batchData.randomCount, 
                batchData.crossSetCount
            ]);
        }
        catch (error) {
            console.log("saveBatchData: Problem with insert operation:", batchNum, batchData);
            throw error;
        }

        await dbConnection.end();
    },

    async fetchBatchData(batchNum) {
        const dbConnection = await dbConn.openConnection();
        if (dbConnection === null) {
            console.log ("Could not open db connection");
            return;
        }

        let sql = `SELECT * FROM batch_data WHERE batch_num = ${batchNum}`;
        try {
            [results] = await dbConnection.query(sql);
        }
        catch (error) {
            console.log("fetchBatchData: Problem with select:", batchNum);
            throw error;
        }

        await dbConnection.end();
        return results;

    },

    stringToIntArray(str) {
        let a = [];
        for (let i = 0; i < str.length; i++) {
            a.push(str.charCodeAt(i));
        }
        return a;
    }


}

module.exports = dbTransactions;