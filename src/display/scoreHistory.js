const scoreHistory = {
    displayHistory(data) {
        let div = document.getElementById('scoreHistoryDiv');
        let html = "";
        for (let i = 0; i < data.length; i++) {
            html += "<div>";
            html += `<span style='display: inline-block; width: 24px'>${i})</span>`;
            for (let j = 0; j < data[i].length; j++) {
                html += "<span style='display: inline-block; width: 60px'>";
                let score = Math.floor(data[i][j] * 10000) / 10000;
                html += `${score}`;
                html += "</span>"
            }
            html += "</div>";
        }
        div.innerHTML = html;
        document.getElementById('scoreHistoryBackground').style.display = "block";
    }
}

module.exports = scoreHistory;