# Explorations in Evolutionary Developments

## Background

This document suggests ideas for further developments derived or based upon the ideas implemented in the XBasic program EvoGraphII01.x

## Some Ideas

Consider that each shape forming situation is a niche in an ecosystem, then we can have many concurrent niches.

Should the forms make an aesthetic arrangement?

What matters? The dynamics or end results?

How can target environments be self-defining?

Simple foundations - complex manifestations?

## Phase I Investigation and Refinements

The EvoGraph project was useful for providing test beds for ideas in breeding, variation and selection so, beginning at EvoGraphII02.x we can make some enhancements to make analysis of results easier.

## Towards A System for producing AI type Responses

Since we have demonstrated that the EvoGraph program advances towards solutions, we can use the principles of chromosomes and genes as the basis of a parameter response system.

To make maximum use of the EvoGraph code we can imagine a test set of programs that write the codons for the shape selection program, based on a prompt specifying the number of nodes in the shape.

Before this process the AI program learns the code library functions
to move data around accurately.

Very likely it would be best to build a new program from EvoGraph functions which can be begun in a new folder AICode.

The coding should be done in nodeJS/javascript in the Electron
framework, so that although written on a PC, it can be adapted
to a server/client model for general consumption.


### Project Schedule I 
Build an Electron system to generate and run the test programs, to gauge the performance and check out feasibility.

Feasibility Study Formal Start Date: 10/11/2024

| Task                           | Est. Time | Actual Time |
| ------------------------------ | --------- | ----------- |
| Analysis And Specification     | 10        |             |
| Coding                         | 15        |             |
| Testing and Monitoring         | 2         |             |

### Exploratory Considerations

What are the purposes of this project?

The aim is to provide an exploratory, visual framework for exploring the idea of using evolutionary type principles as a general purpose problem solver and learning system. This project is aimed at proving/disproving the usefulness of this approach in the AI Domain using a particular example as a framework.

This analysis is intended to do as much theory as feasible in advance, in order save time on conducting time-consuming code and test forays.

XBasic was used in the initial forays because it is a user-friendly
coding environment and being compiled line by line executes quite
fast on PC's. It is also portable between Linux and Windows.

### Principle Features

- The program should be designed with general purpose AI in mind, rather than just a narrow subject area.
- The program should have a sustainable and continuous knowledge base which it can use for future assays
- The program should be able to produce on screen and editor readable reports, details, the coded trials, common data sets

### Development Platforms

The question is whether to do this continuation development in XBASIC or whether to move to another platform, bearing in mind possible web-development

The primary advantage of XBASIC is speed and familiarity. It's primary disadvantage is fixed-size data structures.

The web-type application environments that could be considered are Javascript, Python, PHP and nodejs, these all support dynamic classes, but there may be a substantial processing speed cost. This needs to be assessed. We can use a standard simple piece of code with screen updates to test this performance.

The first development platform to assess is Electron (based on Javascript) which has the advantage of also producing standalone PC packages.
 
### Ruleset Operation

The idea is for the program to build a hierarchical codebase for the
solving of problems. It therefore makes sense to begin with code
combinations that have a relatively high probability of discovery.

These combinations can then be added to the codebase and referenced
by the learning programs using the CALL operation.

The rulesets logic should be general purpose and provide a gradated
set of challenges.

### Operating Principles
The AI code element is a machine instruction based on Z-80 code, with a minimum code set to keep it simple. Here it is the balance between the probability of a single instruction and the selection of several.

#### Probabilities and Time Issues
To keep within problem space time restraints, the following methods
are used:

- Keep the instruction set as small/simple as possible
- Restrict the initial number range to 0-255
- Restrict the code/memory area to 256 bytes
- Avoid the introduction of redundant pairing when modifying entities

#### Ruleset Scoring
Each rule set scores up to one point, distributions generally follow the
1 - proportional distance from the optimum. Or just 1 for an absolute
hit.

The scores for each rule are tallied at the end and calculated as a proportion
of the number of rules.

#### Rulesets

##### Code Distribution
The most basic set of tests looks at distribution and frequency 
of occurence of instructions in the entity set of instructions, 
for example:

The optimum number of instructions in a code block is assumed 
to be 16, and the memSpace has about 200 instructions.

The count of instruction SM is assumed to be 1/16 of 200 is 
therefore 12 at the optimum

So a count of 10 gives a score  1 / (1 + ABS(12 - 10))

Distribution of SM should average 16 (distance between occurrences).
so an average distribution of 8 gives a score 1 - 8/12.

#### Instruction Set and Operation

To keep within our probability field the instruction set is 
limited to 32 instructions, using the following registers
A - Accumulator - math and logic operations
B - Data Swapping Register
C - Memory Indexing Register
R - Output byte ruleset test score
S - Output byte ruleset score significance
ZF - Zero Flag (0 or 1)
CF - Carry Flag (0 or 1)
SP - Stack Pointer
IP - Instruction Pointer
IC - Execution Counter

The memory and code area is a contiguous block of 256 bytes
the code interpretation begins at byte 0.

All data is handled in bytes, with the exception of the long jump
(16 bits) and the stored routine call (32 bits).

The input parameter area is the final 16 bytes of the block
address: 240 - 255.

The output parameter area is the 16 bytes preceding the input
address: 255 - 16 = 224 to 239

The stack begins at address 223 and extends back toward the start.

Both of these areas are set to zeroes to begin with, apart
from the values required as inputs.

All code and data is originally generated as random(256) with
instructions out of range interpreted as NOOP but still incrementing
the instruction counter (IC)

The R and S registers are set by the STO operations using the ruleset
operations. These can be accessed for logic using the LD A, R and
LD A, S instructions

Instructions

| Memory	        | Read	          | LD A,(MEM) MEM is a byte address     |
|                   | Write	          | ST (MEM), A                          |
|                   | Clear	          | CLR (MEM)                            |
|                   | Swap	          | SWP A, B                             |
|                   | Data Movement   | PUSH A                               |
|                   |                 | POP A                                |
| Operations        | Arithmetic      | ADD A, B                             |
|                   |                 | SUB A, B                             |
|                   | Logic           | AND A, B                             |
|                   | Comparison	  | CMP A, B                             |
|                   | Branching       | JR 8bit Rel Address                  |
|                   | Branching       | JRZ 8bit Rel Address                 |
|                   | Long Jump       | JRLZ 16bit Rel Address               |
|                   | Carry Jump      | JRC  8bit Rel Address                |
|                   | Long Carry      | JRLC 16bit Rel Address               | 
| Meta-Transactions | Call            | CALL 8bit Address                    |
|                   | Call Stored     | CFAR 32bit Address                   |
|                   | Return          | RET                                  |
|                   |                 | RETF Return from far procedure       |
|                   | Section Marker  | SM - No op, for breeding 5 bytes     | 
Set Flags - Implicit in arithmetic/logic

#### Instruction Test Sequences

A simple object test program sequence compiler is provided to allow for testing
of the instruction set and for adaptation for later deliberate insertion of code
sequences into the generative process.

This has the following syntax:

{
    at: addr, // The location at which the code is to begin and subsequent instructions to follow
    addr: n, // The absolute memSpace address of the instruction, for checking purposes
    ins: "", // The mnemonic instruction ie: LD A, (MEM)
    data: [n, ..], // The set of data bytes to follow the instruction
    show: "" // The text to be displayed at the given ins execution in a test
}

#### Rule Sets
Rulesets are envisioned as being represented as javascript
objects that include their own evaluation functions.

Scoring is done to select survivors from a range of trials.

Examples might be:

- Execute and return in n steps
- Load a non-zero value in the output buffer
- Load a non-zero value at byte 0 of the output buffer
- Fetch a value from the input buffer and pass it to the output
buffer
- Fetch two bytes from the input buffer, add them together
and pass the result to the output buffer 
- Produce the byte values 0, 1, 2 in the output buffer

All trials score the number of steps (IC) before hitting return
The instruction counter is initially limited to 1000, to avoid
problems with perpetual loops.

The rulesets are introduced in stages based on the count of
the number of trials

##### Other Ruleset Examples

To begin the development of "reasoned" programs, the early
rulesets should allow for:

- Match
- Search
- Sort
- Arrange

#### Reproduction
The most successful programs in a set of trials are copied to
a store for reproduction, modification and breeding.

Breeding involves extracting blocks marked by SM from two
parent entities and arranging them to produce children.

Monoclonal breeding will also be used, in about 50% of cases.


#### General Constraints
It is assumed that the set of selected breeding programs will
contain about 256 instances and that trials will produce 32
offspring for each trial cycle. 

The best three entries are retained as each evaluation cycle
is performed, then these are selected to enter the best set.

#### Performance
The initial program runs will establish the rate of evaluation
which we are currently assuming will be of the order of
50,000 per second (but this is rather a wild guess).

In practice the evaluation rate is about 2500 per second.

#### Main Program Structure

The Electron program divides naturally into two operational
halves, a background processing task (ie server) and a user
event/interface handler.

We can exploit this arrangement by having our trial and breed
operations running in the background on the server side and our user
interface for manipulating and viewing the proceedings on the
renderer side.

We can use a javascript class to define our entities (programs) 
and the code required to make it run. This will also include
the instruction set and registers and the 256byte code/memory
string. The initial state of the code string is also preserved.
And a set of constants such as sizes of code, required
to set constraints. A unique identity code should be provided
for each entity generated (memorable/pronunceable).

We can leave out the subroutine library for now, because we are speed trialing initially, but this would basically be a database or array of saved entities in their initial state.

We can use javascript objects to define our rulesets, with their
own evaluation functions. The top level evaluation object is passed
a copy of an entity's code/memory block in order to assess it.

The rulesets are grouped together in a class and accessible as
an array to be tested sequentially. The final score being maintained
in the super class. We can think about categorisation of sets of
rulesets later.

The breeding operations are arranged in classes (we may want variants later) divided into monoclonal and parent classes. The operating functions of these accept an initial entity code/memory block as input and output a derived block. As an aside we note that entities might be permitted to manage their own breeding.

Breeding operations consist of combining blocks from parents and
code level insert, delete and replace.

The master control loop is also defined as a class, so that we permit ourselves different environmental settings.

It should be possible to save the current system state to
permanent memory for resumption at another time. ie: best
entity set and any library entities.

#### User Interface
The user interface uses the Bootstrap object to provide columnar layout.

The user interface should provide a list of the top 20 scoring
programs (identifier) and their scores and cycle and system time in 
which they appeared. It should be possible to inspect the code block 
for any one of these or of the others from the set of best
entities.

The user interface should also provide facilities to download code 
sequences as text strings (hex + instruction) and to insert
code sequences (seeding, genetic manipulation).

The current elapsed time and number of cycles should also be 
displayed.

##### Displaying an Entity

Initially this is initiated by the main control program
to display an entity for debugging and testing purposes.

The entity display contains:
    entity identifier
    cycle of creation
    current score
    registers (A, B, ZF, CF, SP, IP, IC)
    scrollable list of instructions containing
        item address
        instruction mnemonic
        instruction code / data byte and hex version
    scrollable list of the parameter section
        numbered list of hex and decimal values
    scrollable list of the output values section
        numbered list of hex and decimal values
    
The data is assembled as an object by the process side entity 
and transmitted to the renderer as an event.

##### Trace (step through program) Functionality

The trace facilities allow the user to select the currently
displayed entity for a program step by step trace. A separate
window is provided for this purpose, trace.html.

When the Trace option is selected, a copy of the relevant entity
is obtained in its initial state. The procedure then uses the
relevant function of the instruction set to step through the
entity code instruction by instruction, signalling the trace
window at each step.

The data recorded on trace window is as follows:
    Entity Number (fixed)
    Best Set Number (fixed)
    Best Set Entity Number (fixed)
    Operational Pass Number
    Previous Register Values (A, B, C, CF, ZF, SP, IP, IC)
    Current Register Values
    First Pass Params (fixed)
    Second Pass Params (fixed)
    Params (allowing for the initial and second passes)
    Outputs (allowing for the initial and second passes)
    Initial Memory Space (instructions (fixed))
    Active Memory Space (instructions) with step through markers

###### Trace Logic and Data

When the Trace option is selected processing is flagged as halted, then
the currently displayed entity is transferred to the main program Trace object.
This creates a new entity using the initialMemSpace from the entity program.
The fixed data for the entity is also recorded. This consists of:
    Entity Number
    Best Set Num
    Best Set Entity Num
    First Pass Params
    Second Pass Params
    Initial Disassembled Code

The first program step is run using the instruction set traceExecute() function.

From the first (and subsequent) step, this prepares the following data:
    Previous register values
    Current register values
    Parameter Block Values
    Output Block Values
    Disassembled list of instructions with a flag marker for the last instruction executed
    The Disassembled list instruction index of the flagged marker
    Note also that if the listed previous instruction is incomplete, this is also flagged

Once this data is received by the Trace object, it is added to the fixed data and transmitted
to the traceRenderer event handler, which then transfers control to the src/display/traceDisplay
object for processing into HTML.


## Test Scripts

For isolated function testing the test scripts are in the src/tests folder
and require the functions and objects which they test.

A test window is also included, currently used to check the monoclonal
breeding.

## Load/Save Operations

The database system used by the app is MySql, node.js implementation.

The save and load options are included on the main display window.

The save operation records the best member of each of the best sets, along
with the systems time.

The data arrays (initialParamsList, initialMemSpace) are of fixed length
(256 bytes) and the range of values between 0 and 255, so these can be
saved as CHAR(256) fields.

The tables are as follows:

TABLE session
    id INT
    saved_time INT
    cycle_counter INT
    elapsed_time INT
    entity_number INT

TABLE session_entity_link
    id INT
    session_id INT
    entity_id INT

TABLE entity
    id INT
    session_id INT
    best_set_num INT
    entity_number INT
    birth_time INT
    birth_date_time VARCHAR(256)
    birth_cycle INT
    breed_method CHAR(64)
    score FLOAT
    initial_params_1 VARCHAR(256)
    initial_params_2 VARCHAR(256)
    initial_mem_space VARCHAR(256)

The load operation halts processing, loads the most recent (highest save_time) 
session into memory, clears down the best sets, creates an entity for each database 
entity loaded and includes the initial params and initial_mem_space for that entity. 
Inserting each of these entities into their own best set.

