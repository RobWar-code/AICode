const instructionSetLists = {
    selectedListNum: 1,
    lists: [
        [
            0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,18,19,20,21,22,23,24,25,26,
            33,34,35,36,37,38,39,40,41,42,43,44,45,46,47,48,49,50,51,52,54,55,61
        ]
    ],

    selectIns(numIns) {
        let code;
        if (this.selectedListNum >= this.lists.length) {
            code = Math.floor(Math.random() * numIns); 
        }
        else {
            let list = this.lists[this.selectedListNum];
            let r = Math.floor(Math.random() * list.length);
            code = list[r];
        }
        return code;
    }
};

module.exports = instructionSetLists;