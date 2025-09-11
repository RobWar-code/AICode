const logResults = require('../processes/logResults.js');

function testWrap() {
    let str1 = "The wildest weather strikes the coast of Cornwall";
    let width = 20;
    let wrapArray = logResults.wrapAndPadText(str1, width);
    for (let item of wrapArray) {
        console.log(item + "|");
    }

    str1 = "Contraptions for the weather strike the coast of Cornwall";
    width = 8;
    wrapArray = logResults.wrapAndPadText(str1, width);
    for (let item of wrapArray) {
        console.log(item + "|");
    }

    str1 = "Contraptions for the weather strike the coast of Cornwall";
    width = 10;
    wrapArray = logResults.wrapAndPadText(str1, width);
    for (let item of wrapArray) {
        console.log(item + "|");
    }

    str1 = "Contraptions for the weather + clouds strike the coast of Cornwall";
    width = 10;
    wrapArray = logResults.wrapAndPadText(str1, width);
    for (let item of wrapArray) {
        console.log(item + "|");
    }

    str1 = "Contraptions for the (weather and clouds) strike the coast of Cornwall";
    width = 10;
    wrapArray = logResults.wrapAndPadText(str1, width);
    for (let item of wrapArray) {
        console.log(item + "|");
    }

}

function testHeads() {
    let heads = ["My extra-large column", "little bit"];
    let colWidths = [12,6];
    logResults.makeTextTable([], heads, colWidths);
}

function testMakeTextTable() {
    let heads = ["First Column", "Second Column"];
    let colWidths = [10,6];
    let textData = [
        ["My fat lady", "10"],
        ["The local drunk", "100"],
        ["The oafish lout", "50"]
    ]
    let textArray = logResults.makeTextTable(textData, heads, colWidths);
    for (let line of textArray) {
        console.log(line);
    }
}

// testWrap();
// testHeads();
testMakeTextTable();