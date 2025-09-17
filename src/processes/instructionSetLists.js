const instructionSetLists = {
    selectedListNum: 1,
    lists: [
        {
            exclusions: [
                "POP B",
                "PUSH B",
                "POP C",
                "PUSH C",
                "INC SP",
                "DEC SP",
                "LISC A",
                "JRLZ",
                "JRLC",
                "CFAR",
                "CALL",
                "RET",
                "SM"
            ],
            codes: []
        }
    ],

    init(insSet) {
        for(let listItem of this.lists) {
            let exCodes = [];
            for (let ins of listItem.exclusions) {
                let codeObj = insSet.getInsCode(ins);
                if (codeObj === null) {
                    throw `instructionSetLists.init: invalid instruction ${ins}`;
                }
                let code = codeObj.code;
                exCodes.push(code);
            }
            exCodes.sort();
            let codes = [];
            let p = 0;
            for (let i = 0; i < insSet.numIns; i++) {
                if (i === exCodes[p]) {
                    ++p;
                }
                else {
                    codes.push(i);
                }
            }
            listItem.codes = codes;
        }
    },

    selectIns(numIns) {
        let code;
        if (this.selectedListNum >= this.lists.length) {
            code = Math.floor(Math.random() * numIns); 
        }
        else {
            let list = this.lists[this.selectedListNum].codes;
            let r = Math.floor(Math.random() * list.length);
            code = list[r];
        }
        return code;
    }
};

module.exports = instructionSetLists;