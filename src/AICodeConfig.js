module.exports = {
    databaseType: "sqlite", // sqlite or mysql
    processMode: "parallel", // parallel or serial
    workerDataTransfer: "stdio", // database or fileSystem or stdio
    numProcessesSet: "auto" // n or "auto"
}