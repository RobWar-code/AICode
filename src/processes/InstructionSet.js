const { app } = require('electron');
const path = require('node:path');
const rulesets = require(path.join(__dirname, 'rulesets.js'));

class InstructionSet {
    constructor() {
        this.stackStart = 255;
        this.maxIC = 2000;
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
        this.numIns = 56;
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
                        code: 7
                    },
                    {
                        name: "LDO A, (MEM)",
                        code: 9
                    },
                    {
                        name: "LDO A, (C)",
                        code: 11
                    },
                    {
                        name: "POP A",
                        code: 15
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
                        code: 7
                    },
                    {
                        name: "LDO A, (MEM)",
                        code: 9
                    },
                    {
                        name: "LDO A, (C)",
                        code: 11
                    },
                    {
                        name: "POP A",
                        code: 21
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
                        code: 7
                    },
                    {
                        name: "LDO A, (MEM)",
                        code: 9
                    },
                    {
                        name: "LDO A, (C)",
                        code: 11
                    },
                    {
                        name: "POP A",
                        code: 21
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
                        code: 7
                    },
                    {
                        name: "LDO A, (MEM)",
                        code: 9
                    },
                    {
                        name: "LDO A, (C)",
                        code: 11
                    },
                    {
                        name: "POP A",
                        code: 21
                    }
                ]
            },
            {
                name: "STI (MEM), A",
                code: 6,
                insLen: 2
            },
            {
                name: "LDI A, (C)",
                code: 7,
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
                        code: 7
                    },
                    {
                        name: "LDO A, (MEM)",
                        code: 9
                    },
                    {
                        name: "LDO A, (C)",
                        code: 11
                    },
                    {
                        name: "POP A",
                        code: 21
                    }
                ]
            },
            {
                name: "STI (C), A",
                code: 8,
                insLen: 1,
                redundantPairs: [
                    {
                        name: "STI (C), A",
                        code: 8
                    }
                ]
            },
            {
                name: "LDO A, (MEM)", // Pass the value of A to the output values
                code: 9,
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
                        code: 7
                    },
                    {
                        name: "LDO A, (MEM)",
                        code: 9
                    },
                    {
                        name: "LDO A, (C)",
                        code: 11
                    },
                    {
                        name: "POP A",
                        code: 21
                    }
                ]
            },
            {
                name: "STO (MEM), A",
                code: 10,
                insLen: 2
            },
            {
                name: "LDO A, (C)",
                code: 11,
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
                        code: 7
                    },
                    {
                        name: "LDO A, (MEM)",
                        code: 9
                    },
                    {
                        name: "LDO A, (C)",
                        code: 11
                    },
                    {
                        name: "POP A",
                        code: 21
                    }
                ]
            },
            {
                name: "STO (C), A",
                code: 12,
                insLen: 1,
                redundantPairs: [
                    {
                        name: "STO (C), A",
                        code: 12
                    }
                ]
            },
            {
                name: "LD B, IMM",
                code: 13,
                insLen: 2
            },
            {
                name: "LD B, (MEM)",
                code: 14,
                insLen: 2
            },
            {
                name: "ST (MEM), B",
                code: 15,
                insLen: 2
            },
            {
                name: "LD C, IMM",
                code: 16,
                insLen: 2
            },
            {
                name: "LD C, (MEM)",
                code: 17,
                insLen: 2
            },
            {
                name: "ST (MEM), C",
                code: 18,
                insLen: 2
            },
            {
                name: "CLR (MEM)",       // Set (MEM) to zero
                code: 19,
                insLen: 2
            },
            {
                name: "PUSH A",
                code: 20,
                insLen: 1
            },
            {
                name: "POP A",
                code: 21,
                insLen: 1
            },
            {
                name: "PUSH B",
                code: 22,
                insLen: 1
            },
            {
                name: "POP B",
                code: 23,
                insLen: 1
            },
            {
                name: "PUSH C",
                code: 24,
                insLen: 1
            },
            {
                name: "POP C",
                code: 25,
                insLen: 1
            },
            {
                name: "INC SP",
                code: 26,
                insLen: 1
            },
            {
                name: "DEC SP",
                code: 27,
                insLen: 1
            },
            {
                name: "SWP A, B",
                code: 28,
                insLen: 1,
                redundantPairs: [
                    {
                        name: "SWP A, B",
                        code: 28
                    }
                ]
            },
            {
                name: "SWP B, C",
                code: 29,
                insLen: 1,
                redundantPairs: [
                    {
                        name: "SWP B, C",
                        code: 29
                    }
                ]
            },
            {
                name: "SWP A, C",
                code: 30,
                insLen: 1,
                redundantPairs: [
                    {
                        name: "SWP A, C",
                        code: 30
                    }
                ]
            },
            {
                name: "LD A, R",
                code: 31,
                insLen: 1
            },
            {
                name: "LD A, S",
                code: 32,
                insLen: 1
            },
            {
                name: "INC A",
                code: 33,
                insLen: 1
            },
            {
                name: "DEC A",
                code: 34,
                insLen: 1
            },
            {
                name: "INC B",
                code: 35,
                insLen: 1
            },
            {
                name: "DEC B",
                code: 36,
                insLen: 1
            },
            {
                name: "INC C",
                code: 37,
                insLen: 1
            },
            {
                name: "DEC C",
                code: 38,
                insLen: 1
            },
            {
                name: "ADD A, B",        // Sets carry bit if more than 256
                code: 39,
                insLen: 1
            },
            {
                name: "SUB A, B",        // Sets carry bit if negative result
                code: 40,
                insLen: 1
            },
            {
                name: "AND A, B",
                code: 41,
                insLen: 1,
                redundantPairs: [
                    {
                        name: "AND A, B",
                        code: 41
                    }
                ]
            },
            {
                name: "OR A, B",
                code: 42,
                insLen: 1,
                redundantPairs: [
                    {
                        name: "OR A, B",
                        code: 42
                    }
                ]
            },
            {
                name: "NOT A",
                code: 43,
                insLen: 1,
                redundantPairs: [
                    {
                        name: "NOT A",
                        code: 43 
                    }
                ]
            },
            {       
                name: "CMP A, B",        // If equal, z flag set; if B > A carry flag set; else flags cleared
                code: 44,
                insLen: 1,
                redundantPairs: [
                    {
                        name: "CMP A, B",
                        code: 44
                    }
                ]
            },
            {
                name: "JR", // Unconditional Jump Relative
                code: 45,
                insLen: 2
            },
            {
                name: "JRZ",
                code: 46,
                insLen: 2,
                redundantPairs: [
                    {
                        name: "JRZ",
                        code: 46
                    }
                ]
            },
            {
                name: "JRLZ",
                code: 47,
                insLen: 3,
                redundantPairs: [
                    {
                        name: "JRLZ",
                        code: 47
                    }
                ]
            },
            {
                name: "JRC",
                code: 48,
                insLen: 2,
                redundantPairs: [
                    {
                        name: "JRC",
                        code: 48
                    }
                ]
            },
            {
                name: "JRLC",
                code: 49,
                insLen: 3,
                redundantPairs: [
                    {
                        name: "JRLC",
                        code: 49
                    }
                ]
            },
            {
                name: "CALL",
                code: 50,
                insLen: 2
            },
            {
                name: "CASM",              // Call the code at the SM marker
                code: 51,
                insLen: 2
            },
            {
                name: "CFAR",              // Call Far
                code: 52,
                insLen: 5
            },
            {
                name: "RET",
                code: 53,
                insLen: 1,
                redundantPairs: [
                    {
                        name: "RET",
                        code: 53
                    }
                ]
            },
            {
                name: "RETF",               // Return from far call
                code: 54,
                insLen: 1,
                redundantPairs: [
                    {
                        name: "RETF",
                        code: 54
                    }
                ]
            },
            {
                name:"SM",              // Section Marker - no operation used for breeding (4 data bytes)
                code: 55,
                insLen: 2,
                redundantPairs: [
                    {
                        name: "SM",
                        code: 55
                    }
                ]
            }
        ];
    }

    execute(memSpace, initialParams, params, valuesOut, test, showDataStart, showDataLen, testScript) {
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
            let regObj = this.executeIns(A, B, C, R, S, CF, ZF, SP, IP, memSpace, initialParams, params, valuesOut);
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
            if (test) {
                this.displayICSteps(ins, A, B, ZF, CF, SP, IC, startIP, IP, memSpace, showDataStart, showDataLen, testScript);
            }
            startIP = IP;
            
            if (IP > highestIP) highestIP = IP;
            ++IC;
        }
        this.highestIP = highestIP;
        return {A:A, B:B, C:C, ZF: ZF, CF: CF, SP: SP, IP:IP, highestIP: highestIP, IC:IC, memSpace: memSpace};
    }

    executeIns(A, B, C, R, S, CF, ZF, SP, IP, memSpace, initialParams, params, valuesOut) {
        let ins = memSpace[IP];
        // Debug
        if (isNaN(ins) || typeof ins === 'undefined') {
            console.log("ExecuteIns - Invalid code:", ins);
            ins = 0;
        }
        else if (ins < 0 || ins > 255) {
            console.log("ExecuteIns - code out of range", ins);
            ins = 0;
        }
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
                    A === 0 ? ZF = 1 : ZF = 0;
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
                    A === 0 ? ZF = 1 : ZF = 0;
                    ++IP;
                    break;
                case 6:
                    // STI (MEM), A
                    ++IP;
                    pointer = memSpace[IP];
                    params[pointer] = A;
                    ++IP;
                    break;
                case 7:
                    // LDI A, (C)
                    A = params[C];
                    ++IP;
                    break;
                case 8:
                    // STI (C), A
                    params[C] = A;
                    ++IP;
                    break;
                case 9:
                    // LDO A, (MEM)
                    ++IP;
                    pointer = memSpace[IP];
                    A = valuesOut[pointer];
                    A === 0 ? ZF = 1 : ZF = 0;
                    ++IP;
                    break;
                case 10:
                    // STO (MEM), A
                    ++IP;
                    pointer = memSpace[IP];
                    valuesOut[pointer] = A;
                    // Get byte score
                    resultObj = rulesets.getOutputByteScore(A, pointer, initialParams, params, valuesOut);
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
                    ++IP;
                    break;
                case 11:
                    // LDO A, (C)
                    A = valuesOut[C];
                    ++IP;
                    break;
                case 12:
                    // STO (C), A
                    valuesOut[C] = A;
                    // Get byte score
                    resultObj = rulesets.getOutputByteScore(A, C, initialParams, params, valuesOut);
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
                    ++IP;
                    break;
                case 13:
                    // LD B, IMM
                    ++IP;
                    B = memSpace[IP];
                    ++IP;
                    break;
                case 14:
                    // LD B, (MEM)
                    ++IP;
                    pointer = memSpace[IP];
                    B = memSpace[pointer];
                    ++IP;
                    break;
                case 15:
                    // ST (MEM), B
                    ++IP;
                    pointer = memSpace[IP];
                    memSpace[pointer] = B;
                    ++IP;
                    break;
                case 16:
                    // LD C, IMM
                    ++IP;
                    C = memSpace[IP];
                    ++IP;
                    break;
                case 17:
                    // LD C, (MEM)
                    ++IP;
                    pointer = memSpace[IP];
                    C = memSpace[pointer];
                    ++IP;
                    break;
                case 18:
                    // ST (MEM), C
                    ++IP;
                    pointer = memSpace[IP];
                    memSpace[pointer] = C;
                    ++IP;
                    break;
                case 19:
                    // CLR (MEM)
                    ++IP;
                    pointer = memSpace[IP];
                    memSpace[pointer] = 0;
                    ++IP;
                    break;
                case 20:
                    // PUSH A
                    --SP;
                    if (SP < 0) SP = 0;
                    memSpace[SP] = A;
                    ++IP;
                    break;
                case 21:
                    // POP A
                    A = memSpace[SP];
                    ++SP;
                    if (SP >= memSpace.length) SP = memSpace.length - 1;
                    A === 0 ? ZF = 1 : ZF = 0;
                    ++IP;
                    break;
                case 22:
                    // PUSH B
                    --SP;
                    if (SP < 0) SP = 0;
                    memSpace[SP] = B;
                    ++IP;
                    break;
                case 23:
                    // POP B
                    B = memSpace[SP];
                    ++SP;
                    if (SP >= memSpace.length) SP = memSpace.length - 1;
                    ++IP;
                    break;
                case 24:
                    // PUSH C
                    --SP;
                    if (SP < 0) SP = 0;
                    memSpace[SP] = C;
                    ++IP;
                    break;
                case 25:
                    // POP C
                    C = memSpace[SP];
                    ++SP;
                    if (SP >= memSpace.length) SP = memSpace.length - 1;
                    ++IP;
                    break;
                case 26:
                    // INC SP
                    ++SP;
                    if (SP >= memSpace.length) SP = memSpace.length - 1;
                    ++IP;
                    break;
                case 27:
                    // DEC SP
                    --SP;
                    if (SP < 0) SP = 0;
                    ++IP;
                    break;
                case 28:
                    // SWP A, B
                    value = A;
                    A = B;
                    B = value;
                    A === 0 ? ZF = 1 : ZF = 0;
                    ++IP;
                    break;
                case 29:
                    // SWP B, C
                    value = B;
                    B = C;
                    C = value;
                    ++IP;
                    break;
                case 30:
                    // SWP A, C
                    value = A;
                    A = C;
                    C = value;
                    ++IP;
                    break;
                case 31:
                    // LD A, R
                    A = R;
                    ++IP;
                    break;
                case 32:
                    // LD A, S
                    A = S;
                    ++IP;
                    break;
                case 33:
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
                case 34:
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
                case 35:
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
                case 36:
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
                case 37:
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
                case 38:
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
                case 39:
                    // ADD A, B
                    A += B;
                    if (A > 255) {
                        CF = 1;
                        A = A % 256;
                    }
                    else {
                        CF = 0;
                    }
                    A === 0 ? ZF = 1 : ZF = 0;
                    ++IP;
                    break;
                case 40:
                    // SUB A, B
                    A -= B;
                    if (A < 0) {
                        CF = 1;
                        ZF = 0;
                        // Allow for representations of negative numbers
                        A = Math.abs(A);
                        A = (~A + 1) & 255;
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
                case 41:
                    // AND A, B
                    A = A & B;
                    A === 0 ? ZF = 1 : ZF = 0;
                    ++IP;
                    break;
                case 42:
                    // OR A, B
                    A = A | B;
                    A === 0 ? ZF = 1 : ZF = 0;
                    ++IP;
                    break;
                case 43:
                    // NOT A
                    A = ~A;
                    A = A & 255;
                    A === 0 ? ZF = 1 : ZF = 0;
                    ++IP;
                    break;
                case 44:
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
                case 45:
                    // JR
                    pointer = IP;
                    ++IP;
                    pointer2 = memSpace[IP];
                    if (pointer2 & 0x80) {
                        value = -(((~pointer2) & 255) + 2);
                        IP = pointer + value;
                        if (IP < 0) IP = 0;
                    }
                    else {
                        IP += pointer2 + 1;
                        if (IP > 255) IP = 255;
                    }
                    break;
                case 46:
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
                case 47:
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
                case 48:
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
                            IP += pointer;
                            if (IP > 255) IP = 255;
                        }
                    }
                    else {
                        ++IP;
                    }
                    break;
                case 49:
                    // JRLC
                    if (CF) {
                        ++IP;
                        pointer = memSpace[IP];
                        ++IP
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
                            IP + value;
                            if (IP > 255) IP = 255;
                        }
                    }
                    else {
                        IP += 3;
                    }
                    break;
                case 50:
                    // CALL
                    ++IP;
                    pointer = memSpace[IP];
                    ++IP;
                    this.callStack.push(IP);
                    IP = pointer;
                    break;
                case 51:
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
                case 52:
                    // CFAR - currently a NOOP
                    IP += 5;
                    break;
                case 53:
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
                case 54:
                    // RETF
                    RETF = true;
                    break;
                case 55:
                    // SM - used for marking blocks of code, NOOP
                    IP += 2;
                    break;
                default:
                    ++IP;
                    break;
            }
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

    displayICSteps(ins, A, B, ZF, CF, SP, IC, startIP, IP, memSpace, showDataStart, showDataLen, testScript) {
        let scriptItem = this.getTestScriptText(testScript, startIP);
        if (scriptItem != null) { 
            console.log(`Command: ${scriptItem.ins}`);
        }
        else {
            console.log("Out of script");
        }
        let actualIns = "NOOP";
        if (ins < this.numIns) {
            actualIns = this.ins[ins].name;
        }
        console.log("Actual Ins: ", actualIns);
        console.log(`Registers - A: ${A} B: ${B}, ZF: ${ZF}, CF: ${CF}, SP: ${SP} IC: ${IC}, endIP: ${IP} startIP: ${startIP}`);
        // Mem Space
        let mem = "Memory - ";
        for (let i = 0; i < showDataLen; i++) {
            let p = i + showDataStart;
            mem += p + ": " + memSpace[p] + " ";
        }
        console.log(mem);
        if (scriptItem != null) {
            console.log("Test Notes: " + scriptItem.text);
        }
        console.log("----------------------------------------");
    }

    getTestScriptText(testScript, codeOffset) {
        console.log("Code Offset:", codeOffset);
        let found = false;
        let text = "";
        for (let codeItem of testScript) {
            if ("addr" in codeItem && "ins" in codeItem) {
                if (codeItem.addr === codeOffset) {
                    found = true;
                    if ("show" in codeItem) {
                        text = codeItem.show;
                    }
                    return {ins: codeItem.ins, text: text};
                }
            }
        }
        return null;
    }

    compileTestCode(testCode, memSpace) {
        let ip = 0;
        for (let codeItem of testCode) {
            if ("at" in codeItem) {
                ip = codeItem["at"];
            }
            if (codeItem["ins"] === "DATA") {
                let addr = codeItem["addr"];
                memSpace[addr] = codeItem["value"];
            }
            else {
                let codeDetails = this.getInsCode(codeItem["ins"]);
                if (codeDetails.code === null) {
                    console.error("Invalid compiler code found at", codeItem.ins);
                }
                else {
                    memSpace[ip] = codeDetails.code;
                    if (codeDetails.insLen > 1 && "data" in codeItem) {
                        let c = 1;
                        for (let n of codeItem["data"]) {
                            memSpace[ip + c] = n;
                            ++c;
                        }
                    }
                    ip = ip + codeDetails.insLen;
                }
            }
        }
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
        if (code < 0 || code >= this.numIns) {
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