const dbConn = require("../database/dbConn.js");

checkConnection();

async function checkConnection() {
    let dbConnection = await dbConn.openConnection();
    if (dbConnection === null) {
        console.log("Connection was not opened");
    }
    else {
        console.log("Got dbConnection");
        dbConnection.end();
    }
}

