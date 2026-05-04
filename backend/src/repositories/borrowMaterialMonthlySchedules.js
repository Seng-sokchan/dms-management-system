const { getPool } = require("../db/pool");
const { nowIso } = require("../utils");
const {
  mapBorrowMaterialMonthlySchedule,
  mapBorrowMaterialMonthlyInstallment,
} = require("./mappers");
const { unwrapProcedureRows, getProcedureMeta } = require("./unwrap");

async function listAllBorrowMaterialMonthlySchedules() {
  const [rows] = await getPool().query("CALL sp_list_all_borrow_material_monthly_schedules()");
  return unwrapProcedureRows(rows).map(mapBorrowMaterialMonthlySchedule);
}

async function getBorrowMaterialMonthlyScheduleById(scheduleId, customerId) {
  const [rows] = await getPool().query("CALL sp_get_borrow_material_monthly_schedule_by_id(?, ?)", [
    Number(scheduleId),
    Number(customerId),
  ]);
  const resultRows = unwrapProcedureRows(rows);
  return resultRows[0] ? mapBorrowMaterialMonthlySchedule(resultRows[0]) : null;
}

async function listBorrowMaterialMonthlyInstallments(scheduleId) {
  const [rows] = await getPool().query("CALL sp_list_borrow_material_monthly_installments(?)", [
    Number(scheduleId),
  ]);
  return unwrapProcedureRows(rows).map(mapBorrowMaterialMonthlyInstallment);
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

module.exports = {
  listAllBorrowMaterialMonthlySchedules,
  getBorrowMaterialMonthlyScheduleById,
  listBorrowMaterialMonthlyInstallments,
  createBorrowMaterialMonthlySchedule,
  deleteBorrowMaterialMonthlySchedule,
};
