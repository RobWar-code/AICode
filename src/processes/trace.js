const path = require('node:path');
const Entity = require(path.join(__dirname, 'Entity.js'));
const InstructionSet = require(path.join(__dirname, 'InstructionSet.js'));
const rulesets = require(path.join(__dirname, 'rulesets.js'));

const trace = {
    entityNum: 0,
    bestSetNum: 0,
    bestSetEntityNum: 0,
    entity: null,
    fixedData: null,
    traceWindow: null,

    start(traceWindow, program) {
        this.traceWindow = traceWindow;
        // Fetch the displayed entity
        let traceEntity = null;
        if (program.seedEntity === null) {
            traceEntity = program.bestSets[this.bestSetNum][this.bestSetEntityNum];
        }
        else {
            traceEntity = program.seedEntity;
        }
        let memSpace = traceEntity.initialMemSpace;
        let entityNumber = traceEntity.entityNumber;
        let instructionSet = new InstructionSet();
        let asRandom = false;
        let seeded = false;
        let ruleSequenceNum = program.ruleSequenceNum;
        console.log("trace start, ruleSequenceNum", ruleSequenceNum);
        let currentCycle = program.cycleCounter;
        // Create the trace entity
        let roundNum = traceEntity.roundNum;
        this.entity = new Entity(entityNumber, instructionSet, asRandom, seeded, currentCycle, 
            ruleSequenceNum, roundNum, memSpace);
        // Save the fixed data
        this.fixedData = {};
        let rule = rulesets.getRuleFromSequence(ruleSequenceNum);
        let displayGroupBy = 4;
        if ("displayGroupBy" in rule) displayGroupBy = 4;
        this.fixedData.displayGroupBy = displayGroupBy;
        this.fixedData.sampleIn = rule.sampleIn;
        this.fixedData.sampleOut = rule.sampleOut;
        this.fixedData.entityNumber = this.entity.entityNumber;
        this.fixedData.bestSetNum = this.bestSetNum;
        this.fixedData.bestSetEntityNum = this.bestSetEntityNum;
        if (this.entity.ruleParams === null) {
            this.fixedData.initialParamsList = this.entity.initialParamsList;
        }
        else {
            this.fixedData.initialParamsList = this.entity.ruleParams;
        }
        this.fixedData.initialMemList = this.entity.instructionSet.disassemble(memSpace, 0, this.entity.memLength);

        let start = true;
        this.executionCount = 0;
        this.stepExecute(traceWindow, this.entity, start);
    },

    restart(executionCount) {
        console.log("Got to restart");
        let restart = true;
        let currentExecutionCount = executionCount;
        if (executionCount === null) {
            currentExecutionCount = this.entity.executionCount;
        }
        let stepData = this.entity.stepExecute(restart, currentExecutionCount);
        stepData.start = false;
        stepData.fixedData = this.fixedData;
        this.traceWindow.webContents.send('displayTrace', stepData);
    },

    nextStep() {
        let start = false;
        this.stepExecute(this.traceWindow, this.entity, start)
    },

    stepExecute(traceWindow, entity, start) {
        let restart = false;
        let stepData = entity.stepExecute(restart, this.executionCount);
        this.executionCount = entity.executionCount;
        stepData.start = start;
        stepData.fixedData = this.fixedData;
        traceWindow.webContents.send('displayTrace', stepData);
    }
}

module.exports = trace;