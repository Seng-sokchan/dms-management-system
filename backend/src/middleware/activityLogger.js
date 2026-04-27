const { createUserActivityLog } = require("../db/dataStore");
const { logError } = require("../utils/logger");

function activityLogger(req, res, next) {
  if (!req.path.startsWith("/api/")) {
    return next();
  }

  res.on("finish", async () => {
    try {
      const isKhqrRequest = req.method === "POST" && req.path === "/api/payments/khqr";
      const requestedAmount = isKhqrRequest ? Number(req.body?.amount) : NaN;
      const successMessage = isKhqrRequest && Number.isFinite(requestedAmount)
        ? `Request success | Amount requested: ${requestedAmount.toFixed(2)}`
        : "Request success";
      await createUserActivityLog({
        userId: req.user?.sub || null,
        username: req.user?.username || null,
        role: req.user?.role || null,
        method: req.method,
        path: req.originalUrl,
        statusCode: res.statusCode,
        message: res.statusCode >= 400 ? "Request failed" : successMessage,
      });
    } catch (error) {
      logError("activity_log_write_failed", {
        message: error?.message || "Unknown error",
      });
    }
  });

  return next();
}

module.exports = {
  activityLogger,
};
