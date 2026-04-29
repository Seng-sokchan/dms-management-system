/**
 * Barrel export for the errors module.
 *   const { AppError, NotFoundError, asyncHandler } = require("../errors");
 */
const AppError = require("./AppError");
const httpErrors = require("./HttpErrors");
const asyncHandler = require("./asyncHandler");

module.exports = {
  AppError,
  asyncHandler,
  ...httpErrors,
};
