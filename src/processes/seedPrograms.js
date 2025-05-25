const seedPrograms = {
    programs: [
        {
            name: "addAdjacentParamOp",
            description: "Add adjacent param as indicated by a + op",
            program: [
                {
                    ins: "LD A, IMM",
                    data: [16] // Main Loop Counter
                },
                {
                    ins: "ST (MEM), A",
                    data: [200] // Main Loop Counter
                },
                {
                    ins: "CLR (MEM)",
                    data: [201] // Output Pointer
                },
                {
                    // Main Loop
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
                    data: [202] // First Param
                },
                {
                    ins: "LDI A, (C)" // Second Param
                },
                {
                    ins: "INC C"
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
                    data: [43] // +
                },
                {
                    ins: "CMP A, B"
                },
                {
                    ins: "JRNZ",
                    data: [13] // Next Instruction
                },
                {
                    ins: "PUSH C" // Input Pointer
                },
                {
                    ins: "LD A, (MEM)",
                    data: [202] // First Param
                },
                {
                    ins: "LD B, (MEM)",
                    data: [203]
                },
                {
                    ins: "ADD A, B"
                },
                {
                    ins: "LD C, (MEM)",
                    data: [201] // Output Pointer
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
                    data: [0xDD] // Main Loop
                },
                {
                    ins: "RETF"
                }
            ]
        },
        {
            name: "addAdjacentParams",
            description: "Output the sum of adjacent parameters",
            program: [
                {
                    ins: "LD A, IMM",
                    data: [16] 
                },
                {
                    ins: "ST (MEM), A",
                    data: [200] // Output Count
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
                    // Process Loop
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
                    ins: "ADD A, B"
                },
                {
                    ins: "INC C"
                },
                {
                    ins: "ST (MEM), C",
                    data: [201] // Input Pointer
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
                    data: [0xEB] // Process Loop
                },
                {
                    ins: "RETF"
                }
            ]
        },
        {
            name: "adjacentParamOps",
            description: "Framework for handling multiple adjacent param ops",
            program: [
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
                    label: "mainLoop",
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
                    data: ["compare1"]
                },
                {
                    ins: "LD C, (MEM)",
                    data: [203] // First Param
                },
                {
                    ins: "LD A, (MEM)",
                    data: [204] // Second Param
                },
                {
                    ins: "STO (C), A"
                },
                {
                    ins: "LD A, (MEM)",
                    data: [202] // Output Pointer
                },
                {
                    ins: "INC A"
                },
                {
                    ins: "ST (MEM), A",
                    data: [202]
                },
                {
                    ins: "JR",
                    data: ["nextProcess"]
                },

                {
                    label: "compare1",
                    ins: "LD B, IMM",
                    data: [43] // +
                },
                {
                    ins: "CMP A, B"
                },
                {
                    ins: "JRNZ",
                    data: ["compare2"] // Next Op Compare 2
                },
                {
                    ins: "LD A, (MEM)",
                    data: [203] // First Param
                },
                {
                    ins: "LD B, (MEM)",
                    data: [204] // Second Param
                },
                {
                    ins: "ADD A, B"
                },
                {
                    ins: "JR",
                    data: ["outputResult"]
                },

                {
                    label: "compare2",
                    ins: "LD B, IMM",
                    data: [45] // -
                },
                {
                    ins: "CMP A, B"
                },
                {
                    ins: "JRNZ",
                    data: ["compare3"]
                },
                {
                    ins: "LD A, (MEM)",
                    data: [203] // First Param
                },
                {
                    ins: "LD B, (MEM)",
                    data: [204] // Second Param
                },
                {
                    ins: "SUB A, B"
                },
                {
                    ins: "JR",
                    data: ["outputResult"] // Output Result
                },

                {
                    // Next Op Compare 3:
                    label: "compare3",
                    ins: "LD B, IMM",
                    data: [42] // *
                },
                {
                    ins: "CMP A, B"
                },
                {
                    ins: "JRNZ",
                    data: ["compare4"] // Next Op Compare 4
                },
                {
                    ins: "JR", 
                    data: ["calculation"] // Calculation
                },
                {
                    // Branch Back:
                    label: "branchBack",
                    ins: "JR",
                    data: ["mainLoop"] // Main Loop
                },
                {
                    label: "calculation",
                    ins: "LD B, (MEM)",
                    data: [203] // First Param
                },
                {
                    ins: "LD A, IMM",
                    data: [0]
                },
                {
                    ins: "CMP A, B"
                },
                {
                    ins: "JRZ",
                    data: ["outputResult"] // Output Result
                },
                {
                    ins: "SWP B, C"
                },
                {
                    ins: "LD B, (MEM)",
                    data: [204] // Second Param
                },
                {
                    ins: "CMP A, B"
                },
                {
                    ins: "JRZ",
                    data: ["outputResult"] // Output Result
                },
                {
                    // Add Loop:
                    ins: "ADD A, B"
                },
                {
                    ins: "DEC C"
                },
                {
                    ins: "JRNZ",
                    data: [0xFE] // Add Loop
                },
                {
                    ins: "JR",
                    data: ["outputResult"] // Output Result
                },

                {
                    // Next Op Compare 4:
                    label: "compare4",
                    ins: "LD B, IMM",
                    data: [47] // /
                },
                {
                    ins: "CMP A, B"
                },
                {
                    ins: "JRNZ",
                    data: ["compare5"] // Next Op Compare 5
                },
                {
                    ins: "LD B, (MEM)",
                    data: [204] // Second Param
                },
                {
                    ins: "LD A, IMM",
                    data: [0]
                },
                {
                    ins: "CMP A, B"
                },
                {
                    ins: "JRZ",
                    data: ["outputResult"] // Output Result
                },
                {
                    ins: "LD B, (MEM)",
                    data: [203] // First Param
                },
                {
                    ins: "CMP A, B"
                },
                {
                    ins: "JRZ",
                    data: ["outputResult"] // Output Result
                },
                {
                    ins: "SWP A, B"
                },
                {
                    ins: "LD B, (MEM)",
                    data: [204]
                },
                {
                    ins: "LD C, IMM",
                    data: [0]
                },
                {
                    // Subtract Loop
                    ins: "SUB A, B"
                },
                {
                    ins: "JRC",
                    data: [7] // Set Div Result
                },
                {
                    ins: "JRZ",
                    data: [3] // Set Div Result + 1 
                },
                {
                    ins: "INC C"
                },
                {
                    ins: "JR",
                    data: [0xFA] // Subtract Loop
                },
                {
                    // Set Div Result + 1
                    ins: "INC C"
                },
                {
                    // Set Div Result
                    ins: "SWP A, C"
                },
                {
                    ins: "JR",
                    data: ["outputResult"] // Output Result
                },

                {
                    // Next Op Compare 5:
                    label: "compare5",
                    ins: "LD B, IMM",
                    data: [37] // %
                },
                {
                    ins: "CMP A, B"
                },
                {
                    ins: "JRNZ",
                    data: ["nextProcess"] // Next Process
                },
                {
                    ins: "LD B, (MEM)",
                    data: [204] // Second Param
                },
                {
                    ins: "LD A, IMM",
                    data: [0]
                },
                {
                    ins: "CMP A, B"
                },
                {
                    ins: "JRZ",
                    data: ["outputResult"] // Output Result
                },
                {
                    ins: "SWP B, C"
                },
                {
                    ins: "LD B, (MEM)",
                    data: [203] // First Param
                },
                {
                    ins: "CMP A, B"
                },
                {
                    ins: "JRZ",
                    data: ["outputResult"] // Output Result
                },
                {
                    ins: "SWP A, B"
                },
                {
                    ins: "SWP B, C"
                },
                {
                    // Sub Loop:
                    ins: "CMP A, B"
                },
                {
                    ins: "JRC",
                    data: ["outputResult"] // Output Result
                },
                {
                    ins: "SUB A, B"
                },
                {
                    ins: "JRNZ",
                    data: [0xFC] // Sub Loop
                },

                {
                    // Output Result:
                    label: "outputResult",
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
                    // Next Process:
                    label: "nextProcess",
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
                    data: ["branchBack"] // Main Loop
                },
                {
                    ins: "RETF"
                }
            ]
        },
        {
            name: "divideAdjacentParams",
            description: "divide inputs by their adjacent parameters",
            program: [
                {
                    ins: "LD A, IMM",
                    data: [16] // Process Loop Counter
                },
                {
                    ins: "ST (MEM), A",
                    data: [200] // Process Loop Counter
                },
                {
                    ins: "CLR (MEM)",
                    data: [201] // Input Pointer
                },
                {
                    ins: "CLR (MEM)",
                    data: [204] // Output Pointer
                },
                {
                    // Process Loop
                    ins: "CLR (MEM)",
                    data: [202] // Division Counter
                },
                {
                    ins: "LD C, (MEM)",
                    data: [201] // Input Pointer
                },
                {
                    ins: "LDI A, (C)"
                },
                {
                    ins: "ST (MEM), A",
                    data: [203] // Remainder
                },
                {
                    ins: "SWP A, B"
                },
                {
                    ins: "INC C"
                },
                {
                    ins: "LDI A, (C)" // Divisor
                },
                {
                    ins: "PUSH B"
                },
                {
                    ins: "LD B, IMM",
                    data: [0]
                },
                {
                    // Compare Divisor 0
                    ins: "CMP A, B"
                },
                {
                    ins: "POP B"
                },
                {
                    ins: "JRNZ",
                    data: [5] // Continue Process
                },
                {
                    // Update pointers after divisor zero
                    ins: "INC C"
                },
                {
                    ins: "ST (MEM), C",
                    data: [201] // Input Pointer
                },
                {
                    // Output 0, and loop back
                    ins: "JR",
                    data: [28] // Output Division Counter
                },
                {
                    // Continue Process
                    ins: "SWP A, B"
                },
                {
                    ins: "INC C"
                },
                {
                    ins: "ST (MEM), C",
                    data: [201] // Input Pointer
                },
                {
                    // Calculation Loop
                    ins: "LD A, (MEM)",
                    data: [203] // Remainder
                },
                {
                    ins: "CMP A, B"
                },
                {
                    ins: "JRC",
                    data: [17] // Division Complete
                },
                {
                    ins: "JRZ",
                    data: [10] // Final Division Count
                },
                {
                    ins: "SUB A, B"
                },
                {
                    ins: "ST (MEM), A",
                    data: [203] // Remainder
                },
                {
                    ins: "LD A, (MEM)",
                    data: [202], // Division Counter
                },
                {
                    ins: "INC A"
                },
                {
                    ins: "ST (MEM), A",
                    data: [202]
                },
                {
                    ins: "JR",
                    data: [0xF1], // Calculation Loop
                },
                {
                    // Final Division Count
                    ins: "LD A, (MEM)",
                    data: [202] // Division Counter
                },
                {
                    ins: "INC A"
                },
                {
                    ins: "ST (MEM), A",
                    data: [202]
                },
                {
                    // Division Complete
                    ins: "LD A, (MEM)",
                    data: [202] // Division Counter
                },
                {
                    // Output Division Counter
                    ins: "LD C, (MEM)",
                    data: [204] // Output Pointer
                },
                {
                    ins: "STO (C), A"
                },
                {
                    ins: "INC C"
                },
                {
                    ins: "ST (MEM), C",
                    data: [204]
                },
                {
                    // Next Process
                    ins: "LD A, (MEM)",
                    data: [200] // Process Loop Counter
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
                    data: [0xC3] // Process Loop
                },
                {
                    ins: "RETF"
                }
            ]
        },
        {
            name: "divideAdjacentParamsOp",
            description: "Divide adjacent params lead by / op",
            program: [
                {
                    ins: "LD A, IMM",
                    data: [16]
                },
                {
                    ins: "ST (MEM), A",
                    data: [200] // Process Counter
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
                    // Process Loop
                    ins: "CLR (MEM)",
                    data: [203] // Subtraction Counter
                },
                {
                    ins: "LD C, (MEM)",
                    data: [201] // Input Pointer
                },
                {
                    ins: "LDI A, (C)" // Op
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
                    data: [47] // "/" op
                },
                {
                    ins: "CMP A, B"
                },
                {
                    ins: "JRZ",
                    data: [11] // Start Division
                },
                {
                    ins: "INC C"
                },
                {
                    ins: "INC C"
                },
                {
                    ins: "ST (MEM), C",
                    data: [201] // Input Pointer
                },
                {
                    ins: "LD C, (MEM)",
                    data: [202] // Output Pointer
                },
                {
                    ins: "INC C"
                },
                {
                    ins: "ST (MEM), C",
                    data: [202] // Output Pointer
                },
                {
                    ins: "JR",
                    data: [48] // Next Process
                },
                {
                    // Start Division
                    ins: "LDI A, (C)" // First Op number to be divided
                },
                {
                    ins: "ST (MEM), A",
                    data: [204] // Remainder
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
                    data: [0]
                },
                {
                    ins: "CMP A, B"
                },
                {
                    ins: "JRNZ",
                    data: [5] // Get Divisor
                },
                {
                    ins: "INC C"
                },
                {
                    ins: "ST (MEM), C",
                    data: [201] // Input Pointer
                },
                {
                    ins: "JR",
                    data: [25] // Output Result
                },
                {
                    // Get Divisor
                    ins: "LDI A, (C)" // Second Param
                },
                {
                    ins: "SWP A, B"
                },
                {
                    ins: "INC C"
                },
                {
                    ins: "ST (MEM), C",
                    data: [201] // Input Pointer
                },
                {
                    ins: "LD A, IMM",
                    data: [0]
                },
                {
                    ins: "CMP A, B"
                },
                {
                    ins: "JRZ",
                    data: [15] // Output Result
                },
                {
                    // Calculation Loop
                    ins: "LD A, (MEM)",
                    data: [204] // Remainder
                },
                {
                    ins: "SUB A, B"
                },
                {
                    ins: "ST (MEM), A",
                    data: [204] // Remainder
                },
                {
                    ins: "PUSH A"
                },
                {
                    ins: "LD A, (MEM)",
                    data: [203] // Division Counter
                },
                {
                    ins: "INC A"
                },
                {
                    ins: "ST (MEM), A",
                    data: [203] // Division Counter
                },
                {
                    ins: "POP A"
                },
                {
                    ins: "CMP A, B"
                },
                {
                    ins: "JRNC",
                    data: [0xF3] // Calculation Loop
                },
                {
                    // Output Result
                    ins: "LD C, (MEM)",
                    data: [202] // Output Pointer
                },
                {
                    ins: "LD A, (MEM)",
                    data: [203] // Division Counter
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
                    // Next Process
                    ins: "LD A, (MEM)",
                    data: [200] // Process Counter
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
                    data: [0xB2] // Process Loop
                },
                {
                    ins: "RETF"
                }
            ]
        },
        {
            name: "divideByFirstParam",
            description: "divide the inputs by the first parameter and output each result",
            program: [ 
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
                    data: [200] // Input/output loop count
                },
                {
                    ins: "LDI A, (C)"
                },
                {
                    ins: "ST (MEM), A",
                    data: [201] // Remaining total
                },
                {
                    ins: "CLR (MEM)",
                    data: [202] // Count of subtractions
                },
                {
                    ins: "ST (MEM), A",
                    data: [201]
                },
                {
                    // Calculation Loop
                    ins: "LD A, (MEM)",
                    data: [201]
                },
                {
                    ins: "CMP A, B"
                },
                {
                    ins: "JRC",
                    data: [17], // Main Loop Back
                },
                {
                    ins: "JRZ",
                    data: [10], // Zero End
                },
                {
                    ins: "SUB A, B"
                },
                {
                    ins: "ST (MEM), A",
                    data: [201]
                },
                {
                    ins: "LD A, (MEM)",
                    data: [202]
                },
                {
                    ins: "INC A"
                },
                {
                    ins: "ST (MEM), A",
                    data: [202]
                },
                {
                    ins: "JR",
                    data: [0xF1] // Calculation Loop
                },
                {
                    // Zero End
                    ins: "LD A, (MEM)",
                    data: [202]
                },
                {
                    ins: "INC A"
                },
                {
                    ins: "ST (MEM), A",
                    data: [202]
                },
                {
                    // Main Loop Back
                    ins: "LD A, (MEM)",
                    data: [202]
                },
                {
                    ins: "STO (C), A"
                },
                {
                    ins: "INC C"
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
                    data: [0xDA] // Main Loop
                },
                {
                    ins: "RETF"
                }
            ]
        },
        {
            name: "findNumbers",
            description: "Output the positions of the first set of numbers in the second",
            program: [
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
                    ins: "CMP A, B"
                },
                {
                    ins: "JRNZ",
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
            name: "getNumbersBetweenFirstTwo",
            description: "Output the input numbers that lie between the first two",
            program: [
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
                    ins: "CMP A, B"
                },
                {
                    ins: "JRNC",
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
                    ins: "CMP A, B",
                },
                {
                    ins: "JRC",
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
            name: "getNumbersGreaterThanFirst",
            description: "Output those input numbers which are greater than the first",
            program: [
                {
                    ins: "LDIL A"
                },
                {
                    ins: "ST (MEM), A",
                    data: [200] // Input Counter
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
                    data: [201] // Input Pointer
                },
                {
                    ins: "LDI A, (C)" // Comparator Value
                },
                {
                    ins: "SWP A, B"
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
                    ins: "CMP A, B"
                },
                {
                    ins: "JRC",
                    data: [8] // Next Input
                },
                {
                    ins: "JRZ",
                    data: [6] // Next Input
                },
                {
                    // Output byte
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
                    // Next Input
                    ins: "LD A, (MEM)",
                    data: [201] // Input Pointer
                },
                {
                    ins: "INC A"
                },
                {
                    ins: "ST (MEM), A",
                    data: [201]
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
                    data: [0xE8] // Main Loop
                },
                {
                    ins: "RETF"
                }
            ]
        },
        {
            name: "greaterThanAdjacentParam",
            description: "Output the greater of the adjacent params from the input",
            program: [
                {
                    ins: "LD A, IMM",
                    data: [16]
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
                    // Process Loop
                    ins: "LD C, (MEM)",
                    data: [201] // Input Pointer
                },
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
                    ins: "SWP A, B"
                },
                {
                    ins: "INC C"
                },
                {
                    ins: "ST (MEM), C",
                    data: [201] // Input Pointer
                },
                {
                    ins: "CMP A, B"
                },
                {
                    ins: "JRNC",
                    data: [1] // Output Param (Second)
                },
                {
                    ins: "SWP A, B"
                },
                {
                    // Output Param
                    ins: "LD C, (MEM)",
                    data: [202], // Output Pointer
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
                    data: [0xE7] // Process Loop
                },
                {
                    ins: "RETF"
                }
            ]
        },
        {
            name: "inputLoop",
            description: "A seed program that reads the input parameters and passes them to the output",
            program: [
                {
                    ins: "LDI A, (C)"
                },
                {
                    ins: "STO (C), A"
                },
                {
                    ins: "INC C"
                },
                {
                    ins: "JR",
                    data: [0xFD]
                }
            ]
        },
        {
            name: "modulo first param",
            description: "Find the modulus of each parameter using the first parameter",
            program: [ 
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
                    ins: "CMP A, B"
                },
                {
                    ins: "JRC",
                    data: [9], // Main Loop Back
                },
                {
                    ins: "JRZ",
                    data: [5], // Zero End
                },
                {
                    ins: "SUB A, B"
                },
                {
                    ins: "ST (MEM), A",
                    data: [201]
                },
                {
                    ins: "JR",
                    data: [0xF6] // Calculation Loop
                },
                {
                    // Zero End
                    ins: "LD A, IMM",
                    data: [0]
                },
                {
                    // Main Loop Back
                    ins: "STO (C), A"
                },
                {
                    ins: "INC C"
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
            name: "moduloParamOperations",
            description: "output the modulo of adjacent bytes denoted by the modulo char",
            program: [
                {
                    ins: "LDIL A"
                },
                {
                    ins: "ST (MEM), A",
                    data: [200] // Input Length Counter
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
                    // Next Op
                    ins: "LD C, (MEM)",
                    data: [201] // Input Pointer
                },
                {
                    // Process Loop
                    ins: "LDI A, (C)" // Operator
                },
                {
                    ins: "INC C"
                },
                {
                    ins: "SWP A, B"
                },
                {
                    ins: "LD A, IMM",
                    data: [37]
                },
                {
                    ins: "CMP A, B"
                },
                {
                    ins: "JRZ",
                    data: [4] // Do Modulo
                },
                {
                    ins: "INC C"
                },
                {
                    ins: "INC C"
                },
                {
                    ins: "JR",
                    data: [24] // Skip Op
                },
                {
                    // Do Modulo
                    ins: "LDI A, (C)" // Remainder
                },
                {
                    ins: "INC C"
                },
                {
                    ins: "ST (MEM), A",
                    data: [203] // Remainder
                },
                {
                    ins: "LDI A, (C)" // Divisor
                },
                {
                    ins: "SWP A, B"
                },
                {
                    ins: "INC C"
                },
                {
                    ins: "ST (MEM), C",
                    data: [201] // Input Pointer
                },
                {
                    ins: "LD A, IMM",
                    data: [0]
                },
                {
                    ins: "CMP A, B"
                },
                {
                    ins: "JRZ",
                    data: [19] // Set Output Zero
                },
                {
                    // Calculation Loop
                    ins: "LD A, (MEM)",
                    data: [203] // Remainder
                },
                {
                    ins: "CMP A, B"
                },
                {
                    ins: "JRZ",
                    data: [14] // Set Output Zero
                },
                {
                    ins: "JRC",
                    data: [14] // Set Output Value
                },
                {
                    ins: "SUB A, B",
                },
                {
                    ins: "ST (MEM), A",
                    data: [203] // Remainder
                },
                {
                    ins: "JR",
                    data: [0xF6] // Next Calculation
                },
                {
                    // Skip Op
                    ins: "LD A, (MEM)",
                    data: [202] // Output Pointer
                },
                {
                    ins: "INC A"
                },
                {
                    ins: "ST (MEM), A",
                    data: [202] // Output Pointer
                },
                {
                    ins: "JR",
                    data: [10] // Next Process
                },
                {
                    // Set Output Zero
                    ins: "LD A, IMM",
                    data: [0]
                },
                {
                    // Set Output Value
                    ins: "PUSH C"
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
                    ins: "POP C" // Input Pointer
                },
                {
                    // Next Process
                    ins: "LD A, (MEM)",
                    data: [200] // Process Counter
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
                    data: [0xC4] // Process Loop
                }
            ]
        },
        {
            name: "multiplyAdjacentParams",
            description: "multiply adjacent params by each other",
            program: [
                {
                    ins: "LD A, IMM",
                    data: [16]
                },
                {
                    ins: "ST (MEM), A",
                    data: [200] // Process Counter
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
                    // Process Loop
                    ins: "CLR (MEM)",
                    data: [203] // Total
                },
                {
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
                    ins: "ST (MEM), A",
                    data: [204] // First Param
                },
                {
                    ins: "LD B, IMM",
                    data: [0]
                },
                {
                    ins: "CMP A, B"
                },
                {
                    ins: "JRNZ",
                    data: [5] // Second Param
                },
                {
                    // First Param is Zero
                    ins: "INC C"
                },
                {
                    ins: "ST (MEM), C",
                    data: [201] // Input Pointer
                },
                {
                    ins: "JR",
                    data: [24] // Store Result
                },
                {
                    // Second Param
                    ins: "LDI A, (C)"
                },
                {
                    ins: "ST (MEM), A",
                    data: [205] // Calculation Counter
                },
                {
                    ins: "INC C"
                },
                {
                    ins: "ST (MEM), C",
                    data: [201] // Input Pointer
                },
                {
                    ins: "CMP A, B"
                },
                {
                    ins: "JRZ",
                    data: [14] // Store Result
                },
                {
                    // Calculation Loop
                    ins: "LD B, (MEM)",
                    data: [204] // First param, number to add
                },
                {
                    ins: "LD A, (MEM)",
                    data: [203] // Total
                },
                {
                    ins: "ADD A, B"
                },
                {
                    ins: "ST (MEM), A",
                    data: [203] // Total
                },
                {
                    ins: "LD A, (MEM)",
                    data: [205] // Calculation Counter
                },
                {
                    ins: "DEC A"
                },
                {
                    ins: "ST (MEM), A",
                    data: [205]
                },
                {
                    ins: "JRNZ",
                    data: [0xF4] // Calculation Loop
                },
                {
                    // Store Result
                    ins: "LD A, (MEM)",
                    data: [203] // Total
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
                    // Next Process
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
                    data: [0xCA] // Process Loop
                },
                {
                    ins: "RETF"
                }
            ]
        },
        {
            name: "multiplyAdjacentParamOp",
            description: "multiply adjacent params as indicated by a * op",
            program: [
                {
                    ins: "LD A, IMM",
                    data: [16] // Main Loop Counter
                },
                {
                    ins: "ST (MEM), A",
                    data: [200] // Main Loop Counter
                },
                {
                    ins: "CLR (MEM)",
                    data: [201] // Output Pointer
                },
                {
                    // Main Loop
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
                    data: [202] // First Param
                },
                {
                    ins: "LDI A, (C)" // Second Param
                },
                {
                    ins: "INC C"
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
                    data: [42] // *
                },
                {
                    ins: "CMP A, B"
                },
                {
                    ins: "JRNZ",
                    data: [13] // Next Instruction
                },
                {
                    ins: "CLR (MEM)",
                    data: [204] // Total
                },
                {
                    ins: "PUSH C" // Input Pointer
                },
                {
                    ins: "LD B, (MEM)",
                    data: [203] // Second Param
                },
                {
                    // Addition Loop
                    ins: "ST (MEM), B",
                    data: [205] // Addition Counter
                },
                {
                    ins: "LD A, IMM",
                    data: [0]
                },
                {
                    ins: "CMP A, B"
                },
                {
                    ins: "JRZ",
                    data: [12] // Multiply Done
                },
                {
                    ins: "LD B, (MEM)",
                    data: [202] // First Param
                },
                {
                    ins: "LD A, (MEM)",
                    data: [204] // Total
                },
                {
                    ins: "ADD A, B"
                },
                {
                    ins: "ST (MEM), A",
                    data: [204] // Total
                },
                {
                    ins: "LD B, (MEM)",
                    data: [205] // Addition Counter
                },
                {
                    ins: "DEC B"
                },
                {
                    ins: "JR",
                    data: [0xEF] // Addition Loop
                },
                {
                    // Multiply Done
                    ins: "LD A, (MEM)",
                    data: [204] // Total
                },
                {
                    ins: "LD C, (MEM)",
                    data: [201] // Output Pointer
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
                    data: [0xC9] // Main Loop
                },
                {
                    ins: "RETF"
                }
            ]
        },
        {
            name: "multiplyParamsByTwo",
            description: "Multiply input parameters by two",
            program: [
                {
                    ins: "LDI A, (C)"
                },
                {
                    ins: "SWP A, B"
                },
                {
                    ins: "PUSH B"
                },
                {
                    ins: "POP A"
                },
                {
                    ins: "ADD A, B"
                },
                {
                    ins: "STO (C), A"
                },
                {
                    ins: "INC C"
                },
                {
                    ins: "JR",
                    data: [0xF9]
                }
            ]
        },
        {
            name: "powerFirstParam",
            description: "Raise the inputs by the power given by the first parameter",
            program: [
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
                    // Main Loop:
                    ins: "LDI A, (MEM)",
                    data: [0] // Power
                },
                {
                    ins: "DEC A"
                },
                {
                    ins: "JRNC",
                    data: [4] // Do Calc 
                },
                {
                    ins: "LD A, IMM",
                    data: [0]
                },
                {
                    ins: "JR",
                    data: [40] // Output Result
                },
                {
                    // Do Calc:
                    ins: "ST (MEM), A",
                    data: [203] // Power Count
                },
                {
                    ins: "SWP A, B" // B = Power Count
                },
                {
                    ins: "LD C, (MEM)",
                    data: [201] // Input Pointer
                },
                {
                    ins: "LDI A, (C)" // Input Param
                },
                {
                    ins: "INC C"
                },
                {
                    ins: "ST (MEM), C",
                    data: [201]
                },
                {
                    ins: "ST (MEM), A",
                    data: [204] // Input Param
                },
                {
                    ins: "PUSH A"
                },
                {
                    ins: "POP C" // C = Input Param
                },
                {
                    ins: "DEC B", // Power Count
                },
                {
                    ins: "JRC",
                    data: [24] // Output Result
                },
                {
                    // Do Further Calc:
                    ins: "PUSH C"
                },
                {
                    ins: "POP B" // ABC are input param
                },
                {
                    ins: "DEC C"
                },
                {
                    // Add Loop:
                    ins: "ADD A, B"
                },
                {
                    ins: "DEC C"
                },
                {
                    ins: "JRNZ",
                    data: [0xFE] // Add Loop
                },
                {
                    ins: "ST (MEM), A",
                    data: [205] // Current Result
                },
                {
                    ins: "LD A, (MEM)",
                    data: [203] // Power Count
                },
                {
                    ins: "DEC A"
                },
                {
                    ins: "ST (MEM), A",
                    data: [203]
                },
                {
                    ins: "LD A, (MEM)",
                    data: [205] // Result
                },
                {
                    ins: "JRZ",
                    data: [8] // Output Result
                },
                {
                    ins: "LD C, (MEM)",
                    data: [204] // Input Param
                },
                {
                    ins: "LD A, (MEM)",
                    data: [205]
                },
                {
                    ins: "PUSH A"
                },
                {
                    ins: "POP B" // Current Result
                },
                {
                    ins: "JR",
                    data: [0xEA] // Add Loop
                },
                {
                    // Output Result:
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
                    data: [0xC2] // Main Loop
                },
                {
                    ins: "RETF"
                }
            ]
        },
        {
            name: "sampleInMinusSampleOut",
            description: "Output whether the sampleOut items are greater than sampleIn",
            program: [
                {
                    ins: "LSIL A"
                },
                {
                    ins: "ST (MEM), A",
                    data: [200] // Counter
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
                    // Process Loop:
                    ins: "LD C, (MEM)",
                    data: [201] // Input Pointer
                },
                {
                    ins: "LDSO A, (C)"
                },
                {
                    ins: "SWP A, B"
                },
                {
                    ins: "LDSI A, (C)"
                },
                {
                    ins: "SUB A, B"
                },
                {
                    ins: "STO (C), A"
                },
                {
                    // Next Item:
                    ins: "INC C"
                },
                {
                    ins: "ST (MEM), C",
                    data: [201]
                },
                {
                    ins: "LD A, (MEM)",
                    data: [200] // Counter
                },
                {
                    ins: "DEC A"
                },
                {
                    ins: "JRNZ",
                    data: [0xF3] // Process Loop
                },
                {
                    ins: "RETF"
                }
            ]
        },
        {
            name: "sampleOutGreaterThanSampleIn",
            description: "Output whether the sampleOut items are greater than sampleIn",
            program: [
                {
                    ins: "LSIL A"
                },
                {
                    ins: "ST (MEM), A",
                    data: [200] // Counter
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
                    // Process Loop:
                    ins: "LD C, (MEM)",
                    data: [201] // Input Pointer
                },
                {
                    ins: "LDSO A, (C)"
                },
                {
                    ins: "SWP A, B"
                },
                {
                    ins: "LDSI A, (C)"
                },
                {
                    ins: "CMP A, B"
                },
                {
                    ins: "JRC",
                    data: [5] // Do Greater Than
                },
                {
                    ins: "LD A, IMM",
                    data: [0]
                },
                {
                    ins: "STO (C), A"
                },
                {
                    ins: "JR",
                    data: [3] // Next Item
                },
                {
                    // Do Greater Than:
                    ins: "LD A, IMM",
                    data: [1]
                },
                {
                    ins: "STO (C), A"
                },
                {
                    // Next Item:
                    ins: "INC C"
                },
                {
                    ins: "ST (MEM), C",
                    data: [201]
                },
                {
                    ins: "LD A, (MEM)",
                    data: [200] // Counter
                },
                {
                    ins: "DEC A"
                },
                {
                    ins: "JRNZ",
                    data: [0xEB] // Process Loop
                },
                {
                    ins: "RETF"
                }
            ]
        },
        {
            name: "seriesOfSeries",
            description: "seriesOfSeries solution",
            program: [
                {
                    ins: "LDI A, (MEM)",
                    data: [2]
                },
                {
                    ins: "ST (MEM), A",
                    data: [200]
                },
                {
                    // Main Loop
                    ins: "LDI A, (MEM)",
                    data: [1]
                },
                {
                    ins: "ST (MEM), A",
                    data: [201]
                },
                {
                    // Inner Loop
                    ins: "LDI A, (MEM)",
                    data: [0]
                },
                {
                    ins: "ST (MEM), A",
                    data: [202]
                },
                {
                    ins: "CLR (MEM)",
                    data: [203]
                },
                {
                    ins: "LD B, (MEM)",
                    data: [202]
                },
                {
                    ins: "LD A, (MEM)",
                    data: [203]
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
                    data: [203]
                },
                {
                    ins: "LD A, (MEM)",
                    data: [201]
                },
                {
                    ins: "DEC A"
                },
                {
                    ins: "ST (MEM), A",
                    data: [201]
                },
                {
                    ins: "JRNZ",
                    data: [0xF3] // Inner Loop
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
                    data: [0xE0] // Main Loop
                },
                {
                    ins: "RETF"
                }
            ]
        },
        {
            name: "sortInput",
            description: "Sort the whole input in the output",
            program: [
                {
                    ins: "LDIL A" // Input Length
                },
                {
                    ins: "ST (MEM), A",
                    data: [200] // Input Counter
                },
                {
                    ins: "LD C, IMM",
                    data: [0]
                },
                {
                    // Transfer Loop:
                    ins: "LDI A, (C)"
                },
                {
                    ins: "STO (C), A"
                },
                {
                    ins: "INC C"
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
                    data: [0xF8] // Transfer Loop
                },
                {
                    // Prepare for bubble sort
                    ins: "CLR (MEM)",
                    data: [200] // Bubble Up Pointer
                },
                {
                    ins: "CLR (MEM)",
                    data: [201] // Bubble Down Pointer
                },
                {
                    // Bubble Up Loop
                    ins: "LD C, (MEM)",
                    data: [200] // Bubble Up Pointer
                },
                {
                    ins: "LDO A, (C)" // First Item
                },
                {
                    ins: "SWP A, B"
                },
                {
                    ins: "INC C"
                },
                {
                    ins: "LDO A, (C)"
                },
                {
                    ins: "CMP A, B"
                },
                {
                    ins: "JRNC",
                    data: [16], // Next Bubble Up
                },
                {
                    // First Item is Higher
                    ins: "DEC C"
                },
                {
                    ins: "STO (C), A"
                },
                {
                    ins: "SWP A, B"
                },
                {
                    ins: "INC C"
                },
                {
                    ins: "STO (C), A"
                },
                {
                    // Check For Bubble Down
                    ins: "DEC C"
                },
                {
                    ins: "JRZ",
                    data: [8] // Next Bubble Up
                },
                {
                    ins: "DEC C"
                },
                {
                    ins: "LDO A, (C)" // Previous Item
                },
                {
                    ins: "INC C"
                },
                {
                    ins: "CMP A, B"
                },
                {
                    ins: "ST (MEM), C",
                    data: [201] // Bubble Down Pointer 
                },
                {
                    ins: "JRNC",
                    data: [12] // Bubble Down Loop
                },
                {
                    // Next Bubble Up:
                    ins: "LD A, (MEM)",
                    data: [200] // Bubble up pointer
                },
                {
                    ins: "INC A"
                },
                {
                    ins: "ST (MEM), A",
                    data: [200]
                },
                {
                    ins: "SWP A, B"
                },
                {
                    ins: "LDIL A"
                },
                {
                    ins: "DEC A"
                },
                {
                    ins: "CMP A, B"
                },
                {
                    ins: "JRNZ",
                    data: [0xDE] // Bubble Up Loop
                },
                {
                    ins: "RETF"
                },
                {
                    // Bubble Down Loop:
                    ins: "LD C, (MEM)",
                    data: [201] // Bubble Down Pointer
                },
                {
                    ins: "LDO A, (C)" // First Item
                },
                {
                    ins: "DEC C"
                },
                {
                    ins: "SWP A, B"
                },
                {
                    ins: "LDO A, (C)" // Second Item
                },
                {
                    ins: "CMP A, B"
                },
                {
                    ins: "JRC",
                    data: [0xED] // Next Bubble Up
                },
                {
                    ins: "SWP A, B"
                },
                {
                    ins: "STO (C), A"
                },
                {
                    ins: "INC C"
                },
                {
                    ins: "SWP A, B"
                },
                {
                    ins: "STO (C), A"
                },
                {
                    // Next Bubble Down:
                    ins: "LD C, (MEM)",
                    data: [201] // Bubble Down Pointer
                },
                {
                    ins: "DEC C"
                },
                {
                    ins: "ST (MEM), C",
                    data: [201]
                },
                {
                    ins: "JRNZ",
                    data: [0xED] // Bubble Down Loop
                },
                {
                    ins: "JR",
                    data: [0xDF] // Next Bubble Up
                }
            ]
        },
        {
            name: "sortTriplets",
            description: "Sort groups of three from the input data",
            program: [
                {
                    ins: "LD A, IMM",
                    data: [8] // Number of triplets 
                },
                {
                    ins: "ST (MEM), A",
                    data: [200] // Triplet Counter
                },
                {
                    ins: "CLR (MEM)",
                    data: [201] // Triplet Pointer
                },
                {
                    ins: "CLR (MEM)",
                    data: [202] // Output pointer
                },
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
                },
                {
                    // Output the two values
                    ins: "SWP A, B" // A is first item
                },
                {
                    ins: "STO (C), A"
                },
                {
                    ins: "INC C"
                },
                {
                    ins: "SWP A, B" // A is second item
                },
                {
                    ins: "STO (C), A"
                },
                {
                    ins: "JR",
                    data: [5] // Third Byte
                },
                {
                    // Swap:
                    ins: "STO (C), A"
                },
                {
                    ins: "SWP A, B"
                },
                {
                    ins: "INC C"
                },
                {
                    ins: "STO (C), A"
                },
                {
                    // Third Byte:
                    ins: "POP C" // Input Pointer
                },
                {
                    ins: "SWP A, B" // B is highest of first two
                },
                {
                    ins: "INC C"
                },
                {
                    ins: "LDI A, (C)" // Third Item
                },
                {
                    ins: "CMP A, B"
                },
                {
                    ins: "JRNC",
                    data: [20] // Output final two
                },
                {
                    ins: "LD C, (MEM)",
                    data: [202] // Output Pointer
                },
                {
                    ins: "INC C"
                },
                {
                    ins: "STO (C), A" // Third item
                },
                {
                    ins: "SWP A, B"
                },
                {
                    ins: "INC C"
                },
                {
                    ins: "STO (C), A" // Second Item
                },
                {
                    // Compare the third item with the first
                    ins: "LD C, (MEM)",
                    data: [202] // Output Pointer
                },
                {
                    ins: "LDO A, (C)" // 1st output item
                },
                {
                    ins: "CMP A, B" // Compare the first output item with the new second item
                },
                {
                    ins: "JRC",
                    data: [15] // Order Correct
                },
                {
                    // Swap the first for the third item (B)
                    ins: "SWP A, B"
                },
                {
                    ins: "STO (C), A"
                },
                {
                    ins: "INC C"
                },
                {
                    ins: "SWP A, B"
                },
                {
                    ins: "STO (C), A"
                },
                {
                    ins: "JR",
                    data: [8] // Order Correct
                },
                {
                    // Output Final Two:
                    ins: "LD C, (MEM)",
                    data: [202] // Output Pointer
                },
                {
                    ins: "INC C"
                },
                {
                    ins: "SWP A, B",
                },
                {
                    ins: "STO (C), A",
                },
                {
                    ins: "INC C"
                },
                {
                    ins: "SWP A, B"
                },
                {
                    ins: "STO (C), A"
                },
                {
                    // Order Correct:
                    ins: "LD A, (MEM)",
                    data: [201] // Input Pointer
                },
                {
                    ins: "LD B, IMM",
                    data: [3]
                },
                {
                    ins: "ADD A, B",
                },
                {
                    ins: "ST (MEM), A",
                    data: [201] // Input Pointer
                },
                {
                    ins: "LD A, (MEM)",
                    data: [202] // Output Pointer
                },
                {
                    ins: "ADD A, B"
                },
                {
                    ins: "ST (MEM), A",
                    data: [202] // Output Pointer
                },
                {
                    ins: "LD A, (MEM)",
                    data: [200] // Triplet Counter
                },
                {
                    ins: "DEC A"
                },
                {
                    ins: "JRNZ",
                    data: [0xB7] // Sort Loop
                },
                {
                    ins: "RETF"
                }
            ]
        },
        {
            name: "subtractAdjacentParamOp",
            description: "Subtract adjacent param as indicated by a - op",
            program: [
                {
                    ins: "LD A, IMM",
                    data: [16] // Main Loop Counter
                },
                {
                    ins: "ST (MEM), A",
                    data: [200] // Main Loop Counter
                },
                {
                    ins: "CLR (MEM)",
                    data: [201] // Output Pointer
                },
                {
                    // Main Loop
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
                    data: [202] // First Param
                },
                {
                    ins: "LDI A, (C)" // Second Param
                },
                {
                    ins: "INC C"
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
                    data: [45] // -
                },
                {
                    ins: "CMP A, B"
                },
                {
                    ins: "JRNZ",
                    data: [13] // Next Instruction
                },
                {
                    ins: "PUSH C" // Input Pointer
                },
                {
                    ins: "LD A, (MEM)",
                    data: [202] // First Param
                },
                {
                    ins: "LD B, (MEM)",
                    data: [203]
                },
                {
                    ins: "SUB A, B"
                },
                {
                    ins: "LD C, (MEM)",
                    data: [201] // Output Pointer
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
                    data: [0xDD] // Main Loop
                },
                {
                    ins: "RETF"
                }
            ]
        },
        {
            name: "subtractAdjacentParams",
            description: "Output the difference of adjacent parameters",
            program: [
                {
                    ins: "LD A, IMM",
                    data: [16] 
                },
                {
                    ins: "ST (MEM), A",
                    data: [200] // Output Count
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
                    // Process Loop
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
                    ins: "SWP A, B"
                },
                {
                    ins: "SUB A, B"
                },
                {
                    ins: "INC C"
                },
                {
                    ins: "ST (MEM), C",
                    data: [201] // Input Pointer
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
                    data: [0xEA] // Process Loop
                },
                {
                    ins: "RETF"
                }
            ]
        },
        {
            name: "trialOne",
            description: "Trial Seed Program",
            program: [
                {
                    ins: "SM",
                    data: [1]
                },
                {
                    ins: "CASM", // Data from params
                    data: [2]
                },
                {
                    ins: "CASM", // Add three to params
                    data: [3]
                },
                {
                    ins: "CASM", // Fill remaining space
                    data: [4]
                },
                {
                    ins: "SM", // Data from params
                    data: [2]
                },
                {
                    ins: "LD B, IMM",
                    data: [3]
                },
                {
                    ins: "ST (MEM), B",
                    data: [200] // Main Loop
                },
                {
                    ins: "LD A, IMM",
                    data: [0]
                },
                {
                    ins: "ST (MEM), A",
                    data: [201] // Output Address
                },
                {
                    ins: "LD A, IMM",
                    data: [8]
                },
                {
                    ins: "ST (MEM), A",
                    data: [202] // Input Loop Counter
                },
                {
                    ins: "LD A, IMM",
                    data: [0]
                },
                { 
                    ins: "ST (MEM), A", 
                    data: [203] // Input Address
                },
                // Loop
                {
                    ins: "LD C, (MEM)",
                    data: [203] // Get Input address
                },
                {
                    ins: "LDI A, (C)" // Get Input Byte
                },
                {
                    ins: "INC C"
                },
                {
                    ins: "ST (MEM), C",
                    data: [203] // Update Input Address
                },
                {
                    ins: "LD C, (MEM)",
                    data: [201] // Output Address
                },
                {
                    ins: "STO (C), A"
                },
                {
                    ins: "INC C"
                },
                {
                    ins: "ST (MEM), C",
                    data: [201] // Update Output Address
                },
                {
                    ins: "LD A, (MEM)",
                    data: [202] // Input Loop Counter
                },
                {
                    ins: "DEC A",
                },
                {
                    ins: "ST (MEM), A",
                    data: [202] // Update Input Loop Counter
                },
                {
                    ins: "JRZ",
                    data: [2]
                },
                {
                    ins: "JR",
                    data: [0xED] // Loop to input
                },
                {
                    ins: "LD A, (MEM)",
                    data: [200] // Output Loop Counter
                },
                {
                    ins: "DEC A",
                },
                {
                    ins: "ST (MEM), A",
                    data: [200] // 
                },
                {
                    ins: "JRZ",
                    data: [2]
                },
                {
                    ins: "JR",
                    data: [0xDA] // Main Loop
                },
                {
                    ins: "RET"
                },


                // Input plus three loop
                {
                    ins: "SM",
                    data: [3]
                },
                // Set addresses and input loop
                {
                    ins: "LD A, IMM",
                    data: [40] // Output data address
                },
                {
                    ins: "ST (MEM), A",
                    data: [200]
                },
                {
                    ins: "LD A, IMM",
                    data: [0] // Input data address
                },
                {
                    ins: "ST (MEM), A",
                    data: [201]
                },
                {
                    ins: "LD A, IMM",
                    data: [8] // Loop Counter
                },
                {
                    ins: "ST (MEM), A",
                    data: [202]
                },
                // Loop
                {
                    ins: "LD C, (MEM)",
                    data: [201] // Input Address
                },
                {
                    ins: "LDI A, (C)" // Input value
                },
                {
                    ins: "LD B, IMM",
                    data: [3]
                },
                {
                    ins: "ADD A, B"
                },
                {
                    ins: "INC C" // Next Input Address
                },
                {
                    ins: "ST (MEM), C",
                    data: [201]
                },
                {
                    ins: "LD C, (MEM)",
                    data: [200] // Output Address
                },
                {
                    ins: "STO (C), A"
                },
                {
                    ins: "INC C"
                },
                {
                    ins: "ST (MEM), C",
                    data: [200] // Updated output address
                },
                {
                    ins: "LD A, (MEM)",
                    data: [202] // Loop Counter
                },
                {
                    ins: "DEC A"
                },
                {
                    ins: "ST (MEM), A",
                    data: [202] // Updated Loop Counter
                },
                {
                    ins: "JRZ",
                    data: [2] // End Loop
                },
                {
                    ins: "JR",
                    data: [0xEA]
                },
                {
                    ins: "RET"
                },
                {
                    ins: "SM",
                    data: [4]
                },
                {
                    ins: "RETF"
                }
            ]
        },
        {
            name: "testSampleIns",
            description: "Test Sample Instructions",
            program: [
                {
                    ins: "LSIL A"
                },
                {
                    ins: "STO (C), A"
                },
                {
                    ins: "INC C"
                },
                {
                    ins: "LSOL A"
                },
                {
                    ins: "STO (C), A" 
                },
                {
                    ins: "INC C"
                },
                {
                    ins: "LDIL A"
                },
                {
                    ins: "STO (C), A"
                },
                {
                    ins: "INC C"
                },
                {
                    ins: "LDOL A"
                },
                {
                    ins: "STO (C), A"
                },
                {
                    ins: "INC C"
                },
                {
                    ins: "ST (MEM), C",
                    data: [200] // Output Pointer
                },
                {
                    // Output Sample Inputs
                    ins: "CLR (MEM)",
                    data: [201] // Sample Input Pointer
                },
                {
                    ins: "LSIL A"
                },
                {
                    ins: "ST (MEM), A",
                    data: [202] // Input Counter
                },
                {
                    // Sample Input Loop:
                    ins: "LD C, (MEM)",
                    data: [201] // Sample Input Pointer
                },
                {
                    ins: "LDSI A, (C)"
                },
                {
                    ins: "INC C"
                },
                {
                    ins: "ST (MEM), C",
                    data: [201] // Sample Input Pointer
                },
                {
                    ins: "LD C, (MEM)",
                    data: [200] // Output Pointer
                },
                {
                    ins: "STO (C), A"
                },
                {
                    ins: "INC C"
                },
                {
                    ins: "ST (MEM), C",
                    data: [200] // Output Pointer
                },
                {
                    ins: "LD A, (MEM)",
                    data: [202] // Sample Input Counter
                },
                {
                    ins: "DEC A"
                },
                {
                    ins: "ST (MEM), A",
                    data: [202] // Sample Input Counter
                },
                {
                    ins: "JRNC",
                    data: [0xEF], // Sample Input Loop
                },
                {
                    // Output Sample Output
                    ins: "CLR (MEM)",
                    data: [201] // Sample Output Pointer
                },
                {
                    ins: "LSOL A"
                },
                {
                    ins: "ST (MEM), A",
                    data: [202]
                },
                {
                    // Sample Output Loop:
                    ins: "LD C, (MEM)",
                    data: [201] // Sample Output Pointer
                },
                {
                    ins: "LDSO A, (C)"
                },
                {
                    ins: "INC C"
                },
                {
                    ins: "ST (MEM), C",
                    data: [201] // Sample Output Pointer
                },
                {
                    ins: "LD C, (MEM)",
                    data: [200] // Output Pointer
                },
                {
                    ins: "STO (C), A"
                },
                {
                    ins: "INC C"
                },
                {
                    ins: "ST (MEM), C",
                    data: [200] // Output Pointer
                },
                {
                    ins: "LD A, (MEM)",
                    data: [202] // Sample Output Counter
                },
                {
                    ins: "DEC A"
                },
                {
                    ins: "ST (MEM), A",
                    data: [202] // Sample Output Counter
                },
                {
                    ins: "JRNC",
                    data: [0xEF], // Sample Output Loop
                },
                {
                    ins: "RETF"
                }

            ]
        }
    ],

    getSeedList(mainWindow) {
        let nameList = [];
        for (let progDetails of this.programs) {
            nameList.push(progDetails.name);
        }
        return nameList;
    }
}

module.exports = seedPrograms;