module.exports = {
    databaseType: "mysql", // sqlite or mysql
    processMode: "parallel", // parallel or serial
    workerDataTransfer: "database", // database or fileSystem or stdio
    numProcessesSet: 3 // n or "auto"
}