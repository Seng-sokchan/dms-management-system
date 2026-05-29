const { getPool } = require("../db/pool");

function mapLocation(row) {
  if (!row) return null;
  return {
    latitude: Number(row.latitude),
    longitude: Number(row.longitude),
    accuracy: row.accuracy != null ? Number(row.accuracy) : undefined,
    recordedAt: row.recordedAt instanceof Date ? row.recordedAt.toISOString() : String(row.recordedAt || ""),
  };
}

/**
 * Upsert latest GPS for a delivery agent (one row per agent).
 */
async function upsertLocation({ deliveryAgentId, latitude, longitude, accuracy, recordedAt }) {
  const at = recordedAt ? new Date(recordedAt) : new Date();
  await getPool().query(
    `INSERT INTO delivery_agent_locations
      (delivery_agent_id, latitude, longitude, accuracy, recorded_at)
     VALUES (?, ?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE
       latitude = VALUES(latitude),
       longitude = VALUES(longitude),
       accuracy = VALUES(accuracy),
       recorded_at = VALUES(recorded_at)`,
    [deliveryAgentId, latitude, longitude, accuracy ?? null, at],
  );
}

async function getByAgentId(deliveryAgentId) {
  const [rows] = await getPool().query(
    `SELECT latitude, longitude, accuracy, recorded_at AS recordedAt
     FROM delivery_agent_locations
     WHERE delivery_agent_id = ?
     LIMIT 1`,
    [deliveryAgentId],
  );
  return mapLocation(rows[0]);
}

module.exports = {
  upsertLocation,
  getByAgentId,
};
