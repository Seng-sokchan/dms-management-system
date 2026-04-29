const { listUserActivityLogs } = require("../repositories");

async function listActivityLogs(req, res) {
  const limit = Number(req.query.limit || 5000);
  const rows = await listUserActivityLogs(limit);
  return res.json(rows);
}

module.exports = {
  listActivityLogs,
};
