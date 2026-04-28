const { getPool } = require("../pool");
const { nowIso } = require("../../utils");
const { mapProducer } = require("./mappers");
const { unwrapProcedureRows, getProcedureMeta } = require("./unwrap");

async function listProducers() {
  const [rows] = await getPool().query("CALL sp_list_producers()");
  return unwrapProcedureRows(rows).map(mapProducer);
}

async function getProducerById(id) {
  const [rows] = await getPool().query("CALL sp_get_producer_by_id(?)", [id]);
  const resultRows = unwrapProcedureRows(rows);
  return resultRows[0] ? mapProducer(resultRows[0]) : null;
}

async function createProducer(payload) {
  const [rowsRaw] = await getPool().query("CALL sp_create_producer(?, ?, ?, ?)", [
    payload.name, payload.phone, payload.capacityNote || "", nowIso(),
  ]);
  const meta = getProcedureMeta(rowsRaw);
  return getProducerById(meta.insertId);
}

async function updateProducer(id, payload) {
  const name = String(payload.name || "").trim();
  const phone = String(payload.phone || "").trim();
  const capacityNote = (payload.capacityNote && String(payload.capacityNote).trim()) || "";
  const [rowsRaw] = await getPool().query("CALL sp_update_producer(?, ?, ?, ?, ?)", [
    id, name, phone, capacityNote, nowIso(),
  ]);
  const meta = getProcedureMeta(rowsRaw);
  if (!Number(meta.affectedRows || 0)) return null;
  return getProducerById(id);
}

async function deleteProducer(id) {
  const [rowsRaw] = await getPool().query("CALL sp_delete_producer(?, ?)", [id, nowIso()]);
  const meta = getProcedureMeta(rowsRaw);
  return Number(meta.affectedRows || 0) > 0;
}

module.exports = {
  listProducers,
  getProducerById,
  createProducer,
  updateProducer,
  deleteProducer,
};
