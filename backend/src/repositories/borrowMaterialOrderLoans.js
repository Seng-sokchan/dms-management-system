const { getPool } = require("../../database/pool");
const { nowIso } = require("../utils");
const { mapBorrowMaterialOrderLoan } = require("./mappers");
const { getProcedureMeta } = require("./unwrap");
const V = require("./sql/readViews");

async function listAllBorrowMaterialOrderLoans() {
  const [rows] = await getPool().query(
    `SELECT * FROM ${V.BORROW_MATERIAL_ORDER_LOANS} ORDER BY id DESC`,
  );
  return rows.map(mapBorrowMaterialOrderLoan);
}

async function getBorrowMaterialOrderLoanById(id) {
  const [rows] = await getPool().query(
    `SELECT * FROM ${V.BORROW_MATERIAL_ORDER_LOANS} WHERE id = ? LIMIT 1`,
    [id],
  );
  return rows[0] ? mapBorrowMaterialOrderLoan(rows[0]) : null;
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
