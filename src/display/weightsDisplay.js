const weightsDisplay = {

    displayWeights(weightingTable) {
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
                    html +=   `<td class="weightsActionCell" data-codePosition="${codePosition}" data-code="${p}">${occurrences[p].occurrences}</td>`;
                    ++p;
                }
                html +=    "</tr>";
            }
            html +=     '</table></td>'
            html +=     `<td>${total}</td>`;
            html += "</tr>";
        }
        table.innerHTML = html;
    }
}

module.exports = weightsDisplay;