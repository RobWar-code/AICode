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
            let sql = "INSERT INTO session (num_rule_loops, cycle_counter, num_rounds, elapsed_time, ";
            sql +=  "entity_number, rule_sequence_num) "; 
            sql += "VALUES (?, ?, ?, ?, ?, ?)";
            const [results] = await dbConnection.execute(sql, [rulesets.numRuleLoops, program.cycleCounter, 
                program.numRounds, elapsedTime, program.entityNumber, ruleSequenceNum]);
            console.error("session saved -id", results.insertId);
            sessionId = results.insertId;
        }
        catch (err) {
            console.error("saveSession: problem saving session details");
            throw err;
        }
    
        // Save the entities
        let resultOK = await this.saveEntities(program, sessionId, dbConnection);
        if (resultOK) console.log("Saved Entities", resultOK);

        if (resultOK) {
            // Save the seed rules
            resultOK = await this.saveSeedRules(dbConnection);
        }
        if (resultOK) console.log("Saved Seed Rules", resultOK);

        if (resultOK) {
            // Save the weighting table
            resultOK = await this.saveWeightingTable(dbConnection);
        }
        if (resultOK) console.log("Saved weightingTable");
        else console.log("Problem with save weighting table");

        if (resultOK) {
            // Save sub-opt rules
            resultOK = await this.saveSubOptRules(sessionId, dbConnection);
        }
        if (resultOK) console.log("Saved SubOptRules", resultOK);

        if (resultOK) {
            resultOK = await this.saveBestsStore(sessionId, dbConnection);
        }
        if (resultOK) console.log("saved BestsStore");
    
        await this.deleteOtherRecords(dbConnection, sessionId);

        if (resultOK) {
            console.log("Saving rule rounds");
            resultOK = await this.saveRules(dbConnection);
        }
        if (resultOK) console.log("Saved ruleRounds");

        if (resultOK) {
            resultOK = await this.saveFragments(dbConnection);
        }
        if (resultOK) console.log("Saved Fragments");

        if (resultOK) {
            resultOK = await this.saveSeedbedData(program.seedbedData, dbConnection);
        }
        if (resultOK) console.log("saved SeedBedData");

        if (resultOK) {
            resultOK = await this.saveTemplateSeedbedLog(program.templateSeedbedLog, dbConnection);
        }
        if (resultOK) console.log("Saved TemplateSeedBedLog");

        if (resultOK) {
            resultOK = await this.saveSeedRuleSeedbedLog(program.seedRuleSeedbedLog, dbConnection);
        }
        if (resultOK) console.log("Saved SeedRuleSeedbedLog");
        else console.log("Problem saving SeedRuleSeedbedLog");

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
                // Get Initial Params
                let initialParamsList = [];
                for (let i = 0; i <= rulesets.numAutoParamSets; i++) {
                    let initialParams = "";
                    if (i < entity.initialParamsList.length) {
                        initialParams = this.intArrayToString(entity.initialParamsList[i], entity.initialParamsList[i].length);
                    }
                    initialParamsList.push(initialParams);
                }

                let initialMemSpace = this.intArrayToString(entity.initialMemSpace, 256);

                // Save the entity data
                try {
                    let sql = "INSERT INTO entity (";
                    sql += "session_id, best_set_num, entity_number, birth_time, birth_date_time, birth_cycle, ";
                    sql += "round_num, breed_method, score, "
                    sql += "initial_params_1, initial_params_2, initial_params_3, initial_params_4, initial_mem_space) ";
                    sql += "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
                    const [results] = await dbConnection.execute(sql, [
                        sessionId, i, entityNum, birthTime, birthDateTime, birthCycle,
                        roundNum, breedMethod, score,
                        initialParamsList[0], initialParamsList[1], initialParamsList[2], initialParamsList[3],
                        initialMemSpace
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
            console.error("Entities Saved");
            return true;
        }
        else {
            // Best Sets may have been cleared
            return true;
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
        } catch (err) {
            console.error('Error during DELETE entities operation:', err.message);
        }

        // Delete Sessions
        try {
            const sql = 'DELETE FROM session WHERE id != ?';
            const [results] = await dbConnection.execute(sql, [sessionId]);
        } catch (err) {
            console.error('Error during DELETE sessions operation:', err.message);
        }
    },

    async loadSession(mainWindow, program) {
        const dbConnection = await dbConn.openConnection();
        if (dbConnection === null) {
            console.error("Could not open db connection");
            return;
        }

        let sessions;
        // Get most recent session
        try {
            [sessions] = await dbConnection.execute(
                'SELECT * FROM session ORDER BY id DESC LIMIT 1'
            );
            console.error("Loaded Session");
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

        // weighting table
        await this.loadWeightingTable(dbConnection);

        // Get seed rule memspace
        let subOptRules;
        try {
            [subOptRules] = await dbConnection.execute(
                `SELECT * FROM sub_opt_rule ORDER BY rule_sequence_num`
            );
        }
        catch (error) {
            console.error("Could not read from sub_opt_rule table.", error.message);
        }

        let bestsStore;
        try {
            [bestsStore] = await dbConnection.execute(
                `SELECT * FROM bests_store ORDER BY rule_sequence_num`
            );
        }
        catch (error) {
            console.error("Could not read from bests_store table.", error.message);
        }

        // Seedbed Data
        await this.loadSeedbedData(program, dbConnection);

        // Template Seedbed Log
        await this.loadTemplateSeedbedLog(program, dbConnection);

        // Seed Rule Seedbed Log
        await this.loadSeedRuleSeedbedLog(program, dbConnection);

        await dbConnection.end();

        // Rules
        await this.loadRules();

        // Seed Rule Fragments
        await this.loadFragments();

        program.loadRestart(sessions[0], entities, seedRules, subOptRules, bestsStore);

        mainWindow.webContents.send("loadDone", 0);
    },

    async fetchSession() {
        const dbConnection = await dbConn.openConnection();
        if (dbConnection === null) {
            console.error("Could not open db connection");
            return;
        }

        let sessions;
        // Get most recent session
        try {
            [sessions] = await dbConnection.execute(
                'SELECT * FROM session ORDER BY id DESC LIMIT 1'
            );
            console.error("Loaded Session");
        } catch (err) {
            console.error('loadSession: Error retrieving most recent record:', err.message);
            throw err;
        }
        await dbConnection.end();
        if (sessions.length === 0) return null;
        return sessions[0];
    },

    async saveSeedRules(dbConnection) {
        let dbConnOpened = false;
        if (dbConnection === null) {
            dbConnection = await dbConn.openConnection();
            dbConnOpened = true;
        }

        let seedRules = rulesets.seedRuleMemSpaces;
        if (seedRules.length === 0) return true;

        let ruleSequenceNum = 0;
        for (let seedRuleItem of seedRules) {
            let ruleId = seedRuleItem.ruleId;
            let seedRuleMemSpace = seedRuleItem.memSpace;
            let result = await this.saveSeedRule(dbConnection, ruleId, ruleSequenceNum, seedRuleMemSpace);
            if (!result) return false;
            ++ruleSequenceNum;
        }

        console.error("saved seed rules");

        if (dbConnOpened) {
            dbConnection.end();
        }

        return true;

    },

    async saveWeightingTable(dbConnection) {
        let dbConnOpened = false;
        if (dbConnection === null) {
            dbConnection = await dbConn.openConnection();
            dbConnOpened = true;
        }

        // Clear the previous entries
        let sql = "DELETE FROM weighting_link";
        await dbConnection.query(sql);

        sql = "DELETE FROM weighting_table";
        await dbConnection.query(sql);

        if (rulesets.weightingTable.length === 0) return true;
        
        // Loop re-create the table
        let ok = false;
        let index = 0;
        for (let codePositionItem of rulesets.weightingTable) {
            let codePosition = index;

            // totalCodeOccurrences
            let totalOccurrences = codePositionItem.totalOccurrences;
            let occurrencesArray = [];
            for (let occurrenceItem of codePositionItem.codeOccurrences) {
                occurrencesArray.push(occurrenceItem.occurrences);
            }
            let occurrences = this.intArrayToString(occurrencesArray, 256);
            let sql = "INSERT INTO weighting_table (code_position, total_occurrences, occurrences) VALUES (?, ?, ?)";
            try {
                [results] = await dbConnection.execute(sql, [codePosition, totalOccurrences, occurrences]);
                ok = true;
            }
            catch(err) {
                console.error("saveWeightingTable: Problem inserting into weighting_table");
                throw err;
                break;
            }

            // Save the weighting link data
            if (ok) {
                ok = await this.saveWeightingLinks(index, codePositionItem, dbConnection);
            }

            if (!ok) break;
            ++index;
        }


        if (dbConnOpened) {
            dbConnection.end();
        }

        return ok;
    },

    async saveWeightingLinks(codePosition, codePositionItem, dbConnection) {
        let codeOccurrences = codePositionItem.codeOccurences;
        let code = 0;
        let ok = true;
        for (let codeOccurrence of codeOccurrences) {
            if (codeOccurrence.occurrences > 0) { 
                for (let link of codeOccurrences.links) {
                    try {
                        let sql = "INSERT INTO weighting_link (code_position, code, link_code, occurrences) VALUES (?, ?, ?, ?)";
                        [results] = dbConnection.execute(sql, [codePosition, code, link.code, link.occurrences]);
                    }
                    catch (error) {
                        console.error("saveWeightingLinks: problem inserting code link");
                        ok = false;
                        throw error;
                        break;
                    }
                }
            }
            if (!ok) break;
            ++code;
        } 

        return ok;
    },

    async loadWeightingTable(dbConnection) {
        let dbConnOpened = false;
        if (dbConnection === null) {
            dbConnection = await dbConn.openConnection();
            dbConnOpened = true;
        }

        rulesets.weightingTable = [];
        let ok = false;
        // Fetch the totals 
        let sql = "SELECT * FROM weighting_table ORDER BY code_position";
        try {
            [results] = await dbConnection.query(sql);
            ok = true;
        }
        catch (err) {
            console.error("loadWeightingTable: problem loading totals");
            throw err;
        }

        if (ok && results.length > 0) {
            let codePosition = 0;
            for (let row of results) {
                let weightRowItem = {};
                weightRowItem.totalOccurrences = row.total_occurrences;
                weightRowItem.codeOccurrences = [];
                // Do occurrences
                let codeOccurrences = this.stringToIntArray(row.occurrences);
                let code = 0;
                for (let occurrences of codeOccurrences) {
                    let occurrenceItem = {occurrences: occurrences, links: [], linksTotal: 0};
                    // Get Links
                    try {
                        sql = `SELECT * FROM weighting_link WHERE code_position = ${codePosition} AND code = ${code} `;
                        sql += `ORDER BY code_position, code`;
                        let [linkResults] = dbConnection.execute(sql);
                        let links = [];
                        for (let item of linkResults) {
                            let linkItem = {};
                            occurrenceItem.linksTotal += item.link_occurrences;
                            linkItem.code = linkResults.link_code;
                            linkItem.occurrences = item.link_occurrences;
                            links.push(linkItem);
                        }
                        occurrenceItem.links = links;
                        weightRowItem.codeOccurrences.push(occurrenceItem);
                    }
                    catch(error) {
                        console.error("loadWeightingTable: Problem fetching link - codePosition, code: ", codePosition, code);
                        ok = false;
                        throw error;
                        break;
                    }
                    ++code;
                }
                rulesets.weightingTable.push(weightRowItem);
                ++codePosition;
            }
        }

        if (dbConnOpened) {
            dbConnection.end();
        }

        return ok;
    },

    async saveSubOptRules(sessionId, dbConnection) {

        let subOptRules = rulesets.subOptRuleMemSpaces;
        if (subOptRules.length === 0) return true;

        let ruleSequenceNum = 0;
        for (let subOptRuleItem of subOptRules) {
            let ruleId = subOptRuleItem.ruleId;
            let subOptRuleMemSpace = subOptRuleItem.memSpace;
            let result = await this.saveSubOptRule(dbConnection, sessionId, ruleId, ruleSequenceNum, subOptRuleMemSpace);
            if (!result) return false;
            ++ruleSequenceNum;
        }

        console.error("saved sub-opt rules");

        return true;

    },

    async saveSeedRule(dbConnection, ruleId, ruleSequenceNum, seedRuleMemSpace) {
        // Delete any existing record for this rule sequence number
        sql = `DELETE FROM seed_rule WHERE rule_id = ${ruleId}`;
        await dbConnection.query(sql);

        let memSpaceStr = this.intArrayToString(seedRuleMemSpace, seedRuleMemSpace.length);
        try {
            sql = "INSERT INTO seed_rule (rule_id, rule_sequence_num, seed_rule_mem_space) VALUES (?, ?, ?)";
            const [results] = await dbConnection.execute(sql, [ruleId, ruleSequenceNum, memSpaceStr]);
            return true;
        }
        catch (error) {
            console.error("Failed to insert seed_rule", error.message);
            throw error;
        }
    },

    async saveSubOptRule(dbConnection, sessionId, ruleId, ruleSequenceNum, subOptRuleMemSpace) {
        // Delete any existing record for this rule sequence number
        sql = `DELETE FROM sub_opt_rule WHERE rule_id = ${ruleId}`;
        await dbConnection.query(sql);

        let memSpaceStr = this.intArrayToString(subOptRuleMemSpace, subOptRuleMemSpace.length);
        try {
            sql = "INSERT INTO sub_opt_rule (session_id, rule_id, rule_sequence_num, sub_opt_rule_mem_space) VALUES (?, ?, ?, ?)";
            const [results] = await dbConnection.execute(sql, [sessionId, ruleId, ruleSequenceNum, memSpaceStr]);
            return true;
        }
        catch (error) {
            console.error("Failed to insert sub_opt_rule", error.message);
            throw error;
        }
    },

    async saveBestsStore(sessionId, dbConnection) {

        let bestsStore = rulesets.bestsStore;
        if (bestsStore.length === 0) return true;

        let ruleSequenceNum = 0;
        for (let bestsStoreItem of bestsStore) {
            let ruleId = bestsStoreItem.ruleId;
            let bestsStoreMemSpace = bestsStoreItem.memSpace;
            let result = await this.saveBestsStoreItem(dbConnection, sessionId, ruleId, 
                ruleSequenceNum, bestsStoreMemSpace);
            if (!result) return false;
            ++ruleSequenceNum;
        }

        console.error("saved bestsStore rules");

        return true;

    },

    async saveBestsStoreItem(dbConnection, sessionId, ruleId, ruleSequenceNum, bestsStoreMemSpace) {
        // Delete any existing record for this rule sequence number
        sql = `DELETE FROM bests_store WHERE rule_id = ${ruleId}`;
        await dbConnection.query(sql);

        let memSpaceStr = this.intArrayToString(bestsStoreMemSpace, bestsStoreMemSpace.length);
        try {
            sql = "INSERT INTO bests_store (rule_id, rule_sequence_num, best_entity_mem_space) VALUES (?, ?, ?)";
            const [results] = await dbConnection.execute(sql, [ruleId, ruleSequenceNum, memSpaceStr]);
            return true;
        }
        catch (error) {
            console.error("Failed to insert bestsStore item", error.message);
            throw error;
        }
    },

    async saveRules(dbConnection) {
        let sql = "DELETE FROM rule";
        await dbConnection.query(sql);

        for (let i = 0; i < rulesets.ruleRounds.length; i++) {
            try {
                sql = "INSERT INTO rule (rule_id, rule_num, start_round, completion_round, rule_loop_end, completed) ";
                sql += "VALUES (?, ?, ?, ?, ?, ?)";
                const [results] = await dbConnection.execute(sql, [rulesets.ruleRounds[i].ruleId, i, 
                    rulesets.ruleRounds[i].start, 
                    rulesets.ruleRounds[i].end, rulesets.ruleRounds[i].ruleLoopEnd,
                    rulesets.ruleRounds[i].completed]);
            }
            catch (error) {
                console.error("saveRules: Could not insert ruleCompletionRound[]:", i);
                throw error.message;
            }
        }

        console.log("Rule Rounds Saved");
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
                if (frag.length >= 127) break;
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

        console.error("Saved Seed Rule Fragments");
        return true;
    },

    async saveSeedbedData(seedbedData, dbConnection){
        let dbConnOpened = false;
        if (dbConnection === null) {
            dbConnection = await dbConn.openConnection();
            dbConnOpened = true;
        }

        let resultOK = false;
        // Clear Existing Data
        let sql;
        sql = "DELETE FROM seedbed_data";
        await dbConnection.query(sql);

        // Insert each row from the seedbedData
        for (let batchNum = 0; batchNum < seedbedData.length; batchNum++) {
            let item = seedbedData[batchNum];
            // Debug
            if (typeof item === 'undefined') {
                console.log("saveSeedbedData: item undefined", batchNum, seedbedData.length);
                throw "program error exit"
            }
            sql = "INSERT INTO seedbed_data (seed_batch_num, type, seed_index, start_round,";
            sql += "promoted_round) VALUES (?, ?, ?, ?, ?)";
            try {
                await dbConnection.execute(sql, [batchNum, item.seedType, item.seedIndex, 
                    item.startRound, item.promotedRound]);
                resultOK = true;
            }
            catch (error) {
                console.error("saveSeedbedData: problem saving data");
                throw error;
            }
        }

        if (dbConnOpened) {
            await dbConnection.end();
        }

        return resultOK;
    },

    async loadSeedbedData(program, dbConnection) {
        let sql;
        sql = "SELECT * FROM seedbed_data";
        try {
            const [results] = await dbConnection.query(sql);
            let numItems = results.length;
            program.seedbedData = new Array(numItems).fill({});
            for (let row of results) {
                let index = row.seed_batch_num;
                program.seedbedData[index].seedType = row.type;
                program.seedbedData[index].seedIndex = row.seed_index;
                program.seedbedData[index].startRound = row.start_round;
                program.seedbedData[index].promotedRound = row.promoted_round;
            }
        }
        catch (error) {
            console.error("loadSeedbedData: problem loading seedbed data");
            throw error;
        }
    },

    async fetchSeedbedData() {
        let dbConnection = await dbConn.openConnection();

        let seedbedData;
        let sql;
        sql = "SELECT * FROM seedbed_data";
        try {
            const [results] = await dbConnection.query(sql);
            let numItems = results.length;
            seedbedData = new Array(numItems).fill({});
            for (let row of results) {
                let index = row.seed_batch_num;
                seedbedData[index].seedType = row.type;
                seedbedData[index].seedIndex = row.seed_index;
                seedbedData[index].startRound = row.start_round;
                seedbedData[index].promotedRound = row.promoted_round;
            }
        }
        catch (error) {
            console.error("loadSeedbedData: problem loading seedbed data");
            throw error;
        }

        await dbConnection.end();
        return seedbedData;
    },

    async loadTemplateSeedbedLog(program, dbConnection) {
        let sql;
        sql = "SELECT * FROM template_seedbed_log";
        try {
            const [results] = await dbConnection.query(sql);
            let numItems = results.length;
            program.templateSeedbedLog = new Array(numItems).fill({});
            for (let row of results) {
                let index = row.template_index;
                program.templateSeedbedLog[index].numAttempts = row.num_attempts;
                program.templateSeedbedLog[index].numFailedAttempts = row.failed_attempts;
                program.templateSeedbedLog[index].numSuccessfulAttempts = row.successful_attempts;
                program.templateSeedbedLog[index].current = row.current;
            }
        }
        catch (error) {
            console.error("loadTemplateSeedbedLog: problem loading data");
            throw error;
        }
    },

    async fetchTemplateSeedbedLog() {
        let dbConnection = await dbConn.openConnection();

        let templateSeedbedLog;
        let sql;
        sql = "SELECT * FROM template_seedbed_log";
        try {
            const [results] = await dbConnection.query(sql);
            let numItems = results.length;
            templateSeedbedLog = new Array(numItems).fill({});
            for (let row of results) {
                let index = row.template_index;
                templateSeedbedLog[index].numAttempts = results.num_attempts;
                templateSeedbedLog[index].numFailedAttempts = results.failed_attempts;
                templateSeedbedLog[index].numSuccessfulAttempts = results.successful_attempts;
                templateSeedbedLog[index].current = results.current;
            }
        }
        catch (error) {
            console.error("fetchTemplateSeedbedLog: problem loading data");
            throw error;
        }

        await dbConnection.end();
        return templateSeedbedLog;
    },

    async loadSeedRuleSeedbedLog(program, dbConnection) {
        let sql;
        sql = "SELECT * FROM seed_rule_seedbed_log";
        try {
            const [results] = await dbConnection.query(sql);
            let numItems = results.length;
            program.seedRuleSeedbedLog = new Array(numItems).fill({});
            for (let row of results) {
                let index = row.seed_rule_index;
                program.seedRuleSeedbedLog[index].numAttempts = row.num_attempts;
                program.seedRuleSeedbedLog[index].numFailedAttempts = row.failed_attempts;
                program.seedRuleSeedbedLog[index].numSuccessfulAttempts = row.successful_attempts;
                program.seedRuleSeedbedLog[index].current = row.current;
            }
        }
        catch (error) {
            console.error("loadSeedRuleSeedbedLog: problem loading data");
            throw error;
        }
    },

    async fetchSeedRuleSeedbedLog() {
        let dbConnection = await dbConn.openConnection();

        let seedRuleSeedbedLog;
        let sql;
        sql = "SELECT * FROM seed_rule_seedbed_log";
        try {
            const [results] = await dbConnection.query(sql);
            let numItems = results.length;
            seedRuleSeedbedLog = new Array(numItems).fill({});
            for (let row of results) {
                let index = row.seed_rule_index;
                seedRuleSeedbedLog[index].numAttempts = results.num_attempts;
                seedRuleSeedbedLog[index].numFailedAttempts = results.failed_attempts;
                seedRuleSeedbedLog[index].numSuccessfulAttempts = results.successful_attempts;
                seedRuleSeedbedLog[index].current = results.current;
            }
        }
        catch (error) {
            console.error("fetchSeedRuleSeedbedLog: problem loading data");
            throw error;
        }
        await dbConnection.end();
        return seedRuleSeedbedLog;
    },

    async saveTemplateSeedbedLog(log, dbConnection) {
        if (log.length === 0) return true;

        let dbConnOpened = false;
        if (dbConnection === null) {
            dbConnection = await dbConn.openConnection();
            dbConnOpened = true;
        }

        let resultOK = false;

        // Clear the existing data
        let sql;
        sql = "DELETE FROM template_seedbed_log";
        await dbConnection.query(sql);

        // Insert each row from the log
        for (let itemNum = 0; itemNum < log.length; itemNum++) {
            let item = log[itemNum];
            sql = "INSERT INTO template_seedbed_log (template_index, num_attempts, failed_attempts, ";
            sql += "successful_attempts, current) VALUES (?, ?, ?, ?, ?)";
            try {
                await dbConnection.execute(sql, [itemNum, item.numAttempts, item.numFailedAttempts, 
                    item.numSuccessfulAttempts, item.current]);
                resultOK = true;
            }
            catch (error) {
                console.error("saveTemplateSeedbedLog: problem saving data");
                throw error;
            }
        }

        if (dbConnOpened) {
            await dbConnection.end();
        }

        return resultOK;
    },

    async saveSeedRuleSeedbedLog(log, dbConnection) {
        if (log.length === 0) return true;

        let dbConnOpened = false;
        if (dbConnection === null) {
            dbConnection = await dbConn.openConnection();
            dbConnOpened = true;
        }

        let resultOK = false;

        // Clear the existing data
        let sql;
        sql = "DELETE FROM seed_rule_seedbed_log";
        await dbConnection.query(sql);

        // Insert each row from the log
        for (let itemNum = 0; itemNum < log.length; itemNum++) {
            let item = log[itemNum];
            sql = "INSERT INTO seed_rule_seedbed_log (seed_rule_index, num_attempts, failed_attempts, ";
            sql += "successful_attempts, current) VALUES (?, ?, ?, ?, ?)";
            try {
                await dbConnection.execute(sql, [itemNum, item.numAttempts, item.numFailedAttempts, 
                    item.numSuccessfulAttempts, item.current]);
                resultOK = true;
            }
            catch (error) {
                console.error("saveSeedRuleSeedbedLog: problem saving data");
                throw error;
            }
        }

        if (dbConnOpened) {
            await dbConnection.end();
        }
        
        return resultOK;
    },

    async fetchSeedRuleList() {
        const dbConnection = await dbConn.openConnection();
        if (dbConnection === null) {
            console.error ("Could not open db connection");
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
            console.error ("Could not open db connection");
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
            console.error ("Could not open db connection");
            return;
        }

        try {
            sql = "SELECT rule_id, seed_rule_mem_space FROM seed_rule";
            [results] = await dbConnection.query(sql);
        }
        catch (error) {
            console.error("fetchRuleSeeds: Problem with select");
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

    async fetchBestsStore() {
        const dbConnection = await dbConn.openConnection();
        if (dbConnection === null) {
            console.error ("Could not open db connection");
            return;
        }

        try {
            sql = "SELECT rule_id, best_entity_mem_space FROM bests_store";
            [results] = await dbConnection.query(sql);
        }
        catch (error) {
            console.error("fetchBestsStore: Problem with select");
            throw error;
        }

        await dbConnection.end();
        
        rulesets.bestsStore = [];
        for (let item of results) {
            let entry = {};
            entry.ruleId = item.rule_id;
            entry.memSpace = this.stringToIntArray(item.best_entity_mem_space);
            rulesets.bestsStore.push(entry);
        }
    },

    async loadRules() {
        const dbConnection = await dbConn.openConnection();
        if (dbConnection === null) {
            console.error ("Could not open db connection");
            return;
        }

        let sql = "SELECT rule_id, rule_num, start_round, completion_round, rule_loop_end, completed FROM rule";
        try {
            [results] = await dbConnection.query(sql);
            let ruleRounds = [];
            for (let item of results) {
                let rule = {};
                rule.ruleId = item.rule_id;
                rule.start = item.start_round;
                rule.end = item.completion_round;
                rule.ruleLoopEnd = item.rule_loop_end;
                rule.completed = item.completed;
                ruleRounds.push(rule);
            }
            // Merge the results with the existing ruleRounds list
            for (let item of ruleRounds) {
                let id = item.ruleId;
                let found = false;
                let index = 0;
                for (let ruleItem of rulesets.ruleRounds) {
                    if (ruleItem.ruleId === id) {
                        found = true;
                        break;
                    }
                    ++index;
                }
                if (found) {
                    rulesets.ruleRounds[index] = item;
                }
            }
        }
        catch (error) {
            console.error("loadRules: Could not load rule data");
            throw error;
        }

        console.log("Loaded Rule Rounds", results.length);
        await dbConnection.end();
    },

    async loadFragments() {
        const dbConnection = await dbConn.openConnection();
        if (dbConnection === null) {
            console.error("Could not open db connection");
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
            console.error("Could not open db connection");
            return;
        }
        let sql;
        try {
            sql = `DELETE FROM transfer_entity_output WHERE best_set_num = ${bestSetNum}`;
            [results] = await dbConnection.query(sql);
        }
        catch (error) {
            console.error("clearTransferEntitySet - problem deleting output", bestSetNum);
            throw error;
        }

        try {
            sql = `DELETE FROM transfer_entity_input WHERE best_set_num = ${bestSetNum}`;
            [results] = await dbConnection.query(sql); 
        }
        catch (error) {
            console.error;("clearTransferEntitySet - problem deleting input", bestSetNum);
            throw error;
        }

        try {
            sql = `DELETE FROM transfer_entity WHERE best_set_num = ${bestSetNum}`;
            [results] = await dbConnection.query(sql);
        }
        catch (error) {
            console.error("clearTransferEntitySet: Problem clearing entity set");
            throw error;
        }

        await dbConnection.end();
    },

    async saveTransferEntity(bestSetNum, index, entityNumber, breedMethod, birthTime, birthDateTime, birthCycle, 
        roundNum, registers, initialParamsList, memSpace, 
        finalMemSpace, oldValuesOut, oldParams, score) {
        const dbConnection = await dbConn.openConnection();
        if (dbConnection === null) {
            console.error("Could not open db connection");
            return;
        }

        // Delete the previous transfer entity output blocks
        try {
            let sql = `DELETE FROM transfer_entity_output WHERE best_set_num = ${bestSetNum} AND best_set_inx = ${index}`;
            [results] = await dbConnection.query(sql);
        }
        catch (error) {
            console.error("saveTransferEntity: Could not delete transfer_entity_output", bestSetNum, index);
            throw error;
        }

        // Delete the previous transfer entity parameter blocks
        try {
            let sql = `DELETE FROM transfer_entity_input WHERE best_set_num = ${bestSetNum} AND best_set_inx = ${index}`;
            [results] = await dbConnection.query(sql);
        }
        catch (error) {
            console.error("saveTransferEntity: Could not delete transfer_entity_input", bestSetNum, index);
            throw error;
        }

        // Delete the previous transfer entity
        try {
            let sql = `DELETE FROM transfer_entity WHERE best_set_num = ${bestSetNum} AND inx = ${index}`;
            [results] = await dbConnection.query(sql);
        }
        catch (error) {
            console.error("saveTransferEntity: problem clearing entity");
            throw error;
        }

        // Save the transfer entity

        // Prepare the initial params
        let prepParams = [];
        for (let i = 0; i < rulesets.numAutoParamSets; i++) {
            let codeStr;
            if (i < initialParamsList.length) {
                codeStr = this.intArrayToString(initialParamsList[i], initialParamsList[i].length);
            }
            else {
                codeStr = "";
            }
            prepParams.push(codeStr);
        }

        // Prepare the memspace string
        let memSpaceStr = this.intArrayToString(memSpace, memSpace.length);
        let finalMemSpaceStr = this.intArrayToString(finalMemSpace, finalMemSpace.length);
        let transferEntityId = null;

        try {
            let sql = "INSERT INTO transfer_entity (best_set_num, inx, entity_number, breed_method,";
            sql += "birth_time, birth_date_time, creation_cycle, round_num, score, reg_a, reg_b, reg_c, ";
            sql += "reg_cf, reg_zf, reg_sp, reg_ip, reg_ic,";
            sql += "initial_params_1, initial_params_2, initial_params_3, initial_params_4, ";
            sql += "mem_space, final_mem_space) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
            [results] = await dbConnection.execute(sql, [bestSetNum, index, entityNumber, 
                breedMethod, birthTime, birthDateTime, birthCycle, roundNum, score, registers.A, 
                registers.B, registers.C, registers.CF,
                registers.ZF, registers.SP, registers.IP, registers.IC,
                prepParams[0], prepParams[1], prepParams[2], prepParams[3], 
                memSpaceStr, finalMemSpaceStr]);
            transferEntityId = results.insertId;
        }
        catch (error) {
            console.error("saveTransferEntity: problem inserting transfer entity", bestSetNum, index);
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
                console.error("saveTransferEntityOutputs: Problem saving output block - ", bestSetNum, index, inx);
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
                console.error("saveTransferEntityOutputs: Problem saving output block - ", bestSetNum, index, inx);
                throw error;
            }
            ++inx;
        }
    },

    async fetchTransferEntities(bestSetNum) {
        const dbConnection = await dbConn.openConnection();
        if (dbConnection === null) {
            console.error("Could not open db connection");
            return;
        }

        sql = `SELECT * FROM transfer_entity WHERE best_set_num = ${bestSetNum} ORDER BY inx`;
        try {
            [results] = await dbConnection.query(sql);
        }
        catch (error) {
            console.error("fetchTransferEntities: problem using select statement");
            throw error;
        }

        await dbConnection.end();
        return results;

    },

    async fetchTransferEntityOutputs(bestSetNum, index) {
        const dbConnection = await dbConn.openConnection();
        if (dbConnection === null) {
            console.error("Could not open db connection");
            return;
        }

        let outputs = [];
        let sql = `SELECT * FROM transfer_entity_output WHERE best_set_num = ${bestSetNum} AND best_set_inx = ${index}`;
        sql += " ORDER BY inx";
        try {
            [results] = await dbConnection.query(sql);
        }
        catch (error) {
            console.error("fetchTransferEntityOutputs: Could not collect transfer entity outputs", bestSetNum, index);
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
            console.error("Could not open db connection");
            return;
        }

        let inputs = [];
        let sql = `SELECT * FROM transfer_entity_input WHERE best_set_num = ${bestSetNum} AND best_set_inx = ${index}`;
        sql += " ORDER BY inx";
        try {
            [results] = await dbConnection.query(sql);
        }
        catch (error) {
            console.error("fetchTransferEntityInputs: Could not collect transfer entity inputs", bestSetNum, index);
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
            console.error("Could not open db connection");
            return;
        }

        let sql = `SELECT * FROM transfer_entity WHERE best_set_num = ${setNum} ORDER BY inx`;
        try {
            [results] = await dbConnection.query(sql);
        }
        catch (error) {
            console.error('fetchTransferBestEntitySet: problem with select');
            throw error;
        }

        await dbConnection.end();
        return results;
    },

    async saveTransferEntitySet(setNum, set) {
        const dbConnection = await dbConn.openConnection();
        if (dbConnection === null) {
            console.error("Could not open db connection");
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
            // Initial Params
            let prepParams = [];
            for (let i = 0; i < rulesets.numAutoParamSets; i++) {
                let codeStr = "";
                if (i < entity.initialParamsList.length) {
                    codeStr = this.intArrayToString(entity.initialParamsList[i], entity.initialParamsList[i].length);
                }
                prepParams.push(codeStr);
            }
            let memSpace = entity.initialMemSpace;
            let memStr = this.intArrayToString(memSpace, memSpace.length);
            let finalMemSpace = entity.memSpace;
            let finalMemStr = this.intArrayToString(finalMemSpace, finalMemSpace.length);
            let transferEntityId = null;
            try {
                sql = "INSERT INTO transfer_entity (best_set_num, inx, score, entity_number,";
                sql += "breed_method, birth_time, birth_date_time, creation_cycle, round_num, ";
                sql += "reg_a, reg_b, reg_c, reg_cf, reg_zf, reg_sp, reg_ip, reg_ic, ";
                sql += "initial_params_1, initial_params_2, initial_params_3, initial_params_4, "
                sql += "mem_space, final_mem_space) VALUES ";
                sql += "(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
                [results] = await dbConnection.execute(sql, [setNum, index, score, 
                    entityNumber, breedMethod, birthTime, birthDateTime, creationCycle, roundNum,
                    registers.A, registers.B, registers.C, registers.CF, registers.ZF, 
                    registers.SP, registers.IP, registers.IC,
                    prepParams[0], prepParams[1], prepParams[2], prepParams[3],
                    memStr, finalMemStr]);
                transferEntityId = results.insertId;
            }
            catch (error) {
                console.error('saveTransferEntitySet: Problem with insert');
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
            console.error("Could not open db connection");
            return;
        }

        let sql = `DELETE FROM batch_data WHERE batch_num = ${batchNum}`;
        [results] = await dbConnection.query(sql);

        try {
            sql = "INSERT INTO batch_data (batch_num, monoclonal_ins_count, monoclonal_byte_count, interbreed_count,";
            sql += "interbreed2_count, interbreed_flagged_count, interbreed_ins_merge_count, ";
            sql += "weighted_monoclonal_byte_count, weighted_random_breed_count, self_breed_count,";
            sql += "bests_store_breed_count, seed_rule_breed_count, seed_template_breed_count, ";
            sql += "random_count, cross_set_count) ";
            sql += "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
            [results] = await dbConnection.execute(sql, [batchNum, batchData.monoclonalInsCount, 
                batchData.monoclonalByteCount, batchData.interbreedCount, batchData.interbreed2Count,
                batchData.interbreedFlaggedCount, batchData.interbreedInsMergeCount,
                batchData.weightedMonoclonalByteCount, batchData.weightedRandomBreedCount,
                batchData.selfBreedCount, batchData.bestsStoreBreedCount, batchData.seedRuleBreedCount, 
                batchData.seedTemplateBreedCount,
                batchData.randomCount, 
                batchData.crossSetCount
            ]);
        }
        catch (error) {
            console.error("saveBatchData: Problem with insert operation:", batchNum, batchData);
            throw error;
        }

        await dbConnection.end();
    },

    async fetchBatchData(batchNum) {
        const dbConnection = await dbConn.openConnection();
        if (dbConnection === null) {
            console.error("Could not open db connection");
            return;
        }

        let sql = `SELECT * FROM batch_data WHERE batch_num = ${batchNum}`;
        try {
            [results] = await dbConnection.query(sql);
        }
        catch (error) {
            console.error("fetchBatchData: Problem with select:", batchNum);
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