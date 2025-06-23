const path = require('node:path');
const mathFuncs = require(path.join(__dirname, "../appLib/mathFuncs.js"));

function testIsPrime() {
    let isPrime = mathFuncs.isPrime(17);
    console.log("17", isPrime);
    isPrime = mathFuncs.isPrime(63);
    console.log("63", isPrime);
    isPrime = mathFuncs.isPrime(14);
    console.log("14", isPrime);
}

testIsPrime();