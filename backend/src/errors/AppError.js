/**
 * Base application error class.
 * Throw `AppError` (or one of its subclasses in HttpErrors.js) inside services
 * and controllers; the global errorHandler middleware will translate it into a
 * proper HTTP response.
 *
 *   throw new AppError("Order is locked", 409, "ORDER_LOCKED");
 */
class AppError extends Error {
  /**
   * @param {string} message       Human-readable error message.
   * @param {number} [status=500]  HTTP status code.
   * @param {string} [code]        Machine-readable error code (e.g. "ORDER_LOCKED").
   * @param {object} [details]     Optional extra context (validation issues, etc).
   */
  constructor(message, status = 500, code = "INTERNAL_ERROR", details) {
    super(message);
    this.name = this.constructor.name;
    this.status = status;
    this.code = code;
    if (details) this.details = details;
    this.isOperational = true;
    Error.captureStackTrace?.(this, this.constructor);
  }
}

module.exports = AppError;
