const breedDisplay = {
    displayBreedTable(data) {
        document.getElementById("breedTableBackground").style.display = "block";
        let tableDiv = document.getElementById("breedTableDiv");
        // Get total counts
        let totalTried = 0;
        let totalExtant = 0;
        for (let item of data) {
            totalTried += item.usedCount;
            totalExtant += item.extantCount;
        }
        // Do Table Heads
        let html = "<table id='breedTable'>";
        html += "<tr>"
        html +=     "<th>Breed Method</th>";
        html +=     "<th>Tried</th>"
        html +=     "<th>Tried/Total Tried Percent</th>";
        html +=     "<th>Extant</th>";
        html +=     "<th>Extant/Total Extant Percent</th>";
        html += "</tr>";

        // Do table Body
        for (let item of data) {
            html += "<tr>";
            html +=     `<td>${item.method}</td>`;
            html +=     `<td>${item.usedCount}</td>`;
            if (item.usedCount === 0) {
                html += `<td>n/a</td>`;
            }
            else {
                html += `<td>${Math.round((item.usedCount/totalTried) * 100)}</td>`;
            }
            html +=     `<td>${item.extantCount}</td>`;
            if (item.extantCount === 0) {
                html += `<td>n/a</td>`;
            }
            else {
                html += `<td>${Math.round((item.extantCount/totalExtant) * 100)}</td>`;
            }
            html += "</tr>";
        }
        html += "</table>";

        tableDiv.innerHTML = html;
    }
}

module.exports = breedDisplay;