const { getPool } = require("../db/pool");
const { unwrapProcedureRows } = require("./unwrap");

async function getLatestBakongToken() {
  const [rowsRaw] = await getPool().query("CALL sp_get_latest_bakong_token()");
  const rows = unwrapProcedureRows(rowsRaw);
  if (!rows[0]) return null;
  return {
    id: Number(rows[0].id),
    accessToken: rows[0].access_token,
    expiresAt: rows[0].expires_at ? new Date(rows[0].expires_at).toISOString() : null,
    createdAt: rows[0].created_at ? new Date(rows[0].created_at).toISOString() : null,
    updatedAt: rows[0].updated_at ? new Date(rows[0].updated_at).toISOString() : null,
  };
}

async function insertBakongToken({ accessToken, expiresAt }) {
  const token = String(accessToken || "").trim();
  if (!token) {
    throw new Error("accessToken is required");
  }
  await getPool().query("CALL sp_insert_bakong_token(?, ?)", [token, expiresAt || null]);
  return getLatestBakongToken();
}

module.exports = {
  getLatestBakongToken,
  insertBakongToken,
};
