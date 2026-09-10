const express = require("express");
const cors = require("cors");
const config = require("./config");
const { getPool, getAxPool, getAxLastError, sql } = require("./db");
const {
  MACHINES,
  parseSqlTimestamp,
  formatDateTimeShort,
  formatDateTimeFull,
  AX_PS_COLUMNS,
} = require("./common");
const {
  PROCESS_LIST,
  ALL_MACHINES,
  getMachinesByProcess,
  findMachine,
  getProcess,
} = require("./processes");
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
    service: "Production Checking Report API",
    version: "2.0.0",
  });
});

// GET /api/processes -> list of available process types
router.get("/api/processes", (req, res) => {
  res.json(PROCESS_LIST);
});

// GET /api/machines -> list of machines (filtered by processType if provided)
router.get("/api/machines", (req, res) => {
  const { processType } = req.query;
  const machines = processType ? getMachinesByProcess(processType) : ALL_MACHINES;
  res.json(
    machines.map((m) => ({
      id: m.id,
      name: m.name,
      brand: m.brand,
      isMES: m.isMES,
      processType: m.processType,
    }))
  );
});

// GET /api/checkItemFG -> Check if Item FG and Machine ID exist in AX DB
router.get("/api/checkItemFG", async (req, res) => {
  const { machine, item_fg, processType } = req.query;

  if (!item_fg || !item_fg.trim()) {
    return res.status(400).json({
      exists: false,
      message: "กรุณาระบุ Item FG ที่ต้องการตรวจสอบ",
    });
  }

  const machineConfig =
    findMachine(machine) ||
    (processType ? getMachinesByProcess(processType)[0] : ALL_MACHINES[0]);
  const axMachineId = machineConfig ? machineConfig.axMachineId : machine;
  const cleanItemFg = String(item_fg).trim();

  try {
    const axPool = await getAxPool();
    if (!axPool) {
      const dbErr = getAxLastError() || "ไม่สามารถติดต่อฐานข้อมูล AX ได้";
      return res.json({
        exists: false,
        dbError: true,
        item_fg: cleanItemFg,
        machine: axMachineId,
        message: `ไม่สามารถเชื่อมต่อ AX (${config.AX_DB_SERVER}): ${dbErr}`,
      });
    }

    const axRequest = axPool.request();
    axRequest.input("item_fg", sql.VarChar, cleanItemFg);
    axRequest.input("ax_machine", sql.VarChar, axMachineId);

    const axQuery = `
      SELECT 
        a.ITEMFG, 
        a.MACHINE, 
        a.ITEMID, 
        bi.PRODPOOLID, 
        a.REVID, 
        a.RECID
      FROM [AX50_SF_PRD_SP1].[dbo].[SF_PRODSPECMACHINE] a
      LEFT JOIN [AX50_SF_PRD_SP1].[dbo].[SF_ViewInventTable_SF] bi ON bi.ITEMID = a.ITEMID
      WHERE a.ITEMFG = @item_fg AND a.MACHINE = @ax_machine
      ORDER BY a.REVID DESC, a.RECID DESC
    `;

    const axResult = await axRequest.query(axQuery);
    const records = axResult.recordset || [];
    const exists = records.length > 0;

    // Group unique PRODPOOLID with their latest REVID (first encountered is highest REVID)
    const poolMap = new Map();
    for (const row of records) {
      const poolId = row.PRODPOOLID || "Default";
      if (!poolMap.has(poolId)) {
        const name =
          poolId === "Laminate1"
            ? "Laminate 1"
            : poolId === "Laminate2"
              ? "Laminate 2"
              : poolId;
        poolMap.set(poolId, {
          poolId,
          name,
          revId: row.REVID,
          itemId: row.ITEMID,
        });
      }
    }
    const prodPools = Array.from(poolMap.values());
    const defaultPool = prodPools.length > 0 ? prodPools[0].poolId : null;
    const firstRecord = exists ? records[0] : null;

    return res.json({
      exists,
      item_fg: cleanItemFg,
      machine: axMachineId,
      itemId: firstRecord ? firstRecord.ITEMID : null,
      prodPools,
      defaultPool,
      message: exists
        ? `พบข้อมูล Item FG: ${cleanItemFg} สำหรับเครื่องจักร ${axMachineId} ในระบบ AX`
        : `ไม่พบข้อมูล Item FG: ${cleanItemFg} สำหรับเครื่องจักร ${axMachineId} ในระบบ AX`,
    });
  } catch (err) {
    console.error(`Check Item FG Error: ${err.message}`);
    return res.json({
      exists: false,
      dbError: true,
      item_fg: cleanItemFg,
      machine: axMachineId,
      message: `เกิดข้อผิดพลาดในการตรวจสอบฐานข้อมูล AX: ${err.message}`,
    });
  }
});

// GET /api/report/laminate -> Query SQL Server database for Report Sheet
router.get("/api/report/laminate", async (req, res) => {
  const {
    machine = "1LB09_Bobst",
    date_from,
    date_to,
    time_from = "08:00",
    time_to = "17:00",
    hour_step = 1,
    item_fg = null,
    prod_pool = null,
  } = req.query;

  if (!date_from || !date_to) {
    return res.status(400).json({
      detail: "date_from and date_to are required parameters.",
    });
  }

  const pool = await getPool();
  if (!pool) {
    return res.status(500).json({
      detail:
        "ไม่สามารถเชื่อมต่อฐานข้อมูล MS SQL Server (192.168.10.99) กรุณาตรวจสอบ DB_PASSWORD ในไฟล์ backend/.env",
    });
  }

  try {
    const machineConfig = MACHINES.find((m) => m.id === machine) || MACHINES[0];
    const tableName = machineConfig.tableName;
    const timestampCol = machineConfig.timestampColumn || "[SERVER TIMESTAMP]";
    const selectCols =
      machineConfig.columns && machineConfig.columns.length > 0
        ? machineConfig.columns.join(",\n          ")
        : "*";

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

    console.log(`Retrieved ${sqlRows.length} records from ${tableName} for machine ${machine}.`);

    // Fetch Set Point (PS) from AXDB if item_fg is provided
    let setPointMap = {};
    if (item_fg) {
      try {
        const axPool = await getAxPool();
        if (axPool) {
          const axMachineId = machineConfig.axMachineId;
          const cleanProdPool =
            prod_pool && String(prod_pool).trim() ? String(prod_pool).trim() : null;

          const axRequest = axPool.request();
          axRequest.input("item_fg", sql.VarChar, String(item_fg).trim());
          axRequest.input("ax_machine", sql.VarChar, axMachineId);
          if (cleanProdPool) {
            axRequest.input("prod_pool", sql.VarChar, cleanProdPool);
          }

          const axQuery = `
            SELECT TOP 1
              ${AX_PS_COLUMNS.join(",\n              ")}
            FROM [AX50_SF_PRD_SP1].[dbo].[SF_PRODSPECMACHINE] a
            LEFT JOIN [AX50_SF_PRD_SP1].[dbo].[SF_ViewInventTable_SF] bi ON bi.ITEMID = a.ITEMID
            WHERE a.ITEMFG = @item_fg 
              AND a.MACHINE = @ax_machine
              ${cleanProdPool ? "AND bi.PRODPOOLID = @prod_pool" : ""}
            ORDER BY a.REVID DESC, a.RECID DESC
          `;
          const axResult = await axRequest.query(axQuery);
          if (axResult.recordset && axResult.recordset.length > 0) {
            setPointMap = axResult.recordset[0];
            console.log(
              `Retrieved Set Point (PS) for ITEMFG: ${item_fg}, MACHINE: ${axMachineId}, POOL: ${cleanProdPool || "ANY"}`
            );
          } else {
            console.log(
              `No Set Point record found in AX for ITEMFG: ${item_fg}, MACHINE: ${axMachineId}, POOL: ${cleanProdPool || "ANY"}`
            );
          }
        }
      } catch (axErr) {
        console.warn(`Could not query AXDB for Set Point: ${axErr.message}`);
      }
    }

    const response = processSqlViewData({
      sqlRows,
      machine,
      dateFromStr: date_from,
      dateToStr: date_to,
      timeFromStr: time_from,
      timeToStr: time_to,
      hourStep: parseInt(hour_step),
      setPointMap,
      itemFg: item_fg,
    });

    res.json(response);
  } catch (err) {
    console.error(`PRD SQL Server Query Error: ${err.message}`);
    res.status(500).json({
      detail: `เกิดข้อผิดพลาดในการดึงข้อมูลจาก SQL Server: ${err.message}`,
    });
  }
});

// GET /api/chart/laminate -> Query SQL Server database for Line Chart time series
router.get("/api/chart/laminate", async (req, res) => {
  const {
    machine = "1LB09_Bobst",
    date_from,
    date_to,
    time_from = "08:00",
    time_to = "17:00",
    step_minutes = null,
  } = req.query;

  if (!date_from || !date_to) {
    return res.status(400).json({
      detail: "date_from and date_to are required parameters.",
    });
  }

  const pool = await getPool();
  if (!pool) {
    return res.status(500).json({
      detail:
        "ไม่สามารถเชื่อมต่อฐานข้อมูล MS SQL Server (192.168.10.99) กรุณาตรวจสอบ DB_PASSWORD ในไฟล์ backend/.env",
    });
  }

  try {
    const machineConfig = MACHINES.find((m) => m.id === machine) || MACHINES[0];
    const tableName = machineConfig.tableName;
    const timestampCol = machineConfig.timestampColumn || "[SERVER TIMESTAMP]";
    const selectCols =
      machineConfig.columns && machineConfig.columns.length > 0
        ? machineConfig.columns.join(",\n          ")
        : "*";

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

    console.log(
      `[Chart API] Retrieved ${sqlRows.length} records from ${tableName} for machine ${machine}.`,
    );

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
  const speedCol =
    machineConfig.columns?.find((c) => c.includes("AS LINE_SPEED")) ||
    "[Machine : Speed] AS LINE_SPEED";

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
