const path = require('node:path');
const {databaseType} = require(path.join(__dirname, '../AICodeConfig.js'));
let dbConn;
if (databaseType === "sqlite") {
    dbConn = require(path.join(__dirname, 'dbConnSqlite.js'));
}
else {
    dbConn = require(path.join(__dirname, "dbConn.js"));
}

const miscDbFunctions = {

    async clearTables() {
        let connection = await dbConn.openConnection();
        
        let sql;

        sql = "DELETE FROM bests_store";
        await connection.query(sql);
        
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

};

module.exports = miscDbFunctions;