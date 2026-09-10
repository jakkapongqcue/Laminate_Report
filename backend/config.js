const path = require('path')
require('dotenv').config({ path: path.join(__dirname, '.env') })

const config = {
  KEPLOG_DB_SERVER: process.env.DB_SERVER || '192.168.10.99',
  KEPLOG_DB_PORT: parseInt(process.env.DB_PORT || '1433'),
  KEPLOG_DB_NAME: process.env.DB_NAME || 'KEP_LOG',
  KEPLOG_DB_USER: process.env.DB_USER || 'operation',
  KEPLOG_DB_PASSWORD: process.env.DB_PASSWORD || 'Welcome2026',

  AX_DB_SERVER: process.env.AX_DB_SERVER || 'AXDB',
  AX_DB_PORT: parseInt(process.env.AX_DB_PORT || '1433'),
  AX_DB_NAME: process.env.AX_DB_NAME || 'AX50_SF_PRD_SP1',
  AX_DB_USER: process.env.AX_DB_USER || 'ViewReportAPI',
  AX_DB_PASSWORD: process.env.AX_DB_PASSWORD || '',
}

module.exports = config
