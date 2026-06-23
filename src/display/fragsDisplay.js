const fragsDisplay = {
    sourceSet: "auto",

    start(data) {
        document.getElementById("fragInspectorBackground").style.display = "block";
        document.getElementById("numFragments").innerText = data.numFrags;
        this.doInsTable(data.insCodeData);
    },

    doInsTable(insCodeData) {
        let t = document.getElementById("fragCodeList");
        t.innerHTML = "";
        let html = "<tr>";
        html +=     "<th>Offset</th>";
        html +=     "<th>Code</th>";
        html +=     "<th>Ins</th>";
        html +=     "<th>Dec Data</th>";
        html +=     "<th>Hex Data</th>";
        html +=    "</tr>";
        for (let item of insCodeData) {
            html += "<tr>";
            html +=     `<td>${item.offset}</td>`;
            html +=     `<td>${item.code}</td>`;
            html +=     `<td>${item.ins}</td>`;
            html +=     `<td>${item.decData}</td>`;
            html +=     `<td>${item.hexData}</td>`;
            html += "</tr>";
        }
        t.innerHTML = html;
    }
}

module.exports = fragsDisplay