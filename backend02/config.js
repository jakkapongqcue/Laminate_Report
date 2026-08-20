const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const config = {
  DB_SERVER: process.env.DB_SERVER || '192.168.10.99',
  DB_PORT: parseInt(process.env.DB_PORT || '1433'),
  DB_NAME: process.env.DB_NAME || 'KEP_LOG',
  DB_USER: process.env.DB_USER || 'operation',
  DB_PASSWORD: process.env.DB_PASSWORD || 'Welcome2026',
  PORT: parseInt(process.env.PORT || '8001')
};

module.exports = config;
