const fs = require("fs");
const path = require('node:path');
const rulesets = require(path.join(__dirname,"./rulesets"));

const logResults = {
    heads: ["Rule", "Completed in Rounds", "Rule Loop End"],
    colWidths: [48,9,9],

    makeRuleCompletionLog() {
        // Collect the data
        let rowArray = [];
        let index = 0;
        for (let rule of rulesets.scoreList) {
            if (!rule.skip && !rule.retain) {
                let rowData = [];
                rowData.push(rule.rule);
                let startRound = rulesets.ruleRounds[index].start;
                let endRound = rulesets.ruleRounds[index].end;
                let ruleLoopEnd = rulesets.ruleRounds[index].ruleLoopEnd;
                let completed = rulesets.ruleRounds[index].completed;
                if (startRound < 0 || !completed) {
                    rowData.push ("");
                    rowData.push ("");
                }
                else {
                    let rounds = endRound - startRound;
                    rounds += "";
                    rowData.push(rounds);
                    rowData.push(ruleLoopEnd + "");
                }
                rowArray.push(rowData);
            }
            ++index;
        }
        // Convert to table lines
        let tableLines = this.makeTextTable(rowArray, this.heads, this.colWidths);

        let filePath = path.join(__dirname, "../../logs/CompletionLog.txt");
        fs.writeFileSync(filePath, tableLines.join("\n"), "utf8");
    },

    makeTextTable(arr, heads, colWidths) {
        let textArray = [];
        // Do the horizontal line for the heading
        let numCols = heads.length;
        let hRule = "";
        for (let i = 0; i < numCols; i++) {
            let w = colWidths[i];
            let c = "-";
            hRule = hRule.concat(c.repeat(w)) + "|";
        }
        // Do the heading
        let headLines = this.makeTableRow(heads, colWidths);
        for (let line of headLines) {
            textArray.push(line);
        }
        textArray.push(hRule);
        // Do the table body
        for (let row of arr) {
            let lines = this.makeTableRow(row, colWidths);
            for (let line of lines) {
                textArray.push(line);
            }
        }
        return textArray;
    },

    makeTableRow(colTexts, colWidths) {
        let rows = [];
        let colArrays = [];
        // Get the column wrapped text
        let maxHeight = 1;
        let index = 0;
        for (let colText of colTexts) {
            let wrapArray = this.wrapAndPadText(colText, colWidths[index]);
            if (wrapArray.length > maxHeight) maxHeight = wrapArray.length;
            colArrays.push(wrapArray);
            ++index;
        }
        // Fill all the arrays to the maximum height
        index = 0;
        for (let colArray of colArrays) {
            if (colArray.length < maxHeight) {
                for (let i = colArray.length; i <= maxHeight; i++) {
                    let c = " ";
                    let s = c.repeat(colWidths[index]);
                    colArray.push(s);
                }
            }
            ++index;
        }
        // Make the text rows (lines)
        for (let i = 0; i < maxHeight; i++) {
            let line = "";
            for (let colArray of colArrays) {
                line = line + colArray[i] + "|";
            }
            rows.push(line);
        }
        return rows;
    },

    wrapAndPadText(text, width) {
        let breakChars = " ),;.+-_/=";
        let breakBeforeChars = "([{";
        let wrapArray = [];
        if (text.length === width) {
            wrapArray.push(text);
            return;
        }
        if (text.length < width) {
            let diff = width - text.length;
            let char = " ";
            let pad = char.repeat(diff);
            wrapArray.push(text.concat(pad));
        }
        else {
            let remnant = text;
            let done = false;
            while (!done) {
                let gotBreak = false
                let gotBreakBefore = false;
                let s = remnant.substring(0, width);
                let p = width - 1;
                while (p > 1 && !gotBreak) {
                    let c = s[p];
                    if (breakChars.indexOf(c) > -1) {
                        gotBreak = true;
                        break;
                    }
                    else {
                        if (breakBeforeChars.indexOf(c) > -1) {
                            gotBreak = true;
                            gotBreakBefore = true;
                            break;
                        }
                    }
                    --p;
                }
                if (!gotBreak) {
                    wrapArray.push(s);
                    remnant = remnant.substring(width);
                }
                else if (!gotBreakBefore) {
                    let s1 = s.substring(0, p + 1);
                    let c = " ";
                    s1 = s1.concat(c.repeat(width - p - 1));
                    wrapArray.push(s1);
                    remnant = remnant.substr(p + 1);
                }
                else {
                    let s1 = s.substring(0, p);
                    let c = " ";
                    s1 = s1.concat(c.repeat(width - p));
                    wrapArray.push(s1);
                    remnant = remnant.substr(p);
                }
                if (remnant.length <= width) {
                    done = true;
                    if (remnant.length > 0) {
                        let c = " ";
                        remnant = remnant.concat(c.repeat(width - remnant.length));
                        wrapArray.push(remnant);
                    }
                }
                if (remnant[0] === " ") remnant = remnant.substring(1);
            }
        }
        return wrapArray;
    }
}

module.exports = logResults;