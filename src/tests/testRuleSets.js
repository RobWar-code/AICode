const InstructionSet = require('../processes/InstructionSet');
const rulesets = require('../processes/rulesets.js');
const Entity = require('../processes/Entity.js');

// Check the rule numbers before running the tests, as these are subject to on-going
// updates

const testRuleSets = {
    instructionSet: new InstructionSet(),

    testBubbleSort: function() {
        let a = [45,35,64,87,9,11,20,32,31,18,46,57,91,12,18];
        console.log("Start:", a);
        rulesets.bubbleSort2(a);
        console.log("End:", a);
    },

    testUpdateSeedRuleFragments: function () {
        // Populate the seed rule list
        let seedRules = [
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
            }
        ];

        let count = 0;
        for (let programItem of seedRules) {
            let codeSection = programItem.program;
            let memSpace = new Array(256).fill(0);
            this.instructionSet.compileTestCode(codeSection, memSpace);
            rulesets.seedRuleMemSpaces.push({ruleId: count, memSpace: memSpace});
            count++;
        }

        // Add Some Samples to the fragment list
        let fragments = [
            [
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
                }    
            ],
            [
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
                }    
            ],
            [
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
                }
            ]
        ];

        // Compile and insert the fragments into the ruleset fragment list
        for (let fragmentCode of fragments) {
            let fragment = [];
            this.instructionSet.compileTestCode(fragmentCode, fragment);
            rulesets.seedRuleFragments.push(fragment);
        }
        
        // Set-up the test seed program
        let seedCode = [
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
                ins: "SUB A, B"
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
                ins: "ADD A, B"
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
        ];

        // Compile the seed code
        let seedMemSpace = new Array(256).fill(0);
        this.instructionSet.compileTestCode(seedCode, seedMemSpace);
        console.log(seedMemSpace[0], seedMemSpace[1], seedMemSpace[2]);

        // Do the test update of the fragment list using this seed
        rulesets.updateSeedRuleFragments(this.instructionSet, seedMemSpace);

        // Report the size of the fragment list
        console.log("Num Fragments:", rulesets.seedRuleFragments.length);
        for (let i = 0; i < rulesets.seedRuleFragments.length; i++) {
            console.log("Fragment Length:", rulesets.seedRuleFragments[i].length);
        }

    },

    testSearchRuleSeedForFragment: function () {
        // Populate the seed rule list
        let seedRules = [
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
            }
        ];

        let count = 0;
        for (let programItem of seedRules) {
            let codeSection = programItem.program;
            let memSpace = new Array(256).fill(0);
            this.instructionSet.compileTestCode(codeSection, memSpace);
            rulesets.seedRuleMemSpaces.push({ruleId: count, memSpace: memSpace});
            count++;
        }

        // Set-up sample
        let sectionCode = [
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
            }
        ];

        let section = [];
        this.instructionSet.compileTestCode(sectionCode, section);

        // Test the search function
        let matched = rulesets.searchRuleSeedForFragment(section);
        console.log("Search matched, expect true:", matched);


        // Set-up sample
        sectionCode = [
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
                ins: "ADD A, B"
            }
        ];

        section = [];
        this.instructionSet.compileTestCode(sectionCode, section);

        // Test the search function
        matched = rulesets.searchRuleSeedForFragment(section);
        console.log("Search matched, expect false:", matched);
    },

    testGetSeedFragmentListed: function () {
        // Set-up the fragments list
        let fragments = [
            [
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
                }    
            ],
            [
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
                }    
            ],
            [
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
                }
            ]
        ];

        // Compile and insert the fragments into the ruleset fragment list
        for (let fragmentCode of fragments) {
            let fragment = [];
            this.instructionSet.compileTestCode(fragmentCode, fragment);
            rulesets.seedRuleFragments.push(fragment);
        } 

        // Get the fragment to search for
        let testFragment1 = [
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
            }    
        ];

        // Get the code for the test section
        let section = [];
        this.instructionSet.compileTestCode(testFragment1, section);

        // Do the test search operation
        let listed = rulesets.getSeedFragmentListed(section);
        console.log("Section is listed:", listed);

        // Do another section which should not be listed
        let testFragment2 = [
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
            }
        ];

        // Get the code for the test section
        section = [];
        this.instructionSet.compileTestCode(testFragment2, section);

        // Do the test search operation
        listed = rulesets.getSeedFragmentListed(section);
        console.log("Section is listed:", listed);

    },

    testExtractMemSpaceFragment: function () {
        let codeSample1 = [
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
        ];

        let memSpace = new Array(256).fill(0);
        this.instructionSet.compileTestCode(codeSample1, memSpace);
        let sectionList = [];
        let sectionObj = rulesets.extractMemSpaceFragment(this.instructionSet, memSpace, sectionList);
        if (!sectionObj.abandonned) {
            let section = sectionObj.section;
            let insList = this.instructionSet.disassemble(section, 0, section.length);
            console.log("SECTION:");
            let count = 0;
            for (let op of insList) {
                console.log(count, op.ins, op.data);
                ++count;
            }
        }
        else {
            console.log("Extract Fragment Abandonned");
        }

        // Multiple Test
        console.log("Loop Test")
        sectionList = [];
        for (let i = 0; i < 30; i++) {
            let sectionObj = rulesets.extractMemSpaceFragment(this.instructionSet, memSpace, sectionList);
            if (sectionObj.abandonned) {
                console.log("Section Abandonned");
            }
            console.log("sectionList.length:", sectionList.length);
        }
        for (let item of sectionList) {
            console.log("start:", item.start, "len:", item.len, "used:", item.used);
        }
    },

    testCountInsOccurrences: function () {
        // Test Script
        const testScript = this.getTestScript();
        // Compile to byte format
        let memSpace = new Array(testScript.length).fill(0);
        this.instructionSet.compileTestCode(testScript, memSpace);
        let count = this.instructionSet.countInsInMemSpace(memSpace, memSpace.length, "CALL");
    },

    testCountInsDistribution: function () {
        // Test Script
        const testScript = this.getTestScript();
        // Compile to byte format
        let memSpace = new Array(testScript.length).fill(0);
        this.instructionSet.compileTestCode(testScript, memSpace);
        let optimum = 4;
        let score = this.instructionSet.scoreDistribution("CALL", optimum, memSpace, memSpace.length);
    },

    testValuesOutFromInitialParams: function() {
        let initialParams = [0, 1, 2, 3, 7, 8, 9, 10, 11, 12];
        let valuesOut = [1,12,1,12,1,12,1,12];
        let outBlockStart = 0;
        let outBlockLen = 8;
        let inBlockStart = 0;
        let inBlockLen = 8;
        let score = rulesets.valuesOutFromInitialParams(initialParams, valuesOut, outBlockStart, outBlockLen,
            inBlockStart, inBlockLen
        )
        console.log("score, expect 0.125:", score);

        outBlockLen = 4;
        valuesOut = [3, 1, 1, 2];
        score = rulesets.valuesOutFromInitialParams(initialParams, valuesOut, outBlockStart, outBlockLen,
            inBlockStart, inBlockLen
        )
        console.log("score, expect 0.75:", score);

        initialParams = [1, 1, 0, 2];
        score = rulesets.valuesOutFromInitialParams(initialParams, valuesOut, outBlockStart, outBlockLen,
            inBlockStart, inBlockLen
        )
        console.log("score, expect 0.75:", score);
    },

    getTestScript: function() {
        const testScript = [
            {
                addr: 0,
                ins: "ADD A, B",
            },
            {
                addr: 0,
                ins: "JRZ",
                data: [0x15]
            },
            {
                addr: 0,
                ins: "CALL",
                data: [0x15]
            },
            {
                addr: 0,
                ins: "RET",
            },
            {
                addr: 0,
                ins: "SUB A, B"
            },
            {
                addr: 0,
                ins: "CALL",
                data: [0x15]
            },
            {
                addr: 0,
                ins: "RET",
            },
            {
                addr: 0,
                ins: "SUB A, B"
            },
            {
                addr: 0,
                ins: "ADD A, B",
            },
            {
                addr: 0,
                ins: "JRZ",
                data: [0x15]
            },
            {
                addr: 0,
                ins: "CALL",
                data: [0x15]
            }
        ]
        return testScript;
    },

    testMatchCASM: function() {
        let memSpace = getScriptMemSpace1(this.instructionSet);
        console.log("memSpace[0]", memSpace[0]);
        let score = rulesets.matchCASM(this.instructionSet, memSpace);
        console.log("matchCASM score:", score);

        function getScriptMemSpace1(instructionSet) {
            testScript = [
                {
                    ins: "SM",
                    data: [0]
                },
                {
                    ins: "SM",
                    data: [1]
                },
                {
                    ins: "LD A, (C)"
                },
                {
                    ins: "CASM",
                    data: [0]
                },
                {
                    ins: "CASM",
                    data: [1]
                }
            ];

            // Compile the code
            let memSpace = new Array(256).fill(0);
            instructionSet.compileTestCode(testScript, memSpace);
            return memSpace;
        }
    },

    testParamsGreaterThanN: function () {
        let initialParams = [3,6,22,15,12,18,21,0,1,2,30,40,50,100,150,255,];
        let valuesOut1 =    [1,1,1 ,1 ,1 ,1 ,1 ,1,1,1,1 ,1 ,1 ,1  ,1  ,1   ];
        let valuesOut2 =    [1,1,2 ,2 ,1 ,1 ,1 ,1,1,1,1 ,1 ,1 ,1  ,2  ,2   ];
        let dataParams = {};
        dataParams.initialParams = initialParams;
        dataParams.valuesOut = valuesOut1;
        let ruleParams = {};
        ruleParams.outBlockStart = 0;
        ruleParams.outBlockLen = 16;
        ruleParams.inBlockStart = 0;
        ruleParams.inBlockLen = 16;
        ruleParams.n = 12;

        console.log("testParamsGreaterThanN:");
        let score = rulesets.paramsGreaterThanN(rulesets, dataParams, ruleParams);
        console.log("Expect:", 6/16, "Got: ", score);    
        dataParams.valuesOut = valuesOut2;
        score = rulesets.paramsGreaterThanN(rulesets, dataParams, ruleParams);
        console.log("Expect:", 10/16, "Got: ", score);

    },

    testAddFirstParam: function() {
        let initialParams = [5,6,7,9,10,15,18,23];
        let valuesOut = [10,11,12,14,10,15,18,23];
        let dataParams = {};
        dataParams.initialParams = initialParams;
        dataParams.valuesOut = valuesOut;
        let ruleParams = {};
        ruleParams.outBlockStart = 0;
        ruleParams.outBlockLen = 8;
        ruleParams.inBlockStart = 0;
        ruleParams.inBlockLen = 8;

        console.log("testAddFirstParam:");
        let score = rulesets.addFirstParam(rulesets, dataParams, ruleParams);
        console.log("Expect approx 0.5; Got: ", score);
        valuesOut = [10,11,12,14,15,20,18,23];
        dataParams.valuesOut = valuesOut;
        score = rulesets.addFirstParam(rulesets, dataParams, ruleParams);
        console.log("Expect approx 0.75; Got: ", score);
    },

    testDuplicateParams: function () {
        let initialParams = [7,6,8,9,11,12,72,73];
        let valuesOut = [7,7,6,6,8,8,9,9,11,11,12,12,72,72,73,73];
        let dataParams = {};
        dataParams.initialParams = initialParams;
        dataParams.valuesOut = valuesOut;
        let ruleParams = {};
        ruleParams.outBlockStart = 0;
        ruleParams.outBlockLen = 16;
        ruleParams.inBlockStart = 0;
        ruleParams.inBlockLen = 8;

        console.log("testDuplicateParams:");
        let score = rulesets.duplicateParams(rulesets, dataParams, ruleParams);
        console.log("Expect: ", 16/16, "; Got: ", score);
        valuesOut = [7,7,6,6,8,8,9,9,11,11,12,12,72,72,73,73]
        dataParams.valuesOut = valuesOut;
        score = rulesets.duplicateParams(rulesets, dataParams, ruleParams);
        console.log("Expect 1; Got: ", score);

    },

    testSkipAdjacentParams: function() {
        rulesets.initialise();

        console.log("testSkipAdjacentParams");
        let iniParams = [1,3, 100,156, 5,8, 7,10, 11,21, 16,17, 9,10, 30,40];
        let valuesOut = [3, 156, 8, 10, 9, 11, 21, 14];
        let dataParams = {};
        dataParams.initialParams = iniParams;
        dataParams.valuesOut = valuesOut;
        let ruleParams = {};
        ruleParams.outBlockStart = 0;
        ruleParams.outBlockLen = 8;
        ruleParams.inBlockStart = 0;
        ruleParams.inBlockLen = 8;
        let score = rulesets.skipAdjacentParams(rulesets, dataParams, ruleParams);
        console.log("Expect approx: 0.5; Got:", score);
    },

    testSwapAdjacentParams: function() {
        rulesets.initialise();

        console.log("testSwapAdjacentParams");
        let iniParams = [1,3, 100,156, 5,8, 7,10];
        let valuesOut = [3,1, 156,100, 8,5, 12,15];
        let dataParams = {};
        dataParams.initialParams = iniParams;
        dataParams.valuesOut = valuesOut;
        let ruleParams = {};
        ruleParams.outBlockStart = 0;
        ruleParams.outBlockLen = 8;
        ruleParams.inBlockStart = 0;
        ruleParams.inBlockLen = 8;
        let score = rulesets.swapAdjacentParams(rulesets, dataParams, ruleParams);
        console.log("Expect approx: 0.75; Got:", score);

    },

    testGreaterOfAdjacentParams() {
        rulesets.initialise();
        let iniParams = [1,3, 100,156, 5,8, 7,10, 11,21, 16,17, 9,10, 30,40];
        let valuesOut = [3, 156, 8, 10, 17, 19, 24, 20];
        let dataParams = {};
        dataParams.initialParams = iniParams;
        dataParams.valuesOut = valuesOut;
        let ruleParams = {};
        ruleParams.outBlockStart = 0;
        ruleParams.outBlockLen = 8;
        ruleParams.inBlockStart = 0;
        ruleParams.inBlockLen = 16;
        console.log("testGreaterOfAdjacentParams:");
        let score = rulesets.greaterOfAdjacentParams(rulesets, dataParams, ruleParams);
        console.log("Expect approx 0.5; Got: ", score);
    },

    testSortAdjacentParams: function() {
        rulesets.initialise();
        let iniParams = [1,3, 100,156, 5,8, 7,10, 11,21, 16,17, 9,10, 30,40];
        let valuesOut = [3,1, 156,100, 17,9, 11,21];
        let dataParams = {};
        dataParams.initialParams = iniParams;
        dataParams.valuesOut = valuesOut;
        let ruleParams = {};
        ruleParams.outBlockStart = 0;
        ruleParams.outBlockLen = 8;
        ruleParams.inBlockStart = 0;
        ruleParams.inBlockLen = 8;
        console.log("testSortAdjacentParams: ")
        let score = rulesets.sortAdjacentParams(rulesets, dataParams, ruleParams);
        console.log("Expect approx: 0.5; Got: ", score);

    },

    testAddAdjacentParams: function() {
        rulesets.initialise();
        // Test 1
        console.log("testAddAdjacentParams:")
        // Get the initial params
        let iniParams = [1,3, 100,157, 5,8, 7,10, 11,21, 16,17, 9,10, 30,40];
        let valuesOut = [4, 0, 13, 17, 32, 11, 21, 14];
        let dataParams = {};
        dataParams.initialParams = iniParams;
        dataParams.valuesOut = valuesOut;
        let ruleParams = {};
        ruleParams.outBlockStart = 0;
        ruleParams.outBlockLen = 8;
        ruleParams.inBlockStart = 0;
        ruleParams.inBlockLen = 16;
        let score = rulesets.addAdjacentParams(rulesets, dataParams, ruleParams);
        console.log("Expect approx: 0.5; Got: ", score);

    },

    testSubtractAdjacentParams: function() {
        let ruleNum = 16;
        rulesets.initialise();
        let rule = rulesets.scoreList[ruleNum];


        // Test 1
        console.log("testSubtractAdjacentParams:")
        // Get the initial params
        let iniParams = [3,1, 156,100, 8,5, 10,7, 10,11, 16,17, 9,10, 30,40];
        let valuesOut = [2, 56, 3, 3, 0xFF, 11, 21, 14, 10];
        let dataParams = {};
        dataParams.initialParams = iniParams;
        dataParams.valuesOut = valuesOut;
        let ruleParams = {};
        ruleParams.outBlockStart = 0;
        ruleParams.outBlockLen = 8;
        ruleParams.inBlockStart = 0;
        ruleParams.inBlockLen = 16;
        let score = rulesets.subtractAdjacentParams(rulesets, dataParams, ruleParams);
        console.log("Expect approx: 0.625; Got: ", score);

    },

    testParamOpsDivide: function () {
        rulesets.initialise();

        // Test the adjacent param operations divide operation.
        let inputs = [
            [
                47,5,2, 47,2,0, 47,30,7, 47,100,9, 47,40,6, 47,45,25, 47,15,4, 47,108,9,
                47,62,3, 47,87,5, 47,220,15, 47,96,6, 47,84,23, 47,31,7, 47,18,7, 47,13,5
            ],
            [
                47,9,2, 47,11,0, 47,203,20, 47,5,5, 47,108,10, 47,53,25, 47,8,9, 47,33,9,
                47,11,3, 47,10,5, 47,93,16, 47,7,7, 47,203,45, 47,29,7, 47,230,76, 47,66,25
            ]
        ];

        let ruleIndex = 53;

        // Check Score List Initialisation Output Data
        console.log(rulesets.scoreList[ruleIndex].outputs);
        let entityOutputs = [];
        entityOutputs.push(rulesets.scoreList[ruleIndex].outputs[0]);
        let ruleOutputs = rulesets.scoreList[ruleIndex].outputs;
        let score = rulesets.getOutputComparisonScore(ruleOutputs, entityOutputs);
        console.log("Test 1, expect 1:", score);
        entityOutputs.push(rulesets.scoreList[ruleIndex].outputs[1]);
        score = rulesets.getOutputComparisonScore(ruleOutputs, entityOutputs);
        console.log("Test 2, expect 1:", score);

    },

    testConvertASCIINumbers: function() {
        let ruleNum = 18;
        rulesets.initialise();
        let rule = rulesets.scoreList[ruleNum];

        // Check the initial parameters in the entity
        let insSet = new InstructionSet();
        let entity = new Entity(0, insSet, true, false, 0, 0, null);
        let iniParamsList = entity.initialParamsList;
        // Output the initial params
        let outStart = rule.outBlockStart;
        let inStart = rule.inBlockStart;
        let inLen = rule.inBlockLen;
        for (let ip of iniParamsList) {
            let p = inStart;
            let s = "";
            while (p < inStart + inLen) {
                s += String.fromCharCode(ip[p]);
                ++p;
            }
            console.log("params:", s);
        }

        // Setup Output values
        let v = [];
        let e = []
        let v1 = [1, 5, 9];
        let e1 = rulesets.doScore(16,3,16,0);
        v.push(v1);
        e.push(e1);
        let v2 = [3, 0, 8];
        let e2 = rulesets.doScore(16,2,16,0);
        v.push(v2);
        e.push(e2);
        let index = 0;
        for (let values of v) {
            let valuesOut = new Array(256).fill(0);
            // Insert the test values
            let p = outStart;
            for (let v of values) {
                valuesOut[p] = v;
                ++p;
            }
            // Get the initial params
            let ip = iniParamsList[index];
            let dataParams = {initialParams: ip, valuesOut: valuesOut};
            let score = rulesets.convertASCIINumbers(rulesets, dataParams, rule);
            console.log("ConvertASCIIScore:", score, "Expect:", e[index]);
            ++index;
        }

        // Test the byte function
        let value = 8;
        let address = outStart + 6;
        let initialParams = iniParamsList[0];
        let params = new Array(256).fill(0);
        let valuesOut = new Array(256).fill(0);
        valuesOut[address] = value;
        let score = rulesets.byteConvertASCIINumbers(rulesets, rule, value, address, initialParams, params, valuesOut);
        console.log("byteConvertASCIINumbers expect 64:", score);
    }
}

const testByteRules = {
    initialParams: new Array(256).fill(0),
    params: new Array(256).fill(0),
    valuesOut: new Array(256).fill(0),

    valuesOutFromInitialParams: function() {
        let ruleNum = 4;
        rulesets.initialise();
        let rule = rulesets.scoreList[ruleNum];
        let offset = 1;
        let address = rule.outBlockStart + offset;
        // Test value correct
        let inStart = rule.inBlockStart;
        this.initialParams[inStart + offset] = 8;
        let value = 8;
        let resultObj = rulesets.getOutputByteScore(value, address, this.initialParams, this.params, this.valuesOut);
        console.log("valuesOutFromInitialParams");
        console.log("score", resultObj.totalScore, "significance", resultObj.totalSignificance);
    },

    valuesOutMatchInitialParams: function () {
        let ruleNum = 5;
        rulesets.initialise();
        let rule = rulesets.scoreList[ruleNum];
        let offset = 1;
        let address = rule.outBlockStart + offset;
        // Test value correct
        let inStart = rule.inBlockStart;
        this.initialParams[inStart + offset] = 12;
        let value = 12;
        let resultObj = rulesets.getOutputByteScore(value, address, this.initialParams, this.params, this.valuesOut);
        console.log("valuesOutMatchInitialParams");
        console.log("score", resultObj.totalScore, "significance", resultObj.totalSignificance);
    },

    valuesOutDifferent: function () {
        let ruleNum = 7;
        rulesets.initialise();
        let rule = rulesets.scoreList[ruleNum];
        let offset = 1;
        let address = rule.outBlockStart + offset;
        this.valuesOut[rule.outBlockStart] = 1;
        this.valuesOut[rule.outBlockStart + 2] = 3;
        // Test value correct
        let value = 15;
        let resultObj = rulesets.getOutputByteScore(value, address, this.initialParams, this.params, this.valuesOut);
        console.log("valuesOutDifferent");
        console.log("score", resultObj.totalScore, "significance", resultObj.totalSignificance);
    },

    valuesOutSeries: function () {
        let ruleNum = 8;
        rulesets.initialise();
        let rule = rulesets.scoreList[ruleNum];
        let offset = 0;
        let address = rule.outBlockStart + offset;
        this.valuesOut[rule.outBlockStart + 1] = 2;
        this.valuesOut[rule.outBlockStart + 2] = 3;
        // Test value correct
        let value = 1;
        let resultObj = rulesets.getOutputByteScore(value, address, this.initialParams, this.params, this.valuesOut);
        console.log("valuesOutSeries 1");
        console.log("score", resultObj.totalScore, "significance", resultObj.totalSignificance);

        offset = 1;
        address = rule.outBlockStart + offset;
        this.valuesOut[rule.outBlockStart + 2] = 3;
        this.valuesOut[rule.outBlockStart + 3] = 4;
        // Test value correct
        value = 2;
        resultObj = rulesets.getOutputByteScore(value, address, this.initialParams, this.params, this.valuesOut);
        console.log("valuesOutSeries 2");
        console.log("score", resultObj.totalScore, "significance", resultObj.totalSignificance);

        offset = rule.outBlockLen - 1;
        address = rule.outBlockStart + offset;
        for (let i = 0; i < rule.outBlockLen - 1; i++) {
            this.valuesOut[rule.outBlockStart + i] = i + 1;
        }
        // Test value correct
        value = rule.outBlockLen;
        resultObj = rulesets.getOutputByteScore(value, address, this.initialParams, this.params, this.valuesOut);
        console.log("valuesOutSeries 3");
        console.log("score", resultObj.totalScore, "significance", resultObj.totalSignificance);
    },

    valuesOutFromParams: function () {
        let ruleNum = 9;
        rulesets.initialise();
        let rule = rulesets.scoreList[ruleNum];
        let offset = 1;
        let address = rule.outBlockStart + offset;
        // Test value correct
        let inStart = rule.inBlockStart;
        this.params[inStart + offset] = 12;
        let value = 12;
        let resultObj = rulesets.getOutputByteScore(value, address, this.initialParams, this.params, this.valuesOut);
        console.log("valuesOutFromParams");
        console.log("score", resultObj.totalScore, "significance", resultObj.totalSignificance);
    },

    paramsPlusThree: function () {
        let ruleNum = 10;
        rulesets.initialise();
        let rule = rulesets.scoreList[ruleNum];
        let offset = 1;
        let address = rule.outBlockStart + offset;
        // Test value correct
        let inStart = rule.inBlockStart;
        this.initialParams[inStart + offset] = 12;
        let value = 15;
        let resultObj = rulesets.getOutputByteScore(value, address, this.initialParams, this.params, this.valuesOut);
        console.log("paramsPlusThree1");
        console.log("score", resultObj.totalScore, "significance", resultObj.totalSignificance);

        offset = 1;
        address = rule.outBlockStart + offset;
        // Test value correct
        inStart = rule.inBlockStart;
        this.initialParams[inStart + offset] = 12;
        value = 16;
        resultObj = rulesets.getOutputByteScore(value, address, this.initialParams, this.params, this.valuesOut);
        console.log("paramsPlusThree2");
        console.log("score", resultObj.totalScore, "significance", resultObj.totalSignificance);
    },

    paramsTimesTwo: function () {
        let ruleNum = 11;
        rulesets.initialise();
        let rule = rulesets.scoreList[ruleNum];
        let offset = 1;
        let address = rule.outBlockStart + offset;
        // Test value correct
        let inStart = rule.inBlockStart;
        this.initialParams[inStart + offset] = 12;
        let value = 24;
        let resultObj = rulesets.getOutputByteScore(value, address, this.initialParams, this.params, this.valuesOut);
        console.log("paramsTimesTwo1");
        console.log("score", resultObj.totalScore, "significance", resultObj.totalSignificance);

        offset = 1;
        address = rule.outBlockStart + offset;
        // Test value correct
        inStart = rule.inBlockStart;
        this.initialParams[inStart + offset] = 12;
        value = 30;
        resultObj = rulesets.getOutputByteScore(value, address, this.initialParams, this.params, this.valuesOut);
        console.log("paramsTimesTwo2");
        console.log("score", resultObj.totalScore, "significance", resultObj.totalSignificance);

    },

    paramsGreaterThanN: function () {
        let ruleNum = 18;
        rulesets.initialise();
        let rule = rulesets.scoreList[ruleNum];
        let iniParams = [1, 3, 100, 156,50, 8,  7, 10];
        let valuesOut = [2, 1, 1  , 157, 2, 9, 11, 21];
        let params = [];
        let address = 2;
        let value = 1;
        console.log("testByteParamsGreaterThanN:");
        let score = rulesets.byteParamsGreaterThanN(rulesets, rule, value, address, iniParams, params, valuesOut);
        console.log("Expect: 1; Got:", score);
        address = 0;
        value = 1;
        score = rulesets.byteParamsGreaterThanN(rulesets, rule, value, address, iniParams, params, valuesOut);
        console.log("Expect: 2; Got:", score);
        address = 3;
        value = 157;
        score = rulesets.byteParamsGreaterThanN(rulesets, rule, value, address, iniParams, params, valuesOut);
        console.log("Expect: 1; Got:", score);
        address = 4;
        value = 2;
        score = rulesets.byteParamsGreaterThanN(rulesets, rule, value, address, iniParams, params, valuesOut);
        console.log("Expect: 2; Got:", score);

    },

    addFirstParam: function () {
        let ruleNum = 15;
        rulesets.initialise();
        let rule = rulesets.scoreList[ruleNum];
        let iniParams = [1, 3, 100, 156, 5, 8, 7, 10];
        let valuesOut = [2, 4, 101, 157, 17, 9, 11, 21];
        let params = [];
        let address = 2;
        let value = 101;
        console.log("testByteAddFirstParam:");
        let score = rulesets.byteAddFirstParam(rulesets, rule, value, address, iniParams, params, valuesOut);
        console.log("Expect: 0; Got:", score);
        address = 4;
        value = 17;
        score = rulesets.byteAddFirstParam(rulesets, rule, value, address, iniParams, params, valuesOut);
        console.log("Expect: 255; Got:", score);

    },

    duplicateParams: function () {
        let ruleNum = 15;
        rulesets.initialise();
        let rule = rulesets.scoreList[ruleNum];
        let iniParams = [1,3, 100,156, 5,8, 7,10, 11,21, 16,17, 9,10, 30,40];
        let valuesOut = [1, 1, 3, 3, 17, 9, 11, 21, 14];
        let params = [];
        let address = 3;
        let value = 3;
        console.log("testByteDuplicateParams:");
        let score = rulesets.byteDuplicateParams(rulesets, rule, value, address, iniParams, params, valuesOut);
        console.log("Expect: 0; Got:", score);
        address = 4;
        value = 17;
        score = rulesets.byteDuplicateParams(rulesets, rule, value, address, iniParams, params, valuesOut);
        console.log("Expect: 255; Got:", score);
    },

    skipAdjacentParams: function() {
        let ruleNum = 17;
        rulesets.initialise();
        let rule = rulesets.scoreList[ruleNum];
        console.log("testByteSkipAdjacentParams:")
        // Get the initial params
        let iniParams = [1,3, 100,156, 5,8, 7,10, 11,21, 16,17, 9,10, 30,40];
        let valuesOut = [3, 156, 13, 17, 9, 11, 21, 14];
        let params = [];
        let address = 1;
        let value = 156;
        let score = rulesets.byteSkipAdjacentParams2(rulesets, rule, value, address, iniParams, params, valuesOut);
        console.log("Expect: 0; Got: ", score);
        address = 4;
        value = 9;
        score = rulesets.byteSkipAdjacentParams2(rulesets, rule, value, address, iniParams, params, valuesOut);
        console.log("Expect: 255; Got: ", score);

    },

    swapAdjacentParams: function() {
        let ruleNum = 15;
        rulesets.initialise();
        let rule = rulesets.scoreList[ruleNum];
        console.log("testByteSwapAdjacentParams:")
        // Get the initial params
        let iniParams = [1,3, 100,156, 5,8, 7,10];
        let valuesOut = [3,1, 156,100, 9,7, 11,12];
        let params = [];
        let address = 2;
        let value = 156;
        let score = rulesets.byteSwapAdjacentParams(rulesets, rule, value, address, iniParams, params, valuesOut);
        console.log("Expect: 0; Got: ", score);
        address = 4;
        value = 9;
        score = rulesets.byteSwapAdjacentParams(rulesets, rule, value, address, iniParams, params, valuesOut);
        console.log("Expect: 255; Got: ", score);
    },

    greaterOfAdjacentParams() {
        let ruleNum = 21;
        rulesets.initialise();
        let rule = rulesets.scoreList[ruleNum];
        let iniParams = [100,50, 5,200, 7,3, 9,11];
        let params = [];
        let valuesOut = [10, 200, 3, 11];
        let address = 1;
        let value = 200;
        console.log("testByteGreaterOfAdjacentParams:");
        let score = rulesets.byteGreaterOfAdjacentParams(rulesets, rule, value, address, iniParams, params, valuesOut);
        console.log("Expect 0; Got: ", score);
        address = 2;
        value = 3; 
        score = rulesets.byteGreaterOfAdjacentParams(rulesets, rule, value, address, iniParams, params, valuesOut);
        console.log("Expect 255; Got: ", score);
    },

    sortAdjacentParams: function() {
        let ruleNum = 21;
        rulesets.initialise();
        let rule = rulesets.scoreList[ruleNum];
        console.log("testByteSwapAdjacentParams:")
        // Get the initial params
        let iniParams = [1,3, 100,156, 5,8, 7,10];
        let valuesOut = [3,1, 156,100, 9,7, 11,12];
        let params = [];
        let address = 2;
        let value = 156;
        let score = rulesets.byteSortAdjacentParams(rulesets, rule, value, address, iniParams, params, valuesOut);
        console.log("Expect: 0; Got: ", score);
        address = 4;
        value = 9;
        score = rulesets.byteSortAdjacentParams(rulesets, rule, value, address, iniParams, params, valuesOut);
        console.log("Expect: 255; Got: ", score);

    },

    addAdjacentParams: function () {
        let ruleNum = 15;
        rulesets.initialise();
        let rule = rulesets.scoreList[ruleNum];

        // Test 1
        console.log("testByteAddAdjacentParams:")
        // Get the initial params
        let iniParams = [1,3, 100,156, 5,8, 7,10, 11,21, 16,17, 9,10, 30,40];
        let valuesOut = [4, 0, 13, 17, 9, 11, 21, 14, 10];
        let params = [];
        let address = 2;
        let value = 13;
        let score = rulesets.byteAddAdjacentParams(rulesets, rule, value, address, iniParams, params, valuesOut);
        console.log("Expect: 0; Got: ", score);
        address = 4;
        value = 9;
        score = rulesets.byteAddAdjacentParams(rulesets, rule, value, address, iniParams, params, valuesOut);
        console.log("Expect: 255; Got: ", score);
    },

    subtractAdjacentParams: function () {
        let ruleNum = 15;
        rulesets.initialise();
        let rule = rulesets.scoreList[ruleNum];

        // Test 1
        console.log("testByteSubtractAdjacentParams:")
        // Get the initial params
        let iniParams = [1,3, 100,156, 8,5, 7,10, 21,11, 16,17, 9,10, 30,40];
        let valuesOut = [4, 0, 3, 17, 9, 11, 21, 14, 10];
        let params = [];
        let address = 2;
        let value = 3;
        let score = rulesets.byteSubtractAdjacentParams(rulesets, rule, value, address, iniParams, params, valuesOut);
        console.log("Expect: 0; Got: ", score);
        address = 4;
        value = 9;
        score = rulesets.byteSubtractAdjacentParams(rulesets, rule, value, address, iniParams, params, valuesOut);
        console.log("Expect: 255; Got: ", score);
    },

    multiplyParams: function () {

        let ruleNum = 12;
        rulesets.initialise();
        let rule = rulesets.scoreList[ruleNum];
        let offset = 0;
        let address = rule.outBlockStart + offset;
        // Test value correct
        let inStart = rule.inBlockStart;
        this.initialParams[inStart + offset] = 3;
        this.initialParams[inStart + offset + 1] = 4;
        let value = 12;
        let resultObj = rulesets.getOutputByteScore(value, address, this.initialParams, this.params, this.valuesOut);
        console.log("multiplyParams1");
        console.log("score", resultObj.totalScore, "significance", resultObj.totalSignificance);

        offset = 2;
        address = rule.outBlockStart + offset;
        // Test value correct
        inStart = rule.inBlockStart;
        this.initialParams[inStart + offset] = 12;
        this.initialParams[inStart + offset + 1] = 12;
        value = 100;
        resultObj = rulesets.getOutputByteScore(value, address, this.initialParams, this.params, this.valuesOut);
        console.log("multiplyParams2");
        console.log("score", resultObj.totalScore, "significance", resultObj.totalSignificance);
    },

    divideParams: function () {
        let ruleNum = 13;
        rulesets.initialise();
        let rule = rulesets.scoreList[ruleNum];
        let offset = 0;
        let address = rule.outBlockStart + offset;
        // Test value correct
        let inStart = rule.inBlockStart;
        let inStart2 = rule.inBlockStart2;
        this.initialParams[inStart + offset] = 3;
        this.initialParams[inStart2 + offset] = 12;
        let value = 4;
        let resultObj = rulesets.getOutputByteScore(value, address, this.initialParams, this.params, this.valuesOut);
        console.log("divideParams1");
        console.log("score", resultObj.totalScore, "significance", resultObj.totalSignificance);

        offset = 2;
        address = rule.outBlockStart + offset;
        // Test value correct
        inStart = rule.inBlockStart;
        inStart2 = rule.inBlockStart2;
        this.initialParams[inStart + offset] = 12;
        this.initialParams[inStart2 + offset] = 60;
        value = 3;
        resultObj = rulesets.getOutputByteScore(value, address, this.initialParams, this.params, this.valuesOut);
        console.log("divideParams2");
        console.log("score", resultObj.totalScore, "significance", resultObj.totalSignificance);
    }
}
console.log("Got Here");

testRuleSets.testBubbleSort();

// testRuleSets.testParamOpsDivide();

// testRuleSets.testUpdateSeedRuleFragments();
// testRuleSets.testSearchRuleSeedForFragment();
// testRuleSets.testGetSeedFragmentListed();
// testRuleSets.testExtractMemSpaceFragment();
// testRuleSets.testCountInsOccurrences();
// testRuleSets.testCountInsDistribution();
// testRuleSets.testValuesOutFromInitialParams();
// testRuleSets.testMatchCASM();
// testRuleSets.testParamsGreaterThanN();
// testRuleSets.testAddFirstParam();
// testRuleSets.testDuplicateParams();
// testRuleSets.testSkipAdjacentParams();
// testRuleSets.testSwapAdjacentParams();
// testRuleSets.testGreaterOfAdjacentParams();
// testRuleSets.testSortAdjacentParams();
// testRuleSets.testAddAdjacentParams();
// testRuleSets.testSubtractAdjacentParams();
// testRuleSets.testConvertASCIINumbers();

// testByteRules.valuesOutFromInitialParams();
// testByteRules.valuesOutMatchInitialParams();
// testByteRules.valuesOutDifferent();
// testByteRules.valuesOutSeries();
// testByteRules.valuesOutFromParams();
// testByteRules.paramsPlusThree();
// testByteRules.paramsTimesTwo();
// testByteRules.paramsGreaterThanN();
// testByteRules.addFirstParam();
// testByteRules.duplicateParams();
// testByteRules.skipAdjacentParams();
// testByteRules.swapAdjacentParams();
// testByteRules.greaterOfAdjacentParams();
// testByteRules.sortAdjacentParams();
// testByteRules.addAdjacentParams();
// testByteRules.subtractAdjacentParams();
// testByteRules.multiplyParams();
// testByteRules.divideParams();