const {
  STANDARD_PARAMETERS,
  MACHINES,
  MATCH_TOLERANCE_MINUTES,
  parseSqlTimestamp,
  formatDateThai,
  formatTimeThai,
  formatDateTimeShort,
  formatReadingValue,
  extractTimestampFromRow,
  extractValueFromRow,
} = require("./common");

function processSqlViewData({ sqlRows, machine, dateFromStr, dateToStr, timeFromStr, timeToStr, hourStep = 1, setupTargetDt = null, setupRow = null }) {
  const machineConfig = MACHINES.find((m) => m.id === machine) || MACHINES[0];

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

  // Split daily clusters into pages (max 13 columns per page)
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
        category: p.category,
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
  processSqlViewData,
};
