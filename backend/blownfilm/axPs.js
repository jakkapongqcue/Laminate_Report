// Base Mapping from [AX50_SF_PRD_SP1].[dbo].[SF_PRODSPECMACHINE] to BLOWNFILM_PARAMETERS keys
const BASE_BLOWNFILM_AX_PS_MAP = {
  LINE_SPEED: "[SPEED1] AS LINE_SPEED",
};

/**
 * Returns the final array of SQL select expressions for BlownFilm AX Set Point query.
 * If machineConfig has axPsColumns (full list), it uses that.
 * If machineConfig has axPsOverrides, it overrides specific keys in BASE_BLOWNFILM_AX_PS_MAP.
 * Otherwise, it uses all base mappings.
 */
function getBlownFilmAxPsColumns(machineConfig) {
  if (machineConfig && machineConfig.axPsColumns && Array.isArray(machineConfig.axPsColumns)) {
    return machineConfig.axPsColumns;
  }
  const overrides = (machineConfig && machineConfig.axPsOverrides) || {};
  const merged = { ...BASE_BLOWNFILM_AX_PS_MAP, ...overrides };
  return Object.values(merged);
}

// Flat array for default BlownFilm AX Set Point columns
const AX_BLOWNFILM_PS_COLUMNS = Object.values(BASE_BLOWNFILM_AX_PS_MAP);

module.exports = {
  BASE_BLOWNFILM_AX_PS_MAP,
  AX_BLOWNFILM_PS_COLUMNS,
  getBlownFilmAxPsColumns,
};
