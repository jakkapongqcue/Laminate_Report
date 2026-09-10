const sql = require('mssql');
const config = require('./config');

const kepLogDbConfig = {
  user: config.KEPLOG_DB_USER,
  password: config.KEPLOG_DB_PASSWORD,
  server: config.KEPLOG_DB_SERVER,
  database: config.KEPLOG_DB_NAME,
  port: config.KEPLOG_DB_PORT,
  options: {
    encrypt: false,
    trustServerCertificate: true,
    useUTC: false
  },
  connectionTimeout: 5000,
  requestTimeout: 15000
};

const axDbConfig = {
  user: config.AX_DB_USER,
  password: config.AX_DB_PASSWORD,
  server: config.AX_DB_SERVER,
  database: config.AX_DB_NAME,
  port: config.AX_DB_PORT,
  options: {
    encrypt: false,
    trustServerCertificate: true,
    useUTC: false
  },
  connectionTimeout: 5000,
  requestTimeout: 15000
};

let pool = null;
let axPool = null;

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
    pool = new sql.ConnectionPool(kepLogDbConfig);
    await pool.connect();
    console.log(`Successfully connected to SQL Server at ${config.KEPLOG_DB_SERVER}:${config.KEPLOG_DB_PORT}`);
    return pool;
  } catch (err) {
    console.error(`Database connection failed: ${err.message}`);
    pool = null;
    return null;
  }
}

async function getAxPool() {
  if (axPool && axPool.connected) {
    return axPool;
  }
  try {
    if (axPool) {
      try {
        await axPool.close();
      } catch (e) {
        // ignore
      }
    }
    axPool = new sql.ConnectionPool(axDbConfig);
    await axPool.connect();
    console.log(`Successfully connected to AX SQL Server at ${config.AX_DB_SERVER}:${config.AX_DB_PORT}`);
    return axPool;
  } catch (err) {
    console.error(`AX Database connection failed: ${err.message}`);
    axPool = null;
    return null;
  }
}

module.exports = {
  getPool,
  getAxPool,
  sql
};
