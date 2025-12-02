const mysql = require('mysql2/promise');
const dotenv = require('dotenv');

dotenv.config({
    path:'./.env'
})
const password = process.env.password ;
const connectionLimit = process.env.connectionLimit ;
const host = process.env.host ;
const user = process.env.user ;
const database = process.env.database ;
// Load environment variables from .env file
// Create a connection to the database
const pool = mysql.createPool({
    connectionLimit: connectionLimit,
    host: host,
    user: user,
    password: password,
    database: database
});


// Export the connection
module.exports = pool;
