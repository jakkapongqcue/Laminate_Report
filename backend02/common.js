const STANDARD_PARAMETERS = [
  { key: "LINE_SPEED", param_id: 1, name: "Line Speed", category: "Speed", set_point: "", unit: "m/min", type: "numeric" },
  { key: "SPICE_SPEED", param_id: 2, name: "Spice Speed", category: "Speed", set_point: "", unit: "m/min", type: "numeric" },
  { key: "TEMP_ZONE_1", param_id: 3, name: "Temp No. 1", category: "Temperature", set_point: "", unit: "°C", type: "numeric" },
  { key: "TEMP_ZONE_2", param_id: 4, name: "Temp No. 2", category: "Temperature", set_point: "", unit: "°C", type: "numeric" },
  { key: "TEMP_ZONE_3", param_id: 5, name: "Temp No. 3", category: "Temperature", set_point: "", unit: "°C", type: "numeric" },
  { key: "TEMP_ZONE_4", param_id: 6, name: "Temp No. 4", category: "Temperature", set_point: "", unit: "°C", type: "numeric" },
  { key: "TEMP_TANK_A", param_id: 7, name: "Temp Tank A", category: "Temperature", set_point: "", unit: "°C", type: "numeric" },
  { key: "TEMP_A_B", param_id: 8, name: "Temp A, B", category: "Temperature", set_point: "", unit: "°C", type: "numeric" },
  { key: "TEMP_HOSE_AB", param_id: 9, name: "Adhesive Hose A, B", category: "Temperature", set_point: "", unit: "°C", type: "numeric" },
  { key: "TENSION_UNWIND_1", param_id: 10, name: "1ˢᵗ Unwind Tension", category: "Tension", set_point: "", unit: "Kg./N", type: "numeric" },
  { key: "TENSION_UNWIND_2", param_id: 11, name: "2ⁿᵈ Unwind Tension", category: "Tension", set_point: "", unit: "Kg./N", type: "numeric" },
  { key: "TENSION_REWIND", param_id: 12, name: "Rewind Tension", category: "Tension", set_point: "", unit: "Kg./N", type: "numeric" },
  { key: "TENSION_TAPER_REWIND", param_id: 13, name: "Rewinder : Tension Taper", category: "Tension", set_point: "", unit: "%", type: "numeric" },
  { key: "COATING_PRESSURE", param_id: 14, name: "Coating Pressure", category: "Pressure", set_point: "", unit: "Bar/Mpa", type: "numeric" },
  { key: "TENSION_INLET_COATING", param_id: 15, name: "Coating : Inlet : Tension", category: "Tension", set_point: "", unit: "N", type: "numeric" },
  { key: "PRESSURE_NIP_OPERATOR", param_id: 16, name: "Nip roll Pressure Operator Side", category: "Pressure", set_point: "", unit: "Bar/Mpa", type: "numeric" },
  { key: "PRESSURE_NIP_MOTOR", param_id: 17, name: "Nip roll Pressure Motor Side", category: "Pressure", set_point: "", unit: "Bar/Mpa", type: "numeric" },
  { key: "SMOOTHING_ROLL", param_id: 18, name: "ชุด Smooting Roll เกลี่ยกาว", category: "Status", set_point: "", unit: "ปกติ/ไม่ปกติ", type: "status" },
  { key: "CORONA_INSIDE", param_id: 19, name: "Corona Treated Inside (ด้านใน)", category: "Status", set_point: "", unit: "มี/ไม่มี", type: "status" },
  { key: "CORONA_OUTSIDE", param_id: 20, name: "Corona Treated Outside (ด้านนอก)", category: "Status", set_point: "", unit: "มี/ไม่มี", type: "status" },
  { key: "CORONA_POWER_UW1", param_id: 21, name: "Corona Specific Power (UW1)", category: "Corona", set_point: "", unit: "Watt", type: "numeric" },
  { key: "CORONA_POWER_UW2", param_id: 22, name: "Corona Specific Power (UW2)", category: "Corona", set_point: "", unit: "Watt", type: "numeric" },
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
    unitOverrides: {
      TENSION_UNWIND_1: "N",
      TENSION_UNWIND_2: "N",
      TENSION_REWIND: "N",
      PRESSURE_NIP_OPERATOR: "Bar",
      PRESSURE_NIP_MOTOR: "Bar",
    },
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
};
