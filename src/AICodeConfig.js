module.exports = {
    databaseType: "sqlite", // sqlite or mysql
    processMode: "parallel", // parallel or serial
    workerDataTransfer: "fileSystem", // database or fileSystem
    numProcessesSet: 2 // n or "auto"
}