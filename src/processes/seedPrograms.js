const seedPrograms = {
    programs: [
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