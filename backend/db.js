const sql = require("mssql");
const config = require("./config");

const kepLogDbConfig = {
  user: config.KEPLOG_DB_USER,
  password: config.KEPLOG_DB_PASSWORD,
  server: config.KEPLOG_DB_SERVER,
  database: config.KEPLOG_DB_NAME,
  port: config.KEPLOG_DB_PORT,
  options: {
    encrypt: false,
    trustServerCertificate: true,
    useUTC: false,
  },
  connectionTimeout: 5000,
  requestTimeout: 15000,
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
    useUTC: false,
  },
  connectionTimeout: 5000,
  requestTimeout: 15000,
};

let kepLogPool = null;
let kepLogPoolPromise = null;
let axPool = null;
let axPoolPromise = null;

async function getKepLogPool() {
  if (kepLogPool && kepLogPool.connected) {
    return kepLogPool;
  }
  if (kepLogPoolPromise) {
    return kepLogPoolPromise;
  }
  kepLogPoolPromise = (async () => {
    try {
      if (kepLogPool) {
        try {
          await kepLogPool.close();
        } catch (e) {
          // ignore
        }
      }
      kepLogPool = new sql.ConnectionPool(kepLogDbConfig);
      await kepLogPool.connect();
      console.log(
        `Successfully connected to SQL Server at ${config.KEPLOG_DB_SERVER}:${config.KEPLOG_DB_PORT}`,
      );
      return kepLogPool;
    } catch (err) {
      console.error(`Keplog Database connection failed: ${err.message}`);
      kepLogPool = null;
      return null;
    } finally {
      kepLogPoolPromise = null;
    }
  })();
  return kepLogPoolPromise;
}

let lastAxError = null;

async function getAxPool() {
  if (axPool && axPool.connected) {
    return axPool;
  }
  if (axPoolPromise) {
    return axPoolPromise;
  }
  axPoolPromise = (async () => {
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
      lastAxError = null;
      console.log(
        `Successfully connected to AX SQL Server at ${config.AX_DB_SERVER}:${config.AX_DB_PORT}`,
      );
      return axPool;
    } catch (err) {
      console.error(`AX Database connection failed: ${err.message}`);
      lastAxError = err.message;
      axPool = null;
      return null;
    } finally {
      axPoolPromise = null;
    }
  })();
  return axPoolPromise;
}

function getAxLastError() {
  return lastAxError;
}

module.exports = {
  getKepLogPool,
  getAxPool,
  getAxLastError,
  sql,
};
