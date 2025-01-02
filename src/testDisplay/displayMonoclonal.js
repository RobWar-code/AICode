const displayMonoclonal = {

    displayData(htmlData) {
        console.log("Got to displayData", htmlData);
        for (let i = 0; i < htmlData.length; i++) {
            let itemNum = i + 1
            let listDiv = "monoclonalListDiv" + itemNum;
            let list = "monoclonalList" + itemNum;
            document.getElementById(list).remove();
            document.getElementById(listDiv).innerHTML = htmlData[i];
        }
    }
}

module.exports = displayMonoclonal;