const STANDARD_PARAMETERS = [
  { key: "LINE_SPEED", param_id: 1, name: "Line Speed", set_point: "", unit: "m/min", type: "numeric" },
  { key: "SPICE_SPEED", param_id: 2, name: "Spice Speed", set_point: "", unit: "m/min", type: "numeric" },
  { key: "TEMP_ZONE_1", param_id: 3, name: "Temp No. 1", set_point: "", unit: "°C", type: "numeric" },
  { key: "TEMP_ZONE_2", param_id: 4, name: "Temp No. 2", set_point: "", unit: "°C", type: "numeric" },
  { key: "TEMP_ZONE_3", param_id: 5, name: "Temp No. 3", set_point: "", unit: "°C", type: "numeric" },
  { key: "TEMP_ZONE_4", param_id: 6, name: "Temp No. 4", set_point: "", unit: "°C", type: "numeric" },
  { key: "TEMP_TANK_A", param_id: 7, name: "Temp Tank A", set_point: "", unit: "°C", type: "numeric" },
  { key: "TEMP_A_B", param_id: 8, name: "Temp A, B", set_point: "", unit: "°C", type: "numeric" },
  { key: "TEMP_HOSE_AB", param_id: 9, name: "Adhesive Hose A, B", set_point: "", unit: "°C", type: "numeric" },
  { key: "TENSION_UNWIND_1", param_id: 10, name: "1ˢᵗ Unwind Tension", set_point: "", unit: "Kg./N", type: "numeric" },
  { key: "TENSION_UNWIND_2", param_id: 11, name: "2ⁿᵈ Unwind Tension", set_point: "", unit: "Kg./N", type: "numeric" },
  { key: "TENSION_REWIND", param_id: 12, name: "Rewind Tension", set_point: "", unit: "Kg./N", type: "numeric" },
  { key: "TENSION_TAPER_REWIND", param_id: 13, name: "Rewinder : Tension Taper", set_point: "", unit: "%", type: "numeric" },
  { key: "COATING_PRESSURE", param_id: 14, name: "Coating Pressure", set_point: "", unit: "Bar/Mpa", type: "numeric" },
  { key: "TENSION_INLET_COATING", param_id: 15, name: "Coating : Inlet : Tension", set_point: "", unit: "N", type: "numeric" },
  { key: "PRESSURE_NIP_OPERATOR", param_id: 16, name: "Nip roll Pressure Operator Side", set_point: "", unit: "Bar/Mpa", type: "numeric" },
  { key: "PRESSURE_NIP_MOTOR", param_id: 17, name: "Nip roll Pressure Motor Side", set_point: "", unit: "Bar/Mpa", type: "numeric" },
  { key: "SMOOTHING_ROLL", param_id: 18, name: "ชุด Smooting Roll เกลี่ยกาว", set_point: "", unit: "ปกติ/ไม่ปกติ", type: "status" },
  { key: "CORONA_INSIDE", param_id: 19, name: "Corona Treated Inside (ด้านใน)", set_point: "", unit: "มี/ไม่มี", type: "status" },
  { key: "CORONA_OUTSIDE", param_id: 20, name: "Corona Treated Outside (ด้านนอก)", set_point: "", unit: "มี/ไม่มี", type: "status" },
  { key: "CORONA_POWER_UW1", param_id: 21, name: "Corona Specific Power (UW1)", set_point: "", unit: "Watt", type: "numeric" },
  { key: "CORONA_POWER_UW2", param_id: 22, name: "Corona Specific Power (UW2)", set_point: "", unit: "Watt", type: "numeric" },
];

const MACHINES = [
  {
    id: "1LB09_Bobst",
    name: "1LB09 Bobst",
    tableName: "[KEP_LOG].[dbo].[View_1LB09_Bobst]",
    timestampColumn: "[SERVER TIMESTAMP]",
    columns: [
      "[SERVER TIMESTAMP] AS SERVER_TIMESTAMP",
      "[Machine : Speed] AS LINE_SPEED",
      "[Tunnel : Zone 1 : Temperature] AS TEMP_ZONE_1",
      "[Tunnel : Zone 2 : Temperature] AS TEMP_ZONE_2",
      "[Unwinder 1 : Tension] AS TENSION_UNWIND_1",
      "[Unwinder 2 : Tension] AS TENSION_UNWIND_2",
      "[Rewinder : Tension] AS TENSION_REWIND",
      "[Rewinder : Tension Taper] AS TENSION_TAPER_REWIND",
      "[Coating : Inlet : Tension] AS TENSION_INLET_COATING",
      "[Laminator : Nip Roll : Operator : Pressure] AS PRESSURE_NIP_OPERATOR",
      "[Laminator : Nip Roll : Motor : Pressure] AS PRESSURE_NIP_MOTOR",
      "[Unwinder 1 : Treatment : Specific Power] AS CORONA_POWER_UW1",
      "[Unwinder 2 : Corona : Specific Power] AS CORONA_POWER_UW2",
    ],
  },
  {
    id: "2LB06_FujiKikai",
    name: "2LB06 Fuji Kikai",
    tableName: "[KEP_LOG].[dbo].[View_2LB06_FujiKikai]",
    timestampColumn: "[SERVER TIMESTAMP]",
    columns: [
      "[SERVER TIMESTAMP] AS SERVER_TIMESTAMP",
      "[Speed.Processing Speed] AS LINE_SPEED",
      "[Temp.No.1 Zone] AS TEMP_ZONE_1",
      "[Temp.No.2 Zone] AS TEMP_ZONE_2",
      "[Temp.No.3 Zone] AS TEMP_ZONE_3",
      "[Ten.Dryer] AS TEMP_ZONE_4",
      "[Ten.No.1 Unwinder] AS TENSION_UNWIND_1",
      "[Ten.No.2 Unwinder] AS TENSION_UNWIND_2",
      "[Ten.Rewinder] AS TENSION_REWIND",
      "[Rewinder Taper No.] AS TENSION_TAPER_REWIND",
    ],
    unitOverrides: {
      TENSION_UNWIND_1: "N",
      TENSION_UNWIND_2: "N",
    },
  },
];

const MATCH_TOLERANCE_MINUTES = 30;

function parseSqlTimestamp(val) {
  if (!val) return null;
  if (val instanceof Date) return val;
  if (typeof val === "string") {
    const cleanStr = val.replace("T", " ");
    const parts = cleanStr.split(" ");
    const datePart = parts[0];
    const timePart = parts[1] || "00:00:00";
    const [year, month, day] = datePart.split("-").map(Number);
    const timeSplit = timePart.split(":").map(Number);
    const hour = timeSplit[0] || 0;
    const min = timeSplit[1] || 0;
    const sec = timeSplit[2] || 0;
    return new Date(year, month - 1, day, hour, min, sec, 0);
  }
  return new Date(val);
}

function formatDateThai(date) {
  const d = String(date.getDate()).padStart(2, "0");
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const y = date.getFullYear();
  return `${d}/${m}/${y}`;
}

function formatTimeThai(date) {
  const h = String(date.getHours()).padStart(2, "0");
  const min = String(date.getMinutes()).padStart(2, "0");
  return `${h}:${min} น.`;
}

function formatDateTimeShort(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  const h = String(date.getHours()).padStart(2, "0");
  const min = String(date.getMinutes()).padStart(2, "0");
  return `${y}-${m}-${d} ${h}:${min}`;
}

function formatReadingValue(val) {
  if (val === null || val === undefined) return "";
  if (typeof val === "number") {
    if (Number.isInteger(val)) {
      return String(val);
    } else {
      return String(Math.round(val * 10) / 10);
    }
  }
  return String(val);
}

function extractTimestampFromRow(row) {
  if (!row) return null;
  if (Array.isArray(row)) return row[0];
  return row["SERVER TIMESTAMP"] || row["Server Timestamp"] || row["TIMESTAMP"] || Object.values(row)[0];
}

function extractValueFromRow(row, colName, colIndex = -1) {
  if (!row) return null;
  if (Array.isArray(row)) {
    if (colIndex >= 0 && colIndex < row.length) {
      return row[colIndex];
    }
    return null;
  }
  if (colName && row[colName] !== undefined) {
    return row[colName];
  }
  return null;
}

function processSqlViewData({ sqlRows, machine, dateFromStr, dateToStr, timeFromStr, timeToStr, hourStep = 1, setupTargetDt = null, setupRow = null }) {
  const machineConfig = MACHINES.find((m) => m.id === machine) || MACHINES[0];
  const paramMapping = machineConfig.paramMapping || {};

  // Build a timestamp mapping list
  const timestampList = [];
  for (const r of sqlRows) {
    const rawTs = extractTimestampFromRow(r);
    if (rawTs === null || rawTs === undefined) {
      continue;
    }
    const dtObj = parseSqlTimestamp(rawTs);
    if (!dtObj || isNaN(dtObj.getTime())) {
      continue;
    }
    timestampList.push({ dtObj, row: r });
  }

  // Sort timestamps ASC
  timestampList.sort((a, b) => a.dtObj.getTime() - b.dtObj.getTime());

  // Helper to find nearest row
  const MATCH_TOLERANCE_MS = MATCH_TOLERANCE_MINUTES * 60 * 1000;
  function findNearestRow(targetDt) {
    let bestRow = null;
    let bestActualDt = null;
    let bestDelta = MATCH_TOLERANCE_MS;

    for (const item of timestampList) {
      const delta = Math.abs(item.dtObj.getTime() - targetDt.getTime());
      if (delta <= bestDelta) {
        bestDelta = delta;
        bestRow = item.row;
        bestActualDt = item.dtObj;
      } else if (item.dtObj.getTime() > targetDt.getTime() + MATCH_TOLERANCE_MS) {
        break; // because the list is sorted
      }
    }
    return { bestActualDt, bestRow };
  }

  // Parse start / end datetime
  let startDt, endDt;
  try {
    const [yearFrom, monthFrom, dayFrom] = dateFromStr.split("-").map(Number);
    const [hourFrom, minFrom] = timeFromStr.split(":").map(Number);
    startDt = new Date(yearFrom, monthFrom - 1, dayFrom, hourFrom, minFrom, 0, 0);

    const [yearTo, monthTo, dayTo] = dateToStr.split("-").map(Number);
    const [hourTo, minTo] = timeToStr.split(":").map(Number);
    endDt = new Date(yearTo, monthTo - 1, dayTo, hourTo, minTo, 0, 0);

    if (isNaN(startDt.getTime()) || isNaN(endDt.getTime())) {
      throw new Error("Invalid datetime");
    }
  } catch (err) {
    const today = new Date();
    const y = today.getFullYear();
    const m = today.getMonth();
    const d = today.getDate();
    startDt = new Date(y, m, d, 8, 0, 0, 0);
    endDt = new Date(y, m, d, 17, 0, 0, 0);
  }

  // If end date/time is prior to start, bump by 1 day
  if (endDt <= startDt) {
    endDt.setDate(endDt.getDate() + 1);
  }

  // Generate target hourly checkpoints
  const allTimestamps = [];
  let currDt = new Date(startDt.getTime());
  while (currDt <= endDt) {
    allTimestamps.push(new Date(currDt.getTime()));
    currDt.setHours(currDt.getHours() + hourStep);
  }

  // Cluster checkpoints by day key
  const dayClusters = {};
  for (const dt of allTimestamps) {
    const y = dt.getFullYear();
    const m = String(dt.getMonth() + 1).padStart(2, "0");
    const d = String(dt.getDate()).padStart(2, "0");
    const dayKey = `${y}-${m}-${d}`;
    if (!dayClusters[dayKey]) {
      dayClusters[dayKey] = [];
    }
    dayClusters[dayKey].push(dt);
  }

  // Split daily clusters into pages (max 14 columns per page)
  const pageChunks = [];
  const MAX_COLS_PER_PAGE = 13;
  for (const [dayStr, dtList] of Object.entries(dayClusters)) {
    for (let i = 0; i < dtList.length; i += MAX_COLS_PER_PAGE) {
      pageChunks.push({
        dateKey: dayStr,
        timestamps: dtList.slice(i, i + MAX_COLS_PER_PAGE),
      });
    }
  }

  const totalPages = pageChunks.length;
  const pages = [];

  for (let idx = 1; idx <= totalPages; idx++) {
    const chunk = pageChunks[idx - 1];
    const [y, m, d] = chunk.dateKey.split("-").map(Number);
    const dtObj = new Date(y, m - 1, d);
    const formattedDateTh = formatDateThai(dtObj);

    const timeCols = [];
    const includeSetup = setupTargetDt !== null && setupTargetDt !== undefined;
    let setupDisplayDt = null;

    if (includeSetup) {
      const rawSetupTs = extractTimestampFromRow(setupRow);
      if (rawSetupTs !== null && rawSetupTs !== undefined) {
        setupDisplayDt = parseSqlTimestamp(rawSetupTs);
        if (!setupDisplayDt || isNaN(setupDisplayDt.getTime())) {
          setupDisplayDt = setupTargetDt;
        }
      } else {
        setupDisplayDt = setupTargetDt;
      }

      let setupLabel, setupFullDt;
      if (idx === 1) {
        setupLabel = setupDisplayDt ? `Set up \n${formatTimeThai(setupDisplayDt)}` : "Set up";
        setupFullDt = setupDisplayDt ? formatDateTimeShort(setupDisplayDt) : `${chunk.dateKey} Set up`;
      } else {
        setupLabel = "Set up";
        setupFullDt = `${chunk.dateKey} Set up`;
      }

      timeCols.push({
        key: "setup",
        label: setupLabel,
        full_datetime: setupFullDt,
      });
    }

    for (const dt of chunk.timestamps) {
      const { bestActualDt } = findNearestRow(dt);
      const displayDt = bestActualDt || dt;

      const hh = String(dt.getHours()).padStart(2, "0");
      const mm = String(dt.getMinutes()).padStart(2, "0");
      const key = `time_${hh}${mm}`;

      timeCols.push({
        key: key,
        label: formatTimeThai(displayDt),
        full_datetime: formatDateTimeShort(displayDt),
      });
    }

    const rows = [];
    for (const p of STANDARD_PARAMETERS) {
      let setupVal = "";
      const colValues = {};

      const dbColumnName = p.key;
      // Index for array-based mock row fallback
      const colIdx = p.param_id;

      if (idx === 1 && includeSetup && dbColumnName) {
        if (setupRow) {
          const rawVal = extractValueFromRow(setupRow, dbColumnName, colIdx);
          if (rawVal !== null && rawVal !== undefined) {
            setupVal = formatReadingValue(rawVal);
          }
        } else {
          // Find nearest row in timestampList within ±5 minutes (300000ms)
          let bestRow = null;
          let bestDelta = 5 * 60 * 1000;
          for (const item of timestampList) {
            const delta = Math.abs(item.dtObj.getTime() - setupTargetDt.getTime());
            if (delta <= bestDelta) {
              bestDelta = delta;
              bestRow = item.row;
            } else if (item.dtObj.getTime() > setupTargetDt.getTime() + 5 * 60 * 1000) {
              break;
            }
          }

          if (bestRow) {
            const rawVal = extractValueFromRow(bestRow, dbColumnName, colIdx);
            if (rawVal !== null && rawVal !== undefined) {
              setupVal = formatReadingValue(rawVal);
            }
          }
        }
      }

      for (const col of timeCols) {
        if (col.key === "setup") {
          continue;
        }

        if (!dbColumnName) {
          colValues[col.key] = "";
          continue;
        }

        const [datePart, timePart] = col.full_datetime.split(" ");
        const [yearVal, monthVal, dayVal] = datePart.split("-").map(Number);
        const [hourVal, minVal] = timePart.split(":").map(Number);
        const colDt = new Date(yearVal, monthVal - 1, dayVal, hourVal, minVal, 0, 0);

        if (isNaN(colDt.getTime())) {
          colValues[col.key] = "";
          continue;
        }

        const { bestRow } = findNearestRow(colDt);

        if (bestRow) {
          const rawVal = extractValueFromRow(bestRow, dbColumnName, colIdx);
          if (rawVal !== null && rawVal !== undefined) {
            colValues[col.key] = formatReadingValue(rawVal);
          } else {
            colValues[col.key] = "";
          }
        } else {
          colValues[col.key] = "";
        }
      }

      const unit = (machineConfig.unitOverrides && machineConfig.unitOverrides[p.key]) || p.unit;

      rows.push({
        key: p.key,
        param_id: p.param_id,
        name: p.name,
        set_point: "",
        unit: unit,
        setup_val: setupVal,
        values: colValues,
      });
    }

    pages.push({
      page_number: idx,
      total_pages: totalPages,
      date_str: formattedDateTh,
      time_columns: timeCols,
      rows: rows,
    });
  }

  return {
    machine,
    date_from: dateFromStr,
    date_to: dateToStr,
    time_from: timeFromStr,
    time_to: timeToStr,
    pages,
  };
}

module.exports = {
  MACHINES,
  STANDARD_PARAMETERS,
  processSqlViewData,
  parseSqlTimestamp,
  formatDateTimeShort,
};
