const express = require("express");
const cors = require("cors");
const config = require("./config");
const { getKepLogPool, getAxPool, getAxLastError, sql } = require("./db");
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
  printing,
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
    })),
  );
});

// GET /api/searchItemFG -> Search Item FG by partial keyword (>= 4 chars) and Machine ID from AX DB
router.get("/api/searchItemFG", async (req, res) => {
  const { machine, keyword, processType } = req.query;
  const cleanKeyword = String(keyword || "").trim();

  if (!cleanKeyword || cleanKeyword.length < 4) {
    return res.status(400).json({
      success: false,
      message: "กรุณาระบุคำค้นหาอย่างน้อย 4 ตัวอักษร",
      items: [],
    });
  }

  const machineConfig =
    findMachine(machine) || (processType ? getMachinesByProcess(processType)[0] : ALL_MACHINES[0]);
  const axMachineId = machineConfig ? machineConfig.axMachineId : machine;

  try {
    const axPool = await getAxPool();
    if (!axPool) {
      const dbErr = getAxLastError() || "ไม่สามารถติดต่อฐานข้อมูล AX ได้";
      return res.status(503).json({
        success: false,
        dbError: true,
        keyword: cleanKeyword,
        machine: axMachineId,
        message: `ไม่สามารถเชื่อมต่อ AX (${config.AX_DB_SERVER}): ${dbErr}`,
        items: [],
      });
    }

    const axRequest = axPool.request();
    axRequest.input("keyword", sql.VarChar, `%${cleanKeyword}%`);
    axRequest.input("ax_machine", sql.VarChar, axMachineId);

    const axQuery = `
      SELECT DISTINCT TOP 20
        a.ITEMFG AS item_fg,
        ISNULL(ai.ITEMNAME, '') AS item_fg_name
      FROM [AX50_SF_PRD_SP1].[dbo].[SF_ProdSpecMachine] a
      LEFT JOIN [AX50_SF_PRD_SP1].[dbo].[SF_ViewInventTable_SF] ai 
        ON ai.ITEMID = a.ITEMFG
      WHERE a.MACHINE = @ax_machine
        AND a.ITEMFG LIKE @keyword
      ORDER BY a.ITEMFG ASC
    `;

    const axResult = await axRequest.query(axQuery);
    const items = (axResult.recordset || []).map((row) => ({
      item_fg: row.item_fg,
      item_fg_name: (row.item_fg_name || "").trim(),
    }));

    return res.json({
      success: true,
      keyword: cleanKeyword,
      machine: axMachineId,
      count: items.length,
      items,
      message:
        items.length > 0
          ? `พบ ${items.length} รายการที่ตรงกับคำค้นหา`
          : `ไม่พบ Item FG ที่ตรงกับ "${cleanKeyword}"`,
    });
  } catch (err) {
    console.error(`Search Item FG Error: ${err.message}`);
    return res.status(500).json({
      success: false,
      dbError: true,
      keyword: cleanKeyword,
      machine: axMachineId,
      message: `เกิดข้อผิดพลาดในการค้นหา AX: ${err.message}`,
      items: [],
    });
  }
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
    findMachine(machine) || (processType ? getMachinesByProcess(processType)[0] : ALL_MACHINES[0]);
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
        a.RECID,
        ISNULL(ai.ITEMNAME, '') AS ITEMNAME
      FROM [AX50_SF_PRD_SP1].[dbo].[SF_PRODSPECMACHINE] a
      LEFT JOIN [AX50_SF_PRD_SP1].[dbo].[SF_ViewInventTable_SF] bi ON bi.ITEMID = a.ITEMID
      LEFT JOIN [AX50_SF_PRD_SP1].[dbo].[SF_ViewInventTable_SF] ai ON ai.ITEMID = a.ITEMFG
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
          poolId === "Laminate1" ? "Laminate 1" : poolId === "Laminate2" ? "Laminate 2" : poolId;
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
    const itemFgName = firstRecord ? (firstRecord.ITEMNAME || "").trim() : "";

    return res.json({
      exists,
      item_fg: cleanItemFg,
      item_fg_name: itemFgName,
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

/**
 * ตรวจสอบความถูกต้องของช่วงวันที่ (date_from, date_to)
 * กำหนดให้ไม่เกิน maxDays วัน (ค่าเริ่มต้น 31 วัน)
 */
function validateDateRange(date_from, date_to, maxDays = 31) {
  if (!date_from || !date_to) {
    return { valid: false, detail: "date_from and date_to are required parameters." };
  }
  const fromDate = new Date(date_from);
  const toDate = new Date(date_to);
  if (isNaN(fromDate.getTime()) || isNaN(toDate.getTime())) {
    return { valid: false, detail: "รูปแบบวันที่ไม่ถูกต้อง (ต้องเป็นรูปแบบ YYYY-MM-DD)" };
  }
  const diffDays = Math.round((toDate - fromDate) / (1000 * 60 * 60 * 24));
  if (diffDays < 0) {
    return {
      valid: false,
      detail: "วันที่เริ่มต้น (date_from) ต้องไม่มากกว่าวันที่สิ้นสุด (date_to)",
    };
  }
  if (diffDays > maxDays) {
    return {
      valid: false,
      detail: `ช่วงเวลาที่เลือกต้องไม่เกิน ${maxDays} วัน (คุณเลือก ${diffDays} วัน) เพื่อประสิทธิภาพและความเสถียรของระบบ`,
    };
  }
  return { valid: true, diffDays };
}

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

  const dateValidation = validateDateRange(date_from, date_to, 31);
  if (!dateValidation.valid) {
    return res.status(400).json({
      detail: dateValidation.detail,
    });
  }

  const kepLogPool = await getKepLogPool();
  if (!kepLogPool) {
    return res.status(500).json({
      detail:
        "ไม่สามารถเชื่อมต่อฐานข้อมูล MS SQL Server (192.168.10.99) กรุณาตรวจสอบ DB_PASSWORD ในไฟล์ backend/.env",
    });
  }

  try {
    const machineConfig = MACHINES.find((m) => m.id === machine) || MACHINES[0];
    if (!machineConfig || !machineConfig.tableName) {
      return res.status(400).json({
        detail: `เครื่องจักร ${machineConfig ? machineConfig.name : machine} ยังไม่มีฐานข้อมูลรองรับ (Under Construction)`,
      });
    }
    const tableName = machineConfig.tableName;
    const timestampCol = machineConfig.timestampColumn || "[SERVER TIMESTAMP]";
    const selectCols =
      machineConfig.columns && machineConfig.columns.length > 0
        ? machineConfig.columns.join(",\n          ")
        : "*";

    const startDatetime = `${date_from} ${time_from}:00`;
    const endDatetime = `${date_to} ${time_to}:00`;

    const request = kepLogPool.request();
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

    if (!sqlRows || sqlRows.length === 0) {
      return res.status(404).json({
        detail: `ไม่พบข้อมูลใน KEP_LOG สำหรับเครื่อง ${machineConfig.name || machine} ในช่วงเวลาที่เลือก (${date_from} ${time_from} ถึง ${date_to} ${time_to})`,
      });
    }

    // Fetch Set Point (PS) and item_fg_name from AXDB if item_fg is provided
    let setPointMap = {};
    let itemFgName = "";
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
              ${AX_PS_COLUMNS.join(",\n              ")},
              ISNULL(ai.ITEMNAME, '') AS [ITEM_FG_NAME]
            FROM [AX50_SF_PRD_SP1].[dbo].[SF_PRODSPECMACHINE] a
            LEFT JOIN [AX50_SF_PRD_SP1].[dbo].[SF_ViewInventTable_SF] bi ON bi.ITEMID = a.ITEMID
            LEFT JOIN [AX50_SF_PRD_SP1].[dbo].[SF_ViewInventTable_SF] ai ON ai.ITEMID = a.ITEMFG
            WHERE a.ITEMFG = @item_fg 
              AND a.MACHINE = @ax_machine
              ${cleanProdPool ? "AND bi.PRODPOOLID = @prod_pool" : ""}
            ORDER BY a.REVID DESC, a.RECID DESC
          `;
          const axResult = await axRequest.query(axQuery);
          if (axResult.recordset && axResult.recordset.length > 0) {
            setPointMap = axResult.recordset[0];
            itemFgName = (setPointMap.ITEM_FG_NAME || "").trim();
            console.log(
              `Retrieved Set Point (PS) for ITEMFG: ${item_fg} (${itemFgName}), MACHINE: ${axMachineId}, POOL: ${cleanProdPool || "ANY"}`,
            );
          } else {
            console.log(
              `No Set Point record found in AX for ITEMFG: ${item_fg}, MACHINE: ${axMachineId}, POOL: ${cleanProdPool || "ANY"}`,
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
      itemFgName,
    });

    res.json(response);
  } catch (err) {
    console.error(`PRD SQL Server Query Error: ${err.message}`);
    res.status(500).json({
      detail: `เกิดข้อผิดพลาดในการดึงข้อมูลจาก SQL Server: ${err.message}`,
    });
  }
});

// GET /api/report/printing -> Query SQL Server database for Printing Report Sheet
router.get("/api/report/printing", async (req, res) => {
  const {
    machine = "1PG06",
    date_from,
    date_to,
    time_from = "08:00",
    time_to = "17:00",
    hour_step = 1,
    item_fg = null,
    prod_pool = null,
  } = req.query;

  const dateValidation = validateDateRange(date_from, date_to, 31);
  if (!dateValidation.valid) {
    return res.status(400).json({
      detail: dateValidation.detail,
    });
  }

  const kepLogPool = await getKepLogPool();
  if (!kepLogPool) {
    return res.status(500).json({
      detail:
        "ไม่สามารถเชื่อมต่อฐานข้อมูล MS SQL Server (192.168.10.99) กรุณาตรวจสอบ DB_PASSWORD ในไฟล์ backend/.env",
    });
  }

  try {
    const machineConfig = MACHINES.find((m) => m.id === machine) || MACHINES[0];
    if (!machineConfig || !machineConfig.tableName) {
      return res.status(400).json({
        detail: `เครื่องจักร ${machineConfig ? machineConfig.name : machine} ยังไม่มีฐานข้อมูลรองรับ (Under Construction)`,
      });
    }
    const tableName = machineConfig.tableName;
    const timestampCol = machineConfig.timestampColumn || "[SERVER TIMESTAMP]";
    const selectCols =
      machineConfig.columns && machineConfig.columns.length > 0
        ? machineConfig.columns.join(",\n          ")
        : "*";

    const startDatetime = `${date_from} ${time_from}:00`;
    const endDatetime = `${date_to} ${time_to}:00`;

    const request = kepLogPool.request();
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
      `[Printing] Retrieved ${sqlRows.length} records from ${tableName} for machine ${machine}.`,
    );

    if (!sqlRows || sqlRows.length === 0) {
      return res.status(404).json({
        detail: `ไม่พบข้อมูลใน KEP_LOG สำหรับเครื่อง ${machineConfig.name || machine} ในช่วงเวลาที่เลือก (${date_from} ${time_from} ถึง ${date_to} ${time_to})`,
      });
    }

    // Fetch Set Point (PS) and item_fg_name from AXDB if item_fg is provided
    let setPointMap = {};
    let itemFgName = "";
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

          const axPsCols =
            printing.axPsColumns && printing.axPsColumns.length > 0
              ? printing.axPsColumns.join(",\n              ")
              : "a.RECID";

          const axQuery = `
            SELECT TOP 1
              ${axPsCols},
              ISNULL(ai.ITEMNAME, '') AS [ITEM_FG_NAME]
            FROM [AX50_SF_PRD_SP1].[dbo].[SF_PRODSPECMACHINE] a
            LEFT JOIN [AX50_SF_PRD_SP1].[dbo].[SF_ViewInventTable_SF] bi ON bi.ITEMID = a.ITEMID
            LEFT JOIN [AX50_SF_PRD_SP1].[dbo].[SF_ViewInventTable_SF] ai ON ai.ITEMID = a.ITEMFG
            WHERE a.ITEMFG = @item_fg 
              AND a.MACHINE = @ax_machine
              ${cleanProdPool ? "AND bi.PRODPOOLID = @prod_pool" : ""}
            ORDER BY a.REVID DESC, a.RECID DESC
          `;
          const axResult = await axRequest.query(axQuery);
          if (axResult.recordset && axResult.recordset.length > 0) {
            setPointMap = axResult.recordset[0];
            itemFgName = (setPointMap.ITEM_FG_NAME || "").trim();
            console.log(
              `[Printing] Retrieved Set Point (PS) for ITEMFG: ${item_fg} (${itemFgName}), MACHINE: ${axMachineId}`,
            );
          } else {
            console.log(
              `[Printing] No Set Point record found in AX for ITEMFG: ${item_fg}, MACHINE: ${axMachineId}`,
            );
          }
        }
      } catch (axErr) {
        console.warn(`[Printing] Could not query AXDB for Set Point: ${axErr.message}`);
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
      itemFgName,
      parameters: printing.parameters,
      machinesList: printing.machines,
    });

    res.json(response);
  } catch (err) {
    console.error(`[Printing] SQL Server Query Error: ${err.message}`);
    res.status(500).json({
      detail: `เกิดข้อผิดพลาดในการดึงข้อมูลจาก SQL Server: ${err.message}`,
    });
  }
});

// GET /api/chart/:processType -> Query SQL Server database for Line Chart time series
router.get(["/api/chart/:processType", "/api/chart/laminate"], async (req, res) => {
  const processType = req.params.processType || "laminate";
  const proc = getProcess(processType);
  const procMachines = (proc && proc.machines) || MACHINES;
  const procParameters = (proc && proc.parameters) || null;

  const {
    machine = procMachines[0]?.id || "1LB09",
    date_from,
    date_to,
    time_from = "08:00",
    time_to = "17:00",
    step_minutes = null,
  } = req.query;

  const dateValidation = validateDateRange(date_from, date_to, 31);
  if (!dateValidation.valid) {
    return res.status(400).json({
      detail: dateValidation.detail,
    });
  }

  const kepLogPool = await getKepLogPool();
  if (!kepLogPool) {
    return res.status(500).json({
      detail:
        "ไม่สามารถเชื่อมต่อฐานข้อมูล MS SQL Server (192.168.10.99) กรุณาตรวจสอบ DB_PASSWORD ในไฟล์ backend/.env",
    });
  }

  try {
    const machineConfig = MACHINES.find((m) => m.id === machine) || procMachines[0];
    if (!machineConfig || !machineConfig.tableName) {
      return res.status(400).json({
        detail: `เครื่องจักร ${machineConfig ? machineConfig.name : machine} ยังไม่มีฐานข้อมูลรองรับ (Under Construction)`,
      });
    }
    const tableName = machineConfig.tableName;
    const timestampCol = machineConfig.timestampColumn || "[SERVER TIMESTAMP]";
    const selectCols =
      machineConfig.columns && machineConfig.columns.length > 0
        ? machineConfig.columns.join(",\n          ")
        : "*";

    const startDatetime = `${date_from} ${time_from}:00`;
    const endDatetime = `${date_to} ${time_to}:00`;

    const request = kepLogPool.request();
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
      `[Chart API - ${processType}] Retrieved ${sqlRows.length} records from ${tableName} for machine ${machine}.`,
    );

    if (!sqlRows || sqlRows.length === 0) {
      return res.status(404).json({
        detail: `ไม่พบข้อมูลใน KEP_LOG สำหรับเครื่อง ${machineConfig.name || machine} ในช่วงเวลาที่เลือก (${date_from} ${time_from} ถึง ${date_to} ${time_to})`,
      });
    }

    const parsedStep = step_minutes ? parseInt(step_minutes) : null;
    const response = processSqlChartData({
      sqlRows,
      machine,
      dateFromStr: date_from,
      dateToStr: date_to,
      timeFromStr: time_from,
      timeToStr: time_to,
      stepMinutes: parsedStep,
      parameters: procParameters,
      machinesList: procMachines,
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

  const kepLogPool = await getKepLogPool();
  if (!kepLogPool) {
    return res.status(500).json({ detail: "Database connection unavailable" });
  }

  const machineConfig = findMachine(machine) || MACHINES.find((m) => m.id === machine);
  if (!machineConfig || !machineConfig.tableName || machineConfig.isMES === false) {
    const responseData = {
      machine,
      status: 0,
      updateTime: "",
      message: machineConfig ? "No MES / Under Construction" : "Machine not found",
    };
    machineStatusCache.set(machine, { data: responseData, cachedAt: now });
    return res.json(responseData);
  }
  const tableName = machineConfig.tableName;
  const timestampCol = machineConfig.timestampColumn || "[SERVER TIMESTAMP]";
  const speedCol =
    machineConfig.columns?.find((c) => /LINE_SPEED/i.test(c)) ||
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
    let result = await kepLogPool.request().query(fastQuery);
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
      result = await kepLogPool.request().query(fallbackQuery);
      sqlRows = result.recordset;
    }

    if (!sqlRows || sqlRows.length === 0) {
      const responseData = { machine, status: 0, updateTime: "", message: "No data in KEP_LOG" };
      machineStatusCache.set(machine, { data: responseData, cachedAt: now });
      return res.json(responseData);
    }

    const row = sqlRows[0];
    const rawSpeed = row["LINE_SPEED"] !== undefined ? row["LINE_SPEED"] : row["line_speed"];
    const lineSpeed = parseFloat(rawSpeed) || 0;
    const diffSec = row["DIFF_SECONDS"] !== null && row["DIFF_SECONDS"] !== undefined ? Number(row["DIFF_SECONDS"]) : null;
    const isRecent = diffSec === null || (diffSec >= 0 && diffSec <= 1800);
    const status = (isRecent && lineSpeed > 0) ? 1 : 0;
    const parsedTime = parseSqlTimestamp(row["SERVER_TIMESTAMP"]);
    const updateTime = parsedTime ? formatDateTimeShort(parsedTime) : "";

    const responseData = { machine, status, updateTime };
    machineStatusCache.set(machine, { data: responseData, cachedAt: now });
    res.json(responseData);
  } catch (err) {
    console.error(`Machine status query error for ${machine}: ${err.message}`);
    const responseData = { machine, status: 0, updateTime: "", message: err.message };
    res.json(responseData);
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
