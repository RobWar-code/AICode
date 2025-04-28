const path = require('node:path');
const dbConn = require(path.join(__dirname, 'dbConnSqlite.js'));

async function testCreateTable() {
    let connection = await dbConn.openConnection();

    let sql = "CREATE TABLE users (";
    sql += "id INTEGER PRIMARY KEY AUTOINCREMENT,";
    sql += "name VARCHAR(64)";
    sql += ")";

    try {
        await connection.query(sql);
        console.log("Got connection and query");
    }
    catch(error) {
        console.log("database test problem");
        throw error;
    }
    console.log("Done");

    connection.end();
}

async function testInsertRow() {
    let connection = await dbConn.openConnection();

    let sql = "INSERT INTO users (name) VALUES (?)";
    try {
        await connection.execute(sql, ["Matilda"]);
        console.log("Inserted row");
    }
    catch (error) {
        console.log("Problem inserting row");
        throw error;
    }

    connection.end()

}

async function testSelectRows() {
    let connection = await dbConn.openConnection();

    let sql = "SELECT * FROM users";

    try {
        let rows = await connection.query(sql);
        for (let row of rows) {
            console.log("users row:", row.name);
        }
    }
    catch (error) {
        console.log("Problem selecting rows");
        throw error;
    }

    connection.end();

}


// testCreateTable();
testInsertRow();
testSelectRows();
