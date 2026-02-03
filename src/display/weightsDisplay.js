const weightsDisplay = {

    weightingTable: [],

    displayWeights(weightingTable) {
        this.weightingTable = weightingTable;
        let table = document.getElementById("weightsTable");
        document.getElementById("weightsBackground").style.display = "block";
        table.innerHTML = "";
        let html = "<tr>";
        html +=    "<th>Pos</th>";
        html +=    "<th>Code Occurrences</th>";
        html +=    "<th>Total</th>"
        html +=    "</tr>";
        for (let codePosition = 0; codePosition < weightingTable.length; codePosition++) {
            let weightItem = weightingTable[codePosition];
            let total = weightItem.totalOccurrences;
            let occurrences = weightItem.codeOccurrences;
            html += "<tr>";
            html +=     `<td>${codePosition}</td>`;
            html +=     '<td><table id="weightsOccurrencesTable">';
            let p = 0;
            for (let i = 0; i < 16; i++) {
                html +=    "<tr>";
                html +=       `<td>${i * 16})</td>`
                for (let j = 0; j < 16; j++) {
                    html +=   `<td class="weightsActionCell" data-code-position="${codePosition}" data-code="${p}">${occurrences[p].occurrences}</td>`;
                    ++p;
                }
                html +=    "</tr>";
            }
            html +=     '</table></td>'
            html +=     `<td>${total}</td>`;
            html += "</tr>";
        }
        table.innerHTML = html;
    },

    displayWeightLinks(codePosition, code) {
        document.getElementById("weightsLinks").style.display = "block";
        document.getElementById("codePosition").innerText = codePosition;
        document.getElementById("weightCode").innerText = code;
        let weightsCell = this.weightingTable[codePosition].codeOccurrences[code];
        let linksTotal = weightsCell.linksTotal;
        document.getElementById("linksTotal").innerText = linksTotal;

        let links = weightsCell.links;
        links.sort((a,b) => a.code - b.code);
        let numRows = Math.floor(links.length / 16);
        let remnant = links.length - numRows * 16;
        if (remnant > 0) ++numRows;

        let html = "";
        let p = 0;
        for (let row = 0; row < numRows; row++) {
            html += "<tr>";
            let limit = 16;
            if (row === numRows - 1 && remnant > 0) limit = remnant;
            for (let cell = 0; cell < limit; cell++) {
                let link = links[p];
                let occurrences = link.occurrences;
                let code = link.code;
                html += `<td>${code}:${occurrences}</td>`;
                ++p;
            }
            html +="</tr>";
        }
        document.getElementById("weightsLinksTable").innerHTML = html;
    }
}

module.exports = weightsDisplay;