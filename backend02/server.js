const express = require('express');
const cors = require('cors');
const config = require('./config');
const { getPool, sql } = require('./db');
const { MACHINES, processSqlViewData, parseSqlTimestamp } = require('./reportProcessor');

const app = express();

// Enable CORS for Vue 3 frontend
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Root endpoint -> status
app.get('/', (req, res) => {
  res.json({
    status: "online",
    service: "Laminate Checking Report API",
    version: "1.0.0"
  });
});

// GET /api/machines -> list of machines
app.get('/api/machines', (req, res) => {
  res.json(MACHINES.map(m => ({ id: m.id, name: m.name })));
});

// GET /api/report/laminate -> Query SQL Server database
app.get('/api/report/laminate', async (req, res) => {
  const {
    machine = "1LB09_Bobst",
    date_from,
    date_to,
    time_from = "08:00",
    time_to = "17:00",
    hour_step = 1,
    setup_date = null,
    setup_time = null
  } = req.query;

  if (!date_from || !date_to) {
    return res.status(400).json({ detail: "date_from and date_to are required parameters." });
  }

  const pool = await getPool();
  if (!pool) {
    return res.status(500).json({
      detail: "ไม่สามารถเชื่อมต่อฐานข้อมูล MS SQL Server (192.168.10.99) กรุณาตรวจสอบ DB_PASSWORD ในไฟล์ backend02/.env"
    });
  }

  try {
    const startDatetime = `${date_from} ${time_from}:00`;
    const endDatetime = `${date_to} ${time_to}:00`;

    const request = pool.request();
    request.input('start_dt', sql.VarChar, startDatetime);
    request.input('end_dt', sql.VarChar, endDatetime);

    const query = `
      SELECT 
          [SERVER TIMESTAMP]
          ,[Machine : Speed]
          ,[Tunnel : Zone 1 : Temperature]
          ,[Tunnel : Zone 2 : Temperature]
          ,[Unwinder 1 : Tension]
          ,[Unwinder 2 : Tension]
          ,[Rewinder : Tension]
          ,[Rewinder : Tension Taper]
          ,[Coating : Inlet : Tension]
          ,[Laminator : Nip Roll : Operator : Pressure]
          ,[Laminator : Nip Roll : Motor : Pressure]
          ,[Unwinder 1 : Treatment : Specific Power]
          ,[Unwinder 2 : Corona : Specific Power]
      FROM [KEP_LOG].[dbo].[View_1LB09_Bobst]
      WHERE [SERVER TIMESTAMP] BETWEEN @start_dt AND @end_dt
      ORDER BY [SERVER TIMESTAMP] ASC
    `;

    const result = await request.query(query);
    const sqlRows = result.recordset;

    let setupRow = null;
    let setupTargetDt = null;

    if (setup_time) {
      const setupDateUse = setup_date || date_from;
      const [y, m, d] = setupDateUse.split('-').map(Number);
      const [hr, min] = setup_time.split(':').map(Number);
      setupTargetDt = new Date(y, m - 1, d, hr, min, 0, 0);

      if (!isNaN(setupTargetDt.getTime())) {
        const setupRequest = pool.request();
        const setupDatetimeStr = `${setupDateUse} ${setup_time}:00`;
        setupRequest.input('setup_dt', sql.VarChar, setupDatetimeStr);

        const setupQuery = `
          SELECT TOP 1
              [SERVER TIMESTAMP]
              ,[Machine : Speed]
              ,[Tunnel : Zone 1 : Temperature]
              ,[Tunnel : Zone 2 : Temperature]
              ,[Unwinder 1 : Tension]
              ,[Unwinder 2 : Tension]
              ,[Rewinder : Tension]
              ,[Rewinder : Tension Taper]
              ,[Coating : Inlet : Tension]
              ,[Laminator : Nip Roll : Operator : Pressure]
              ,[Laminator : Nip Roll : Motor : Pressure]
              ,[Unwinder 1 : Treatment : Specific Power]
              ,[Unwinder 2 : Corona : Specific Power]
          FROM [KEP_LOG].[dbo].[View_1LB09_Bobst]
          WHERE [SERVER TIMESTAMP] BETWEEN DATEADD(minute, -5, @setup_dt) AND DATEADD(minute, 5, @setup_dt)
          ORDER BY ABS(DATEDIFF(second, @setup_dt, [SERVER TIMESTAMP])) ASC
        `;

        const setupResult = await setupRequest.query(setupQuery);
        if (setupResult.recordset.length > 0) {
          setupRow = setupResult.recordset[0];
        }
      } else {
        setupTargetDt = null;
      }
    }

    console.log(`Retrieved ${sqlRows.length} records from [KEP_LOG].[dbo].[View_1LB09_Bobst]. Setup row found: ${setupRow !== null}`);

    const response = processSqlViewData({
      sqlRows,
      machine,
      dateFromStr: date_from,
      dateToStr: date_to,
      timeFromStr: time_from,
      timeToStr: time_to,
      hourStep: parseInt(hour_step),
      setupTargetDt,
      setupRow
    });

    res.json(response);
  } catch (err) {
    console.error(`PRD SQL Server Query Error: ${err.message}`);
    res.status(500).json({
      detail: `เกิดข้อผิดพลาดในการดึงข้อมูลจาก SQL Server: ${err.message}`
    });
  }
});

// GET /api/report/laminate/test -> Query synthetic mock data
app.get('/api/report/laminate/test', (req, res) => {
  const {
    machine = "1LB09_Bobst",
    date_from,
    date_to,
    time_from = "08:00",
    time_to = "17:00",
    hour_step = 1,
    setup_date = null,
    setup_time = null
  } = req.query;

  if (!date_from || !date_to) {
    return res.status(400).json({ detail: "date_from and date_to are required parameters." });
  }

  try {
    const [yearFrom, monthFrom, dayFrom] = date_from.split('-').map(Number);
    const [hourFrom, minFrom] = time_from.split(':').map(Number);
    const startDt = new Date(yearFrom, monthFrom - 1, dayFrom, hourFrom, minFrom, 0, 0);

    const [yearTo, monthTo, dayTo] = date_to.split('-').map(Number);
    const [hourTo, minTo] = time_to.split(':').map(Number);
    let endDt = new Date(yearTo, monthTo - 1, dayTo, hourTo, minTo, 0, 0);

    if (isNaN(startDt.getTime()) || isNaN(endDt.getTime())) {
      return res.status(400).json({ detail: "Invalid date/time format. Use YYYY-MM-DD and HH:MM" });
    }

    if (endDt <= startDt) {
      endDt.setDate(endDt.getDate() + 1);
    }

    const timestamps = [];
    let curr = new Date(startDt.getTime());
    const parsedHourStep = parseInt(hour_step);
    while (curr <= endDt) {
      timestamps.push(new Date(curr.getTime()));
      curr.setHours(curr.getHours() + parsedHourStep);
    }

    // Helper to format to YYYY-MM-DD HH:mm:ss
    function formatFullDateTime(date) {
      const y = date.getFullYear();
      const m = String(date.getMonth() + 1).padStart(2, '0');
      const d = String(date.getDate()).padStart(2, '0');
      const h = String(date.getHours()).padStart(2, '0');
      const min = String(date.getMinutes()).padStart(2, '0');
      const s = String(date.getSeconds()).padStart(2, '0');
      return `${y}-${m}-${d} ${h}:${min}:${s}`;
    }

    const sqlRows = [];
    for (let i = 0; i < timestamps.length; i++) {
      const tsStr = formatFullDateTime(timestamps[i]);
      const base = 100 + (i * 3);
      const row = [tsStr];
      for (let j = 0; j < 12; j++) {
        row.push(base + j);
      }
      sqlRows.push(row);
    }

    let setupRow = null;
    let setupTargetDt = null;

    if (setup_time) {
      const setupDateUse = setup_date || date_from;
      const [y, m, d] = setupDateUse.split('-').map(Number);
      const [hr, min] = setup_time.split(':').map(Number);
      setupTargetDt = new Date(y, m - 1, d, hr, min, 0, 0);

      if (!isNaN(setupTargetDt.getTime())) {
        let bestRow = null;
        let bestDelta = 5 * 60 * 1000;
        for (const tsRow of sqlRows) {
          const tsDt = parseSqlTimestamp(tsRow[0]);
          if (!tsDt) continue;
          const delta = Math.abs(tsDt.getTime() - setupTargetDt.getTime());
          if (delta <= bestDelta) {
            bestDelta = delta;
            bestRow = tsRow;
          } else if (tsDt.getTime() > setupTargetDt.getTime() + 5 * 60 * 1000) {
            break;
          }
        }
        if (bestRow) {
          setupRow = bestRow;
        }
      } else {
        setupTargetDt = null;
      }
    }

    const response = processSqlViewData({
      sqlRows,
      machine,
      dateFromStr: date_from,
      dateToStr: date_to,
      timeFromStr: time_from,
      timeToStr: time_to,
      hourStep: parsedHourStep,
      setupTargetDt,
      setupRow
    });

    res.json(response);
  } catch (err) {
    res.status(500).json({ detail: err.message });
  }
});

// Start Express server
const port = process.env.PORT || config.PORT || 8000;
if (typeof port === 'string' && port.startsWith('\\\\.\\pipe\\')) {
  app.listen(port, () => {
    console.log(`Server is running under iisnode on pipe: ${port}`);
  });
} else {
  app.listen(port, '0.0.0.0', () => {
    console.log(`Server is running on http://localhost:${port}`);
  });
}
