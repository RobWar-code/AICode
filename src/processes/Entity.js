const path = require('node:path');
const rulesets = require(path.join(__dirname, 'rulesets.js'));
const seedFragments = require(path.join(__dirname, 'seedFragments.js'));
const instructionSetLists = require(path.join(__dirname, 'instructionSetLists.js'));
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
    constructor(entityNumber, instructionSet, asRandom, seeded, currentCycle, ruleSequenceNum, roundNum, memSpace) {
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
            [   5,1,2,3,11,15,13,7,8,10,12,32,64,100,128,255, // 0:15
                17,9,64,0,12,15,102,84,87,25,2,18,36,5,7,16 // 16:31
            ],
            [   3,6,22,15,12,18,21,0,1,2,30,40,50,100,150,255, // 0:15
                23,5,18,7,31,126,7,91,8,127,18,54,202,207,4,22 // 16:31
            ]
        ];
        this.valuesOut = new Array(this.valuesOutMax).fill(0);
        this.oldValuesOut = [];
        this.params = new Array(this.paramsMax).fill(0);
        this.oldParams = [];

        this.initialParamsListIndex = 0;
        if (ruleSequenceNum === null) {
            this.ruleSequenceNum = rulesets.ruleSequenceNum;
        }
        else {
            this.ruleSequenceNum = ruleSequenceNum;
        }
        this.ruleParams = rulesets.getParamsInFromRuleSequence(this.ruleSequenceNum);
        if (this.ruleParams === null) {
            this.initialParams = this.initialParamsList[0];
            this.numExecutions = this.initialParamsList.length;
        }
        else {
            this.initialParams = this.ruleParams[0];
            this.numExecutions = this.ruleParams.length;
        }
        this.initialMemSpace = new Array(this.memLength).fill(0);
        this.codeFlags = new Array(this.memLength).fill(0);
        this.executionCount = 0;
        this.memSpace = new Array(this.memLength).fill(0);
        // Other Constants
        this.dataMaxValue = 255;
        if (memSpace != null) {
            this.qualityControlIns("External Breed", memSpace);
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
        this.ruleScores = [];
        let now = new Date();
        this.birthTime = Date.now();
        this.birthDateTime = `${now.toDateString()} ${now.toTimeString()}`;
        this.birthCycle = currentCycle;
        this.roundNum = roundNum;
        this.breedMethod = "Random";
        this.crossSetBreed = false;

        // Step Data
        this.scoreObj = {score: 0, scoreList: null};
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
        const fragmentChance = 0.01;
        this.breedMethod = "Random";
        let numIns = this.instructionSet.numIns;
        let lastIns = -1;
        let checkArray = [];
        for (let i = 0; i < this.memLength; i++) {
            if (Math.random() < fragmentChance) {
                let codeBlock = seedFragments.getCodeFragment(this.instructionSet);
                let j = 0;
                while (i < this.memLength && j < codeBlock.length) {
                    this.initialMemSpace[i] = codeBlock[j];
                    ++i;
                    ++j;
                }
            }
            else if (i < 100) {
                let c = 4;
                let n = 0;

                let redundant = true;
                while (redundant && c >= 0){
                    n = instructionSetLists.selectIns(numIns);
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
                    console.error("Missing code?", n, i);
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
            console.error("qualityControlIns - length wrong", message, memSpace.length);
            if (memSpace.length < this.memLength) {
                for (let i = memSpace.length; i < this.memLength; i++) {
                    memSpace.push(0);
                }
            }
            else {
                memSpace = memSpace.slice(0, this.memLength);
            }
        }
       // Quality Control, check the array
        for (let i = 0; i < memSpace.length; i++) {
            let c = memSpace[i];
            if (typeof c != "number" || c < 0 || c > 255) {
                console.error("qualityControlIns - ", message, c, i);
                memSpace[i] = 0;
            }
        }
    }

    breed(entityNumber, mateEntity, crossSet, cycleCounter, roundNum) {
        let newEntity = null;
        this.crossSetBreed = false;

        if (cycleCounter < this.interbreedCycle || Math.random() < 0.7 || mateEntity === null) {
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
            let interbreedChance = Math.random();
            if (interbreedChance < 0.2) {
                newEntity = this.interbreed(mateEntity, entityNumber, cycleCounter, roundNum);
                newEntity.breedMethod = "Interbreed";
                if (crossSet) this.crossSetBreed = true;
            }
            else if (interbreedChance < 0.4) {
                newEntity = this.interbreed2(mateEntity, entityNumber, cycleCounter, roundNum);
                newEntity.breedMethod = "Interbreed2";
                if (crossSet) this.crossSetBreed = true;
            }
            else if (interbreedChance < 0.6) {
                newEntity = this.interbreedFlagged(mateEntity, entityNumber, cycleCounter, roundNum);
                newEntity.breedMethod = "InterbreedFlagged";
                if (crossSet) this.crossSetBreed = true;
            }
            else if (interbreedChance < 0.9) {
                newEntity = this.interbreedInsMerge(mateEntity, entityNumber, cycleCounter, roundNum);
                newEntity.breedMethod = "InterbreedInsMerge";
                if (crossSet) this.crossSetBreed = true;
            }
            else {
                // Self-breed
                let asRandom = false;
                let seeded = false;
                let ruleSequenceNum = null;
                newEntity = new Entity(this.entityNumber, this.instructionSet, asRandom, seeded, 
                    cycleCounter, ruleSequenceNum, roundNum, this.memSpace);
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
                newEntity.breedMethod = "MonoclonalIns";
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

        const duplicateChance = 0.1;
        const transposeChance = 0.15;
        const replaceChance = 0.6;
        const insertChance = 0.75;
        const deleteChance = 0.97;
        const ruleSeedFragmentChance = 0.985;
        const codeFragmentChance = 1.0;
        const numIns = this.instructionSet.numIns;
        let newCodeSegment = [];
        let oldInsLen = 0;
        let oldCodeItem = [];
        let lastNoChange = false;
        for (let i = 0; i < this.initialMemSpace.length; i++) {
            let oldi = i;
            // Get instruction
            let codeItem = [];
            let code = this.initialMemSpace[i];
            if (typeof code != "number") {
                code = instructionSetLists.selectIns(numIns);
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
            let insLen = insItem.insLen;

            if (Math.random() < codeHitChance) {
                // Create a random instruction
                let n = instructionSetLists.selectIns(numIns);
                let codeItem2 = [];
                codeItem2.push(n);
                let insItem = this.instructionSet.getInsDetails(n);
                for (let j = 1; j < insItem.insLen; j++) {
                    codeItem2.push(Math.floor(Math.random() * (this.dataMaxValue + 1)));
                }

                let hitType = Math.random();
                if (hitType <= duplicateChance) {
                    // Add the current instruction twice
                    let full = false;
                    for (let i = 0; i < 2; i++) {
                        for (let j = 0; j < codeItem.length; j++) {
                            newCodeSegment.push(codeItem[j]);
                            if (newCodeSegment.length >= this.memLength) {
                                full = true;
                                break;
                            }
                        }
                        if (full) break;
                    }
                    // Determine the number of instructions to replace
                    let r = Math.floor(Math.random() * codeItem.length);
                    i += r;
                }
                else if (hitType < transposeChance && newCodeSegment.length > 0 && 
                    lastNoChange && (newCodeSegment.length + oldInsLen + insLen) <= this.memLength) {
                    // Clear the last instruction
                    let len = newCodeSegment.length;
                    newCodeSegment = newCodeSegment.slice(0, len - oldInsLen);
                    newCodeSegment = newCodeSegment.concat(codeItem);
                    newCodeSegment = newCodeSegment.concat(oldCodeItem);
                }
                else if (hitType < replaceChance) {
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
                else if (hitType < deleteChance) {
                    // Delete - exclude the instruction
                }
                else if (hitType < ruleSeedFragmentChance) {
                    // Get a fragment from the fragment list
                    let fragmentList = rulesets.seedRuleFragments;
                    if (fragmentList.length === 0) {
                        // Delete ins - skip instruction
                    }
                    else {
                        let len = fragmentList.length;
                        let fragNum = Math.floor(Math.random() * len);
                        let fragment = fragmentList[fragNum];
                        for (let n of fragment) {
                            if (newCodeSegment.length < this.memLength) {
                                newCodeSegment.push(n);
                            }
                            else {
                                break;
                            }
                        }
                    }
                }
                else {
                    // Insert Code Fragment
                    let codeBlock = seedFragments.getCodeFragment(this.instructionSet);
                    let j = 0;
                    while (newCodeSegment.length < this.memLength && j < codeBlock.length) {
                        newCodeSegment.push(codeBlock[j]);
                    }
                }
                lastNoChange = false;
            }
            else {
                // Insert the old instruction
                for (let j = 0; j < codeItem.length; j++) {
                    newCodeSegment.push(codeItem[j]);
                    if (newCodeSegment.length >= this.memLength) {
                        break;
                    }
                }
                lastNoChange = true;            
            }
            oldInsLen = insLen;
            oldCodeItem = codeItem.concat();
            if (newCodeSegment.length >= this.memLength) break;
        }
        if (newCodeSegment.length < this.memLength) {
            let len = newCodeSegment.length;
            for (let i = 0; i < (this.memLength - len); i++) {
                newCodeSegment.push(0);
            }
        }
        this.qualityControlIns("Monoclonal Ins", newCodeSegment);

        let asRandom = false;
        let seeded = false;
        let ruleSequenceNum = null;
        let entity = new Entity(entityNumber, this.instructionSet, asRandom, seeded, cycleCounter, ruleSequenceNum, roundNum, newCodeSegment);

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
                if (c < 0.1) {
                    // Duplicate
                    newCode.push(v);
                    if (newCode.length < this.memLength) {
                        newCode.push(v);
                    }
                }
                else if (c < 0.15 && newCode.length > 0 && newCode.length + 2 <= this.memLength) {
                    // Transpose
                    let oldV = newCode.pop();
                    newCode.push(v);
                    newCode.push(oldV);
                }
                else if (c < 0.5) {
                    // Replace
                    let n = Math.floor(Math.random() * (this.dataMaxValue + 1));
                    newCode.push(n);
                }
                else if (c < 0.75) {
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
        let ruleSequenceNum = null;
        let entity = new Entity(entityNumber, this.instructionSet, asRandom, seeded, 
            cycleCounter, ruleSequenceNum, roundNum, newCode);
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
        this.qualityControlIns("Interbreed", newMemSpace);
        let asRandom = false;
        let seeded = false;
        let ruleSequenceNum = null;
        let newEntity = new Entity(entityNumber, this.instructionSet, asRandom, seeded, cycleCounter, 
            ruleSequenceNum, roundNum, newMemSpace);
        return newEntity;
    }

    interbreed2(mate, entityNumber, cycleCounter, roundNum) {
        // Fixed length blocks
        let insBlockLen = 12;
        let newProgram = [];
        let entityFlipper = false;
        let pointer1 = 0;
        let pointer2 = 0;
        while (newProgram.length < this.memLength && pointer1 < this.initialMemSpace.length && pointer2 < mate.initialMemSpace.length) {
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
            // Check a
            let i = 0;
            for (let c of a) {
                if (typeof c === 'undefined') {
                    console.error("interbreed2: invalid code", a.length, i);
                }
                ++i;
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
        let ruleSequenceNum = null;
        let newEntity = new Entity(entityNumber, this.instructionSet, asRandom, seeded, cycleCounter, 
            ruleSequenceNum, roundNum, newProgram);
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
        let ruleSequenceNum = null;
        let newEntity = new Entity(entityNumber, this.instructionSet, asRandom, seeded, cycleCounter, 
            ruleSequenceNum, roundNum, memSpace);
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

    interbreedInsMerge(mate, entityNumber, cycleCounter, roundNum) {
        let newCode = [];
        let srcCode = [];
        srcCode.push(this.initialMemSpace);
        srcCode.push(mate.initialMemSpace);
        let p = [];
        p.push(0);
        p.push(0);
        let done = false;
        while (!done) {
            // Choose the parent
            let source = 0;
            if (Math.random() < 0.5) {
                source = 1;
            }
            if (p[source] >= srcCode[source].length) {
                source = (source + 1) % 2;
            }
            let otherSource = (source + 1) % 2;
            // Decide whether insert or swap
            let insert = false;
            if (Math.random() < 0.25) {
                insert = true;
            }
            let insObj = this.getInsBlock(this.memLength, srcCode[source], p[source]);
            // Insert the code block
            let insBlock = insObj.block;
            for (let i = 0; i < insBlock.length; i++) {
                newCode.push(insBlock[i]);
                if (newCode.length >= this.memLength) {
                    done = true;
                    break;
                }
            }
            p[source] += insBlock.length;

            // If this is a swap, increment the other pointer
            if (!insert && p[otherSource] < srcCode[otherSource].length) {
                let ins = srcCode[otherSource][p[otherSource]];
                let insItem = this.instructionSet.getInsDetails(ins);
                p[otherSource] += insItem.insLen;
            }

            // Check for limits
            if ((p[source] >= srcCode[source].length && p[otherSource] >= srcCode[otherSource].length) ||
                newCode.length >= this.memLength) {
                    done = true;
                    break;
            }
        }

        // Check whether the length is correct
        if (newCode.length < this.memLength) {
            let d = this.memLength - newCode.length;
            for (let i = 0; i < d; i++) {
                newCode.push(Math.floor(Math.random() * (this.dataMaxValue + 1)));
            }
        }
        else if (newCode.length > this.memLength) {
            newCode = newCode.slice(0, this.memLength);
        }

        // Create the new entity
        this.qualityControlIns("InterbreedInsMerge", newCode);
        let asRandom = false;
        let seeded = false;
        let ruleSequenceNum = null;
        let newEntity = new Entity(entityNumber, this.instructionSet, asRandom, seeded, cycleCounter, 
            ruleSequenceNum, roundNum, newCode);
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
            if (insLen + p >= memSpace.length) insLen = memSpace.length - p;
            for (let i = 0; i < insLen; i++) {
                let c = memSpace[p + i];
                // Debug
                if (typeof c === 'undefined') {
                    console.error("getInsBlock: invalid code", memSpace.length, p + i, i);
                }
                insBlock.push(c);
            }
            p += insLen;
            ++count;
        }
        return {pointer: p, block: insBlock};
    }

    display(bestSetNum, bestSetEntityNum) {
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

        if (this.ruleParams === null) {
            displayData.initialParamsList = this.initialParamsList;
        }
        else {
            displayData.initialParamsList = this.ruleParams;
        }

        // Registers
        displayData.registers = this.registers;

        // Details
        displayData.bestSetNum = bestSetNum;
        displayData.bestSetEntityNum = bestSetEntityNum;
        displayData.birthCycle = this.birthCycle;
        displayData.entityNumber = this.entityNumber;
        displayData.creationTime = this.birthDateTime;
        displayData.breedMethod = this.breedMethod;
        displayData.score = Math.floor(this.score * 10000)/10000;
        displayData.ruleScores = this.ruleScores;

        return displayData;

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

        let rule = rulesets.getRuleFromSequence(this.ruleSequenceNum);
        let displayGroupBy = 4;
        if ("displayGroupBy" in rule) {
            displayGroupBy = rule.displayGroupBy;
        }
        displayData.displayGroupBy = rule.displayGroupBy;
        displayData.sampleIn = rule.sampleIn;
        displayData.sampleOut = rule.sampleOut;
        displayData.params = this.oldParams;
        displayData.valuesOut = this.oldValuesOut;

        if (this.ruleParams === null) {
            displayData.initialParamsList = this.initialParamsList;
        }
        else {
            displayData.initialParamsList = this.ruleParams;
        }

        // Registers
        displayData.registers = this.registers;

        // Score list
        displayData.scoreList = rulesets.scoreList;
        displayData.ruleScores = this.ruleScores;
        displayData.maxScore = rulesets.getCurrentMaxScore(this.ruleSequenceNum);
        displayData.ruleCompletionRound = rulesets.ruleCompletionRound;
        displayData.score = Math.floor(this.score * 10000)/10000;

        // Details
        displayData.seedName = seedProgram.name;
        displayData.seedDescription = seedProgram.description;

        return displayData;

    }

    doScore(bestSetHighScore, bestSetLowScore) {
        let scoreObj = rulesets.getScore(bestSetHighScore, bestSetLowScore, 
            this.instructionSet, this.initialMemSpace, 
            this.initialParams, this.params, this.valuesOut, this.oldValuesOut, this.executionCount, this.registers.IC, 
            this.instructionSet.highestIP, this.ruleSequenceNum, this.roundNum);
        this.score = scoreObj.score;
        this.transferRuleScores(scoreObj.scoreList);
        return score;
    }

    transferRuleScores(scoreList) {
        this.ruleScores = [];
        for (let scoreItem of scoreList) {
            this.ruleScores.push(scoreItem.score);
        }
    }
    
    getMemData(n, memSpace) {
        let dataObj = {};
        // Get the memSpace data converted
        let memCode = this.instructionSet.disassemble(memSpace, 0, this.memLength);
        dataObj.code = memCode;
        return dataObj;
    }        

    execute(bestSetHighScore, bestSetLowScore) {
        rulesets.zeroScores();
        let memObj = null;
        let scoreObj = null;
        for (let executionCount = 0; executionCount < this.numExecutions; executionCount++) {
            this.copyMem(executionCount);
            memObj = this.instructionSet.execute(executionCount, this.memSpace, this.codeFlags, this.initialParams, 
                this.params, this.valuesOut, this.oldValuesOut, this.ruleSequenceNum,
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
                this.oldValuesOut, executionCount, memObj.IC, this.instructionSet.highestIP, 
                this.ruleSequenceNum, this.roundNum);
            this.score += scoreObj.score;
        }

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
        this.transferRuleScores(scoreObj.scoreList);
        return memObj;
    }

    stepExecute(restart, executionCount) {
        let executionEnded = false;
        if (restart) {
            this.executionCount = executionCount;
            this.scoreObj = {score: 0, scoreList: null};
            this.resetRegisters();
            this.copyMem(this.executionCount);
        }
        if (this.registers.IC === 0 && this.executionCount >= this.numExecutions) {
            return {executionEnded: true};
        }
        if (this.registers.IC === 0) {
            if (this.executionCount === 0) {
                rulesets.zeroScores();
                this.scoreObj = {score: 0, scoreList: null};
            }
            this.resetRegisters();
            this.copyMem(this.executionCount);
        }
        let {A, B, C, R, S, CF, ZF, SP, IP, IC} = this.registers;
        this.instructionVisited[IP] = true;
        this.previousRegisters = {...this.registers};
        let rule = rulesets.getRuleFromSequence(this.ruleSequenceNum);
        let execObj = this.instructionSet.executeIns(A, B, C, R, S, CF, ZF, SP, IP, IC, executionCount, this.memSpace, 
            this.codeFlags, this.initialParams, this.params, this.valuesOut, this.oldValuesOut,
            this.ruleSequenceNum, rule, this.roundNum);
        this.registers = {...execObj.registers, IC: this.registers.IC};
        ++this.registers.IC;
        // Execution Cycle Completed
        if (execObj.RETF || this.registers.IP >= this.memLength || this.registers.IC >= this.instructionSet.maxIC) {
            this.oldValuesOut.push(this.valuesOut.concat());
            this.oldParams.push(this.params.concat());
            this.scoreObj = rulesets.getScore(0, 0, this.instructionSet, 
                this.initialMemSpace, this.codeFlags, this.initialParams, this.params, this.valuesOut, this.oldValuesOut,
                this.registers.IC, this.instructionSet.highestIP, this.ruleSequenceNum, this.roundNum);
            this.score += this.scoreObj.score;
            ++this.executionCount;
            this.registers.IC = 0;
        }
        // Update the rule scores
        if (this.scoreObj.scoreList != null) this.transferRuleScores(this.scoreObj.scoreList);
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
            ruleScores: this.ruleScores,
            scoreObj: this.scoreObj
        }
    }

    copyMem(executionCount) {
        this.valuesOut = new Array(this.valuesOutMax).fill(0);
        this.params = new Array(this.paramsMax).fill(0);
        if (this.ruleParams === null) {
            this.initialParams = this.initialParamsList[executionCount];
        }
        else {
            this.initialParams = this.ruleParams[executionCount];
        }
        for (let i = 0; i < this.initialParams.length; i++) {
            this.params[i] = this.initialParams[i];
        }
        this.memSpace = this.initialMemSpace.concat();
    }

    cloneEntity() {
        let asRandom = false;
        let seeded = false;
        let newEntity = new Entity(this.entityNumber, this.instructionSet, asRandom, seeded, 
            this.birthCycle, this.ruleSequenceNum, this.roundNum, this.initialMemSpace);
        newEntity.breedMethod = this.breedMethod;
        newEntity.score = this.score;
        return newEntity;
    }
}

module.exports = Entity;