const mysql = require('mysql2/promise');
const dbConn = require('./dbConn.js');

createTables();

async function createTables() {
    const connection = await dbConn.openConnection();
    if (connection === null) {
        console.log("createTables: problem with connection")
    }

    let sql = "DROP TABLE session";
    await connection.query(sql);

    sql = "CREATE TABLE session (";
    sql += "id INT AUTO_INCREMENT PRIMARY KEY,";
    sql += "cycle_counter INT,";
    sql += "elapsed_time INT,";
    sql += "entity_number INT";
    sql += ")";
    await connection.query(sql);

    sql = "DROP TABLE entity";
    await connection.query(sql);

    sql = "CREATE TABLE entity (";
    sql += "id INT AUTO_INCREMENT PRIMARY KEY,";
    sql += "session_id INT,";
    sql += "best_set_num INT,";
    sql += "entity_number INT,";
    sql += "birth_time BIGINT,";
    sql += "birth_date_time VARCHAR(256),";
    sql += "birth_cycle INT,";
    sql += "breed_method CHAR(64),";
    sql += "score FLOAT, ";
    sql += "initial_params_1 VARCHAR(256),";
    sql += "initial_params_2 VARCHAR(256),";
    sql += "initial_mem_space VARCHAR(256)";
    sql += ")";
    await connection.query(sql);

    connection.end();
}