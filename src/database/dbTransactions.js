const mysql = require('mysql2/promise');
const path = require('node:path');
const dbConn = require(path.join(__dirname, 'dbConn.js'));

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
            console.log ("session saved");
            sessionId = results.insertId;
        }
        catch (err) {
            console.error("saveSession: problem saving session details");
            throw err;
        }
    
        // Save the entities
        let resultOK = await this.saveEntities(program, sessionId, dbConnection);

        await this.deleteOtherRecords(dbConnection, sessionId);

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
                    console.error("saveEntity: problem saving entity details");
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
            console.log('loaded entities');
        } catch (err) {
            console.error('Error retrieving most recent record:', err.message);
            throw err;
        }

        // Get seed rule memspace
        let seedRules;
        try {
            [seedRules] = await dbConnection.execute(
                `SELECT * FROM seed_rule`
            );
        }
        catch (error) {
            console.error("Could not read from seed_rule table.", error.message);
        }
        await dbConnection.end();

        program.loadRestart(sessions[0], entities, seedRules);

        mainWindow.webContents.send("loadDone", 0);
    },

    async saveSeedRule(ruleSequenceNum, seedRuleMemSpace) {
        const dbConnection = await dbConn.openConnection();
        if (dbConnection === null) {
            console.log ("Could not open db connection");
            return;
        }

        // Delete any existing record for this rule sequence number
        sql = `DELETE FROM seed_rule WHERE rule_sequence_num = ${ruleSequenceNum}`;
        await dbConnection.query(sql);

        let memSpaceStr = this.intArrayToString(seedRuleMemSpace, seedRuleMemSpace.length);
        try {
            sql = "INSERT INTO seed_rule (rule_sequence_num, seed_rule_mem_space) VALUES (?, ?)";
            const [results] = await dbConnection.execute(sql, [ruleSequenceNum, memSpaceStr]);
        }
        catch (error) {
            console.error("Failed to insert seed_rule", error.message);
            throw error;
        }
    }

}

module.exports = dbTransactions;