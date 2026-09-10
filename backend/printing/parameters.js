// Standard parameters placeholder for Printing process
const PRINTING_PARAMETERS = [
  { key: "LINE_SPEED", param_id: 1, name: "Printing Speed", category: "Speed", set_point: "", unit: "m/min", type: "numeric" },
  { key: "TEMP_DRYER_1", param_id: 2, name: "Dryer Temp 1", category: "Temperature", set_point: "", unit: "°C", type: "numeric" },
  { key: "TEMP_DRYER_2", param_id: 3, name: "Dryer Temp 2", category: "Temperature", set_point: "", unit: "°C", type: "numeric" },
  { key: "TENSION_UNWIND", param_id: 4, name: "Unwind Tension", category: "Tension", set_point: "", unit: "N", type: "numeric" },
  { key: "TENSION_REWIND", param_id: 5, name: "Rewind Tension", category: "Tension", set_point: "", unit: "N", type: "numeric" },
];

module.exports = {
  PRINTING_PARAMETERS,
};
