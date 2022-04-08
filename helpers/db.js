// @ts-check

const mssql = require('mssql');
const { DB_HOST, DB_NAME, DB_USER, DB_PASSWORD, DB_PORT } = require('../config/config');

/**
 * Obtener la conexión a la BD
 * 
 * @returns 
 */
const getConnectionPool = () => new mssql.ConnectionPool({
    database: DB_NAME,
    user: DB_USER,
    password: DB_PASSWORD,
    server: DB_HOST,
    port: +DB_PORT,
    requestTimeout: 300000,
    options: {
        encrypt: false,
        enableArithAbort: false,
        requestTimeout: 300000,
    }
}).connect();

module.exports = {
    getConnectionPool,
}
