const { logError } = require("../utils/logger");

function errorHandler(error, req, res, _next) {
  const status = error?.status || 500;
  const message = error?.message || "Internal Server Error";

  logError("request_error", {
    method: req.method,
    path: req.originalUrl,
    ip: req.ip,
    userId: req.user?.sub || null,
    status,
    message,
    stack: error?.stack || null,
  });
  // eslint-disable-next-line no-console
  console.error(`[${req.method}] ${req.path} - ${status}: ${message}`);
  return res.status(status).json({ error: message });
}

module.exports = {
  errorHandler,
};
