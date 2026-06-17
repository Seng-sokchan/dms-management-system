const { getPool } = require("../../database/pool");
const { nowIso } = require("../utils");
const {
  mapBorrowMaterialMonthlySchedule,
  mapBorrowMaterialMonthlyInstallment,
} = require("./mappers");
const { getProcedureMeta } = require("./unwrap");
const V = require("./sql/readViews");

async function listAllBorrowMaterialMonthlySchedules() {
  const [rows] = await getPool().query(
    `SELECT * FROM ${V.BORROW_MATERIAL_MONTHLY_SCHEDULES} ORDER BY id DESC`,
  );
  return rows.map(mapBorrowMaterialMonthlySchedule);
}

async function getBorrowMaterialMonthlyScheduleById(scheduleId, customerId) {
  const [rows] = await getPool().query(
    `SELECT * FROM ${V.BORROW_MATERIAL_MONTHLY_SCHEDULES}
     WHERE id = ? AND customer_id = ?
     LIMIT 1`,
    [Number(scheduleId), Number(customerId)],
  );
  return rows[0] ? mapBorrowMaterialMonthlySchedule(rows[0]) : null;
}

async function listBorrowMaterialMonthlyInstallments(scheduleId) {
  const [rows] = await getPool().query(
    `SELECT * FROM ${V.BORROW_MATERIAL_MONTHLY_INSTALLMENTS}
     WHERE schedule_id = ?
     ORDER BY period_no ASC`,
    [Number(scheduleId)],
  );
  return rows.map(mapBorrowMaterialMonthlyInstallment);
}

async function createBorrowMaterialMonthlySchedule(payload) {
  const customerId = Number(payload.customerId);
  const materialId = Number(payload.materialId);
  const totalAmount = Number(payload.totalAmount);
  const currency = String(payload.currency || "KHR").toUpperCase() === "USD" ? "USD" : "KHR";
  const totalPeriod = Math.max(1, Math.floor(Number(payload.totalPeriod)));
  const startDueDate = String(payload.startDueDate || "").trim();
  const note = (payload.note && String(payload.note).trim()) || "";
  const [rowsRaw] = await getPool().query(
    "CALL sp_create_borrow_material_monthly_schedule(?, ?, ?, ?, ?, ?, ?, ?)",
    [customerId, materialId, totalAmount, currency, totalPeriod, startDueDate, note, nowIso()],
  );
  const meta = getProcedureMeta(rowsRaw);
  return getBorrowMaterialMonthlyScheduleById(meta.insertId, customerId);
}

async function deleteBorrowMaterialMonthlySchedule(customerId, id) {
  const [rowsRaw] = await getPool().query("CALL sp_delete_borrow_material_monthly_schedule(?, ?)", [
    Number(id),
    Number(customerId),
  ]);
  const meta = getProcedureMeta(rowsRaw);
  return Number(meta.affectedRows || 0) > 0;
}

async function updateBorrowMaterialMonthlyInstallmentStatus(payload) {
  const status = Number(payload.status);
  const normalized = status === 1 ? 1 : 0;
  const [rowsRaw] = await getPool().query(
    "CALL sp_update_borrow_material_monthly_installment_status(?, ?, ?, ?, ?)",
    [
      Number(payload.customerId),
      Number(payload.scheduleId),
      Number(payload.installmentId),
      normalized,
      nowIso(),
    ],
  );
  const meta = getProcedureMeta(rowsRaw);
  return Number(meta.affectedRows || 0) > 0;
}

module.exports = {
  listAllBorrowMaterialMonthlySchedules,
  getBorrowMaterialMonthlyScheduleById,
  listBorrowMaterialMonthlyInstallments,
  createBorrowMaterialMonthlySchedule,
  deleteBorrowMaterialMonthlySchedule,
  updateBorrowMaterialMonthlyInstallmentStatus,
};
