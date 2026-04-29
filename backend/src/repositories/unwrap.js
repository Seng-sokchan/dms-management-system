function unwrapProcedureRows(rows) {
  if (Array.isArray(rows) && Array.isArray(rows[0])) {
    return rows[0];
  }
  return rows;
}

function getProcedureMeta(rows) {
  if (!rows) return {};
  if (Array.isArray(rows)) {
    for (const item of rows) {
      if (item && typeof item === "object" && ("insertId" in item || "affectedRows" in item)) {
        return item;
      }
      const nested = getProcedureMeta(item);
      if (nested.insertId !== undefined || nested.affectedRows !== undefined) return nested;
    }
  }
  if (typeof rows === "object" && ("insertId" in rows || "affectedRows" in rows)) {
    return rows;
  }
  return {};
}

module.exports = {
  unwrapProcedureRows,
  getProcedureMeta,
};
