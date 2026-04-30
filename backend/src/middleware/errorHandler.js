/**
 * Global error handler.
 *
 * Translates anything thrown by a controller / service / repository into the
 * standard failure envelope:
 *
 *   { success: false, error: { code, message, details? } }
 *
 * AppError subclasses (NotFoundError, BadRequestError, ValidationError, …)
 * carry a status + code + optional details. Anything else is treated as a
 * 500 INTERNAL_ERROR; the message is suppressed in production to avoid
 * leaking stack traces or DB errors to clients.
 */
const { logError } = require("../utils/logger");
const AppError = require("../errors/AppError");

const isProd = process.env.NODE_ENV === "production";

function errorHandler(error, req, res, _next) {
  const isApp = error instanceof AppError;
  const status = isApp ? error.status : 500;
  const code = isApp ? error.code : "INTERNAL_ERROR";
  const message = isApp
    ? error.message
    : isProd
      ? "Internal Server Error"
      : error?.message || "Internal Server Error";

  logError("request_error", {
    method: req.method,
    path: req.originalUrl,
    ip: req.ip,
    userId: req.user?.sub || null,
    status,
    code,
    message: error?.message,
    stack: error?.stack || null,
  });

  if (!isProd) {
    // eslint-disable-next-line no-console
    console.error(`[${req.method}] ${req.path} - ${status} ${code}: ${error?.message}`);
  }

  const body = {
    success: false,
    error: { code, message },
  };
  if (isApp && error.details) {
    body.error.details = error.details;
  }

  return res.status(status).json(body);
}

module.exports = {
  errorHandler,
};
