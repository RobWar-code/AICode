const fragsDisplay = {
    sourceSet: "auto",

    start(data) {
        document.getElementById("fragInspectorBackground").style.display = "block";
        document.getElementById("numFragments").innerText = data.numFrags;
    }
}

module.exports = fragsDisplay