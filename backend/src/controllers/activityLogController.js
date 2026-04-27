const { listUserActivityLogs } = require("../db/dataStore");

async function listActivityLogs(req, res) {
  const limit = Number(req.query.limit || 300);
  const rows = await listUserActivityLogs(limit);
  return res.json(rows);
}

module.exports = {
  listActivityLogs,
};
