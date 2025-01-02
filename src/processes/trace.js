const path = require('node:path');
const Entity = require(path.join(__dirname, 'Entity.js'));
const InstructionSet = require(path.join(__dirname, 'InstructionSet.js'));

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
        const traceEntity = program.bestSets[this.bestSetNum][this.bestSetEntityNum];
        let memSpace = traceEntity.initialMemSpace;
        let entityNumber = traceEntity.entityNumber;
        let instructionSet = new InstructionSet();
        let asRandom = false;
        let seeded = false;
        let currentCycle = program.cycleCounter;
        // Create the trace entity
        this.entity = new Entity(entityNumber, instructionSet, asRandom, seeded, currentCycle, memSpace);
        // Save the fixed data
        this.fixedData = {};
        this.fixedData.entityNumber = this.entity.entityNumber;
        this.fixedData.bestSetNum = this.bestSetNum;
        this.fixedData.bestSetEntityNum = this.bestSetEntityNum;
        this.fixedData.initialParamsList = this.entity.initialParamsList;
        this.fixedData.initialMemList = this.entity.instructionSet.disassemble(memSpace, 0, this.entity.memLength);

        let start = true;
        this.stepExecute(traceWindow, this.entity, start);
    },

    nextStep() {
        let start = false;
        this.stepExecute(this.traceWindow, this.entity, start)
    },

    stepExecute(traceWindow, entity, start) {
        let restart = false;
        let stepData = entity.stepExecute(restart);
        if (!stepData.executionEnded) {
            stepData.start = start;
            stepData.fixedData = this.fixedData;
            traceWindow.webContents.send('displayTrace', stepData);
        }
    }
}

module.exports = trace;