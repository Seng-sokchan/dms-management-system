/**
 * Convenience HTTP error subclasses.
 * Prefer these over `new AppError(...)` so the intent is obvious at the call site:
 *
 *   if (!order) throw new NotFoundError("Order not found");
 *   if (!user.isAdmin) throw new ForbiddenError();
 */
const AppError = require("./AppError");

class BadRequestError extends AppError {
  constructor(message = "Bad request", details) {
    super(message, 400, "BAD_REQUEST", details);
  }
}

class UnauthorizedError extends AppError {
  constructor(message = "Unauthorized") {
    super(message, 401, "UNAUTHORIZED");
  }
}

class ForbiddenError extends AppError {
  constructor(message = "Forbidden") {
    super(message, 403, "FORBIDDEN");
  }
}

class NotFoundError extends AppError {
  constructor(message = "Resource not found") {
    super(message, 404, "NOT_FOUND");
  }
}

class ConflictError extends AppError {
  constructor(message = "Conflict", details) {
    super(message, 409, "CONFLICT", details);
  }
}

class ValidationError extends AppError {
  constructor(message = "Validation failed", details) {
    super(message, 422, "VALIDATION_ERROR", details);
  }
}

class TooManyRequestsError extends AppError {
  constructor(message = "Too many requests") {
    super(message, 429, "RATE_LIMITED");
  }
}

module.exports = {
  BadRequestError,
  UnauthorizedError,
  ForbiddenError,
  NotFoundError,
  ConflictError,
  ValidationError,
  TooManyRequestsError,
};
