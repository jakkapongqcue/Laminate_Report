const { STANDARD_PARAMETERS } = require("./laminate/parameters");
const { AX_PS_COLUMNS } = require("./laminate/axPs");
const { ALL_MACHINES } = require("./processes");

const MACHINES = ALL_MACHINES;
  

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

function formatDateTimeFull(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  const h = String(date.getHours()).padStart(2, "0");
  const min = String(date.getMinutes()).padStart(2, "0");
  const s = String(date.getSeconds()).padStart(2, "0");
  return `${y}-${m}-${d} ${h}:${min}:${s}`;
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

function parseNumericValue(val) {
  if (val === null || val === undefined || val === "") return null;
  if (typeof val === "number") {
    return isNaN(val) ? null : Math.round(val * 100) / 100;
  }
  const parsed = parseFloat(val);
  return isNaN(parsed) ? null : Math.round(parsed * 100) / 100;
}

function extractTimestampFromRow(row) {
  if (!row) return null;
  if (Array.isArray(row)) return row[0];
  return row["SERVER_TIMESTAMP"] || row["SERVER TIMESTAMP"] || row["Server Timestamp"] || row["TIMESTAMP"] || Object.values(row)[0];
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

module.exports = {
  STANDARD_PARAMETERS,
  MACHINES,
  MATCH_TOLERANCE_MINUTES,
  parseSqlTimestamp,
  formatDateThai,
  formatTimeThai,
  formatDateTimeShort,
  formatDateTimeFull,
  formatReadingValue,
  parseNumericValue,
  extractTimestampFromRow,
  extractValueFromRow,
  AX_PS_COLUMNS,
};
