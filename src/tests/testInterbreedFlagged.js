const Entity = require('../processes/Entity.js');
const InstructionSet = require('../processes/InstructionSet');

const testObj = {

    testInterbreedFlagged() {
        let insSet = new InstructionSet();
        // Create the entity mates
        let asRandom = true;
        let seeded = false;
        let m1 = new Entity(0, insSet, asRandom, seeded, 0, 0, null);
        let m2 = new Entity(0, insSet, asRandom, seeded, 0, 0, null);
        // Execute the entity mates
        m1.execute(0, 0);
        m2.execute(0, 0);
        // Check the instruction flagging
        console.log("m1Flags:");
        this.displayFlagging(m1.codeFlags);
        console.log("m2Flags:");
        this.displayFlagging(m2.codeFlags);
        let m3 = m1.interbreedFlagged(m2, 0, 0, 0);
        this.displayInitialMemSpace(m1.initialMemSpace, m2.initialMemSpace, m3.initialMemSpace);
    },

    displayFlagging(flags) {
        let a = Math.floor(flags.length / 32);
        let p = 0;
        for (let i = 0; i < a; i++) {
            for (let j = 0; j < 32; j++) {
                process.stdout.write(flags[p++] + " ");
            }
            process.stdout.write("\n");
        }
    },

    displayInitialMemSpace(m1, m2, m3) {
        console.log("Comparative bytes");
        for (let i = 0; i < 256; i++) {
            console.log(i + ")", m1[i], m2[i], m3[i]);
        }
    }

}

testObj.testInterbreedFlagged();

