const { createUserActivityLog } = require("../repositories");
const { logError } = require("../utils/logger");

function activityLogger(req, res, next) {
  if (!req.path.startsWith("/api/")) {
    return next();
  }

  res.on("finish", async () => {
    try {
      const successMessage = "Request success";
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
