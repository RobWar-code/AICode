const sqlite3 = require('sqlite3').verbose();
const { open } = require('sqlite');


const dbConn = {
    connection: null,
    lastWrite: Promise.resolve(), // <- added to serialize writes
    lastRead: Promise.resolve(),

    async openConnection() {
        // Open once for the app
        if (this.connection != null) return this;

        try {
            this.connection = await open({
                filename: './src/database/database.db',
                driver: sqlite3.Database
            });
            return this;
        }
        catch (error) {
            console.log("Problem starting database");
            throw error;
        }
    },

    async execute(sql, params = []) {
        if (this.connection === null) {
            throw new Error('Database not initialized. Call openConnection() first.');
        }
        // Choose between .run() (no result) or .all() (getting results)
        if (sql.trim().toUpperCase().startsWith('SELECT')) {
            let results = await this._serializeRead(() => this.connection.all(sql, params));
            // To match mysql response
            return [results, undefined];
        } else {
            let result = await this._serializeWrite(() => this._runWrite(sql, params));
            return [result, undefined]; // can include info like changes, lastID
        }
    },
    
    async query(sql, params = []) {
        if (this.connection === null) {
            throw new Error('Database not initialized. Call openConnection() first.');
        }
        const firstWord = sql.trim().split(' ')[0].toUpperCase();
        if (firstWord === 'SELECT') {
            // If you want always multiple rows, use all()
            let results = await this._serializeRead(() => this.connection.all(sql, params));
            return [results, undefined];
        } else {
            // For INSERT/UPDATE/DELETE, use run()
            let result = await this._serializeWrite(() => this._runWrite(sql, params));
            return [result, undefined]; // can include info like changes, lastID
        }
    },

    async end() {
        // Do Nothing - use .close() to close the database at app end
    },

    async close() {
        if (this.connection === null) return;
        try {
            await this.connection.close();
            this.connection = null;
        }
        catch (error) {
            console.log("Problem closing connection");
            throw error;
        }
    },

    async _runWrite(sql, params) {
        // Helper to run the write operation
        if (sql.trim().startsWith('INSERT') || sql.trim().startsWith('UPDATE') || sql.trim().startsWith('DELETE') || sql.trim().startsWith('CREATE') || sql.trim().startsWith('DROP')) {
            const result = await this.connection.run(sql, params);
            return [result, undefined]; // Match the [results, undefined] format
        } else {
            throw new Error('Unknown write operation');
        }
    },

    async _serializeWrite(writeFn) {
        const maxRetries = 5;
        const retryDelay = 200; // milliseconds
    
        const attempt = async (retryCount) => {
            try {
                return await writeFn();
            } catch (err) {
                if (err && err.code === 'SQLITE_BUSY' && retryCount < maxRetries) {
                    console.warn(`Database is busy, retrying... attempt ${retryCount + 1}`);
                    await new Promise(resolve => setTimeout(resolve, retryDelay));
                    return attempt(retryCount + 1);
                } else {
                    throw err; // Rethrow if not SQLITE_BUSY or too many retries
                }
            }
        };
    
        // Chain it to the lastWrite promise to serialize
        this.lastWrite = this.lastWrite.then(() => attempt(0)).catch((err) => {
            console.error('Write error:', err);
            throw err;
        });
        return this.lastWrite;
    },
    
    async _serializeRead(readFn) {
        const maxRetries = 5;
        const retryDelay = 200; // milliseconds
    
        const attempt = async (retryCount) => {
            try {
                return await readFn();
            } catch (err) {
                if (err && err.code === 'SQLITE_BUSY' && retryCount < maxRetries) {
                    console.warn(`Read busy, retrying... attempt ${retryCount + 1}`);
                    await new Promise(resolve => setTimeout(resolve, retryDelay));
                    return attempt(retryCount + 1);
                } else {
                    throw err;
                }
            }
        };
    
        this.lastRead = this.lastRead.then(() => attempt(0)).catch(err => {
            console.error('Read error:', err);
            throw err;
        });
    
        return this.lastRead;
    }
    
}

module.exports = dbConn;
