const path = require('node:path');
const InstructionSet = require(path.join(__dirname, "InstructionSet"));

        /* Template Instruction Layout
            {
                freeform: n // the number of freeform (random) instructions

                or

                noops: n // Number of noop instructions

                or

                ins: "ins" or ["ins1", "ins2", ...] as alternatives
                data: [n, n ..] or ["?"] for a random value or
                dataRange: [a, b]
            }
        */

const seedTemplates = {

    instructionSet: new InstructionSet(),                 
    templates: [
        {
            name: "addAdjacentParamOp",
            description: "Add adjacent param as indicated by a + op",
            template: [
                // 0
                {
                    ins: "LDIL A"
                },
                {
                    ins: "ST (MEM), A",
                    data: [200] // Main Loop Counter
                },
                {
                    ins: "CLR (MEM)",
                    data: [201] // Input Pointer
                },
                {
                    ins: "CLR (MEM)",
                    data: [202] // Output Pointer
                },
                { 
                    // Main Loop
                    ins: "LD C, (MEM)",
                    data: [201]
                },
                {
                    ins: "LDI A, (C)" // Op
                },
                {
                    ins: "INC C"
                },
                {
                    ins: "PUSH A"
                },
                {
                    ins: "LDI A, (C)" // First Param
                },
                {
                    ins: "INC C"
                },
                {
                    ins: "ST (MEM), A",
                    data: [203] // First Param
                },
                {
                    ins: "LDI A, (C)" // Second Param
                },
                {
                    ins: "INC C"
                },
                {
                    ins: "ST (MEM), C",
                    data: [201] // Input Pointer
                },
                {
                    ins: "ST (MEM), A",
                    data: [203] // Second Param
                },
                {
                    ins: "POP A" // Operator
                },
                {
                    ins: "LD B, IMM",
                    dataRange: [35, 61] // +-*/= etc.
                },
                {
                    ins: "CMP A, B"
                },
                {
                    ins: "JRNZ",
                    data: [13] // Next Instruction
                },
                {
                    ins: "LD C, (MEM)",
                    data: [201] // Output Pointer
                },
                {
                    noops: 12
                },
                {
                    ins: "STO (C), A"
                },
                {
                    ins: "INC C"
                },
                {
                    ins: "ST (MEM), C",
                    data: [201]
                },
                {
                    ins: "POP C" // Input Pointer
                },
                {
                    // Next Loop
                    ins: "LD A, (MEM)",
                    data: [200] // Main Loop Counter
                },
                {
                    ins: "DEC A"
                },
                {
                    ins: "ST (MEM), A",
                    data: [200] 
                },
                {
                    ins: "JRNZ",
                    data: [0xD3] // Main Loop
                },
                {
                    ins: "RETF"
                }
            ]
        },
        {
            // 1
            name: "adjacentParamOps",
            description: "Framework for handling multiple adjacent param ops",
            template: [
                {
                    ins: "CLR (MEM)",
                    data: [201] // Input Pointer
                },
                {
                    ins: "CLR (MEM)",
                    data: [202] // Output Pointer
                },
                {
                    // Main Loop:
                    ins: "LD C, (MEM)",
                    data: [201] // Input Pointer
                },
                {
                    ins: "LDI A, (C)" // A = op
                },
                {
                    ins: "PUSH A"
                },
                {
                    ins: "INC C"
                },
                {
                    ins: "LDI A, (C)"
                },
                {
                    ins: "ST (MEM), A",
                    data: [203] // First param
                },
                {
                    ins: "INC C"
                },
                {
                    ins: "LDI A, (C)"
                },
                {
                    ins: "ST (MEM), A",
                    data: [204] // Second Param
                },
                {
                    ins: "INC C"
                },
                {
                    ins: "ST (MEM), C",
                    data: [201] // Input Pointer
                },
                {
                    ins: "POP A"
                },

                {
                    ins: "LD B, IMM",
                    data: [61] // =
                },
                {
                    ins: "CMP A, B"
                },
                {
                    ins: "JRNZ",
                    data: [15] // Next Op Compare 1
                },
                {
                    noops: 12
                },
                {
                    ins: "JR",
                    data: [94] // Output Result
                },

                {
                    // Next Op Compare 1:
                    ins: "LD B, IMM",
                    data: [42] // *
                },
                {
                    ins: "CMP A, B"
                },
                {
                    ins: "JRNZ",
                    data: [15] // Next Op Compare 2
                },
                {
                    noops: 12
                },
                {
                    ins: "JR",
                    data: [75] // Output Result
                },

                {
                    // Next Op Compare 2:
                    ins: "LD B, IMM",
                    data: [43] // +
                },
                {
                    ins: "CMP A, B"
                },
                {
                    ins: "JRNZ",
                    data: [15] // Next Op Compare 3
                },
                {
                    noops: 12
                },
                {
                    ins: "JR",
                    data: [56] // Output Result
                },

                {
                    // Next Op Compare 3:
                    ins: "LD B, IMM",
                    data: [45] // -
                },
                {
                    ins: "CMP A, B"
                },
                {
                    ins: "JRNZ",
                    data: [15] // Next Op Compare 4
                },
                {
                    ins: "JR", 
                    data: [2] // Calculation
                },
                {
                    // Branch Back:
                    ins: "JR",
                    data: [0xB0] // Main Loop
                },
                {
                    // Calculation:
                    noops: 12
                },
                {
                    ins: "JR",
                    data: [37] // Output Result
                },

                {
                    // Next Op Compare 4:
                    ins: "LD B, IMM",
                    data: [47] // /
                },
                {
                    ins: "CMP A, B"
                },
                {
                    ins: "JRNZ",
                    data: [15] // Next Op Compare 5
                },
                {
                    noops: 12
                },
                {
                    ins: "JR",
                    data: [16] // Output Result
                },

                {
                    // Next Op Compare 5:
                    ins: "LD B, IMM",
                    data: [37] // %
                },
                {
                    ins: "CMP A, B"
                },
                {
                    ins: "JRNZ",
                    data: [19] // Next Process
                },
                {
                    noops: 12
                },

                {
                    // Output Result:
                    ins: "LD C, (MEM)",
                    data: [202] // Output Pointer
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
                {
                    // Next Process
                    ins: "LDIL A"
                },
                {
                    ins: "SWP A, B"
                },
                {
                    ins: "LD A, (MEM)",
                    data: [201] // Input Pointer
                },
                {
                    ins: "CMP A, B"
                },
                {
                    ins: "JRNZ",
                    data: [0xC0] // Main Loop
                },
                {
                    ins: "RETF"
                }
            ]
        },
        {
            // 2
            name: "firstParamExtractLoop",
            description: "Loop with separate i/o pointers using first param", 
            template: [
                {
                    ins: "LDIL A"
                },
                {
                    ins: "ST (MEM), A",
                    data: [200] // Loop Counter
                },
                {
                    ins: "CLR (MEM)",
                    data: [201] // Input Pointer
                },
                {
                    ins: "CLR (MEM)",
                    data: [202] // Output Pointer
                },
                {
                    ins: "LD C, (MEM)",
                    data: [201]
                },
                {
                    ins: "LDI A, (C)"
                },
                {
                    ins: "SWP A, B"
                },
                {
                    // Main Loop
                    ins: "LD C, (MEM)",
                    data: [201] // Input Pointer
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
                    // Perform Operation A, B
                    ins: ["CMP A, B", "SUB A, B", "OR A, B", "AND A, B"]
                },
                {
                    ins: ["JRZ", "JRC", "JRNZ", "JRNC"],
                    data: ["?"]
                },
                {
                    ins: "LD C, (MEM)",
                    data: [202] // Output Pointer
                },
                {
                    ins: "STO (C), A"
                },
                {
                    ins: "INC C"
                },
                {
                    ins: "ST (MEM), C",
                    data: [202] // Output Pointer
                },
                {
                    ins: "LD A, (MEM)",
                    data: [200] // Loop Counter
                },
                {
                    ins: "DEC A"
                },
                {
                    ins: "ST (MEM), A",
                    data: [200]
                },
                {
                    ins: "JRNZ",
                    data: ["?"] // mainloop
                },
                {
                    ins: "RETF"
                }
            ]    
        },
        {
            // 3
            name: "findNumbers",
            description: "Find numbers from the first set in the second",
            template: [
                {
                    // Get input length
                    ins: "LDIL A"
                },
                {
                    // Input counter and start of search section
                    ins: "SR A"
                },
                {
                    ins: "ST (MEM), A",
                    data: [200] // Input Counter
                },
                {
                    ins: "ST (MEM), A",
                    data: [201] // Initial Search Pointer
                },
                {
                    ins: "CLR (MEM)",
                    data: [202] // Input/Output Pointer
                },
                {
                    // Main Loop
                    ins: "LD C, (MEM)",
                    data: [202] // Input / Output Pointer
                },
                {
                    ins: "LDI A, (C)" // Input
                },
                {
                    ins: "SWP A, B" // B = Input
                },
                {
                    ins: "LD C, (MEM)",
                    data: [201] // Search Area
                },
                {
                    ins: "ST (MEM), C",
                    data: [203] // Search Counter
                },
                {
                    ins: "ST (MEM), C",
                    data: [204] // Search Pointer
                },
                {
                    // Search Loop
                    ins: "LD C, (MEM)",
                    data: [204] // Search Pointer 
                },
                {
                    ins: "LDI A, (C)" // A = Test Byte
                },
                {
                    ins: ["CMP A, B", "OR A, B", "AND A, B", "ADD A, B", "SUB A, B"]
                },
                {
                    ins: ["JRNZ", "JRNC", "JRZ", "JRC"],
                    data: [6] // Next Search
                },
                {
                    ins: "SWP A, C" // A = Search Pointer
                },
                {
                    ins: "LD C, (MEM)",
                    data: [202] // Input / Output Pointer
                },
                {
                    ins: "STO (C), A"
                },
                {
                    ins: "JR",
                    data: [10] // Next Input
                },
                {
                    // Next Search:
                    ins: "INC C"
                },
                {
                    ins: "ST (MEM), C",
                    data: [204] // Search Pointer
                },
                {
                    ins: "LD A, (MEM)",
                    data: [203] // Search Counter
                },
                {
                    ins: "DEC A"
                },
                {
                    ins: "ST (MEM), A",
                    data: [203]
                },
                {
                    ins: "JRNZ",
                    data: [0xEC] // Search Loop
                },
                {
                    // Next Input
                    ins: "LD A, (MEM)",
                    data: [202] // Input/Output Pointer
                },
                {
                    ins: "INC A"
                },
                {
                    ins: "ST (MEM), A",
                    data: [202] // Input/Output Pointer
                },
                {
                    ins: "LD A, (MEM)",
                    data: [200] // Input Counter
                },
                {
                    ins: "DEC A"
                },
                {
                    ins: "ST (MEM), A",
                    data: [200]
                },
                {
                    ins: "JRNZ",
                    data: [0xD6] // Main Loop
                },
                {
                    ins: "RETF"
                }
            ]
        },
        {
            // 4
            name: "firstAndSecondParamExtractLoop",
            description: "Extract numbers based on the first and second param",
            template: [
                {
                    ins: "LDIL A"
                },
                {
                    ins: "ST (MEM), A",
                    data: [200] // Loop Counter
                },
                {
                    ins: "CLR (MEM)",
                    data: [201] // Input Pointer
                },
                {
                    ins: "CLR (MEM)",
                    data: [202] // Output Pointer
                },
                {
                    ins: "LDI A, (MEM)",
                    data: [0] // Param 1
                },
                {
                    ins: "ST (MEM), A",
                    data: [203] // Param 1
                },
                {
                    ins: "LDI A, (MEM)",
                    data: [1]
                },
                {
                    ins: "ST (MEM), A",
                    data: [204]
                },
                {
                    // Main Loop:
                    ins: "LD C, (MEM)",
                    data: [201] // Input Pointer
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
                    ins: "SWP A, B"
                },
                {
                    ins: "LD A, (MEM)",
                    data: [203]
                },
                {
                    ins: ["CMP A, B", "SUB A, B", "AND A, B", "OR A, B", "ADD A, B"]
                },
                {
                    ins: ["JRNC", "JRC"],
                    data: [16] // Next Item
                },
                {
                    ins: "JRZ",
                    data: [14] // Next Item
                },
                {
                    ins: "LD A, (MEM)",
                    data: [204]
                },
                {
                    ins: ["CMP A, B", "SUB A, B", "AND A, B", "OR A, B", "ADD A, B"]
                },
                {
                    ins: ["JRNC", "JRC"],
                    data: [9] // Next Item
                },
                {
                    ins: "JRZ",
                    data: [7] // Next Item
                },
                {
                    ins: "SWP A, B"
                },
                {
                    ins: "LD C, (MEM)",
                    data: [202] // Output Pointer
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
                {
                    // Next Item:
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
                    ins: "JRNZ",
                    data: [0xDF] // Main Loop
                },
                {
                    ins: "RETF"
                }
            ]
        },
        {
            // 5
            name: "moduloFirstParam",
            description: "Find the modulus of each parameter using the first parameter",
            template: [ 
                {
                    ins: "LDI A, (C)"
                },
                {
                    ins: "SWP A, B"
                },
                {
                    ins: "LD A, IMM",
                    data: [16]
                },
                {
                    // Main Loop
                    ins: "ST (MEM), A",
                    data: [200]
                },
                {
                    ins: "LDI A, (C)"
                },
                {
                    ins: "ST (MEM), A",
                    data: [201]
                },
                {
                    ins: "CLR (MEM)",
                    data: [202]
                },
                {
                    // Calculation Loop
                    ins: "ST (MEM), A",
                    data: [201]
                },
                {
                    freeform: 10
                },
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
                    ins: "JRNZ",
                    data: [0xE6] // Main Loop
                },
                {
                    ins: "RETF"
                }
            ]
        },
        {
            // 6
            name: "multiplyAdjacentParams",
            description: "multiply adjacent input params and place in output",
            template: [
                {
                    ins: "LDIL A"
                },
                {
                    ins: "SR A"
                },
                {
                    ins: "ST (MEM), A",
                    data: [200] // Loop Counter
                },
                {
                    ins: "CLR (MEM)",
                    data: [201] // Input Pointer
                },
                {
                    ins: "CLR (MEM)",
                    data: [202] // Output Pointer
                },
                {
                    // Main Loop
                    ins: "LD C, (MEM)",
                    data: [201] // Input Pointer
                },
                {
                    ins: "LDI A, (C)"
                },
                {
                    ins: "INC C"
                },
                {
                    ins: "SWP A, B"
                },
                {
                    ins: "LDI A, (C)"
                },
                {
                    ins: "INC C"
                },
                {
                    ins: "ST (MEM), C",
                    data: [201] // Input Pointer
                },
                {
                    ins: "SWP A, C"
                },
                {
                    ins: "LD A, IMM",
                    data: [0]
                },
                {
                    ins: "DEC C"
                },
                {
                    ins: "JRNC",
                    data: [3] // Continue
                },
                {
                    ins: "INC C"
                },
                {
                    ins: "JR",
                    data: [15] // Save Result
                },
                {
                    // Continue
                    noops: 15
                },
                {
                    // Save Result
                    ins: "LD C, (MEM)",
                    data: [202] // Output Pointer
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
                    ins: "JRNZ",
                    data: [0xD4] // Main Loop
                },
                {
                    ins: "RETF"
                }
            ]
        },
        {
            // 7
            name: "seriesOfSeries",
            description: "Create a series of series in the output from first three params",
            template: [
                {
                    ins: "LDI A, (C)"
                },
                {
                    ins: "SWP A, B"
                },
                {
                    ins: "INC C"
                },
                {
                    ins: "LDI A, (C)"
                },
                {
                    ins: "ST (MEM), A",
                    data: [202] // Number of steps
                },
                {
                    ins: "INC C"
                },
                {
                    ins: "LDI A, (C)"
                },
                {
                    ins: "ST (MEM), A",
                    data: [204] // Number of Series
                },
                {
                    ins: "CLR (MEM)",
                    data: [201] // Output Pointer
                },
                {
                    // Series Loop
                    ins: "LD A, (MEM)",
                    data: [202] // Number of Steps
                },
                {
                    ins: "ST (MEM), A",
                    data: [203] // Step Counter
                },
                {
                    ins: "CLR (MEM)",
                    data: [205] // Series Tally
                },
                {
                    // Tally Loop
                    ins: "LD A, (MEM)",
                    data: [205]
                },
                {
                    ins: "STO (C), A"
                },
                { 
                    ins: "INC C"
                },
                {
                    ins: "ADD A, B"
                },
                {
                    ins: "ST (MEM), A",
                    data: [205] //Series Tally
                },
                {
                    ins: "LD A, (MEM)",
                    data: [203] // Step Counter
                },
                {
                    ins: "DEC A"
                },
                {
                    ins: "ST (MEM), A",
                    data: [203] // Step Counter
                },
                {
                    ins: "JRNZ",
                    data: [0xF4] // Tally Loop
                },
                {
                    ins: "LD A, (MEM)",
                    data: [204] // Number Of Series
                },
                {
                    ins: "DEC A"
                },
                {
                    ins: "ST (MEM), A",
                    data: [204]
                },
                {
                    ins: "JRNZ",
                    data: [0xE7] // Series Loop
                }
            ]
        }
    ],

    /**
     * 
     * @param {*} n Optional, choose the nth template if given
     * @returns 
     */
    getSeedTemplate(n) {

        // Choose a template
        let t;
        if (typeof n === 'undefined') {
            t = Math.floor(Math.random() * this.templates.length);
        }
        else {
            t = n;
        }
        let codeItem = this.templates[t].template;
        let codeBlock = this.instructionSet.compileCodeFragmentOrTemplate(codeItem);
        // Debug
        let found = false;
        let i;
        for (i = 0; i < codeBlock.length; i++) {
            let c = codeBlock[i];
            if (typeof c === 'undefined') {
                found = true;
                break;
            }
        }
        if (found) {
            console.error("getSeedTemplate: invalid code at:", t, i);
        }

        let memSpace = new Array(256).fill(0);
        let index = 0;
        for (let code of codeBlock) {
            memSpace[index] = code;
            ++index;
        }
        return memSpace;
    }
}

module.exports = seedTemplates;
