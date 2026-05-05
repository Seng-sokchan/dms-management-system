const { listUserActivityLogs } = require("../repositories");

async function listActivityLogs(limit = 5000) {
  return listUserActivityLogs(limit);
}

module.exports = { listActivityLogs };
