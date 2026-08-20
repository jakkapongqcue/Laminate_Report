const sql = require('mssql');
const config = require('./config');

const dbConfig = {
  user: config.DB_USER,
  password: config.DB_PASSWORD,
  server: config.DB_SERVER,
  database: config.DB_NAME,
  port: config.DB_PORT,
  options: {
    encrypt: false,
    trustServerCertificate: true,
    useUTC: false
  },
  connectionTimeout: 5000,
  requestTimeout: 15000
};

let pool = null;

async function getPool() {
  if (pool && pool.connected) {
    return pool;
  }
  try {
    // If pool exists but not connected, close it first
    if (pool) {
      try {
        await pool.close();
      } catch (e) {
        // ignore
      }
    }
    pool = await sql.connect(dbConfig);
    console.log(`Successfully connected to SQL Server at ${config.DB_SERVER}:${config.DB_PORT}`);
    return pool;
  } catch (err) {
    console.error(`Database connection failed: ${err.message}`);
    pool = null;
    return null;
  }
}

module.exports = {
  getPool,
  sql
};
