const { app } = require('electron');
const path = require('node:path');
const rulesets = require(path.join(__dirname, 'rulesets.js'));

class InstructionSet {
    constructor() {
        this.stackStart = 255;
        this.maxIC = 8000;
        this.maxIP = 255;
        this.highestIP = 0;
        this.registers = {
            A: 0,
            B: 0,
            C: 0,
            SP: this.stackStart,
            ZF: 0,
            CF: 0
        };
        this.callStack = []; 
        this.farCallStack = [];
        this.numIns = 62;
        // Notes: Later we need to decide how the return communication with CFAR functions
        // should be performed.
        // multi-byte numbers are most significant byte first
        this.ins = [
            {
                name: "LD A, (MEM)",
                code: 0,
                insLen: 2,
                redundantPairs: [
                    {
                        name: "LD A, (MEM)",
                        code: 0
                    },
                    {
                        name: "LD A, IMM",
                        code: 2
                    },
                    {
                        name: "LDI A, (MEM)",
                        code: 5
                    },
                    {
                        name: "LDI A, (C)",
                        code: 6
                    },
                    {
                        name: "LDO A, (MEM)",
                        code: 7
                    },
                    {
                        name: "LDO A, (C)",
                        code: 9
                    },
                    {
                        name: "POP A",
                        code: 25
                    }
                ]
            },
            {
                name: "ST (MEM), A",
                code: 1,
                insLen: 2
            },
            {
                name: "LD A, IMM",
                code: 2,
                insLen: 2,
                redundantPairs: [
                    {
                        name: "LD A, (MEM)",
                        code: 0
                    },
                    {
                        name: "LD A, IMM",
                        code: 2
                    },
                    {
                        name: "LDI A, (MEM)",
                        code: 5
                    },
                    {
                        name: "LDI A, (C)",
                        code: 6
                    },
                    {
                        name: "LDO A, (MEM)",
                        code: 7
                    },
                    {
                        name: "LDO A, (C)",
                        code: 9
                    },
                    {
                        name: "POP A",
                        code: 25
                    }
                ]
            },
            {
                name: "LD A, (C)",
                code: 3,
                insLen: 1,
                redundantPairs: [
                    {
                        name: "LD A, (MEM)",
                        code: 0
                    },
                    {
                        name: "LD A, IMM",
                        code: 2
                    },
                    {
                        name: "LDI A, (MEM)",
                        code: 5
                    },
                    {
                        name: "LDI A, (C)",
                        code: 6
                    },
                    {
                        name: "LDO A, (MEM)",
                        code: 7
                    },
                    {
                        name: "LDO A, (C)",
                        code: 9
                    },
                    {
                        name: "POP A",
                        code: 25
                    }
                ]
            },
            {
                name: "ST (C), A",
                code: 4,
                insLen: 1,
                redundantPairs: [
                    {
                        name: "ST (C), A",
                        code: 4
                    }
                ]
            },
            {
                name: "LDI A, (MEM)",    // A from the input parameter memory
                code: 5,
                insLen: 2,
                redundantPairs: [
                    {
                        name: "LD A, (MEM)",
                        code: 0
                    },
                    {
                        name: "LD A, IMM",
                        code: 2
                    },
                    {
                        name: "LDI A, (MEM)",
                        code: 5
                    },
                    {
                        name: "LDI A, (C)",
                        code: 6
                    },
                    {
                        name: "LDO A, (MEM)",
                        code: 7
                    },
                    {
                        name: "LDO A, (C)",
                        code: 9
                    },
                    {
                        name: "POP A",
                        code: 25
                    }
                ]
            },
            {
                name: "LDI A, (C)",
                code: 6,
                insLen: 1,
                redundantPairs: [
                    {
                        name: "LD A, (MEM)",
                        code: 0
                    },
                    {
                        name: "LD A, IMM",
                        code: 2
                    },
                    {
                        name: "LDI A, (MEM)",
                        code: 5
                    },
                    {
                        name: "LDI A, (C)",
                        code: 6
                    },
                    {
                        name: "LDO A, (MEM)",
                        code: 7
                    },
                    {
                        name: "LDO A, (C)",
                        code: 9
                    },
                    {
                        name: "POP A",
                        code: 25
                    }
                ]
            },
            {
                name: "LDO A, (MEM)", // Pass the value of A to the output values
                code: 7,
                insLen: 2,
                redundantPairs: [
                    {
                        name: "LD A, (MEM)",
                        code: 0
                    },
                    {
                        name: "LD A, IMM",
                        code: 2
                    },
                    {
                        name: "LDI A, (MEM)",
                        code: 5
                    },
                    {
                        name: "LDI A, (C)",
                        code: 6
                    },
                    {
                        name: "LDO A, (MEM)",
                        code: 7
                    },
                    {
                        name: "LDO A, (C)",
                        code: 9
                    },
                    {
                        name: "POP A",
                        code: 25
                    }
                ]
            },
            {
                name: "STO (MEM), A",
                code: 8,
                insLen: 2
            },
            {
                name: "LDO A, (C)",
                code: 9,
                insLen: 1,
                redundantPairs: [
                    {
                        name: "LD A, (MEM)",
                        code: 0
                    },
                    {
                        name: "LD A, IMM",
                        code: 2
                    },
                    {
                        name: "LDI A, (MEM)",
                        code: 5
                    },
                    {
                        name: "LDI A, (C)",
                        code: 6
                    },
                    {
                        name: "LDO A, (MEM)",
                        code: 7
                    },
                    {
                        name: "LDO A, (C)",
                        code: 9
                    },
                    {
                        name: "POP A",
                        code: 19
                    }
                ]
            },
            {
                name: "STO (C), A",
                code: 10,
                insLen: 1,
                redundantPairs: [
                    {
                        name: "STO (C), A",
                        code: 10
                    }
                ]
            },
            {
                name: "LDSI A, (C)", // Load A from the sample input
                code: 11,
                insLen: 1
            },
            {
                name: "LDSO A, (C)", // Load A from the sample output
                code: 12,
                insLen: 1
            },
            {
                name: "LDIL A", // Load A with the length of the inputs
                code: 13,
                insLen: 1
            },
            {
                name: "LDOL A", // Load A with the length of the outputs
                code: 14,
                insLen: 1
            },
            {
                name: "LSIL A", // Load A with the length of the sample input
                code: 15,
                insLen: 1
            },
            {
                name: "LSOL A", // Load A with the length of the sample output
                code: 16,
                insLen: 1
            },
            {
                name: "LD B, IMM",
                code: 17,
                insLen: 2
            },
            {
                name: "LD B, (MEM)",
                code: 18,
                insLen: 2
            },
            {
                name: "ST (MEM), B",
                code: 19,
                insLen: 2
            },
            {
                name: "LD C, IMM",
                code: 20,
                insLen: 2
            },
            {
                name: "LD C, (MEM)",
                code: 21,
                insLen: 2
            },
            {
                name: "ST (MEM), C",
                code: 22,
                insLen: 2
            },
            {
                name: "CLR (MEM)",       // Set (MEM) to zero
                code: 23,
                insLen: 2
            },
            {
                name: "PUSH A",
                code: 24,
                insLen: 1
            },
            {
                name: "POP A",
                code: 25,
                insLen: 1
            },
            {
                name: "PUSH B",
                code: 26,
                insLen: 1
            },
            {
                name: "POP B",
                code: 27,
                insLen: 1
            },
            {
                name: "PUSH C",
                code: 28,
                insLen: 1
            },
            {
                name: "POP C",
                code: 29,
                insLen: 1
            },
            {
                name: "INC SP",
                code: 30,
                insLen: 1
            },
            {
                name: "DEC SP",
                code: 31,
                insLen: 1
            },
            {
                name: "SWP A, B",
                code: 32,
                insLen: 1,
                redundantPairs: [
                    {
                        name: "SWP A, B",
                        code: 32
                    }
                ]
            },
            {
                name: "SWP B, C",
                code: 33,
                insLen: 1,
                redundantPairs: [
                    {
                        name: "SWP B, C",
                        code: 33
                    }
                ]
            },
            {
                name: "SWP A, C",
                code: 34,
                insLen: 1,
                redundantPairs: [
                    {
                        name: "SWP A, C",
                        code: 34
                    }
                ]
            },
            {
                name: "INC A",
                code: 35,
                insLen: 1
            },
            {
                name: "DEC A",
                code: 36,
                insLen: 1
            },
            {
                name: "INC B",
                code: 37,
                insLen: 1
            },
            {
                name: "DEC B",
                code: 38,
                insLen: 1
            },
            {
                name: "INC C",
                code: 39,
                insLen: 1
            },
            {
                name: "DEC C",
                code: 40,
                insLen: 1
            },
            {
                name: "ADD A, B",        // Sets carry bit if more than 256
                code: 41,
                insLen: 1
            },
            {
                name: "SUB A, B",        // Sets carry bit if negative result
                code: 42,
                insLen: 1
            },
            {
                name: "AND A, B",
                code: 43,
                insLen: 1,
                redundantPairs: [
                    {
                        name: "AND A, B",
                        code: 43
                    }
                ]
            },
            {
                name: "OR A, B",
                code: 44,
                insLen: 1,
                redundantPairs: [
                    {
                        name: "OR A, B",
                        code: 44
                    }
                ]
            },
            {
                name: "NOT A",
                code: 45,
                insLen: 1,
                redundantPairs: [
                    {
                        name: "NOT A",
                        code: 45 
                    }
                ]
            },
            {
                name: "SL A",
                code: 46,
                insLen: 1
            },
            {
                name: "SR A",
                code: 47,
                insLen: 1
            },
            {       
                name: "CMP A, B",        // If equal, z flag set; if B > A carry flag set; else flags cleared
                code: 48,
                insLen: 1,
                redundantPairs: [
                    {
                        name: "CMP A, B",
                        code: 48
                    }
                ]
            },
            {
                name: "JR", // Unconditional Jump Relative
                code: 49,
                insLen: 2
            },
            {
                name: "JRZ",
                code: 50,
                insLen: 2,
                redundantPairs: [
                    {
                        name: "JRZ",
                        code: 50
                    }
                ]
            },
            {
                name: "JRNZ",
                code: 51,
                insLen: 2,
                redundantPairs: [
                    {
                        name: "JRNZ",
                        code: 51
                    }
                ]
            },
            {
                name: "JRLZ",
                code: 52,
                insLen: 3,
                redundantPairs: [
                    {
                        name: "JRLZ",
                        code: 52
                    }
                ]
            },
            {
                name: "JRC",
                code: 53,
                insLen: 2,
                redundantPairs: [
                    {
                        name: "JRC",
                        code: 53
                    }
                ]
            },
            {
                name: "JRNC",
                code: 54,
                insLen: 2,
                redundantPairs: [
                    {
                        name: "JRNC",
                        code: 54
                    }
                ]
            },
            {
                name: "JRLC",
                code: 55,
                insLen: 3,
                redundantPairs: [
                    {
                        name: "JRLC",
                        code: 55
                    }
                ]
            },
            {
                name: "CALL",
                code: 56,
                insLen: 2
            },
            {
                name: "CASM",              // Call the code at the SM marker
                code: 57,
                insLen: 2
            },
            {
                name: "CFAR",              // Call Far
                code: 58,
                insLen: 5
            },
            {
                name: "RET",
                code: 59,
                insLen: 1,
                redundantPairs: [
                    {
                        name: "RET",
                        code: 59
                    }
                ]
            },
            {
                name: "RETF",               // Return from far call
                code: 60,
                insLen: 1,
                redundantPairs: [
                    {
                        name: "RETF",
                        code: 60
                    }
                ]
            },
            {
                name:"SM",              // Section Marker - no operation used for breeding (4 data bytes)
                code: 61,
                insLen: 2,
                redundantPairs: [
                    {
                        name: "SM",
                        code: 61
                    }
                ]
            }
        ];
    }

    compileCodeFragmentOrTemplate(fragment) {
        // Convert the fragment to binary code
        let labels = [];
        let calls = []
        let codeBlock = [];
        let addr = 0;
        for (let ins of fragment) {
            if ("label" in ins) {
                labels.push({label: ins.label, addr: addr})
            }
            if ("addr" in ins) {
                if (ins.addr < addr) {
                    console.error("compileCodeFragmentOrTemplate, addr overlaps existing addr", ins.addr, addr);
                    throw "Program Error";
                }
                let padding = new Array(ins.addr - addr).fill(255);
                codeBlock = codeBlock.concat(padding);
                addr = codeBlock.length;
            }
            if ("freeform" in ins) {
                let count = ins.freeform;
                for (let i = 0; i < count; i++) {
                    let code = Math.floor(Math.random() * 256);
                    codeBlock.push(code);
                    let insItem = this.getInsDetails(code);
                    if (insItem.insLen > 1) {
                        for (let i = 1; i < insItem.insLen; i++) {
                            codeBlock.push(Math.floor(Math.random() * 256));
                        }
                    }
                }
            }
            else if ("noops" in ins) {
                let numNoops = ins.noops;
                codeBlock = codeBlock.concat(new Array(numNoops).fill(255));
            }
            else if ("ins" in ins) {
                if (typeof ins.ins === 'object') { // ie: array
                    let insName = ins.ins[Math.floor(Math.random() * ins.ins.length)];
                    let tempIns = {...ins};
                    tempIns.ins = insName;
                    this.compileIns(tempIns, codeBlock, calls, addr);
                }
                else {
                    this.compileIns(ins, codeBlock, calls, addr);
                }
            }
            addr = codeBlock.length;
        }

        this.compileLabelRefs(codeBlock, labels, calls);

        return codeBlock;
    }

    compileLabelRefs(codeBlock, labels, calls) {
        for (let call of calls) {
            let label = call.label;
            // Find the label
            let found = false;
            let labelItem = null;
            for (labelItem of labels) {
                if (labelItem.label === label) {
                    found = true;
                    break;
                }
            }
            if (found) {
                let targetAddr = labelItem.addr;
                if (call.rel) {
                    let relAddr;
                    // Relative Address
                    if (call.addr > targetAddr) {
                        relAddr = targetAddr - (call.addr - 1);
                        if (relAddr < -127) {
                            console.error("compileLabelRefs: negative relative address out of range:", label, call.addr);
                            throw "Program Error";
                        } 
                        relAddr = relAddr & 255;
                    }
                    else {
                        relAddr = (targetAddr - (call.addr + 1)) & 255;
                        if (relAddr > 128) {
                            console.error("compileLabelRefs: relative address out of range: ", label, call.addr);
                            throw "Program Error";
                        }
                    }
                    codeBlock[call.addr] = relAddr;
                }
                else {
                    codeBlock[call.addr] = labelItem.addr;
                }
            }
        }
    }

    compileIns(ins, codeBlock, calls, addr) {
        let insItem = this.getInsItemFromIns(ins);
        codeBlock.push(insItem.code);
        if ("data" in ins) {
            let dataGiven = ins.data;
            if (insItem.insLen > 1) {
                // Add data bytes
                for (let i = 0; i < insItem.insLen - 1; i++) {
                    if (typeof dataGiven[i] === "string") {
                        if (dataGiven[i] === "?") {
                            let v = Math.floor(Math.random() * 256);
                            codeBlock.push(v);
                        }
                        else {
                            let rel = false;
                            if (insItem.name.substring(0, 2) === "JR") {
                                rel = true;
                            }
                            calls.push({label: dataGiven[i], addr: addr + 1, rel: rel});
                            codeBlock.push(0);
                        }
                    }
                    else {
                        codeBlock.push(dataGiven[i]);
                    }
                }
            }
        }
        else if ("dataRange" in ins) {
            let a = ins.dataRange[0];
            let b = ins.dataRange[1];
            if (b < a) {
                let c = b;
                b = a;
                a = c;
            }
            let r = b - a + 1;
            let n = Math.floor(Math.random() * r) + a;
            codeBlock.push(n);
        }
    }

    execute(executionCycle, memSpace, codeFlags, initialParams, params, valuesOut, ruleSequenceNum, roundNum) {
        let rule = rulesets.getRuleFromSequence(ruleSequenceNum);
        let IC = 0;
        let IP = 0;
        let highestIP = 0;
        let startIP = 0;
        let SP = this.registers.SP;
        let A = this.registers.A;
        let B = this.registers.B;
        let C = this.registers.C;
        let R = 0;
        let S = 0;
        let ZF = this.registers.ZF;
        let CF = this.registers.CF;
        this.callStack = [];
        let gotRet = false;
        while (IC <= this.maxIC && IP <= this.maxIP && !gotRet) {
            let regObj = this.executeIns(A, B, C, R, S, CF, ZF, SP, IP, executionCycle, memSpace, codeFlags, 
                initialParams, params, valuesOut, ruleSequenceNum, rule, roundNum);
            A = regObj.registers.A;
            B = regObj.registers.B;
            C = regObj.registers.C;
            R = regObj.registers.R;
            S = regObj.registers.S;
            CF = regObj.registers.CF;
            ZF = regObj.registers.ZF;
            SP = regObj.registers.SP;
            IP = regObj.registers.IP;
            if (regObj.RETF) gotRet = true;
            startIP = IP;
            
            if (IP > highestIP) highestIP = IP;
            ++IC;
        }
        this.highestIP = highestIP;
        return {A:A, B:B, C:C, ZF: ZF, CF: CF, SP: SP, IP:IP, highestIP: highestIP, IC:IC, memSpace: memSpace};
    }

    executeIns(A, B, C, R, S, CF, ZF, SP, IP, executionCycle, memSpace, codeFlags, initialParams, params, 
        valuesOut, ruleSequenceNum, rule, roundNum) {
        let sampleIn = null;
        if (rule.sampleIn.length > 1) {
            sampleIn = rule.sampleIn[executionCycle];
        }
        else {
            sampleIn = rule.sampleIn[0];
        }
        let sampleOut = null;
        if (rule.sampleOut.length > 1) {
            sampleOut = rule.sampleOut[executionCycle];
        }
        else {
            sampleOut = rule.sampleOut[0]
        }
        let sampleInLength = sampleIn.length;
        let sampleOutLength = sampleOut.length;
        let inputsLength = initialParams.length;
        let outputsLength = rule.outputs[executionCycle].length;
        if (typeof sampleIn === 'undefined') {
            console.error("sampleIn Undefined");
        }
        if (typeof sampleOut === 'undefined') {
            console.error("sampleOut Undefined");
        }
        if (typeof sampleInLength === 'undefined') {
            console.error('sampleInLength undefined');
        }
        if (typeof sampleOutLength === 'undefined') {
            console.error('sampleOutLength undefined');
        }
        if (typeof inputsLength === 'undefined') {
            console.error('inputsLength undefined');
        }
        if (typeof outputsLength === 'undefined') {
            console.error('outputsLength undefined');
        }
        let ins = memSpace[IP];
        if (IP >= memSpace.length) {
            console.error("executeIns - IP out of range", IP, memSpace.length);
        }
        // Debug
        if (isNaN(ins)) {
            console.error("ExecuteIns - Invalid code:", ins, IP);
            ins = 0;
        }
        else if (!Number.isInteger(ins)) {
            console.error("executeIns: Invalid code (not integer)", ins, IP);
        }
        else if (ins < 0 || ins > 255) {
            console.error("ExecuteIns - code out of range", ins);
            ins = 0;
        }
        if (codeFlags[IP] < 256) ++codeFlags[IP];
        let validIns = true;
        let RETF = false;
        if (ins < this.numIns) {
            // Check for complete instruction
            if (this.ins[ins].insLen + IP > this.maxIP) {
                validIns = false;
                IP = this.maxIP + 1;
            }
        }
        if (validIns) {
            let pointer = 0;
            let pointer2 = 0;
            let value = 0;
            let value2 = 0;
            let value3 = 0;
            let resultObj = null;
            switch(ins) {
                case 0:
                    // LD A, (MEM)
                    ++IP;
                    pointer = memSpace[IP];
                    value = memSpace[pointer];
                    A = value;
                    ++IP;
                    break;
                case 1:
                    // ST (MEM), A
                    ++IP;
                    pointer = memSpace[IP];
                    memSpace[pointer] = A;
                    ++IP;
                    break;
                case 2:
                    // LD A, IMM
                    ++IP;
                    A = memSpace[IP];
                    ++IP;
                    break;
                case 3:
                    // LD A, (C)
                    value = memSpace[C];
                    A = value;
                    ++IP;
                    break;
                case 4:
                    // ST (C), A
                    memSpace[C] = A;
                    ++IP;
                    break;
                case 5:
                    // LDI A, (MEM)
                    ++IP;
                    pointer = memSpace[IP];
                    value = params[pointer];
                    A = value;
                    ++IP;
                    break;
                case 6:
                    // LDI A, (C)
                    A = params[C];
                    ++IP;
                    break;
                case 7:
                    // LDO A, (MEM)
                    ++IP;
                    pointer = memSpace[IP];
                    A = valuesOut[pointer];
                    ++IP;
                    break;
                case 8:
                    // STO (MEM), A
                    ++IP;
                    pointer = memSpace[IP];
                    valuesOut[pointer] = A;
                    // Get byte score
                    /*
                    resultObj = rulesets.getOutputByteScore(A, pointer, initialParams, params, 
                        valuesOut, ruleSequenceNum, roundNum);
                    R = resultObj.totalScore;
                    S = resultObj.totalSignificance;
                    if (isNaN(R) || isNaN(S) || typeof R === 'undefined' || typeof S === 'undefined') {
                        console.log("Invalid R/S", R, S, A, pointer);
                        R = 0;
                        S = 0;
                    }
                    else if (R < 0 || R > 255 || S < 0 || S > 255) {
                        console.log("R/S out of range:", R, S, A, pointer);
                        R = 0;
                        S = 0;
                    }
                    */
                    ++IP;
                    break;
                case 9:
                    // LDO A, (C)
                    A = valuesOut[C];
                    ++IP;
                    break;
                case 10:
                    // STO (C), A
                    valuesOut[C] = A;
                    /*
                    // Get byte score
                    resultObj = rulesets.getOutputByteScore(A, C, initialParams, params, valuesOut, 
                        ruleSequenceNum, roundNum);
                    R = resultObj.totalScore;
                    S = resultObj.totalSignificance;
                    if (isNaN(R) || isNaN(S) || typeof R === 'undefined' || typeof S === 'undefined') {
                        console.log("Invalid R/S", R, S, A, C);
                        R = 0;
                        S = 0;
                    }
                    else if (R < 0 || R > 255 || S < 0 || S > 255) {
                        console.log("R/S out of range:", R, S, A, C);
                        R = 0;
                        S = 0;
                    }
                    */
                    ++IP;
                    break;
                case 11:
                    // LDSI A, (C)
                    if (sampleInLength === 0) {
                        A = 0;
                    }
                    else if (C >= sampleInLength) {
                        A = 0;
                    }
                    else {
                        A = sampleIn[C];
                    }
                    ++IP;
                    break;
                case 12:
                    // LDSO A, (C)
                    if (sampleOutLength === 0) {
                        A = 0;
                    }
                    else if (C >= sampleOutLength) {
                        A = 0;
                    }
                    else {
                        A = sampleOut[C];
                    }
                    ++IP;
                    break;
                case 13:
                    // LDIL A
                    A = inputsLength;
                    ++IP;
                    break;
                case 14:
                    // LDOL A
                    A = outputsLength;
                    ++IP;
                    break;
                case 15:
                    // LSIL A
                    A = sampleInLength;
                    ++IP;
                    break;
                case 16:
                    // LSOL A
                    A = sampleOutLength;
                    ++IP;
                    break;
                case 17:
                    // LD B, IMM
                    ++IP;
                    B = memSpace[IP];
                    ++IP;
                    break;
                case 18:
                    // LD B, (MEM)
                    ++IP;
                    pointer = memSpace[IP];
                    B = memSpace[pointer];
                    ++IP;
                    break;
                case 19:
                    // ST (MEM), B
                    ++IP;
                    pointer = memSpace[IP];
                    memSpace[pointer] = B;
                    ++IP;
                    break;
                case 20:
                    // LD C, IMM
                    ++IP;
                    C = memSpace[IP];
                    ++IP;
                    break;
                case 21:
                    // LD C, (MEM)
                    ++IP;
                    pointer = memSpace[IP];
                    C = memSpace[pointer];
                    ++IP;
                    break;
                case 22:
                    // ST (MEM), C
                    ++IP;
                    pointer = memSpace[IP];
                    memSpace[pointer] = C;
                    ++IP;
                    break;
                case 23:
                    // CLR (MEM)
                    ++IP;
                    pointer = memSpace[IP];
                    memSpace[pointer] = 0;
                    ++IP;
                    break;
                case 24:
                    // PUSH A
                    --SP;
                    if (SP < 0) SP = 0;
                    memSpace[SP] = A;
                    ++IP;
                    break;
                case 25:
                    // POP A
                    A = memSpace[SP];
                    ++SP;
                    if (SP >= memSpace.length) SP = memSpace.length - 1;
                    A === 0 ? ZF = 1 : ZF = 0;
                    ++IP;
                    break;
                case 26:
                    // PUSH B
                    --SP;
                    if (SP < 0) SP = 0;
                    memSpace[SP] = B;
                    ++IP;
                    break;
                case 27:
                    // POP B
                    B = memSpace[SP];
                    ++SP;
                    if (SP >= memSpace.length) SP = memSpace.length - 1;
                    ++IP;
                    break;
                case 28:
                    // PUSH C
                    --SP;
                    if (SP < 0) SP = 0;
                    memSpace[SP] = C;
                    ++IP;
                    break;
                case 29:
                    // POP C
                    C = memSpace[SP];
                    ++SP;
                    if (SP >= memSpace.length) SP = memSpace.length - 1;
                    ++IP;
                    break;
                case 30:
                    // INC SP
                    ++SP;
                    if (SP >= memSpace.length) SP = memSpace.length - 1;
                    ++IP;
                    break;
                case 31:
                    // DEC SP
                    --SP;
                    if (SP < 0) SP = 0;
                    ++IP;
                    break;
                case 32:
                    // SWP A, B
                    value = A;
                    A = B;
                    B = value;
                    A === 0 ? ZF = 1 : ZF = 0;
                    ++IP;
                    break;
                case 33:
                    // SWP B, C
                    value = B;
                    B = C;
                    C = value;
                    ++IP;
                    break;
                case 34:
                    // SWP A, C
                    value = A;
                    A = C;
                    C = value;
                    ++IP;
                    break;
                case 35:
                    // INC A
                    ++A;
                    if (A > 255) {
                        CF = 1;
                        ZF = 1;
                        A = 0;
                    }
                    else {
                        CF = 0;
                        ZF = 0;
                    }
                    ++IP;
                    break;
                case 36:
                    // DEC A
                    --A;
                    if (A === 0) {
                        ZF = 1;
                        CF = 0;
                    }
                    else if (A < 0){
                        A = 255;
                        CF = 1;
                        ZF = 0;
                    }
                    else {
                        CF = 0;
                        ZF = 0;
                    }
                    ++IP;
                    break;
                case 37:
                    // INC B
                    ++B;
                    if (B > 255) {
                        CF = 1;
                        ZF = 1;
                        B = 0;
                    }
                    else {
                        CF = 0;
                        ZF = 0;
                    }
                    ++IP;
                    break;
                case 38:
                    // DEC B
                    --B;
                    if (B < 0) {
                        B = 255;
                        CF = 1;
                        ZF = 0;
                    }
                    else if (B === 0) {
                        ZF = 1;
                        CF = 0;
                    }
                    else {
                        ZF = 0;
                        CF = 0;
                    }
                    ++IP;
                    break;
                case 39:
                    // INC C
                    ++C;
                    if (C > 255) {
                        C = 0;
                        CF = 1;
                        ZF = 1;
                    }
                    else {
                        CF = 0;
                        ZF = 0;
                    }
                    ++IP;
                    break;
                case 40:
                    // DEC C
                    --C;
                    if (C < 0) {
                        C = 255;
                        ZF = 0;
                        CF = 1;
                    }
                    else if (C === 0) {
                        ZF = 1;
                        CF = 0;
                    }
                    else {
                        ZF = 0;
                        CF = 0;
                    }
                    ++IP;
                    break;
                case 41:
                    // ADD A, B
                    A += B;
                    if (A > 255) {
                        CF = 1;
                        A = A & 255;
                    }
                    else {
                        CF = 0;
                    }
                    A === 0 ? ZF = 1 : ZF = 0;
                    ++IP;
                    break;
                case 42:
                    // SUB A, B
                    A -= B;
                    if (A < 0) {
                        CF = 1;
                        ZF = 0;
                        // Allow for representations of negative numbers
                        A = A & 255;
                    }
                    else if (A === 0) {
                        ZF = 1;
                        CF = 0;
                    }
                    else {
                        ZF = 0;
                        CF = 0;
                    }
                    ++IP;
                    break;
                case 43:
                    // AND A, B
                    A = A & B;
                    A === 0 ? ZF = 1 : ZF = 0;
                    ++IP;
                    break;
                case 44:
                    // OR A, B
                    A = A | B;
                    A === 0 ? ZF = 1 : ZF = 0;
                    ++IP;
                    break;
                case 45:
                    // NOT A
                    A = ~A;
                    A = A & 255;
                    A === 0 ? ZF = 1 : ZF = 0;
                    ++IP;
                    break;
                case 46:
                    // SL A
                    A = A * 2;
                    if (A > 255) {
                        CF = 1;
                    }
                    else {
                        CF = 0;
                    }
                    A = A & 255;
                    if (A === 0) {
                        ZF = 1;
                    }
                    else {
                        ZF = 0;
                    }
                    ++IP;
                    break;
                case 47:
                    // SR A
                    let x = A % 2;
                    if (x != 0) {
                        CF = 1;
                    }
                    else {
                        CF = 0;
                    }
                    A = Math.floor(A / 2);
                    A = A & 255;
                    if (A === 0) {
                        ZF = 1;
                    }
                    else {
                        ZF = 0;
                    }
                    ++IP;
                    break;
                case 48:
                    // CMP A, B
                    if (A < B) {
                        CF = 1;
                        ZF = 0;
                    }
                    else if (A === B) {
                        CF = 0;
                        ZF = 1;
                    }
                    else {
                        CF = 0;
                        ZF = 0;
                    }
                    ++IP;
                    break;
                // Jumps relative are taken from the byte preceding or the byte 
                // following the jump instruction
                case 49:
                    // JR
                    pointer = IP;
                    ++IP;
                    pointer2 = memSpace[IP];
                    if (pointer2 & 0x80) {
                        value = -(((~pointer2) & 255) + 1);
                        IP = pointer + value;
                        if (IP < 0) IP = 0;
                    }
                    else {
                        IP += pointer2 + 1;
                        if (IP > 255) IP = 255;
                    }
                    break;
                case 50:
                    // JRZ
                    ++IP;
                    if (ZF) {
                        pointer = memSpace[IP];
                        if (pointer & 0x80) {
                            value = -((~pointer & 255) + 1);
                            IP += value - 1;
                            if (IP < 0) IP = 0;
                        }
                        else {
                            IP += pointer + 1;
                            if (IP > 255) IP = 255;
                        }
                    }
                    else {
                        ++IP;
                    }
                    break;
                case 51:
                    // JRNZ
                    ++IP;
                    if (!ZF) {
                        pointer = memSpace[IP];
                        if (pointer & 0x80) {
                            value = -((~pointer & 255) + 1);
                            IP += value - 1;
                            if (IP < 0) IP = 0;
                        }
                        else {
                            IP += pointer + 1;
                            if (IP > 255) IP = 255;
                        }
                    }
                    else {
                        ++IP;
                    }
                    break;
                case 52:
                    // JRLZ
                    if (ZF) {
                        ++IP;
                        pointer = memSpace[IP];
                        ++IP;
                        pointer2 = memSpace[IP];
                        if (pointer & 0x80) {
                            value = ~pointer & 255;
                            value2 = ((~pointer2 & 255) + 1);
                            value3 = 256 * value + value2;
                            IP -= (value3 + 3);
                            if (IP < 0) IP = 0;
                        }
                        else {
                            value = 256 * pointer + pointer2;
                            IP += value + 1;
                            if (IP > 255) IP = 255;
                        }
                    }
                    else {
                        IP += 3;
                    }
                    break;
                case 53:
                    // JRC
                    ++IP;
                    if (CF) {
                        pointer = memSpace[IP];
                        if (pointer & 0x80) {
                            value = -((~pointer & 255) + 1);
                            IP += (value - 1);
                            if (IP < 0) IP = 0;
                        }
                        else {
                            IP += pointer + 1;
                            if (IP > 255) IP = 255;
                        }
                    }
                    else {
                        ++IP;
                    }
                    break;
                case 54:
                    // JRNC
                    ++IP;
                    if (!CF) {
                        pointer = memSpace[IP];
                        if (pointer & 0x80) {
                            value = -((~pointer & 255) + 1);
                            IP += (value - 1);
                            if (IP < 0) IP = 0;
                        }
                        else {
                            IP += pointer + 1;
                            if (IP > 255) IP = 255;
                        }
                    }
                    else {
                        ++IP;
                    }
                    break;
                case 55:
                    // JRLC
                    if (CF) {
                        ++IP;
                        pointer = memSpace[IP];
                        ++IP;
                        pointer2 = memSpace[IP];
                        if (pointer & 0x80) {
                            value = ~pointer & 255;
                            value2 = ((~pointer2 & 255) + 1);
                            value3 = 256 * value + value2
                            IP -= (value3 + 2);
                            if (IP < 0) IP = 0;
                        }
                        else {
                            value = 256 * pointer + pointer2;
                            IP + value + 1;
                            if (IP > 255) IP = 255;
                        }
                    }
                    else {
                        IP += 3;
                    }
                    break;
                case 56:
                    // CALL
                    ++IP;
                    pointer = memSpace[IP];
                    ++IP;
                    this.callStack.push(IP);
                    IP = pointer;
                    break;
                case 57:
                    // CASM
                    ++IP;
                    value = memSpace[IP];
                    pointer = this.findMarker(memSpace, value);
                    if (pointer >= 0) {
                        this.callStack.push(IP + 1);
                        IP = pointer;
                    }
                    else {
                        ++IP;
                    }
                    break;
                case 58:
                    // CFAR - currently a NOOP
                    IP += 5;
                    break;
                case 59:
                    // RET
                    if (this.callStack.length > 0) {
                        pointer = this.callStack.pop();
                        IP = pointer;
                    }
                    else {
                        ++IP;
                        RETF = true;
                    }
                    break;
                case 60:
                    // RETF
                    RETF = true;
                    break;
                case 61:
                    // SM - used for marking blocks of code, NOOP
                    IP += 2;
                    break;
                default:
                    ++IP;
                    break;
            }
        }
        if (typeof A === 'undefined') {
            console.error("executeIns: Invalid A reg", ins);
        }
        return {registers:{A:A, B:B, C:C, R: R, S: S, CF:CF, ZF:ZF, SP:SP, IP:IP}, RETF: RETF};
    }

    findMarker(memSpace, value) {
        let pointer = -1;
        let found = false;
        let p = 0;
        while (!found && p < memSpace.length) {
            let code = memSpace[p];
            let insItem = this.getInsDetails(code);
            if (insItem.name === "SM") {
                let lbl = memSpace[p + 1];
                if (lbl === value) {
                    pointer = p + 2;
                    found = true;
                    break;
                }
            }
            p += insItem.insLen;
        }
        return pointer;
    }

    compileTestCode(testCode, memSpace) {
        let createMemSpace = false;
        if (memSpace.length === 0) {
            createMemSpace = true;
            memSpace = new Array(256).fill(0);
        }
        let codeBlock = this.compileCodeFragmentOrTemplate(testCode);
        for (let i = 0; i < codeBlock.length; i++) {
            memSpace[i] = codeBlock[i];
        }
        return memSpace;
    }

    getInsItemFromIns(ins) {
        let insObj= this.getInsCode(ins.ins);
        let insCode = insObj.code;
        let insItem = this.ins[insCode];
        return insItem;
    }

    disassemble(data, offset, length) {
        let insList = [];
        for (let i = offset; i < offset + length && i < data.length; i++) {
            let code = data[i];
            let insItem = this.getInsDetails(code);
            let textItem = {};
            textItem.offset = i;
            textItem.code = code;
            textItem.ins = insItem.name;
            textItem.insLen = insItem.insLen;
            textItem.data = [];
            for (let j = 0; j < insItem.insLen - 1 && i + j + 1 < data.length; j++) {
                let byte = data[i + j + 1];
                let value = {decimal: byte, hex: byte.toString(16).toUpperCase()};
                textItem.data.push(value);
            }
            insList.push(textItem);
            i += insItem.insLen - 1;
        }
        return insList;
    }

    stepDisassemble(memSpace, instructionsVisited, IP) {
        let insList = [];
        let stepLine = 0;
        let lineCount = 0;
        for (let i = 0; i < memSpace.length; i++) {
            let textItem = {};
            let code = memSpace[i];
            let insItem = this.getInsDetails(code);
            let insLen = insItem.insLen;
            if (i < IP && i + insLen > IP) {
                textItem.IPMark = "?";
                insLen = IP - i;
            }
            else if (i === IP) {
                textItem.IPMark = ">";
                stepLine = lineCount;
            }
            else if (instructionsVisited[i]) {
                textItem.IPMark = "#";
            }
            else {
                textItem.IPMark = " ";
            }
            textItem.offset = i;
            textItem.code = code;
            textItem.ins = insItem.name;
            textItem.insLen = insLen;
            textItem.data = [];
            for (let j = 0; j < insItem.insLen - 1 && i + j + 1 < memSpace.length; j++) {
                let byte = memSpace[i + j + 1];
                let value = {decimal: byte, hex: byte.toString(16).toUpperCase()};
                textItem.data.push(value);
            }
            insList.push(textItem);
            i += insLen - 1;
            ++lineCount;
        }
        return {stepLine: stepLine, insList: insList};
    }

    getRedundantPairs(insCode) {
        let found = false;
        for (let ins of this.ins) {
            if (ins.code === insCode) {
                found = true;
                break;
            }
        }
        if (found) {
            if ("redundantPairs" in ins) {
                return ins.redundantPairs;
            }
            else {
                return null;
            }
        }
        return null;
    }

    isRedundantPairing(insCode, testCode) {
        let redundants = getRedundantPairs(insCode);
        for (let r of redundants) {
            if (r.code === testCode) {
                return true;
            }           
        }
        return false;
    }

    getInsLen(insCode) {
        if (insCode > this.numIns) {
            return 0;
        }
        return this.ins[insCode].insLen;
    }

    getInsCode(ins) {
        let found = false;
        let code = null;
        let insLen = null;
        for (let setIns of this.ins) {
            if (ins === setIns.name) {
                found = true;
                code = setIns.code;
                insLen = setIns.insLen;
                break;
            }
        }
        if (!found) {
            console.error("getInsCode: ins not found", ins);
        }
        return {code: code, insLen: insLen}
    }

    getInsDetails(code) {
        let insItem = {};
        if (typeof code === 'undefined') {
            console.error("getInsDetails: code is undefined");
        }
        else if (code < 0 || code >= this.numIns) {
            insItem.name = "NOOP/DATA";
            insItem.code = code;
            insItem.insLen = 1;
        }
        else {
            insItem = this.ins[code];
        }
        return insItem;
    }

    countInsInMemSpace(memSpace, memLen, ins) {
        if (memSpace.length < memLen || memSpace.length === 0) {
            console.log("memSpace.length:", memSpace.length, memLen);
            app.quit();
        }
        let count = 0;
        let codeObj = this.getInsCode(ins);
        let code = codeObj.code;
        let addr = 0;
        let end = false;
        while (addr < memLen && addr < memSpace.length && !end) {
            let c = memSpace[addr];
            if (typeof(c) != "number" || isNaN(c)) {
                console.log("Invalid Value in memSpace", c);
                if (addr < memSpace.length) {
                    memSpace[addr] = 0;
                }
                c = 0;
                code = 0;
            }
            if (code === c) ++count;
            let len = this.getInsDetails(c).insLen;
            addr += len;
        }
        return count;
    }

    scoreDistribution(ins, opt, memSpace, codeLen) {
        let codeObj = this.getInsCode(ins);
        let code = codeObj.code;
        let addr = 0;
        let end = false;
        let totalScore = 0;
        let gotFirst = false;
        let startAddr = 0;
        let count = 0;
        while(addr < codeLen && !end) {
            let c = memSpace[addr];
            if (c === code) {
                if (!gotFirst) {
                    gotFirst = true;
                    startAddr = addr;
                }
                else {
                    let d = addr - startAddr;
                    let s = 1 / (1 + Math.abs(opt - d));
                    totalScore += s;
                    ++count;
                    startAddr = addr;
                }
            }
            let insObj = this.getInsDetails(c);
            addr += insObj.insLen;
        }
        // Get the aggregate score
        let score;
        if (count === 0) {
            score = 0;
        }
        else {
            score = totalScore / count;
        }
        return score;
    }
}

module.exports = InstructionSet;