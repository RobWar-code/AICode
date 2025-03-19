const mysql = require('mysql2/promise');
const path = require('node:path');
const dbConn = require(path.join(__dirname, 'dbConn.js'));
const rulesets = require(path.join(__dirname, '../processes/rulesets.js'));

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

        if (resultOK) {
            // Save the seed rules
            resultOK = await this.saveSeedRules(sessionId, dbConnection);
        }

        await this.deleteOtherRecords(dbConnection, sessionId);

        if (resultOK) {
            resultOK = await this.saveRules(dbConnection);
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
                `SELECT * FROM seed_rule ORDER BY rule_sequence_num`
            );
        }
        catch (error) {
            console.error("Could not read from seed_rule table.", error.message);
        }
        await dbConnection.end();

        // Rules
        await this.loadRules();

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
        sql = "DELETE FROM rule";
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

    stringToIntArray(str) {
        let a = [];
        for (let i = 0; i < str.length; i++) {
            a.push(str.charCodeAt(i));
        }
        return a;
    }


}

module.exports = dbTransactions;