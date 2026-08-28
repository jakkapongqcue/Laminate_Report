const {
  STANDARD_PARAMETERS,
  MACHINES,
  parseSqlTimestamp,
  formatDateTimeFull,
  formatDateTimeShort,
  parseNumericValue,
  extractTimestampFromRow,
  extractValueFromRow,
} = require("./common");

/**
 * Processes raw SQL rows into a clean Time Series structure optimized for ApexCharts Line Charts.
 */
function processSqlChartData({
  sqlRows = [],
  machine = "1LB09_Bobst",
  dateFromStr,
  dateToStr,
  timeFromStr = "08:00",
  timeToStr = "17:00",
  stepMinutes = null,
}) {
  const machineConfig = MACHINES.find((m) => m.id === machine) || MACHINES[0];

  // 1. Build sorted record list with valid timestamps
  const records = [];
  for (const r of sqlRows) {
    const rawTs = extractTimestampFromRow(r);
    if (!rawTs) continue;
    const dt = parseSqlTimestamp(rawTs);
    if (!dt || isNaN(dt.getTime())) continue;
    records.push({ dt, row: r });
  }

  records.sort((a, b) => a.dt.getTime() - b.dt.getTime());

  // 2. Filter / Sample records if stepMinutes is specified
  let sampledRecords = records;
  if (stepMinutes && stepMinutes > 0 && records.length > 0) {
    sampledRecords = [];
    const stepMs = stepMinutes * 60 * 1000;
    let lastTs = -Infinity;
    for (const item of records) {
      const currentTs = item.dt.getTime();
      if (currentTs - lastTs >= stepMs) {
        sampledRecords.push(item);
        lastTs = currentTs;
      }
    }
  }

  // 3. Map parameters to series
  const parameters = [];

  for (const p of STANDARD_PARAMETERS) {
    const dbColumnName = p.key;
    const colIdx = p.param_id;
    const unit = (machineConfig.unitOverrides && machineConfig.unitOverrides[p.key]) || p.unit;

    const dataPoints = [];
    let sum = 0;
    let count = 0;
    let min = null;
    let max = null;
    let latest = null;

    for (const rec of sampledRecords) {
      const rawVal = extractValueFromRow(rec.row, dbColumnName, colIdx);
      const numVal = parseNumericValue(rawVal);

      const timeLabel = formatDateTimeFull(rec.dt);

      if (numVal !== null) {
        dataPoints.push({
          x: timeLabel,
          y: numVal,
        });

        sum += numVal;
        count += 1;
        if (min === null || numVal < min) min = numVal;
        if (max === null || numVal > max) max = numVal;
        latest = numVal;
      } else {
        // If status or non-numeric, record null or skip
        if (p.type === "numeric") {
          dataPoints.push({
            x: timeLabel,
            y: null,
          });
        }
      }
    }

    const avg = count > 0 ? Math.round((sum / count) * 100) / 100 : null;

    parameters.push({
      key: p.key,
      param_id: p.param_id,
      name: p.name,
      category: p.category || "Other",
      type: p.type,
      unit: unit,
      stats: {
        min,
        max,
        avg,
        latest,
        count,
      },
      data: dataPoints,
    });
  }

  return {
    machine,
    date_from: dateFromStr,
    date_to: dateToStr,
    time_from: timeFromStr,
    time_to: timeToStr,
    total_data_points: sampledRecords.length,
    parameters,
  };
}

module.exports = {
  processSqlChartData,
};
