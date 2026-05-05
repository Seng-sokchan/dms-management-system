const { getPool } = require("../db/pool");
const { nowIso } = require("../utils");
const { mapBorrowMaterialOrderLoan } = require("./mappers");
const { unwrapProcedureRows, getProcedureMeta } = require("./unwrap");

async function listAllBorrowMaterialOrderLoans() {
  const [rows] = await getPool().query("CALL sp_list_all_borrow_material_order_loans()");
  return unwrapProcedureRows(rows).map(mapBorrowMaterialOrderLoan);
}

async function getBorrowMaterialOrderLoanById(id) {
  const list = await listAllBorrowMaterialOrderLoans();
  return list.find((row) => String(row.id) === String(id)) || null;
}

async function createBorrowMaterialOrderLoan(payload) {
  const customerId = Number(payload.customerId);
  const materialId = Number(payload.materialId);
  const orderId = Number(payload.orderId);
  const fixedUnitPrice = Number(payload.fixedUnitPrice);
  const note = (payload.note && String(payload.note).trim()) || "";
  const [rowsRaw] = await getPool().query(
    "CALL sp_create_borrow_material_order_loan(?, ?, ?, ?, ?, ?)",
    [customerId, materialId, orderId, fixedUnitPrice, note, nowIso()],
  );
  const meta = getProcedureMeta(rowsRaw);
  return getBorrowMaterialOrderLoanById(meta.insertId);
}

async function deleteBorrowMaterialOrderLoan(customerId, id) {
  const [rowsRaw] = await getPool().query("CALL sp_delete_borrow_material_order_loan(?, ?)", [
    Number(id),
    Number(customerId),
  ]);
  const meta = getProcedureMeta(rowsRaw);
  return Number(meta.affectedRows || 0) > 0;
}

module.exports = {
  listAllBorrowMaterialOrderLoans,
  getBorrowMaterialOrderLoanById,
  createBorrowMaterialOrderLoan,
  deleteBorrowMaterialOrderLoan,
};
