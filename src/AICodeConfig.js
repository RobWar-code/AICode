module.exports = {
    databaseType: "sqlite", // sqlite or mysql
    processMode: "serial", // parallel or serial
    workerDataTransfer: "stdio", // database or fileSystem or stdio
    numProcessesSet: 3 // n or "auto"
}