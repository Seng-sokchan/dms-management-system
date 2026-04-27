const { logError } = require("../utils/logger");

function responsePolicy(_req, res, next) {
  const originalJson = res.json.bind(res);

  res.json = function jsonWithPolicy(payload) {
    if (res.statusCode >= 200 && res.statusCode < 300) {
      res.statusCode = 201;
    } else if (res.statusCode >= 400 && res.statusCode < 500 && res.statusCode !== 401) {
      res.statusCode = 400;
    }
    if (res.statusCode >= 400) {
      logError("api_error_response", {
        method: this.req?.method,
        path: this.req?.originalUrl,
        statusCode: res.statusCode,
        message: payload?.message || null,
      });
    }
    return originalJson(payload);
  };

  next();
}

module.exports = {
  responsePolicy,
};
