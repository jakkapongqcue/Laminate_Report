const STANDARD_PARAMETERS = [
  { param_id: 1, name: "Line Speed", set_point: "", unit: "m/min", type: "numeric", db_column: "Machine : Speed" },
  { param_id: 2, name: "Temp No. 1", set_point: "", unit: "°C", type: "numeric", db_column: "Tunnel : Zone 1 : Temperature" },
  { param_id: 3, name: "Temp No. 2", set_point: "", unit: "°C", type: "numeric", db_column: "Tunnel : Zone 2 : Temperature" },
  { param_id: 4, name: "Temp No. 3", set_point: "", unit: "°C", type: "numeric", db_column: null },
  { param_id: 5, name: "Temp No. 4", set_point: "", unit: "°C", type: "numeric", db_column: null },
  { param_id: 6, name: "Temp Tank A", set_point: "", unit: "°C", type: "numeric", db_column: null },
  { param_id: 7, name: "Temp A, B", set_point: "", unit: "°C", type: "numeric", db_column: null },
  { param_id: 8, name: "Adhesive Hose A, B", set_point: "", unit: "°C", type: "numeric", db_column: null },
  { param_id: 9, name: "1st Unwind Tension", set_point: "", unit: "Kg./N", type: "numeric", db_column: "Unwinder 1 : Tension" },
  { param_id: 10, name: "2nd Unwind Tension", set_point: "", unit: "Kg./N", type: "numeric", db_column: "Unwinder 2 : Tension" },
  { param_id: 11, name: "Rewind Tension", set_point: "", unit: "Kg./N", type: "numeric", db_column: "Rewinder : Tension" },
  { param_id: 12, name: "Rewinder : Tension Taper", set_point: "", unit: "%", type: "numeric", db_column: "Rewinder : Tension Taper" },
  { param_id: 13, name: "Coating Pressure", set_point: "", unit: "Bar/Mpa", type: "numeric", db_column: null },
  { param_id: 14, name: "Coating : Inlet : Tension", set_point: "", unit: "N", type: "numeric", db_column: "Coating : Inlet : Tension" },
  { param_id: 15, name: "Nip roll Pressure Operator Side", set_point: "", unit: "Bar/Mpa", type: "numeric", db_column: "Laminator : Nip Roll : Operator : Pressure" },
  { param_id: 16, name: "Nip roll Pressure Motor Side", set_point: "", unit: "Bar/Mpa", type: "numeric", db_column: "Laminator : Nip Roll : Motor : Pressure" },
  { param_id: 17, name: "ชุด Smooting Roll เกลี่ยกาว", set_point: "", unit: "ปกติ/ไม่ปกติ", type: "status", options: ["ปกติ", "ไม่ปกติ"], db_column: null },
  { param_id: 18, name: "Corona Treated Inside (ด้านใน)", set_point: "", unit: "มี/ไม่มี", type: "status", options: ["มี", "ไม่มี"], db_column: null },
  { param_id: 19, name: "Corona Treated Outside (ด้านนอก)", set_point: "", unit: "มี/ไม่มี", type: "status", options: ["มี", "ไม่มี"], db_column: null },
  { param_id: 20, name: "Corona Specific Power (UW1)", set_point: "", unit: "Watt", type: "numeric", db_column: "Unwinder 1 : Treatment : Specific Power" },
  { param_id: 21, name: "Corona Specific Power (UW2)", set_point: "", unit: "Watt", type: "numeric", db_column: "Unwinder 2 : Corona : Specific Power" }
];

const MACHINES = [
  { id: "1LB09_Bobst", name: "1LB09 Bobst" }
];

const COLUMN_INDEX_MAP = {
  "Machine : Speed": 1,
  "Tunnel : Zone 1 : Temperature": 2,
  "Tunnel : Zone 2 : Temperature": 3,
  "Unwinder 1 : Tension": 4,
  "Unwinder 2 : Tension": 5,
  "Rewinder : Tension": 6,
  "Rewinder : Tension Taper": 7,
  "Coating : Inlet : Tension": 8,
  "Laminator : Nip Roll : Operator : Pressure": 9,
  "Laminator : Nip Roll : Motor : Pressure": 10,
  "Unwinder 1 : Treatment : Specific Power": 11,
  "Unwinder 2 : Corona : Specific Power": 12
};

const MATCH_TOLERANCE_MINUTES = 30;

function convertSqlRowToArray(row) {
  if (!row) return null;
  if (Array.isArray(row)) return row;

  return [
    row["SERVER TIMESTAMP"],
    row["Machine : Speed"],
    row["Tunnel : Zone 1 : Temperature"],
    row["Tunnel : Zone 2 : Temperature"],
    row["Unwinder 1 : Tension"],
    row["Unwinder 2 : Tension"],
    row["Rewinder : Tension"],
    row["Rewinder : Tension Taper"],
    row["Coating : Inlet : Tension"],
    row["Laminator : Nip Roll : Operator : Pressure"],
    row["Laminator : Nip Roll : Motor : Pressure"],
    row["Unwinder 1 : Treatment : Specific Power"],
    row["Unwinder 2 : Corona : Specific Power"]
  ];
}

function parseSqlTimestamp(val) {
  if (!val) return null;
  if (val instanceof Date) return val;
  if (typeof val === 'string') {
    const cleanStr = val.replace('T', ' ');
    const parts = cleanStr.split(' ');
    const datePart = parts[0];
    const timePart = parts[1] || '00:00:00';
    const [year, month, day] = datePart.split('-').map(Number);
    const timeSplit = timePart.split(':').map(Number);
    const hour = timeSplit[0] || 0;
    const min = timeSplit[1] || 0;
    const sec = timeSplit[2] || 0;
    return new Date(year, month - 1, day, hour, min, sec, 0);
  }
  return new Date(val);
}

function formatDateThai(date) {
  const d = String(date.getDate()).padStart(2, '0');
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const y = date.getFullYear();
  return `${d}/${m}/${y}`;
}

function formatTimeThai(date) {
  const h = String(date.getHours()).padStart(2, '0');
  const min = String(date.getMinutes()).padStart(2, '0');
  return `${h}:${min} น.`;
}

function formatDateTimeShort(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  const h = String(date.getHours()).padStart(2, '0');
  const min = String(date.getMinutes()).padStart(2, '0');
  return `${y}-${m}-${d} ${h}:${min}`;
}

function formatReadingValue(val) {
  if (val === null || val === undefined) return "";
  if (typeof val === 'number') {
    if (Number.isInteger(val)) {
      return String(val);
    } else {
      return String(Math.round(val * 10) / 10);
    }
  }
  return String(val);
}

function processSqlViewData({
  sqlRows,
  machine,
  dateFromStr,
  dateToStr,
  timeFromStr,
  timeToStr,
  hourStep = 1,
  setupTargetDt = null,
  setupRow = null
}) {
  // Build a timestamp mapping list
  const timestampList = [];
  for (const r of sqlRows) {
    const arrRow = convertSqlRowToArray(r);
    if (!arrRow || arrRow[0] === null || arrRow[0] === undefined) {
      continue;
    }
    const dtObj = parseSqlTimestamp(arrRow[0]);
    if (!dtObj || isNaN(dtObj.getTime())) {
      continue;
    }
    timestampList.push({ dtObj, row: arrRow });
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
    const [yearFrom, monthFrom, dayFrom] = dateFromStr.split('-').map(Number);
    const [hourFrom, minFrom] = timeFromStr.split(':').map(Number);
    startDt = new Date(yearFrom, monthFrom - 1, dayFrom, hourFrom, minFrom, 0, 0);

    const [yearTo, monthTo, dayTo] = dateToStr.split('-').map(Number);
    const [hourTo, minTo] = timeToStr.split(':').map(Number);
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
    const m = String(dt.getMonth() + 1).padStart(2, '0');
    const d = String(dt.getDate()).padStart(2, '0');
    const dayKey = `${y}-${m}-${d}`;
    if (!dayClusters[dayKey]) {
      dayClusters[dayKey] = [];
    }
    dayClusters[dayKey].push(dt);
  }

  // Split daily clusters into pages (max 14 columns per page)
  const pageChunks = [];
  const MAX_COLS_PER_PAGE = 14;
  for (const [dayStr, dtList] of Object.entries(dayClusters)) {
    for (let i = 0; i < dtList.length; i += MAX_COLS_PER_PAGE) {
      pageChunks.push({
        dateKey: dayStr,
        timestamps: dtList.slice(i, i + MAX_COLS_PER_PAGE)
      });
    }
  }

  const totalPages = pageChunks.length;
  const pages = [];

  for (let idx = 1; idx <= totalPages; idx++) {
    const chunk = pageChunks[idx - 1];
    const [y, m, d] = chunk.dateKey.split('-').map(Number);
    const dtObj = new Date(y, m - 1, d);
    const formattedDateTh = formatDateThai(dtObj);

    const timeCols = [];
    const includeSetup = (setupTargetDt !== null && setupTargetDt !== undefined);
    let setupDisplayDt = null;

    if (includeSetup) {
      const arrSetupRow = setupRow ? convertSqlRowToArray(setupRow) : null;
      if (arrSetupRow && arrSetupRow.length > 0 && arrSetupRow[0] !== null && arrSetupRow[0] !== undefined) {
        setupDisplayDt = parseSqlTimestamp(arrSetupRow[0]);
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
        full_datetime: setupFullDt
      });
    }

    for (const dt of chunk.timestamps) {
      const { bestActualDt } = findNearestRow(dt);
      const displayDt = bestActualDt || dt;

      const hh = String(dt.getHours()).padStart(2, '0');
      const mm = String(dt.getMinutes()).padStart(2, '0');
      const key = `time_${hh}${mm}`;

      timeCols.push({
        key: key,
        label: formatTimeThai(displayDt),
        full_datetime: formatDateTimeShort(displayDt)
      });
    }

    const rows = [];
    for (const p of STANDARD_PARAMETERS) {
      let setupVal = "";
      const colValues = {};

      const dbColumn = p.db_column;
      const hasDbColumn = dbColumn && (COLUMN_INDEX_MAP[dbColumn] !== undefined);

      if (idx === 1 && includeSetup && hasDbColumn) {
        const setupColIdx = COLUMN_INDEX_MAP[dbColumn];

        if (setupColIdx !== undefined) {
          const arrSetupRow = setupRow ? convertSqlRowToArray(setupRow) : null;

          if (arrSetupRow && setupColIdx < arrSetupRow.length && arrSetupRow[setupColIdx] !== null && arrSetupRow[setupColIdx] !== undefined) {
            const rawVal = arrSetupRow[setupColIdx];
            setupVal = formatReadingValue(rawVal);
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

            if (bestRow && setupColIdx < bestRow.length && bestRow[setupColIdx] !== null && bestRow[setupColIdx] !== undefined) {
              const rawVal = bestRow[setupColIdx];
              setupVal = formatReadingValue(rawVal);
            }
          }
        }
      }

      for (const col of timeCols) {
        if (col.key === "setup") {
          continue;
        }

        if (!hasDbColumn) {
          colValues[col.key] = "";
          continue;
        }

        const colIdx = COLUMN_INDEX_MAP[dbColumn];

        const [datePart, timePart] = col.full_datetime.split(' ');
        const [yearVal, monthVal, dayVal] = datePart.split('-').map(Number);
        const [hourVal, minVal] = timePart.split(':').map(Number);
        const colDt = new Date(yearVal, monthVal - 1, dayVal, hourVal, minVal, 0, 0);

        if (isNaN(colDt.getTime())) {
          colValues[col.key] = "";
          continue;
        }

        const { bestRow } = findNearestRow(colDt);

        if (bestRow && colIdx < bestRow.length && bestRow[colIdx] !== null && bestRow[colIdx] !== undefined) {
          const rawVal = bestRow[colIdx];
          colValues[col.key] = formatReadingValue(rawVal);
        } else {
          colValues[col.key] = "";
        }
      }

      rows.push({
        param_id: p.param_id,
        name: p.name,
        set_point: "",
        unit: p.unit,
        setup_val: setupVal,
        values: colValues
      });
    }

    pages.push({
      page_number: idx,
      total_pages: totalPages,
      date_str: formattedDateTh,
      time_columns: timeCols,
      rows: rows
    });
  }

  return {
    machine,
    date_from: dateFromStr,
    date_to: dateToStr,
    time_from: timeFromStr,
    time_to: timeToStr,
    pages
  };
}

module.exports = {
  MACHINES,
  STANDARD_PARAMETERS,
  processSqlViewData,
  parseSqlTimestamp
};
