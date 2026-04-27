const { getPool } = require("../pool");
const { nowIso } = require("../../utils");
const { mapProducer } = require("./mappers");
const { unwrapProcedureRows } = require("./unwrap");

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
  const [result] = await getPool().query(
    "INSERT INTO producers (name, phone, capacity_note, updated_at) VALUES (?, ?, ?, ?)",
    [payload.name, payload.phone, payload.capacityNote || "", nowIso()],
  );
  return getProducerById(result.insertId);
}

async function updateProducer(id, payload) {
  const name = String(payload.name || "").trim();
  const phone = String(payload.phone || "").trim();
  const capacityNote = (payload.capacityNote && String(payload.capacityNote).trim()) || "";
  const [result] = await getPool().query(
    "UPDATE producers SET name = ?, phone = ?, capacity_note = ?, updated_at = ? WHERE id = ? AND is_active = 1",
    [name, phone, capacityNote, nowIso(), id],
  );
  if (!result.affectedRows) return null;
  return getProducerById(id);
}

async function deleteProducer(id) {
  const [result] = await getPool().query(
    "UPDATE producers SET is_active = 0, updated_at = ? WHERE id = ? AND is_active = 1",
    [nowIso(), id],
  );
  return result.affectedRows > 0;
}

module.exports = {
  listProducers,
  getProducerById,
  createProducer,
  updateProducer,
  deleteProducer,
};
