const { LAMINATE_MACHINES } = require("./machines");
const { STANDARD_PARAMETERS } = require("./parameters");
const { AX_PS_COLUMNS } = require("./axPs");

module.exports = {
  processType: "Laminate",
  name: "เครื่องเคลือบ (Lamination)",
  machines: LAMINATE_MACHINES,
  parameters: STANDARD_PARAMETERS,
  axPsColumns: AX_PS_COLUMNS,
};
