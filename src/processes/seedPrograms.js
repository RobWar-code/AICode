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
                    ins: "LD A, IMM",
                    data: [16] // Process Counter
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
                    data: [0xC6] // Process Loop
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