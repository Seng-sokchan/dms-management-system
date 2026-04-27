const { logError } = require("../utils/logger");

function errorHandler(error, req, res, _next) {
  logError("request_error", {
    method: req.method,
    path: req.originalUrl,
    ip: req.ip,
    userId: req.user?.sub || null,
    message: error?.message || "Unknown error",
    stack: error?.stack || null,
  });
  return res.status(500).json({
    message: "Internal server error",
  });
}

module.exports = {
  errorHandler,
};
