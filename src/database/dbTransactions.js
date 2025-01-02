const mysql = require('mysql2/promise');
const path = require('node:path');
const dbConn = require(path.join(__dirname, 'dbConn.js'));

const dbTransactions = {
    async saveSession(mainWindow, program) {

        const dbConnection = await dbConn.openConnection();
        if (dbConnection === null) {
            return false;
        };

        const timeNow = Date.now();
        const elapsedTime = (timeNow - program.startTime) + program.previousElapsedTime;
        let sessionId = null;

        // Insert the program session details
        try {
            let sql = "INSERT INTO session (cycle_counter, elapsed_time, entity_number) VALUES (?, ?, ?)";
            const [results] = await dbConnection.execute(sql, [program.cycleCounter, elapsedTime, program.entityNumber]);
            console.log ("session saved");
            sessionId = results.insertId;
        }
        catch (err) {
            console.error("saveSession: problem saving session details");
            throw err;
        }
    
        // Save the entities
        let resultOK = await this.saveEntities(program, sessionId, dbConnection);

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
                let breedMethod = entity.breedMethod;
                let score = entity.score;
                let initialParams1 = this.intArrayToString(entity.initialParamsList[0], 256);
                let initialParams2 = this.intArrayToString(entity.initialParamsList[1], 256);
                let initialMemSpace = this.intArrayToString(entity.initialMemSpace, 256);

                // Save the entity data
                try {
                    let sql = "INSERT INTO entity (";
                    sql += "session_id, best_set_num, entity_number, birth_time, birth_date_time, birth_cycle, ";
                    sql += "breed_method, score, "
                    sql += "initial_params_1, initial_params_2, initial_mem_space) ";
                    sql += "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
                    const [results] = await dbConnection.execute(sql, [
                        sessionId, i, entityNum, birthTime, birthDateTime, birthCycle,
                        breedMethod, score,
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
        await dbConnection.end();

        program.loadRestart(sessions[0], entities);

        mainWindow.webContents.send("loadDone", 0);
    }

}

module.exports = dbTransactions;