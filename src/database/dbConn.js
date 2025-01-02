const mysql = require('mysql2/promise');

const dbConn = {

    async openConnection() {
        // Create a connection to the database
        const connection = await mysql.createConnection({
            host: 'localhost', // Replace with your MySQL host
            user: 'SysAdmin',      // Replace with your MySQL username
            password: 'Gollum56', // Replace with your MySQL password
            database: 'ai_code', // Replace with your MySQL database name
        });
    
        // Connect to the database
        let connectionOK = await connection.connect((err) => {
            if (err) {
                console.log('Error connecting to MySQL:', err.message);
                return false;
            }
            else {
                console.log('Connection OK');
                return true;
            }
        });

        if (connectionOK) {
            console.log("connection opened in dbConn");
            return connection;
        }
        else {
            return null;
        }
    }
}

// Export the connection
module.exports = dbConn;
