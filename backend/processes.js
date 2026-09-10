const laminate = require("./laminate");
const printing = require("./printing");
const blownfilm = require("./blownfilm");

const PROCESSES_MAP = {
  laminate: laminate,
  printing: printing,
  blownfilm: blownfilm,
};

const PROCESS_LIST = [
  { id: "Laminate", key: "laminate", name: "เครื่องเคลือบ (Lamination)", icon: "laminate" },
  { id: "Printing", key: "printing", name: "เครื่องพิมพ์ (Printing)", icon: "printing" },
  { id: "BlownFilm", key: "blownfilm", name: "เครื่องเป่าฟิล์ม (Blown Film)", icon: "blownfilm" },
];

const ALL_MACHINES = [
  ...laminate.machines,
  ...printing.machines,
  ...blownfilm.machines,
];

function getProcess(type) {
  if (!type) return laminate;
  const key = String(type).trim().toLowerCase();
  return PROCESSES_MAP[key] || laminate;
}

function getMachinesByProcess(type) {
  if (!type) return ALL_MACHINES;
  const key = String(type).trim().toLowerCase();
  const proc = PROCESSES_MAP[key];
  return proc ? proc.machines : ALL_MACHINES;
}

function findMachine(machineId) {
  if (!machineId) return null;
  const cleanId = String(machineId).trim().replace(/[-_]/g, "").toUpperCase();
  return ALL_MACHINES.find(
    (m) =>
      m.id.toUpperCase() === cleanId ||
      m.id.replace(/[-_]/g, "").toUpperCase() === cleanId ||
      (m.axMachineId && m.axMachineId.replace(/[-_]/g, "").toUpperCase() === cleanId)
  );
}

module.exports = {
  PROCESS_LIST,
  ALL_MACHINES,
  laminate,
  printing,
  blownfilm,
  getProcess,
  getMachinesByProcess,
  findMachine,
};
