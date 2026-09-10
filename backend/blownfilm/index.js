const { BLOWNFILM_MACHINES } = require("./machines");
const { BLOWNFILM_PARAMETERS } = require("./parameters");
const { AX_BLOWNFILM_PS_COLUMNS } = require("./axPs");

module.exports = {
  processType: "BlownFilm",
  name: "เครื่องเป่าฟิล์ม (Blown Film)",
  machines: BLOWNFILM_MACHINES,
  parameters: BLOWNFILM_PARAMETERS,
  axPsColumns: AX_BLOWNFILM_PS_COLUMNS,
};
