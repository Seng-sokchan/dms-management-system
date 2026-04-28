const { getPool } = require("../pool");

async function getLatestBakongToken() {
  const [rows] = await getPool().query(
    `SELECT id, access_token, expires_at, created_at, updated_at
     FROM bakong_tokens
     ORDER BY updated_at DESC, id DESC
     LIMIT 1`,
  );
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
  await getPool().query(
    `INSERT INTO bakong_tokens (access_token, expires_at, updated_at) VALUES (?, ?, NOW())`,
    [token, expiresAt || null],
  );
  return getLatestBakongToken();
}

module.exports = {
  getLatestBakongToken,
  insertBakongToken,
};
