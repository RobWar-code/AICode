const path = require('node:path');
const rulesets = require(path.join(__dirname, 'rulesets.js'));
const testObj = require(path.join(__dirname, 'testObj'));

class Entity {
    /***
     * entityNumber - a unique identifying number
     * instructionSet - the instruction set to be used by the entity
     * asRandom - whether the entity is to be created at random
     * currentCycle - the current processing breed and evaluate cycle
     * memSpace - the instruction memory to be used to generate a new entity
     * 
     * Create, execute or breed a similar entity
     */
    constructor(entityNumber, instructionSet, asRandom, seeded, currentCycle, roundNum, memSpace) {
        this.entityNumber = entityNumber;
        this.bestSetEntityNum = -1;
        // Segments
        this.memLength = 256;
        // Instruction Set
        this.instructionSet = instructionSet;
        // Registers
        this.resetRegisters();
        // Set-up Data
        this.paramsLength = 16;
        this.paramsMax = 256;
        this.valuesOutMax = 256;
        this.initialParamsList = [
            [0,1,2,3,11,15,13,7,8,10,12,32,64,100,128,255,
                43,3,2,43,4,5,43,12,13,43,9,11,43,10,10,43,15,8,43,100,50,43,75,72, // +
                45,9,4,45,10,2,45,100,22,45,85,13,45,3,4,45,19,2,45,201,105,45,222,37, // -
                42,3,4,42,5,7,42,9,10,42,12,12,42,8,15,42,20,9,42,7,7,42,11,7 // *
            ],
            [3,6,9,12,15,18,21,0,1,2,30,40,50,100,150,255,
                43,5,2,43,10,5,43,22,13,43,19,11,43,17,10,43,18,8,43,109,50,43,77,72, // +
                45,19,4,45,17,2,45,107,22,45,87,13,45,3,5,45,21,2,45,209,105,45,217,37, // -
                42,3,5,42,5,9,42,9,11,42,13,13,42,9,15,42,20,3,42,7,8,42,12,7 // *
            ]
        ];
        this.valuesOut = new Array(this.valuesOutMax).fill(0);
        this.oldValuesOut = [];
        this.params = new Array(this.paramsMax).fill(0);
        this.oldParams = [];

        this.initialParamsListIndex = 0;
        this.initialParams = this.initialParamsList[0];
        this.initialMemSpace = new Array(this.memLength).fill(0);
        this.executionCount = 0;
        this.numExecutions = 2;
        this.memSpace = new Array(this.memLength).fill(0);
        // Other Constants
        this.dataMaxValue = 255;
        if (memSpace != null) {
            this.initialMemSpace = memSpace.concat();
        }
        else if (seeded) {
            this.createSeededProgram()
        }
        else if (asRandom) {
            this.createRandomProgram();
        }
        // this.instructionSetTest(this.initialMemSpace);
        // Breeding Parameters
        this.interbreedCycle = 5;
        this.score = 0;
        this.scoreList = [];
        let now = new Date();
        this.birthTime = Date.now();
        this.birthDateTime = `${now.toDateString()} ${now.toTimeString()}`;
        this.birthCycle = currentCycle;
        this.roundNum = roundNum;
        this.breedMethod = "Random";
        this.crossSetBreed = false;

        // Test Data
        this.testScript = this.getTestScript();
    }

    resetRegisters() {
        this.registers = {
            A: 0,
            B: 0,
            C: 0,
            R: 0,
            S: 0,
            CF: 0,
            ZF: 0,
            SP: this.instructionSet.stackStart,
            IP: 0,
            IC: 0
        }
        this.previousRegisters = {...this.registers};
        this.instructionVisited = new Array(this.memLength).fill(false);
    }

    createRandomProgram() {
        this.breedMethod = "Random";
        let numIns = this.instructionSet.numIns;
        let lastIns = -1;
        let checkArray = [];
        for (let i = 0; i < this.memLength; i++) {
            if (i < 48) {
                let c = 4;
                let n = 0;

                let redundant = true;
                while (redundant && c >= 0){
                    n = Math.floor(this.instructionSet.numIns * Math.random());
                    // Check for redundant frequency
                    if (i % 12 === 0) {
                        checkArray = new Array(numIns).fill(0);
                    }
                    if (checkArray[n] < 3) {
                        redundant = false;
                        ++checkArray[n];
                    }

                    if (!redundant) {
                        // Remove redundant pairing
                        if (lastIns != -1) {
                            // Check whether this is a redundant pair
                            if (!this.instructionSet.isRedundantPairing(lastIns, n)) {
                                redundant = false;
                            }
                        }
                    }
                    --c;
                }
                this.initialMemSpace[i] = n;
                // Add in data bytes
                let len = this.instructionSet.getInsLen(n);
                if (len === 0) {
                    // Debug
                    console.log("Missing code?", n, i);
                }
                if (len > 1) {
                    for (let j = 1; j < len; j++) {
                        let n = Math.floor(256 * Math.random());
                        this.initialMemSpace[i + j] = n;
                    }
                }
                i += len - 1;
            }
            else {
                let n = Math.floor(256 * Math.random());
                this.initialMemSpace[i] = n;
            }
        }
    }

    createSeededProgram() {
        this.breedMethod = "Seeded";
        let seededProgs = [];
        let numSeededProgs = this.createSeedProgs(seededProgs);
        let progNum = 1;
        this.initialMemSpace = seededProgs[progNum];
    }

    createSeedProgs(seededProgs) {
        let progs = [];
        let prog1 = [
            {
                ins: "LD A, IMM",
                data: [5]
            },
            {
                ins: "STO (MEM), A",
                data: [0]
            },
            {
                ins: "RETF"
            }
        ];
        progs.push(prog1);

        let prog2 = [
            // add 3 to each input (0 to 7) and output at (40 to 47)
            // Initialisation
            // Counter
            {
                ins: "LD A, IMM",
                data: [8]
            },
            {
                ins: "ST (MEM), A",
                data: [200]
            },
            // Input Address
            {
                ins: "LD A, IMM",
                data: [0]
            },
            {
                ins: "ST (MEM), A",
                data: [201]
            },
            // Get Output address
            {
                ins: "LD A, IMM",
                data: [40]
            },
            {
                ins: "ST (MEM), A",
                data: [202]
            },
            // Loop Start: Get Input
            {
                ins: "LD C, (MEM)",
                data: [201]
            },
            {
                ins: "LDI A, (C)"
            },
            {
                ins: "INC C"
            },
            { 
                ins: "ST (MEM), C",
                data: [201]
            },
            {
                ins: "LD B, IMM",
                data: [3]
            },
            {
                ins: "ADD A, B"
            },
            // Pass the result to the output
            {
                ins: "LD C, (MEM)",
                data: [202]
            },
            {
                ins: "STO (C), A"
            },
            {
                ins: "INC C"
            },
            {
                ins: "ST (MEM), C",
                data: [202]
            },
            // Decrement the counter
            {
                ins: "LD A, (MEM)",
                data: [200]
            },
            {
                ins: "DEC A"
            },
            {
                ins: "ST (MEM), A",
                data: [200]
            },
            {
                ins: "JRZ",
                data: [2] // To Exit
            },
            {
                ins: "JR",
                data: [0xEA] // Loop Start
            },
            {
                // Exit
                ins: "RETF"
            }
        ];
        progs.push(prog2);

        for (let program of progs) {
            let memSpace = new Array(this.memLength).fill(0);
            this.instructionSet.compileTestCode(program, memSpace);
            seededProgs.push(memSpace);
        }
    }

    qualityControlIns(message, memSpace) { 
        if (memSpace.length != this.memLength) {
            console.log("qualityControlIns - length wrong", message, memSpace.length);
        }
       // Quality Control, check the array
        for (let i = 0; i < this.initialMemSpace.length; i++) {
            let c = this.initialMemSpace[i];
            if (typeof(c) != "number" || c < 0 || c > 255) {
                console.log("qualityControlIns - ", message, c, i);
                this.initialMemSpace[i] = 245;
            }
        }
    }

    breed(entityNumber, mateEntity, crossSet, cycleCounter, roundNum) {
        let newEntity = null;
        this.crossSetBreed = false;

        if (cycleCounter < this.interbreedCycle || Math.random() < 0.7) {
            newEntity = this.monoclonalBreed(entityNumber, cycleCounter, roundNum);
            newEntity.breedMethod = "Monoclonal";
        }
        else {
            if (Math.random() < 0.4) {
                newEntity = this.interbreed(mateEntity, entityNumber, cycleCounter, roundNum);
                newEntity.breedMethod = "Interbreed";
                if (crossSet) this.crossSetBreed = true;
            }
            else if (Math.random() < 0.8) {
                newEntity = this.interbreed2(mateEntity, entityNumber, cycleCounter, roundNum);
                newEntity.breedMethod = "Interbreed2";
                if (crossSet) this.crossSetBreed = true;
            }
            else {
                // Self-breed
                let asRandom = false;
                let seeded = false;
                newEntity = new Entity(this.entityNumber, this.instructionSet, asRandom, seeded, 
                    cycleCounter, roundNum, this.memSpace);
                newEntity.breedMethod = "Self-breed";
            }
            // Compare with old entity
            let different = false;
            for (let i = 0; i < this.initialMemSpace.length; i++) {
                if (newEntity.initialMemSpace[i] != this.initialMemSpace[i]) {
                    different = true;
                    break;
                }
            }
            if (!different) {
                newEntity = this.monoclonalBreed(entityNumber, cycleCounter);
                newEntity.breedMethod = "Monoclonal";
            }
        }
        return (newEntity);
    }

    monoclonalBreed(entityNumber, cycleCounter, roundNum) {
        let codeHitChance;
        if (cycleCounter % 3 === 0) {
            codeHitChance = 0.05;
        }
        else if (cycleCounter % 3 === 1) {
            codeHitChance = 0.1;
        }
        else {
            codeHitChance = 0.3;
        }

        const replaceChance = 0.5;
        const insertChance = 0.75;
        const deleteChance = 1.0;
        let newCodeSegment = [];
        for (let i = 0; i < this.initialMemSpace.length; i++) {
            let oldi = i;
            // Get instruction
            let codeItem = [];
            let code = this.initialMemSpace[i];
            if (typeof code != "number") {
                code = Math.floor(Math.random() * this.instructionSet.numIns);
            }
            let insItem = this.instructionSet.getInsDetails(code);
            codeItem.push(code);
            if (insItem.insLen > 1) {
                for (let j = 1; j < insItem.insLen; j++) {
                    let n = this.initialMemSpace[i + j];
                    if (Math.random() < 0.1 || isNaN(n) || typeof n != 'number') {
                        n = Math.floor(Math.random() * (this.dataMaxValue + 1));
                    }
                    codeItem.push(n);
                }
            }
            i += insItem.insLen - 1;

            if (Math.random() < codeHitChance) {
                // Create a random instruction
                let n = Math.floor(Math.random() * this.instructionSet.numIns);
                let codeItem2 = [];
                codeItem2.push(n);
                let insItem = this.instructionSet.getInsDetails(n);
                for (let j = 1; j < insItem.insLen; j++) {
                    codeItem2.push(Math.floor(Math.random() * (this.dataMaxValue + 1)));
                }

                let hitType = Math.random();
                if (hitType < replaceChance) {
                    for (let j = 0; j < codeItem2.length; j++) {
                        newCodeSegment.push(codeItem2[j]);
                        if (newCodeSegment.length >= this.memLength) {
                            break;
                        }
                    }
                }
                else if (hitType < insertChance) {
                    // Insert the random instruction
                    for (let j = 0; j < codeItem2.length; j++) {
                        newCodeSegment.push(codeItem2[j]);
                        if (newCodeSegment.length >= this.memLength) {
                            break;
                        }
                    }
                    i = oldi - 1; // Allow for the next instruction
                }
                else {
                    // Delete - exclude the instruction
                }
            }
            else {
                // Insert the old instruction
                for (let j = 0; j < codeItem.length; j++) {
                    newCodeSegment.push(codeItem[j]);
                    if (newCodeSegment.length >= this.memLength) {
                        break;
                    }
                }            
            }
            if (newCodeSegment.length >= this.memLength) break;
        }
        if (newCodeSegment.length < this.memLength) {
            let len = newCodeSegment.length;
            for (let i = 0; i < (this.memLength - len); i++) {
                newCodeSegment.push(0);
            }
        }
        this.qualityControlIns("Monoclonal", newCodeSegment);

        let asRandom = false;
        let seeded = false;
        let entity = new Entity(entityNumber, this.instructionSet, asRandom, seeded, cycleCounter, roundNum, newCodeSegment);

        return entity;
    }

    interbreed(mate, entityNumber, cycleCounter, roundNum) {
        // Get the block marker instruction
        let markerCode = this.instructionSet.getInsCode("SM").code;
        let memSpace1 = this.initialMemSpace;
        let memSpace2 = mate.initialMemSpace;
        let start1 = 0;
        let start2 = 0;
        let start;
        let from1 = true;
        let newMemSpace = [];
        let done = false;
        while (!done) {
            from1 ? start = start1 : start = start2;
            for (let i = start; i < memSpace1.length; i++) {
                let code;
                from1 ? code = memSpace1[i] : code = memSpace2[i];
                if (code != markerCode || i === start) {
                    // Transfer the instruction
                    let insItem = this.instructionSet.getInsDetails(code);
                    let insLen = insItem.insLen;
                    let p;
                    for (p = 0; p < insLen; p++) {
                        if (i + p >= memSpace1.length) {
                            break;
                        }
                        let c;
                        from1 ? c = memSpace1[i + p] : c = memSpace2[i + p];
                        newMemSpace.push(c);
                        if (newMemSpace.length >= this.memLength) {
                            done = true;
                            break;
                        } 
                    }
                    if (done) break;
                    i += insLen - 1;
                }
                else {
                    // End the transfer and record the start position
                    from1 ? start1 = i : start2 = i;
                    break;
                }
            }
            from1 = !from1;
        }
        let asRandom = false;
        let seeded = false;
        let newEntity = new Entity(entityNumber, this.instructionSet, asRandom, seeded, cycleCounter, roundNum, newMemSpace);
        return newEntity;
    }

    interbreed2(mate, entityNumber, cycleCounter, roundNum) {
        // Fixed length blocks
        let insBlockLen = 12;
        let newProgram = [];
        let entityFlipper = false;
        let pointer1 = 0;
        let pointer2 = 0;
        while (newProgram.length < this.memLength && !(pointer1 >= this.memLength && pointer2 >= this.memLength)) {
            let blockObj = {};
            let a;
            if (entityFlipper) {
                blockObj = this.getInsBlock(insBlockLen, this.initialMemSpace, pointer1);
                a = blockObj.block;
                pointer1 = blockObj.pointer;
            }
            else {
                blockObj = this.getInsBlock(insBlockLen, mate.initialMemSpace, pointer2);
                a = blockObj.block;
                pointer2 = blockObj.pointer;
            }
            newProgram = newProgram.concat(a);
            entityFlipper = !entityFlipper;
        }
        if (newProgram.length < this.memLength) {
            for (let i = newProgram.length + 1; i < this.memLength; i++) {
                newProgram.push(0);
            }
        }
        else if (newProgram.length > this.memLength) {
            newProgram = newProgram.slice(0, this.memLength);
        }
        this.qualityControlIns("Interbreed2", newProgram);

        let asRandom = false;
        let seeded = false;
        let newEntity = new Entity(entityNumber, this.instructionSet, asRandom, seeded, cycleCounter, roundNum, newProgram);
        return newEntity;
    }

    getInsBlock(insBlockLen, memSpace, pointer) {
        let insBlock = [];
        let count = 0;
        let p = pointer;
        let code = 0;
        while (p < memSpace.length && count < insBlockLen) {
            code = memSpace[p];
            let insItem = this.instructionSet.getInsDetails(code);
            let insLen = insItem.insLen;
            if (insLen + p >= this.memLength) insLen = this.memLength - p;
            for (let i = 0; i < insLen; i++) {
                insBlock.push(memSpace[p + i]);
            }
            p += insLen;
            ++count;
        }
        return {pointer: p, block: insBlock};
    }

    display(mainWindow, bestSetNum, elapsedTime, numTrials, randomCount, monoclonalCount, interbreedCount, 
        interbreed2Count, selfBreedCount, crossSetCount, currentCycle, numRounds) {
        let displayData = {};
        // Code, parameters and memory output
        let dataSection = [];
        for (let i = 0; i < 2; i++) {
            if (i === 0) {
                dataSection.push(this.getMemData(0, this.initialMemSpace));
            }
            else {
                dataSection.push(this.getMemData(1, this.memSpace));
            }
        }
        displayData.data = dataSection;

        displayData.params = this.oldParams;
        displayData.valuesOut = this.oldValuesOut;

        displayData.initialParamsList = this.initialParamsList;


        // Registers
        displayData.registers = this.registers;

        // Details
        displayData.bestSetNum = bestSetNum;
        displayData.bestSetEntityNum = this.bestSetEntityNum;
        displayData.numTrials = numTrials;
        displayData.currentCycle = currentCycle;
        displayData.numRounds = numRounds;
        displayData.birthCycle = this.birthCycle;
        displayData.entityNumber = this.entityNumber;
        displayData.creationTime = this.birthDateTime;
        displayData.breedMethod = this.breedMethod;
        displayData.score = Math.floor(this.score * 10000)/10000;
        displayData.maxScore = rulesets.maxScore;
        displayData.elapsedTime = Math.floor(elapsedTime * 10000)/10000;
        displayData.randomCount = randomCount;
        displayData.monoclonalCount = monoclonalCount;
        displayData.interbreedCount = interbreedCount;
        displayData.interbreed2Count = interbreed2Count;
        displayData.selfBreedCount = selfBreedCount;
        displayData.crossSetCount = crossSetCount;
        displayData.scoreList = this.scoreList;

        mainWindow.webContents.send('displayEntity', displayData);

        return;

    }

    getSeedDisplayData(seedProgram) {
        let displayData = {};
        // Code, parameters and memory output
        let dataSection = [];
        for (let i = 0; i < 2; i++) {
            if (i === 0) {
                dataSection.push(this.getMemData(0, this.initialMemSpace));
            }
            else {
                dataSection.push(this.getMemData(1, this.memSpace));
            }
        }
        displayData.data = dataSection;

        displayData.params = this.oldParams;
        displayData.valuesOut = this.oldValuesOut;

        displayData.initialParamsList = this.initialParamsList;

        // Registers
        displayData.registers = this.registers;

        // Score list
        displayData.scoreList = this.scoreList;
        displayData.score = Math.floor(this.score * 10000)/10000;

        // Details
        displayData.seedName = seedProgram.name;
        displayData.seedDescription = seedProgram.description;

        return displayData;

    }

    doScore(bestSetHighScore, bestSetLowScore) {
        let scoreObj = rulesets.getScore(bestSetHighScore, bestSetLowScore, 
            this.instructionSet, this.initialMemSpace, 
            this.initialParams, this.params, this.valuesOut, this.registers.IC, 
            this.instructionSet.highestIP, this.roundNum);
        this.score = scoreObj.score;
        this.scoreList = scoreObj.scoreList;
        return score;
    }
    
    getMemData(n, memSpace) {
        let dataObj = {};
        // Get the memSpace data converted
        let memCode = this.instructionSet.disassemble(memSpace, 0, this.memLength);
        dataObj.code = memCode;
        return dataObj;
    }        

    execute(bestSetHighScore, bestSetLowScore) {
        rulesets.initialise();
        let memObj = null;
        let scoreObj = null;
        let test = false;
        let showDataStart = 100;
        let showDataLen = 7;
        for (let executionCount = 0; executionCount < this.numExecutions; executionCount++) {
            this.copyMem(executionCount);
            memObj = this.instructionSet.execute(this.memSpace, this.initialParams, this.params, this.valuesOut, 
                this.roundNum, test, showDataStart, showDataLen, this.testScript);
            // Fix invalid memspace codes
            for (let i = 0; i < this.memSpace.length; i++) {
                let c = this.memSpace[i];
                if (typeof(c) != "number" || c < 0 || c > this.dataMaxValue) {
                    this.memSpace[i] = 0;
                }
            }
            this.oldValuesOut.push(this.valuesOut.concat());
            this.oldParams.push(this.params.concat());
            scoreObj = rulesets.getScore(bestSetHighScore, bestSetLowScore, this.instructionSet, 
                this.initialMemSpace, this.initialParams, this.params, this.valuesOut, 
                this.registers.IC, this.instructionSet.highestIP, this.roundNum);
            this.score += scoreObj.score;
        }
        // Score the difference between the outputs of the passes
        this.score += rulesets.scoreOutputDiff(this.oldValuesOut);

        if (typeof(memObj.A) != "number") memObj.A = 0;
        if (typeof(memObj.B) != "number") memObj.B = 0;
        this.registers.A = memObj.A;
        this.registers.B = memObj.B;
        this.registers.C = memObj.C;
        this.registers.CF = memObj.CF;
        this.registers.ZF = memObj.ZF;
        this.registers.SP = memObj.SP;
        this.registers.IP = memObj.IP;
        this.registers.IC = memObj.IC;
        this.scoreList = scoreObj.scoreList;
        return memObj;
    }

    stepExecute(restart) {
        let executionsEnded = false;
        if (restart) {
            this.executionCount = 0;
            this.resetRegisters();
            this.copyMem();
        }
        if (this.registers.IC >= this.instructionSet.ICMax && this.executionCount >= this.numExecutions) {
            return {executionEnded: true};
        }
        if (this.registers.IC === 0) {
            this.resetRegisters();
            this.copyMem(this.executionCount);
        }
        let {A, B, C, R, S, CF, ZF, SP, IP, IC} = this.registers;
        this.instructionVisited[IP] = true;
        this.previousRegisters = {...this.registers};
        let execObj = this.instructionSet.executeIns(A, B, C, R, S, CF, ZF, SP, IP, this.memSpace, 
            this.initialParams, this.params, this.valuesOut, this.roundNum);
        this.registers = {...execObj.registers, IC: this.registers.IC};
        ++this.registers.IC;
        if (execObj.RETF || this.registers.IP >= this.memLength || this.registers.IC >= this.instructionSet.ICMax) {
            ++this.executionCount;
            this.registers.IC = 0;
        }
        let insListObj = this.instructionSet.stepDisassemble(this.memSpace, this.instructionVisited, this.previousRegisters.IP);
        return {
            executionEnded:false,
            executionCount: this.executionCount,
            registers: this.registers,
            previousRegisters: this.previousRegisters,
            params: this.params,
            valuesOut: this.valuesOut,
            stepLine: insListObj.stepLine,
            insList: insListObj.insList
        }
    }

    copyMem(executionCount) {
        this.valuesOut = new Array(this.valuesOutMax).fill(0);
        this.params = new Array(this.paramsMax).fill(0);
        this.initialParams = this.initialParamsList[executionCount];
        for (let i = 0; i < this.initialParams.length; i++) {
            this.params[i] = this.initialParams[i];
        }
        this.memSpace = this.initialMemSpace.concat();
    }

    getTestScript() {
        let testCode = [
            {
                addr: 0,
                ins: "LD A, (MEM)",  //  Value at &100  is 5
                data: [100], 
                show: "A === 5, ZF = 0"
            },
            {
                addr: 2,
                ins: "ST (MEM), A", // 2)
                data: [101],
                show: "&101 === 5"
            },
            {
                addr: 4,
                ins: "CLR (MEM)", // 4)
                data: [102],
                show: "&102 === 0"
            },
            {
                addr: 6,
                ins: "PUSH A", // 6)
                show: "STACK_TOP === 5"
            },
            {
                addr: 7,
                ins: "LD A, (MEM)", // 7) Value at &103 is 7
                data: [103],
                show: "A === 7"
            },
            {
                addr: 9,
                ins: "POP A", // 8)
                show: "A === 5"
            },
            {
                addr: 10,
                ins: "SWP A, B", // 9)
                show: "A === 0, B === 5" 
            },
            {
                addr: 11,
                ins: "LD A, (MEM)", // 10)
                data: [103],
                show: "A === 7, ZF = 0"
            },
            {
                addr: 13,
                ins: "ADD A, B", // 12)
                show: "A === 12"
            },
            {
                addr: 14,
                ins: "SWP A, B", // 13)
                show: "A === 5, B === 12"
            },
            {
                addr: 15,
                ins: "LD A, (MEM)", // 14) Data at &104 is 254
                data: [104],
                show: "A === 254"
            },
            {
                addr: 17,
                ins: "ADD A, B", // 16) A is 254, B is 12
                show: "A === 10, CF === 1, ZF = 0"
            },
            {
                addr: 18,
                ins: "SUB A, B", // 17) A is 10, B is 12
                show: "A === 254, ZF = 0, CF = 1"
            },
            {
                addr: 19,
                ins: "SUB A, B", // 18) A is 254, B is 12
                show: "A === 242, ZF = 0, CF = 0"
            },
            {
                addr: 20,
                ins: "AND A, B", // 19) A is 254, B is 12
                show: "A === 0, ZF === 0"
            },
            {
                addr: 21,
                ins: "OR A, B", // 20) A is 12, B is 12
                show: "A === 12"
            },
            {
                addr: 22,
                ins: "LD A, (MEM)", // 21) Data at &105 is 1
                data: [105],
                show: "A === 1, ZF = 0"
            },
            {
                addr: 24,
                ins: "NOT A", // 23)
                show: "A === 254, ZF = 0"
            },
            {
                addr: 25,
                ins: "CMP A, B", // 24) A is 254, B is 12
                show: "CF === 0, ZF === 0"
            },
            {
                addr: 26,
                ins: "SWP A, B", // 25) A is 254, B is 12
                show: "A === 12, B === 254"
            },
            {
                addr: 27, 
                ins: "CMP A, B", // 26) A is 12, B is 254
                show: "CF === 1, ZF === 0"
            },
            {
                addr: 28,
                ins: "ST (MEM), A", // 27) A is 12
                data: [106],
                show: "&106 === 12"
            },
            {
                addr: 30,
                ins: "SWP A, B", // 29) A is 12, B is 254
                show: "A = 254, B = 12"
            },
            {
                addr: 31,
                ins: "LD A, (MEM)", // 31)
                data: [106],
                show: "A === 12, ZF === 0"
            },
            {
                addr: 33,
                ins: "CMP A, B", // 33) A is 254, B is 254
                show: "ZF === 1, CF === 0"
            },
            {
                addr: 34,
                ins: "JRZ", // 34) ZF is 1
                data: [2],
                show: "IP === 38"
            },
            {
                addr: 36,
                ins: "LD A, (MEM)", // 36) &103 is 7
                data: [103],
                show: "A === 7, ZF === 0, note: should be skipped"
            },
            {    
                addr: 38,
                ins: "LD A, (MEM)", // 38) &100 is 5
                data: [100],
                show: "A === 5, ZF === 0"
            },
            {
                addr: 40,
                ins: "JRZ", // 40) Ignored
                data: [100],
                show: "IP === 41"
            },
            { 
                addr: 42,
                ins: "SWP A, B", // 42)
                show: "A === 12, B === 5"
            },
            {
                addr: 43,
                ins: "LD A, (MEM)", // 43)
                data: [105],
                show: "A === 1"
            },
            {
                addr: 45,
                ins: "SWP A, B", // 45)
                show: "A === 5, B === 1"
            },
            {
                addr: 46,
                ins: "SUB A, B", // 46)
                show: "A === [4, 3, 2, 1, 0], B === 1, ZF === [0, 1], CF === 0"
            },
            {
                addr: 47,
                ins: "JRZ", // 47)
                data: [2],
                show: "IP === 51"
            },
            {
                addr: 49,
                ins: "JR", // 49)
                data: [254],  // -2
                show: "IP === 46"
            },
            {   
                addr: 51,
                ins: "JRLZ", // 51) ZF is 1
                data: [0, 2], // 2
                show: "IP === 56"
            },
            {
                addr: 54,
                ins: "LD A, (MEM)", // 54)
                data: [105],
                show: "A === 1, ZF === 0"
            },
            {   
                addr: 56,
                ins: "JRLZ", // 56) ZF is 1 first, 0 second
                data: [255, 255], // -1
                show: "IP === 53"
            },
            {
                addr: 59,
                ins: "CMP A, B", // 59) A is 1 B is 1
                show: "ZF === 0, CF === 1"
            },
            {
                addr: 60,
                ins: "JRC", // 60)
                data: [0],
                show: "IP === 61, Notes: No effect"
            },
            {
                addr: 62,
                ins: "LD A, (MEM)", // 62)
                data: [100],
                show: "A === 5"
            },
            {
                addr: 64,
                ins: "SWP A, B", // 64)
                show: "First: A === 1, B === 5, Second: A === 5, B === 1"
            },
            {
                addr: 65,
                ins: "CMP A, B", // 65)
                show: "First: CF = 1, ZF = 0, Second: CF = 0, ZF = 0"
            },
            {
                addr: 66,
                ins: "JRC", // 66)
                data: [254], // -2
                show: "First: IP === 63, Second: IP === 67"
            },
            {
                addr: 68,
                ins: "JRLC", // 68)
                data: [0, 2], // 2
                show: "First: IP = 71, Second: IP === 70"
            },
            {
                addr: 71,
                ins: "SWP A, B", // 71) 
                show: "A === 1, B === 5"
            },
            { 
                addr: 72,
                ins: "CMP A, B", // 72)
                show: "CF === 1, ZF === 0"
            },
            {
                addr: 73,
                ins: "JRLC", // 73)
                data: [255, 254], // -2
                show: "First: IP === 71, Second: IP === 75"
            },
            {
                addr: 76,
                ins: "CALL", // 76)
                data: [90],
                show: "IP === 90"
            },
            {
                addr: 78,
                ins: "CFAR", // 78)
                data: [0,0,0,0],
                show: "IP === 83"
            },
            {
                addr: 83,
                ins: "SM", // 83)
                data: [0,0,0,0],
                show: "IP === 86"
            },
            {
                addr: 88,
                ins: "RETF",
                show: "IP === 86 - Exit"
            },

            {
                at: 90,
                addr: 90,
                ins: "RET",
                show: "IP === 91"
            },

            // Data Settings 
            {
                ins: "DATA",
                addr: 100,
                value: 5
            },
            {
                ins: "DATA",
                addr: 103,
                value: 7
            },
            { 
                ins: "DATA",
                addr: 104,
                value: 254
            },
            {
                ins: "DATA",
                addr: 105,
                value: 1
            }
        ];

        return testCode;
    }

    instructionSetTest(initialMemSpace) {
        let testScript = this.getTestScript();
        this.instructionSet.compileTestCode(testScript, initialMemSpace);
    }
}

module.exports = Entity;