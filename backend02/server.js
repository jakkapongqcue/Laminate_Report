const express = require("express");
const cors = require("cors");
const config = require("./config");
const { getPool, sql } = require("./db");
const { MACHINES, parseSqlTimestamp, formatDateTimeShort, formatDateTimeFull } = require("./common");
const { processSqlViewData } = require("./reportProcessor");
const { processSqlChartData } = require("./chartProcessor");

const app = express();

// Enable CORS for Vue 3 frontend
app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Mount the router to the IIS application path
const router = express.Router();

// Root endpoint -> status
router.get("/", (req, res) => {
  res.json({
    status: "online",
    service: "Laminate Checking Report API",
    version: "1.0.0",
  });
});

// GET /api/machines -> list of machines
router.get("/api/machines", (req, res) => {
  res.json(MACHINES.map((m) => ({ id: m.id, name: m.name })));
});

// GET /api/report/laminate -> Query SQL Server database for Report Sheet
router.get("/api/report/laminate", async (req, res) => {
  const { machine = "1LB09_Bobst", date_from, date_to, time_from = "08:00", time_to = "17:00", hour_step = 1, setup_date = null, setup_time = null } = req.query;

  if (!date_from || !date_to) {
    return res.status(400).json({
      detail: "date_from and date_to are required parameters.",
    });
  }

  const pool = await getPool();
  if (!pool) {
    return res.status(500).json({
      detail: "ไม่สามารถเชื่อมต่อฐานข้อมูล MS SQL Server (192.168.10.99) กรุณาตรวจสอบ DB_PASSWORD ในไฟล์ backend02/.env",
    });
  }

  try {
    const machineConfig = MACHINES.find((m) => m.id === machine) || MACHINES[0];
    const tableName = machineConfig.tableName;
    const timestampCol = machineConfig.timestampColumn || "[SERVER TIMESTAMP]";
    const selectCols = machineConfig.columns && machineConfig.columns.length > 0 ? machineConfig.columns.join(",\n          ") : "*";

    const startDatetime = `${date_from} ${time_from}:00`;
    const endDatetime = `${date_to} ${time_to}:00`;

    const request = pool.request();
    request.input("start_dt", sql.VarChar, startDatetime);
    request.input("end_dt", sql.VarChar, endDatetime);

    const query = `
      SELECT 
          ${selectCols}
      FROM ${tableName}
      WHERE ${timestampCol} BETWEEN @start_dt AND @end_dt
      ORDER BY ${timestampCol} ASC
    `;

    const result = await request.query(query);
    const sqlRows = result.recordset;

    let setupRow = null;
    let setupTargetDt = null;

    if (setup_time) {
      const setupDateUse = setup_date || date_from;
      const [y, m, d] = setupDateUse.split("-").map(Number);
      const [hr, min] = setup_time.split(":").map(Number);
      setupTargetDt = new Date(y, m - 1, d, hr, min, 0, 0);

      if (!isNaN(setupTargetDt.getTime())) {
        const setupRequest = pool.request();
        const setupDatetimeStr = `${setupDateUse} ${setup_time}:00`;
        setupRequest.input("setup_dt", sql.VarChar, setupDatetimeStr);

        const setupQuery = `
          SELECT TOP 1
              ${selectCols}
          FROM ${tableName}
          WHERE ${timestampCol} BETWEEN DATEADD(minute, -5, @setup_dt) AND DATEADD(minute, 5, @setup_dt)
          ORDER BY ABS(DATEDIFF(second, @setup_dt, ${timestampCol})) ASC
        `;

        const setupResult = await setupRequest.query(setupQuery);
        if (setupResult.recordset.length > 0) {
          setupRow = setupResult.recordset[0];
        }
      } else {
        setupTargetDt = null;
      }
    }

    console.log(`Retrieved ${sqlRows.length} records from ${tableName} for machine ${machine}. Setup row found: ${setupRow !== null}`);

    const response = processSqlViewData({
      sqlRows,
      machine,
      dateFromStr: date_from,
      dateToStr: date_to,
      timeFromStr: time_from,
      timeToStr: time_to,
      hourStep: parseInt(hour_step),
      setupTargetDt,
      setupRow,
    });

    res.json(response);
  } catch (err) {
    console.error(`PRD SQL Server Query Error: ${err.message}`);
    res.status(500).json({
      detail: `เกิดข้อผิดพลาดในการดึงข้อมูลจาก SQL Server: ${err.message}`,
    });
  }
});

// GET /api/report/laminate/test -> Query synthetic mock data for Report Sheet
router.get("/api/report/laminate/test", (req, res) => {
  const { machine = "1LB09_Bobst", date_from, date_to, time_from = "08:00", time_to = "17:00", hour_step = 1, setup_date = null, setup_time = null } = req.query;

  if (!date_from || !date_to) {
    return res.status(400).json({
      detail: "date_from and date_to are required parameters.",
    });
  }

  try {
    const [yearFrom, monthFrom, dayFrom] = date_from.split("-").map(Number);
    const [hourFrom, minFrom] = time_from.split(":").map(Number);
    const startDt = new Date(yearFrom, monthFrom - 1, dayFrom, hourFrom, minFrom, 0, 0);

    const [yearTo, monthTo, dayTo] = date_to.split("-").map(Number);
    const [hourTo, minTo] = time_to.split(":").map(Number);
    let endDt = new Date(yearTo, monthTo - 1, dayTo, hourTo, minTo, 0, 0);

    if (isNaN(startDt.getTime()) || isNaN(endDt.getTime())) {
      return res.status(400).json({
        detail: "Invalid date/time format. Use YYYY-MM-DD and HH:MM",
      });
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

    const sqlRows = [];
    for (let i = 0; i < timestamps.length; i++) {
      const tsStr = formatDateTimeFull(timestamps[i]);
      const base = 100 + i * 3;
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
      const [y, m, d] = setupDateUse.split("-").map(Number);
      const [hr, min] = setup_time.split(":").map(Number);
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
      setupRow,
    });

    res.json(response);
  } catch (err) {
    res.status(500).json({ detail: err.message });
  }
});

// GET /api/chart/laminate -> Query SQL Server database for Line Chart time series
router.get("/api/chart/laminate", async (req, res) => {
  const { machine = "1LB09_Bobst", date_from, date_to, time_from = "08:00", time_to = "17:00", step_minutes = null } = req.query;

  if (!date_from || !date_to) {
    return res.status(400).json({
      detail: "date_from and date_to are required parameters.",
    });
  }

  const pool = await getPool();
  if (!pool) {
    return res.status(500).json({
      detail: "ไม่สามารถเชื่อมต่อฐานข้อมูล MS SQL Server (192.168.10.99) กรุณาตรวจสอบ DB_PASSWORD ในไฟล์ backend02/.env",
    });
  }

  try {
    const machineConfig = MACHINES.find((m) => m.id === machine) || MACHINES[0];
    const tableName = machineConfig.tableName;
    const timestampCol = machineConfig.timestampColumn || "[SERVER TIMESTAMP]";
    const selectCols = machineConfig.columns && machineConfig.columns.length > 0 ? machineConfig.columns.join(",\n          ") : "*";

    const startDatetime = `${date_from} ${time_from}:00`;
    const endDatetime = `${date_to} ${time_to}:00`;

    const request = pool.request();
    request.input("start_dt", sql.VarChar, startDatetime);
    request.input("end_dt", sql.VarChar, endDatetime);

    const query = `
      SELECT 
          ${selectCols}
      FROM ${tableName}
      WHERE ${timestampCol} BETWEEN @start_dt AND @end_dt
      ORDER BY ${timestampCol} ASC
    `;

    const result = await request.query(query);
    const sqlRows = result.recordset;

    console.log(`[Chart API] Retrieved ${sqlRows.length} records from ${tableName} for machine ${machine}.`);

    const parsedStep = step_minutes ? parseInt(step_minutes) : null;
    const response = processSqlChartData({
      sqlRows,
      machine,
      dateFromStr: date_from,
      dateToStr: date_to,
      timeFromStr: time_from,
      timeToStr: time_to,
      stepMinutes: parsedStep,
    });

    res.json(response);
  } catch (err) {
    console.error(`PRD SQL Server Chart Query Error: ${err.message}`);
    res.status(500).json({
      detail: `เกิดข้อผิดพลาดในการดึงข้อมูลกราฟจาก SQL Server: ${err.message}`,
    });
  }
});

// GET /api/chart/laminate/test -> Query synthetic mock data for Line Chart
router.get("/api/chart/laminate/test", (req, res) => {
  const { machine = "1LB09_Bobst", date_from, date_to, time_from = "08:00", time_to = "17:00", step_minutes = 15 } = req.query;

  if (!date_from || !date_to) {
    return res.status(400).json({
      detail: "date_from and date_to are required parameters.",
    });
  }

  try {
    const [yearFrom, monthFrom, dayFrom] = date_from.split("-").map(Number);
    const [hourFrom, minFrom] = time_from.split(":").map(Number);
    const startDt = new Date(yearFrom, monthFrom - 1, dayFrom, hourFrom, minFrom, 0, 0);

    const [yearTo, monthTo, dayTo] = date_to.split("-").map(Number);
    const [hourTo, minTo] = time_to.split(":").map(Number);
    let endDt = new Date(yearTo, monthTo - 1, dayTo, hourTo, minTo, 0, 0);

    if (isNaN(startDt.getTime()) || isNaN(endDt.getTime())) {
      return res.status(400).json({
        detail: "Invalid date/time format. Use YYYY-MM-DD and HH:MM",
      });
    }

    if (endDt <= startDt) {
      endDt.setDate(endDt.getDate() + 1);
    }

    const stepMin = parseInt(step_minutes) || 15;
    const timestamps = [];
    let curr = new Date(startDt.getTime());
    while (curr <= endDt) {
      timestamps.push(new Date(curr.getTime()));
      curr.setMinutes(curr.getMinutes() + stepMin);
    }

    const sqlRows = [];
    for (let i = 0; i < timestamps.length; i++) {
      const tsStr = formatDateTimeFull(timestamps[i]);
      // Generate realistic mock data patterns with some slight wave/variance
      const sinWave = Math.sin(i / 3);
      const cosWave = Math.cos(i / 2);

      const row = {
        SERVER_TIMESTAMP: tsStr,
        LINE_SPEED: Math.round((120 + sinWave * 15 + (i % 5)) * 10) / 10,
        TEMP_ZONE_1: Math.round((80 + cosWave * 3 + (i % 3) * 0.5) * 10) / 10,
        TEMP_ZONE_2: Math.round((85 + sinWave * 4 + (i % 2) * 0.5) * 10) / 10,
        TENSION_UNWIND_1: Math.round((25 + sinWave * 2) * 10) / 10,
        TENSION_UNWIND_2: Math.round((28 + cosWave * 2) * 10) / 10,
        TENSION_REWIND: Math.round((30 + sinWave * 3) * 10) / 10,
        TENSION_TAPER_REWIND: Math.round((15 + cosWave * 1.5) * 10) / 10,
        TENSION_INLET_COATING: Math.round((18 + sinWave * 2) * 10) / 10,
        PRESSURE_NIP_OPERATOR: Math.round((3.5 + cosWave * 0.2) * 10) / 10,
        PRESSURE_NIP_MOTOR: Math.round((3.6 + sinWave * 0.2) * 10) / 10,
        CORONA_POWER_UW1: Math.round(1500 + sinWave * 100),
        CORONA_POWER_UW2: Math.round(1600 + cosWave * 120),
      };
      sqlRows.push(row);
    }

    const response = processSqlChartData({
      sqlRows,
      machine,
      dateFromStr: date_from,
      dateToStr: date_to,
      timeFromStr: time_from,
      timeToStr: time_to,
      stepMinutes: null,
    });

    res.json(response);
  } catch (err) {
    res.status(500).json({ detail: err.message });
  }
});

// Cache machine status for 5 seconds to reduce DB load from client polling
const machineStatusCache = new Map();
const STATUS_CACHE_TTL_MS = 5000;

// GET /api/machineStatus -> GET machine status by id, if speed > 0 online, speed = 0 offline
//  ex = /api/machineStatus?machine=1LB09_Bobst
router.get("/api/machineStatus", async (req, res) => {
  const { machine } = req.query;
  if (!machine) {
    return res.status(400).json({ detail: "machine is required parameter." });
  }

  // 1. Return cached response if within TTL
  const now = Date.now();
  const cached = machineStatusCache.get(machine);
  if (cached && now - cached.cachedAt < STATUS_CACHE_TTL_MS) {
    return res.json(cached.data);
  }

  const pool = await getPool();
  if (!pool) {
    return res.status(500).json({ detail: "Database connection unavailable" });
  }

  const machineConfig = MACHINES.find((m) => m.id === machine) || MACHINES[0];
  const tableName = machineConfig.tableName;
  const timestampCol = machineConfig.timestampColumn || "[SERVER TIMESTAMP]";
  const speedCol = machineConfig.columns?.find((c) => c.includes("AS LINE_SPEED")) || "[Machine : Speed] AS LINE_SPEED";

  // 2. Optimized query: Only select necessary columns with a time window (last 24h)
  const fastQuery = `
    SELECT TOP 1
      ${timestampCol} AS SERVER_TIMESTAMP,
      ${speedCol},
      DATEDIFF(second, ${timestampCol}, GETDATE()) AS DIFF_SECONDS
    FROM ${tableName}
    WHERE ${timestampCol} >= DATEADD(day, -1, GETDATE())
    ORDER BY ${timestampCol} DESC
  `;

  try {
    let result = await pool.request().query(fastQuery);
    let sqlRows = result.recordset;

    // 3. Fallback: if machine has been completely stopped for >24h, fetch latest historical record
    if (!sqlRows || sqlRows.length === 0) {
      const fallbackQuery = `
        SELECT TOP 1
          ${timestampCol} AS SERVER_TIMESTAMP,
          ${speedCol},
          DATEDIFF(second, ${timestampCol}, GETDATE()) AS DIFF_SECONDS
        FROM ${tableName}
        ORDER BY ${timestampCol} DESC
      `;
      result = await pool.request().query(fallbackQuery);
      sqlRows = result.recordset;
    }

    if (!sqlRows || sqlRows.length === 0) {
      const responseData = { machine, status: 0, updateTime: "" };
      machineStatusCache.set(machine, { data: responseData, cachedAt: now });
      return res.json(responseData);
    }

    const row = sqlRows[0];
    const lineSpeed = parseFloat(row["LINE_SPEED"]) || 0;
    const status = lineSpeed > 0 ? 1 : 0;
    const parsedTime = parseSqlTimestamp(row["SERVER_TIMESTAMP"]);
    const updateTime = parsedTime ? formatDateTimeShort(parsedTime) : "";

    const responseData = { machine, status, updateTime };
    machineStatusCache.set(machine, { data: responseData, cachedAt: now });
    res.json(responseData);
  } catch (err) {
    console.error(`Machine status query error: ${err.message}`);
    res.status(500).json({ detail: err.message });
  }
});

// Mount the router under both /LMR-Back (IIS Application path) and / (local dev fallback)
app.use("/LaminateReport-Back", router);
app.use("/", router);

// Start Express server
const port = process.env.PORT || config.PORT || 8000;
if (typeof port === "string" && port.startsWith("\\\\.\\pipe\\")) {
  app.listen(port, () => {
    console.log(`Server is running under iisnode on pipe: ${port}`);
  });
} else {
  app.listen(port, "0.0.0.0", () => {
    console.log(`Server is running on http://localhost:${port}`);
  });
}
