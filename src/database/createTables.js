const mysql = require('mysql2/promise');
const dbConn = require('./dbConn.js');


createTables();

async function createTables() {
    const connection = await dbConn.openConnection();
    if (connection === null) {
        console.log("createTables: problem with connection")
    }

    await clearTables(connection);

    return;

    let sql = "DROP TABLE session";
    await connection.query(sql);

    sql = "CREATE TABLE session (";
    sql += "id INT AUTO_INCREMENT PRIMARY KEY,";
    sql += "cycle_counter INT,";
    sql += "num_rounds INT,"
    sql += "elapsed_time INT,";
    sql += "entity_number INT,";
    sql += "rule_sequence_num INT";
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
    sql += "round_num INT,";
    sql += "breed_method CHAR(64),";
    sql += "score FLOAT, ";
    sql += "initial_params_1 VARCHAR(256),";
    sql += "initial_params_2 VARCHAR(256),";
    sql += "initial_mem_space VARCHAR(256)";
    sql += ")";
    await connection.query(sql);

    sql = "DROP TABLE seed_rule";
    await connection.query(sql);

    sql = "CREATE TABLE seed_rule (";
    sql += "id INT AUTO_INCREMENT PRIMARY KEY,";
    sql += "session_id INT,";
    sql += "rule_id INT,";
    sql += "rule_sequence_num INT,";
    sql += "seed_rule_mem_space VARCHAR(256)";
    sql += ")";
    await connection.query(sql);

    connection.end();
}

async function clearTables(connection) {

    sql = "DELETE FROM seed_rule";
    await connection.query(sql);

//    sql = "DELETE FROM entity";
//    await connection.query(sql);

//    sql = "DELETE FROM session";
//    await connection.query(sql);

}