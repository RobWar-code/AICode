seedFragments = {
    getCodeFragment(instructionSet) {
        // See seedTemplates.js for object format
        const fragments = [
            [
                {
                    ins: "LDIL A"
                },
                {
                    ins: "ST (MEM), A",
                    data: [200] // Input Loop Counter
                }
            ],
            [
                // Collect and record First Three Parameters
                {
                    ins: "LDI A, (C)",
                },
                {
                    ins: "ST (MEM), A",
                    data: [203]
                },
                {
                    ins: "INC C"
                },
                {
                    ins: "LDI A, (C)",
                },
                {
                    ins: "ST (MEM), A",
                    data: [204]
                },
                {
                    ins: "INC C"
                },
                {
                    ins: "LDI A, (C)",
                },
                {
                    ins: "ST (MEM), A",
                    data: [205]
                },
                {
                    ins: "INC C"
                }
            ],
            [
                // Retrieve Mem
                {
                    ins: "LD A, (MEM)",
                    dataRange: [200, 210]
                },
                {
                    ins: "DEC A"
                },
                {
                    ins: "ST (MEM), A",
                    dataRange: [200, 210]
                },
                {
                    ins: "JRNZ",
                    dataRange: [0xF8, 0xA0]
                }
            ],
            [
                // Decrement Main Loop Counter
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
                    data: ["?"]
                }
            ],
            [
                {
                    ins: "CLR (MEM)",
                    data: [201] // Input Pointer
                }
            ],
            [
                {
                    ins: "CLR (MEM)",
                    data: [202] // Output Pointer
                }
            ],
            [
                // Fetch Input
                {
                    ins: "LD C, (MEM)",
                    data: [201]
                },
                {
                    ins: "LD A, (C)"
                },
                {
                    ins: "INC C"
                },
                {
                    ins: "ST (MEM), C",
                    data: [201]
                }
            ],
            [
                // Send Output
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
                }
            ],
            [
                {
                    // Save first input
                    ins: "LDI A, (MEM)",
                    data: [0]
                },
                {
                    ins: "ST (MEM), A",
                    data: [203] // Constant 1
                }
            ],
            [
                {
                    ins: "LDI A, (MEM)",
                    data: [1]
                },
                {
                    ins: "ST (MEM), A",
                    data: [204]
                }
            ],
            [
                {
                    ins: "LD B, (MEM)",
                    data: [203]
                }
            ],
            [
                {
                    ins: "LD B, (MEM)",
                    data: [204]
                }
            ],
            [
                // For set of inputs in two parts
                {
                    ins: "LDIL A"
                },
                {
                    ins: "SR A"
                },
                {
                    ins: "ST (MEM), A",
                    data: [200]
                },
                {
                    ins: "ST (MEM), A",
                    data: [205]
                }
            ],
            [
                {
                    // Comparison Loop
                    ins: "LD C, (MEM)",
                    data: [205]
                },
                {
                    ins: "LDI A, (C)"
                },
                {
                    ins: "ST (MEM), C",
                    data: [205] // Secondary input pointer
                },
                {
                    ins: "CMP A, B"
                },
                {
                    ins: "JRNZ",
                    data: [9]
                },
                {
                    ins: "SWP A, C"
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
                    ins: "JR",
                    data: ["?"] // Next Number
                },
                {
                    ins: "INC A"
                },
                {
                    ins: "ST (MEM), A",
                    data: [205]
                },
                {
                    ins: "SWP A, B"
                },
                {
                    ins: "LDIL A"
                },
                {
                    ins: "CMP A, B"
                },
                {
                    ins: "JRNZ",
                    data: [0xE9] // Comparison Loop
                },
                {
                    ins: "ST (MEM), A",
                    data: [205]
                }
            ],
            [
                // Divide input length by 3
                {
                    ins: "LDIL A"
                },
                {
                    ins: "LD B, IMM",
                    dataRange: [2,12]
                },
                {
                    ins: "LD C, IMM",
                    data: [0]
                },
                {
                    // Divide Loop
                    ins: "INC C"
                },
                {
                    ins: "SUB A, B"
                },
                {
                    ins: "JRZ",
                    data: [3] // Got product
                },
                {
                    ins: "JRNC",
                    data: [0xFC] // Divide Loop
                },
                {
                    ins: "DEC C"
                },
                {
                    // Got Product:
                    ins: "ST (MEM), C",
                    data: [200] // Main Loop Counter
                }
            ],
            [
                // Section of sort triplets
                {
                    // Sort Loop:
                    ins: "LD C, (MEM)",
                    data: [201] // Triplet Pointer
                },
                {
                    ins: "LDI A, (C)" // First item
                },
                {
                    ins: "SWP A, B"
                },
                {
                    ins: "INC C"
                },
                {
                    ins: "LDI A, (C)" // Second item
                },
                {
                    ins: "CMP A, B"
                },
                {
                    ins: "PUSH C"
                },
                {
                    ins: "LD C, (MEM)",
                    data: [202] // Output Pointer
                },
                {
                    ins: "JRC",
                    data: [7] // Swap
                }
            ],
            [
                {
                    ins: "LD A, (C)"
                },
                {
                    ins: "SWP A, B"
                },
                {
                    ins: "INC C"
                },
                {
                    ins: "LD A, (C)"
                },
                {
                    ins: "INC C"
                },
                {
                    ins: "ST (MEM), C",
                    data: [201] // Input Pointer
                }
            ],
            [
                {
                    ins: "PUSH A" 
                },
                {
                    ins: "POP C"
                },
                {
                    ins: "LD A, IMM",
                    data: [0]
                },
                {
                    ins: "ADD A, B"
                },
                {
                    ins: "DEC C"
                },
                {
                    ins: "JRNZ",
                    data: [0xFE]
                }
            ],
            [
                // Multiply Saved Values
                {
                    ins: "LD A, IMM",
                    data: [0]
                },
                {
                    ins: "LD C, (MEM)",
                    data: [203]
                },
                {
                    ins: "DEC C"
                },
                {
                    ins: "JRC",
                    data: [11] // Output Result
                },
                {
                    ins: "INC C"
                },
                {
                    ins: "LD B, (MEM)",
                    data: [204] // Second Parameter
                },
                {
                    ins: "DEC B"
                },
                {
                    ins: "JRC",
                    data: [5] // Output Value
                },
                {
                    ins: "INC B"
                },
                {
                    ins: "ADD A, B"
                },
                {
                    ins: "DEC C"
                },
                {
                    ins: "JRNZ",
                    data: [0xFE]
                },
                // Output Value
            ],
            [
                // ASCII Numbers
                {
                    ins: "LD A, IMM",
                    data: [205] // Digit Values
                },
                {
                    ins: "ST (MEM), A",
                    data: [203] // Digit Pointer
                },
                {
                    label: "fetchNumLoop",
                    ins: "LD C, (MEM)",
                    data: [201] // Input Pointer
                },
                {
                    // Fetch Input Chars
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
                    ins: "LD B, IMM",
                    data: [59] // ;
                },
                {
                    ins: "CMP A, B"
                },
                {
                    ins: "JRZ",
                    data: ["?"] // Do Calc
                },
                {
                    ins: "LD B, (MEM)",
                    data: [204] // Digit Counter
                },
                {
                    ins: "INC B"
                },
                {
                    ins: "ST (MEM), B",
                    data: [204]
                },
                {
                    ins: "LD C, (MEM)",
                    data: [203] // Digit Pointer
                },
                {
                    ins: "LD B, IMM",
                    data: [48] // 0
                },
                {
                    ins: "SUB A, B"
                },
                {
                    ins: "ST (C), A"
                },
                {
                    ins: "INC C"
                },
                {
                    ins: "ST (MEM), C",
                    data: [203] // Digit Pointer
                },
                {
                    ins: "JR",
                    data: ["fetchNumLoop"]
                }
            ],
            [
                // Totalise ASCII Number
                {
                    ins: "CLR (MEM)",
                    data: [208] // Total
                },
                {
                    ins: "LD C, IMM",
                    data: [205] // Digit Pointer
                },
                {
                    ins: "ST (MEM), C",
                    data: [203]
                },
                {
                    label: "totaliseLoop",
                    ins: "LD C, (MEM)",
                    data: [203] // Digit Pointer
                },
                {
                    ins: "LD A, (C)" // Current Digit 
                },
                {
                    ins: "INC C"
                },
                {
                    ins: "ST (MEM), C",
                    data: [203]
                },
                {
                    ins: "LD C, (MEM)",
                    data: [204] // Digit Counter
                },
                {
                    ins:"ST (MEM), C",
                    data: [210] // Digit Counter Reserve
                },
                {
                    // Get Power Of 10
                    ins: "PUSH A"
                },
                {
                    ins: "DEC C"
                },
                {
                    ins: "ST (MEM), C",
                    data: [204] // Digit Counter
                },
                {
                    ins: "POP B"
                },
                {
                    ins: "PUSH B"
                },
                {
                    ins: "POP A"
                },
                {
                    ins: "JRC",
                    data: ["addToTotal"]
                },
                {
                    label: "powerUp",
                    ins: "LD C, IMM",
                    data: [10]
                },
                {
                    label: "tenTimes",
                    ins: "ADD A, B"
                },
                {
                    ins: "DEC C"
                },
                {
                    ins: "JRNZ",
                    data: ["tenTimes"]
                },
                {
                    ins: "LD C, (MEM)",
                    data: [204] // Digit Counter
                },
                {
                    ins: "DEC C"
                },
                {
                    ins: "ST (MEM), C",
                    data: [204]
                },
                {
                    ins: "JRZ",
                    data: ["addToTotal"]
                },
                {
                    ins: "PUSH A"
                },
                {
                    ins: "POP B"
                },
                {
                    ins: "JR",
                    data: ["powerUp"]
                },
                {
                    label: "addToTotal",
                    ins: "LD B, (MEM)",
                    data: [208] // Total
                },
                {
                    ins: "ADD A, B"
                },
                {
                    ins: "ST (MEM), A",
                    data: [208] // Total
                },
                {
                    ins: "LD C, (MEM)",
                    data: [210] // Digit Counter Reserve
                },
                {
                    ins: "DEC C"
                },
                {
                    ins: "ST (MEM), C",
                    data: [210]
                },
                {
                    ins: "ST (MEM), C",
                    data: [204] // Digit Counter
                },
                {
                    ins: "JRNZ",
                    data: ["totaliseLoop"]
                }

            ]
        ]; // end of fragments

        // Select a fragment
        let fragmentNum = Math.floor(Math.random() * fragments.length);
        let fragment = fragments[fragmentNum];
        let codeBlock = instructionSet.compileCodeFragmentOrTemplate(fragment);
        return codeBlock;
    }

}

module.exports = seedFragments;