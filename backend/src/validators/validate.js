/**
 * Express middleware factory that validates `req.body`, `req.query`, and/or
 * `req.params` against a Zod schema. Replaces inline `safeParse` calls inside
 * controllers so that validation lives in one consistent place.
 *
 *   const { validate } = require("../validators/validate");
 *   const { loginSchema } = require("../validators/auth.validator");
 *
 *   router.post("/auth/login", validate({ body: loginSchema }), authController.login);
 */
const { ValidationError } = require("../errors/HttpErrors");

function formatZodIssues(issues) {
  return issues.map((i) => ({
    path: i.path.join("."),
    message: i.message,
    code: i.code,
  }));
}

function validate(schemas = {}) {
  return function validateMiddleware(req, _res, next) {
    try {
      for (const key of ["body", "query", "params"]) {
        const schema = schemas[key];
        if (!schema) continue;
        const result = schema.safeParse(req[key]);
        if (!result.success) {
          return next(new ValidationError(`Invalid ${key}`, formatZodIssues(result.error.issues)));
        }
        // Replace with the parsed (coerced/defaulted) value.
        req[key] = result.data;
      }
      return next();
    } catch (err) {
      return next(err);
    }
  };
}

module.exports = { validate };
