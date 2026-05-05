/**
 * Standardized HTTP response helpers.
 * Use these in controllers so every endpoint returns the same shape:
 *
 *   { success: true,  data: <payload>,  meta?: <pagination/etc.> }
 *   { success: false, error: { code, message, details? } }
 */

function success(res, data, { status = 200, meta, message } = {}) {
  const body = { success: true, data };
  if (message) body.message = message;
  if (meta) body.meta = meta;
  return res.status(status).json(body);
}

function created(res, data, opts = {}) {
  return success(res, data, { ...opts, status: 201 });
}

function noContent(res) {
  return res.status(200).json({
    success: true,
    message: "Request completed successfully",
    data: null,
  });
}

function fail(res, { status = 400, code = "BAD_REQUEST", message, details } = {}) {
  const body = {
    success: false,
    error: { code, message: message || "Request failed" },
  };
  if (details) body.error.details = details;
  return res.status(status).json(body);
}

function paginated(res, items, { page = 1, pageSize = 20, total = 0 } = {}) {
  return success(res, items, {
    meta: {
      page,
      pageSize,
      total,
      totalPages: Math.max(1, Math.ceil(total / Math.max(1, pageSize))),
    },
  });
}

module.exports = { success, created, noContent, fail, paginated };
