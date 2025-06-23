const path = require('node:path');

const mathFuncs = {
    primeTable: [],

    init() {
        this.makePrimeTable(256);
    },

    makePrimeTable(maxValue) {
        this.primeTable.push(1);
        this.primeTable.push(2);

        let n = 3;
        while (n < maxValue) {
            // Check for prime
            isPrime = this.isPrime(n);
            if (isPrime) {
                this.primeTable.push(n);
            }
            n += 2;
        }
    },

    isPrime(n) {
        let isPrime = false;
        if (n <= 3) {
            isPrime = true;
        }
        else {
            isPrime = true;
            let r = n ** 0.5;
            if (Math.floor(r) === r) {
                isPrime = false;
            }
            else if (n % 2 === 0) {
                isPrime = false;
            }
            else {
                let ir = Math.floor(r);
                if (ir % 2 === 0) --ir;
                for (let irn = ir; irn > 1; irn -= 2) {
                    if (n % irn === 0) {
                        isPrime = false;
                        break;
                    }
                }
            }
        }
        return isPrime;
    }
};

module.exports = mathFuncs;