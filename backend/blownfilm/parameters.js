// Standard parameters placeholder for BlownFilm process
const BLOWNFILM_PARAMETERS = [
  { key: "LINE_SPEED", param_id: 1, name: "Extrusion Speed", category: "Speed", set_point: "", unit: "m/min", type: "numeric" },
  { key: "DIE_TEMP", param_id: 2, name: "Die Temp", category: "Temperature", set_point: "", unit: "°C", type: "numeric" },
  { key: "TENSION_REWIND", param_id: 3, name: "Rewind Tension", category: "Tension", set_point: "", unit: "N", type: "numeric" },
];

module.exports = {
  BLOWNFILM_PARAMETERS,
};
