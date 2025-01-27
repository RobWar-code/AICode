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
            [   0,1,2,3,11,15,13,7,8,10,12,32,64,100,128,255, // 0:15
                61,82,5,61,85,3,61,80,4,61,86,7,61,81,12,61,84,20,61,87,95,61,83,100, // 16:39 = a b
                43,3,2,43,4,5,43,12,13,43,9,11,43,10,10,43,15,8,43,100,50,43,75,72, // 40:63 +
                45,9,4,45,10,2,45,100,22,45,85,13,45,3,4,45,19,2,45,201,105,45,222,37, // 64:87 -
                42,3,4,42,5,7,42,9,10,42,12,12,42,8,15,42,20,9,42,7,7,42,11,7 // 88:111 *
                // 112:146 ascii numbers
            ],
            [   3,6,9,15,12,18,21,0,1,2,30,40,50,100,150,255, // 0:15
                61,81,5,61,84,3,61,82,4,61,86,7,61,83,12,61,85,20,61,80,95,61,87,100, // 16:39 = a b
                43,5,2,43,10,5,43,22,13,43,19,11,43,17,10,43,18,8,43,109,50,43,77,72, // 40:63 +
                45,19,4,45,17,2,45,107,22,45,87,13,45,3,5,45,21,2,45,209,105,45,217,37, // 64:87 -
                42,3,5,42,5,9,42,9,11,42,13,13,42,9,15,42,20,3,42,7,8,42,12,7 // 88-111 *
                // 112:146 ascii numbers
            ]
        ];
        this.initialParamsList = this.addAsciiParams(this.initialParamsList);

        this.valuesOut = new Array(this.valuesOutMax).fill(0);
        this.oldValuesOut = [];
        this.params = new Array(this.paramsMax).fill(0);
        this.oldParams = [];

        this.initialParamsListIndex = 0;
        this.initialParams = this.initialParamsList[0];
        this.initialMemSpace = new Array(this.memLength).fill(0);
        this.codeFlags = new Array(this.memLength).fill(0);
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

        // Step Data
        this.scoreObj = null;
    }

    addAsciiParams(initialParamsList) {
        let set1 = ["1","5","7","6","9","0","8","3","2","4","17","23","45","77","81","63"]; // 38 chars
        let set2 = ["2","4","8","7","5","9","0","6","1","3","14","39","52","89","96","55"];
        let params1 = insertAsciiStrings(initialParamsList[0], set1);
        initialParamsList[0] = params1;
        let params2 = insertAsciiStrings(initialParamsList[1], set2);
        initialParamsList[1] = params2;

        return initialParamsList;

        function insertAsciiStrings(ip, set) {
            let p = [];
            for (let numStr of set) {
                for (let i = 0; i < numStr.length; i++) {
                    let c = numStr.charCodeAt(i);
                    p.push(c);
                }
                let s = ";";
                p.push(s.charCodeAt(0));
            }
            if (p.length + ip.length >= 256) {
                console.log("initial params too long");
            }
            let op = ip.concat(p);
            return op;
        }

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
            if (Math.random() < 0.5) {
                newEntity = this.monoclonalInsBreed(entityNumber, cycleCounter, roundNum);
                newEntity.breedMethod = "MonoclonalIns";
            }
            else {
                newEntity = this.monoclonalByteBreed(entityNumber, cycleCounter, roundNum);
                newEntity.breedMethod = "MonoclonalByte";
            }
        }
        else {
            if (Math.random() < 0.25) {
                newEntity = this.interbreed(mateEntity, entityNumber, cycleCounter, roundNum);
                newEntity.breedMethod = "Interbreed";
                if (crossSet) this.crossSetBreed = true;
            }
            else if (Math.random() < 0.5) {
                newEntity = this.interbreed2(mateEntity, entityNumber, cycleCounter, roundNum);
                newEntity.breedMethod = "Interbreed2";
                if (crossSet) this.crossSetBreed = true;
            }
            else if (Math.random() < 0.75) {
                newEntity = this.interbreedFlagged(mateEntity, entityNumber, cycleCounter, roundNum);
                newEntity.breedMethod = "InterbreedFlagged";
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
                newEntity = this.monoclonalInsBreed(entityNumber, cycleCounter, roundNum);
                newEntity.breedMethod = "Monoclonal";
            }
        }
        return (newEntity);
    }

    monoclonalInsBreed(entityNumber, cycleCounter, roundNum) {
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

    monoclonalByteBreed(entityNumber, cycleCounter, roundNum) {
        let newCode = [];
        let oldCode = this.initialMemSpace;
        // Determine whether high or low probability of change
        let changeChance = 0.1;
        if (Math.random() < 0.2) changeChance = 0.3;
        for (let v of oldCode) {
            // Determine whether change occurs
            if (Math.random() < changeChance) {
                let c = Math.random();
                if (c < 0.4) {
                    // Replace
                    let n = Math.floor(Math.random() * (this.dataMaxValue + 1));
                    newCode.push(n);
                }
                else if (c < 0.65) {
                    // Insert
                    let n = Math.floor(Math.random() * (this.dataMaxValue + 1));
                    newCode.push(n);
                    newCode.push(v);
                }
                else {
                    // Delete
                    // Do nothing
                }
            }
            else {
                // No change
                newCode.push(v);
            }
        }
        if (newCode.length > this.memLength) {
            newCode = newCode.slice(0, this.memLength);
        }
        else if (newCode.length < this.memLength) {
            newCode = newCode.concat(new Array(this.memLength - newCode.length).fill(0));
        }
        let asRandom = false;
        let seeded = false;
        let entity = new Entity(entityNumber, this.instructionSet, asRandom, seeded, cycleCounter, roundNum, newCode);
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

    interbreedFlagged(mate, entityNumber, cycleCounter, roundNum) {
        let done = false;
        let count = 0;
        let m = [];
        m.push(this.initialMemSpace);
        m.push(mate.initialMemSpace);
        let f = [];
        f.push(this.codeFlags);
        f.push(mate.codeFlags);
        let p = [];
        p.push(0);
        p.push(0);
        let gotBlock = [];
        gotBlock.push(false);
        gotBlock.push(false);
        let memSpace = [];
        let source = Math.floor(Math.random() * 2);
        let startSource = source;
        while (!done) {
            // Search for flagged code block
            if (p[source] < m[source].length) {
                let codeBlockObj = this.getFlaggedCode(m[source], p[source], f[source]);
                let l = codeBlockObj.length;
                if (l > 0) {
                    let block = codeBlockObj.block;
                    if (l + memSpace.length > this.memLength) {
                        block = block.slice(0, this.memLength - memSpace.length);
                    }
                    // join on the code block
                    memSpace = memSpace.concat(block);
                    ++count;
                    gotBlock[source] = true;
                    if (memSpace.length >= this.memLength) {
                        done = true;
                        break;
                    }
                    p[source] = codeBlockObj.nextPointer;
                }
                else {
                    // If a block was not taken from the previous mate
                    if (!gotBlock[(source + 1) % 2]) {
                        // Use the rest of the code for the memSpace
                        let block = m[source].slice(p[source], m[source].length);
                        let l = block.length;
                        if (l + memSpace.length > this.memLength) {
                            block = block.slice(0, this.memLength - block.length);
                        }
                        memSpace = memSpace.concat(block);
                        done = true;
                        break;
                    }
                }
            }
            else {
                if (p[(source + 1) % 2] >= m[(source + 1) % 2].length) {
                    done = true;
                    break;
                }
            }
            source = (source + 1) % 2;
            gotBlock[source] = false;
        }
        // If the memSpace is short, pad it
        if (memSpace.length < this.memLength) {
            let d = this.memLength - memSpace.length;
            for (let i = 0; i < d; i++) {
                memSpace.push(Math.floor(Math.random() * (this.dataMaxValue + 1)));
            }
        }
        else if (memSpace.length > this.memLength) {
            memSpace = memSpace.slice(0, this.memLength);
        }
        this.qualityControlIns("interbreedFlagged", memSpace);

        // Create the new entity
        let asRandom = false;
        let seeded = false;
        let newEntity = new Entity(entityNumber, this.instructionSet, asRandom, seeded, cycleCounter, roundNum, memSpace);
        return newEntity;
    }

    getFlaggedCode(mem, start, flags) {
        let maxBlockSize = 64;
        let minBlockSize = 3;
        let block = [];
        let done = false;
        let p = start;
        let c = 0;
        while (!done) {
            let v = mem[p];
            let insItem = this.instructionSet.getInsDetails(v);
            let insLen = insItem.insLen;
            if (flags[p] > 0 && insItem.name != "NOOP/DATA") {
                ++c;
                for (let i = 0; i < insLen; i++) {
                    if ((p + i) < this.memLength) { 
                        block.push(mem[p + i]);
                    }
                };
                if (c >= maxBlockSize) {
                    done = true;
                    break;
                }
            }
            else {
                if (c < minBlockSize) {
                    c = 0;
                    block = [];
                }
                if (c >= minBlockSize) {
                    done = true;
                    break;
                }
            }
            p += insLen;
            if (p >= mem.length) {
                done = true;
                break;
            }
        }
        return {block: block, length: c, nextPointer: p};
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

    display(mainWindow, bestSetNum, elapsedTime, numTrials, randomCount, monoclonalInsCount, 
        monoclonalByteCount, interbreedCount, 
        interbreed2Count, interbreedFlaggedCount, selfBreedCount, crossSetCount, currentCycle, numRounds) {
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
        displayData.monoclonalInsCount = monoclonalInsCount;
        displayData.monoclonalByteCount = monoclonalByteCount;
        displayData.interbreedCount = interbreedCount;
        displayData.interbreed2Count = interbreed2Count;
        displayData.interbreedFlaggedCount = interbreedFlaggedCount;
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
        for (let executionCount = 0; executionCount < this.numExecutions; executionCount++) {
            this.copyMem(executionCount);
            memObj = this.instructionSet.execute(this.memSpace, this.codeFlags, this.initialParams, 
                this.params, this.valuesOut, 
                this.roundNum);
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
                this.initialMemSpace, this.codeFlags, this.initialParams, this.params, this.valuesOut, 
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
        let executionEnded = false;
        if (restart) {
            this.executionCount = 0;
            this.scoreObj = null;
            this.resetRegisters();
            this.copyMem(this.executionCount);
        }
        if (this.registers.IC === 0 && this.executionCount >= this.numExecutions) {
            return {executionEnded: true};
        }
        if (this.registers.IC === 0) {
            if (this.executionCount === 0) {
                rulesets.initialise();
                this.scoreObj = null;
            }
            this.resetRegisters();
            this.copyMem(this.executionCount);
        }
        let {A, B, C, R, S, CF, ZF, SP, IP, IC} = this.registers;
        this.instructionVisited[IP] = true;
        this.previousRegisters = {...this.registers};
        let execObj = this.instructionSet.executeIns(A, B, C, R, S, CF, ZF, SP, IP, this.memSpace, 
            this.codeFlags, this.initialParams, this.params, this.valuesOut, this.roundNum);
        this.registers = {...execObj.registers, IC: this.registers.IC};
        ++this.registers.IC;
        if (execObj.RETF || this.registers.IP >= this.memLength || this.registers.IC >= this.instructionSet.maxIC) {
            this.oldValuesOut.push(this.valuesOut.concat());
            this.oldParams.push(this.params.concat());
            this.scoreObj = rulesets.getScore(0, 0, this.instructionSet, 
                this.initialMemSpace, this.codeFlags, this.initialParams, this.params, this.valuesOut, 
                this.registers.IC, this.instructionSet.highestIP, this.roundNum);
            this.score += this.scoreObj.score;
            if (this.executionCount > 0) {
                let s = rulesets.scoreOutputDiff(this.oldValuesOut);
                this.score += s;
                this.scoreObj.score += s;
            }
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
            insList: insListObj.insList,
            scoreObj: this.scoreObj
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
}

module.exports = Entity;