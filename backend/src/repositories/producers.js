const { getPool } = require("../../database/pool");
const { nowIso } = require("../utils");
const { mapProducer } = require("./mappers");
const { unwrapProcedureRows, getProcedureMeta } = require("./unwrap");
const V = require("./sql/readViews");

async function listProducers() {
  const [rows] = await getPool().query(`SELECT * FROM ${V.PRODUCERS} ORDER BY id DESC`);
  return rows.map(mapProducer);
}

async function getProducerById(id) {
  const [rows] = await getPool().query(`SELECT * FROM ${V.PRODUCERS} WHERE id = ? LIMIT 1`, [id]);
  return rows[0] ? mapProducer(rows[0]) : null;
}

async function createProducer(payload) {
  const [rowsRaw] = await getPool().query("CALL sp_create_producer(?, ?, ?, ?)", [
    payload.name,
    payload.phone,
    payload.capacityNote || "",
    nowIso(),
  ]);
  const meta = getProcedureMeta(rowsRaw);
  return getProducerById(meta.insertId);
}

async function updateProducer(id, payload) {
  const [rowsRaw] = await getPool().query("CALL sp_update_producer(?, ?, ?, ?, ?)", [
    id,
    payload.name,
    payload.phone,
    payload.capacityNote || "",
    nowIso(),
  ]);
  const meta = getProcedureMeta(rowsRaw);
  return Number(meta.affectedRows || 0) > 0 ? getProducerById(id) : null;
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
