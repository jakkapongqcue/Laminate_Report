const { getPool, sql } = require('../db');

async function check() {
  const pool = await getPool();
  if (!pool) {
    console.log("Failed to connect to database");
    return;
  }
  try {
    const result = await pool.request()
      .input('start_dt', sql.VarChar, '2026-08-20 05:00:00')
      .input('end_dt', sql.VarChar, '2026-08-20 18:00:00')
      .query(`
        SELECT [SERVER TIMESTAMP], [Machine : Speed]
        FROM [KEP_LOG].[dbo].[View_1LB09_Bobst]
        WHERE [SERVER TIMESTAMP] BETWEEN @start_dt AND @end_dt
        ORDER BY [SERVER TIMESTAMP] ASC
      `);
    console.log(`Total rows retrieved: ${result.recordset.length}`);
    if (result.recordset.length > 0) {
      console.log("First 15 rows:");
      console.log(result.recordset.slice(0, 15));
      console.log("Last 5 rows:");
      console.log(result.recordset.slice(-5));
    }
  } catch (err) {
    console.error("Query failed:", err);
  } finally {
    process.exit(0);
  }
}

check();
