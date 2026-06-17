const { getPool } = require("../../database/pool");
const { nowIso } = require("../utils");
const { mapCustomerBorrowedMaterial } = require("./mappers");
const { getProcedureMeta } = require("./unwrap");
const V = require("./sql/readViews");

async function listCustomerBorrowedMaterialsByCustomer(customerId) {
  const [rows] = await getPool().query(
    `SELECT * FROM ${V.CUSTOMER_BORROWED_MATERIALS} WHERE customer_id = ? ORDER BY id DESC`,
    [customerId],
  );
  return rows.map(mapCustomerBorrowedMaterial);
}

async function listAllCustomerBorrowedMaterials() {
  const [rows] = await getPool().query(
    `SELECT * FROM ${V.CUSTOMER_BORROWED_MATERIALS} ORDER BY id DESC`,
  );
  return rows.map(mapCustomerBorrowedMaterial);
}

async function upsertCustomerBorrowedMaterial(payload) {
  const customerId = Number(payload.customerId);
  const materialId = Number(payload.materialId);
  const qty = Math.max(0, Number(payload.qty || 0));
  const note = (payload.note && String(payload.note).trim()) || "";
  await getPool().query("CALL sp_upsert_customer_borrowed_material(?, ?, ?, ?, ?)", [
    customerId,
    materialId,
    qty,
    note,
    nowIso(),
  ]);
  const list = await listCustomerBorrowedMaterialsByCustomer(customerId);
  return list.find((row) => String(row.materialId) === String(materialId)) || null;
}

async function deleteCustomerBorrowedMaterial(customerId, materialId) {
  const [rowsRaw] = await getPool().query("CALL sp_delete_customer_borrowed_material(?, ?)", [
    customerId,
    materialId,
  ]);
  const meta = getProcedureMeta(rowsRaw);
  return Number(meta.affectedRows || 0) > 0;
}

module.exports = {
  listCustomerBorrowedMaterialsByCustomer,
  listAllCustomerBorrowedMaterials,
  upsertCustomerBorrowedMaterial,
  deleteCustomerBorrowedMaterial,
};
