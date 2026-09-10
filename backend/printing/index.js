const { PRINTING_MACHINES } = require("./machines");
const { PRINTING_PARAMETERS } = require("./parameters");
const { AX_PRINTING_PS_COLUMNS } = require("./axPs");

module.exports = {
  processType: "Printing",
  name: "เครื่องพิมพ์ (Printing)",
  machines: PRINTING_MACHINES,
  parameters: PRINTING_PARAMETERS,
  axPsColumns: AX_PRINTING_PS_COLUMNS,
};
