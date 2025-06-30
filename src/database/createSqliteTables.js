const mysql = require('mysql2/promise');
const dbConn = require('./dbConnSqlite.js');


createTables();

console.log ("Done");

async function createTables() {
    const connection = await dbConn.openConnection();
    if (connection === null) {
        console.log("createTables: problem with connection")
    }

    let sql;

    // await clearTables(connection);

    // console.log("Tables Cleared");

    // return;
    
    /*
    // sql = "DROP TABLE session";
    // await connection.query(sql);

    sql = "CREATE TABLE session (";
    sql += "id INTEGER PRIMARY KEY AUTOINCREMENT,";
    sql += "cycle_counter INTEGER,";
    sql += "num_rounds INTEGER,"
    sql += "elapsed_time INTEGER,";
    sql += "entity_number INTEGER,";
    sql += "rule_sequence_num INTEGER";
    sql += ")";
    await connection.query(sql);

    // sql = "DROP TABLE entity";
    // await connection.query(sql);

    sql = "CREATE TABLE entity (";
    sql += "id INTEGER PRIMARY KEY AUTOINCREMENT,";
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

    // sql = "DROP TABLE seed_rule";
    // await connection.query(sql);

    sql = "CREATE TABLE seed_rule (";
    sql += "id INTEGER PRIMARY KEY AUTOINCREMENT,";
    sql += "session_id INT,";
    sql += "rule_id INT,";
    sql += "rule_sequence_num INT,";
    sql += "seed_rule_mem_space VARCHAR(256)";
    sql += ")";
    await connection.query(sql);

    sql = "CREATE TABLE sub_opt_rule (";
    sql += "id INT PRIMARY KEY AUTOINCREMENT,";
    sql += "session_id INT,";
    sql += "rule_id INT,";
    sql += "rule_sequence_num INT,";
    sql += "sub_opt_rule_mem_space VARCHAR(256)";
    sql += ")";
    await connection.query(sql);

    sql = "DROP TABLE rule";
    await connection.query(sql);

    sql = "CREATE TABLE rule (";
    sql += "id INT PRIMARY KEY AUTOINCREMENT,";
    sql += "rule_num INT,";
    sql += "start_round INT,";
    sql += "completion_round INT,";
    sql += "completed INT";
    sql += ")";
    await connection.query(sql);

    sql = "CREATE TABLE seed_rule_fragment (";
    sql += "id INTEGER PRIMARY KEY AUTOINCREMENT,";
    sql += "fragment VARCHAR(128)";
    sql += ")";
    await connection.query(sql);
    */

    sql = "CREATE TABLE seedbed_data (",
    sql += "id INTEGER PRIMARY KEY AUTOINCREMENT,";
    sql += "seed_batch_num INT,"
    sql += "type VARCHAR(16),";
    sql += "seed_index INT,";
    sql += "start_round INT,";
    sql += "promoted_round INT";
    sql += ")";
    await connection.query(sql);

    sql = "CREATE TABLE template_seedbed_log (";
    sql += "id INTEGER PRIMARY KEY AUTOINCREMENT,";
    sql += "template_index INT,";
    sql += "num_attempts INT,";
    sql += "failed_attempts INT,";
    sql += "successful_attempts INT,";
    sql += "current INT"
    sql += ")";
    await connection.query(sql);

    sql = "CREATE TABLE seed_rule_seedbed_log (";
    sql += "id INTEGER PRIMARY KEY AUTOINCREMENT,";
    sql += "seed_rule_index INT,";
    sql += "num_attempts INT,";
    sql += "failed_attempts INT,";
    sql += "successful_attempts INT,";
    sql += "current INT"
    sql += ")";
    await connection.query(sql);

    /*
    // sql = "DROP TABLE transfer_entity";
    // await connection.query(sql);

    sql = "CREATE TABLE transfer_entity (";
    sql += "id INTEGER PRIMARY KEY AUTOINCREMENT,";
    sql += "best_set_num INT,";
    sql += "inx INT,";
    sql += "score FLOAT,";
    sql += "entity_number INT,";
    sql += "breed_method VARCHAR(64),";
    sql += "birth_time BIGINT,";
    sql += "birth_date_time VARCHAR(256),";
    sql += "creation_cycle INT,";
    sql += "round_num INT,"
    sql += "reg_a INT,";
    sql += "reg_b INT,";
    sql += "reg_c INT,";
    sql += "reg_cf INT,";
    sql += "reg_zf INT,";
    sql += "reg_sp INT,";
    sql += "reg_ip INT,";
    sql += "reg_ic INT,";
    sql += "mem_space VARCHAR(256),";
    sql += "final_mem_space VARCHAR(256)";
    sql += ")";
    await connection.query(sql);

    // sql = "DROP TABLE transfer_entity_output";
    // await connection.query(sql);

    sql = "CREATE TABLE transfer_entity_output (";
    sql += "id INTEGER PRIMARY KEY AUTOINCREMENT,";
    sql += "transfer_entity_id INT,";
    sql += "best_set_num INT,";
    sql += "best_set_inx INT,"
    sql += "inx INT,";
    sql += "output_block VARCHAR(256)";
    sql += ")";
    await connection.query(sql);

    // sql = "DROP TABLE transfer_entity_input";
    // await connection.query(sql);

    sql = "CREATE TABLE transfer_entity_input (";
    sql += "id INTEGER PRIMARY KEY AUTOINCREMENT,";
    sql += "transfer_entity_id INT,";
    sql += "best_set_num INT,";
    sql += "best_set_inx INT,"
    sql += "inx INT,";
    sql += "input_block VARCHAR(256)";
    sql += ")";
    await connection.query(sql);

    // sql = "DROP TABLE batch_data";
    // await connection.query(sql);
    
    sql = "CREATE TABLE batch_data (";
    sql += "batch_num INT,"
    sql += "monoclonal_ins_count INT,";
    sql += "monoclonal_byte_count INT,";
    sql += "interbreed_count INT,";
    sql += "interbreed2_count INT,";
    sql += "interbreed_flagged_count INT,";
    sql += "interbreed_ins_merge_count INT,";
    sql += "self_breed_count INT,";
    sql += "seed_rule_breed_count INT,";
    sql += "random_count INT,";
    sql += "cross_set_count INT";
    sql += ")";
    await connection.query(sql);
    */
    connection.close();
}

async function clearTables(connection) {
    let sql;

    sql = "DELETE FROM seedbed_data";
    await connection.query(sql);

    sql = "DELETE FROM template_seedbed_log";
    await connection.query(sql);

    sql = "DELETE FROM seed_rule_seedbed_log";
    await connection.query(sql);

    sql = "DELETE FROM batch_data";
    await connection.query(sql);

    sql = "DELETE FROM transfer_entity_output";
    await connection.query(sql);

    sql = "DELETE FROM transfer_entity_input";
    await connection.query(sql);

    sql = "DELETE FROM transfer_entity";
    await connection.query(sql);

    sql = "DELETE FROM rule",
    await connection.query(sql);

    sql = "DELETE FROM seed_rule_fragment";
    await connection.query(sql);

    sql = "DELETE FROM sub_opt_rule";
    await connection.query(sql);
    
    sql = "DELETE FROM seed_rule";
    await connection.query(sql);

    sql = "DELETE FROM entity";
    await connection.query(sql);

    sql = "DELETE FROM session";
    await connection.query(sql);

}