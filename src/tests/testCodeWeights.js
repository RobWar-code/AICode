const path = require('node:path');
const {databaseType, processMode} = require(path.join(__dirname, '../AICodeConfig.js'));
let dbConn;
if (databaseType === "sqlite") {
  dbConn = require(path.join(__dirname, '../database/dbConnSqlite.js'));
}
const dbTransactions = require(path.join(__dirname, "../database/dbTransactions.js"));
const rulesets = require(path.join(__dirname, "../processes/rulesets.js"));
const Entity = require(path.join(__dirname, "../processes/Entity.js"));
const InstructionSet = require(path.join(__dirname, "../processes/InstructionSet.js"));


async function testCodeWeights() {
    const instructionSet = new InstructionSet();
    rulesets.initialise();
    
    if (databaseType === 'sqlite') {
      dbConn.openConnection();
    }
    // Get the codeweight table from the database
    await dbTransactions.loadWeightingTable(null);
    console.log("rulesets weighting table:", rulesets.weightingTable.length, rulesets.weightingTable[0].totalCodeOccurrences);

    // Create the entity
    let entityNumber = 0;
    let asRandom = "weighted";
    let seeded = false;
    let currentCycle = 0;
    let ruleSequenceNum = 0;
    let roundNum = 0;
    let memSpace = null;
    let entity = new Entity(entityNumber, instructionSet, asRandom, seeded, currentCycle, ruleSequenceNum, roundNum, memSpace);

}

testCodeWeights();
