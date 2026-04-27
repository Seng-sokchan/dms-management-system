const fs = require("fs");
const path = require("path");

const logsDir = path.resolve(__dirname, "../../logs");
const errorLogFile = path.join(logsDir, "error.log");

function ensureLogsDir() {
  if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
  }
}

function safeJson(value) {
  try {
    return JSON.stringify(value);
  } catch (_error) {
    return "\"[unserializable]\"";
  }
}

function logError(message, details = {}) {
  ensureLogsDir();
  const timestamp = new Date().toISOString();
  const line = `[${timestamp}] ${message} ${safeJson(details)}\n`;

  // eslint-disable-next-line no-console
  console.error(line.trim());
  fs.appendFileSync(errorLogFile, line, "utf8");
}

module.exports = {
  logError,
};
