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

function buildSqlMessage(error) {
  const sql = error?.sql ? String(error.sql) : null;
  const params = error?.parameters ?? error?.params ?? null;
  const sqlMessage = error?.sqlMessage || error?.message || "SQL query failed";
  if (!sql) return null;
  return {
    message: `SQL query failed: ${sqlMessage}`,
    details: {
      query: sql,
      params,
      dbCode: error?.code || null,
      dbErrno: error?.errno || null,
      dbSqlState: error?.sqlState || null,
    },
  };
}

function errorHandler(error, req, res, _next) {
  const isApp = error instanceof AppError;
  const sqlError = buildSqlMessage(error);

  let status = 500;
  let code = "INTERNAL_ERROR";
  let message = "Internal Server Error";
  let details;

  if (isApp) {
    status = Number(error.status || 500);
    code = error.code || "INTERNAL_ERROR";
    message = error.message;
    details = error.details;
  } else if (sqlError) {
    status = 400;
    code = "BAD_REQUEST";
    message = sqlError.message;
    details = sqlError.details;
  } else if (!isProd && error?.message) {
    message = error.message;
  }

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
  if (details) {
    body.error.details = details;
  }

  return res.status(status).json(body);
}

module.exports = {
  errorHandler,
};
