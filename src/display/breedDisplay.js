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
        html +=     "<th>Tried Per 1/10000</th>";
        html +=     "<th>Extant</th>";
        html +=     "<th>Extant Per 1/10000</th>";
        html +=     "<th>1/10000 of Tried</th>";
        html +=     "<th>Proportion of Sampled percent</th>"
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
                html += `<td>${Math.round((item.usedCount/totalTried) * 10000)}</td>`;
            }
            html +=     `<td>${item.extantCount}</td>`;
            if (item.extantCount === 0) {
                html += `<td>n/a</td>`;
            }
            else {
                html += `<td>${Math.round((item.extantCount/totalExtant) * 10000)}</td>`;
            }
            if (item.extantCount === 0 || item.usedCount === 0) {
                html += `<td>n/a</td>`;
            }
            else {
                html += `<td>${Math.round((item.extantCount/item.usedCount) * 10000)}</td>`;
            }
            if (item.extantCount === 0) {
                html += `<td>n/a</td>`;
            }
            else {
                html += `<td>${Math.round((item.extantCount/(72*40)) * 100)}</td>`;
            }
            html += "</tr>";
        }
        html += "</table>";

        tableDiv.innerHTML = html;
    }
}

module.exports = breedDisplay;