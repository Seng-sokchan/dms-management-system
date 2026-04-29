/**
 * Wraps an async Express handler so any rejected promise is forwarded to the
 * global errorHandler middleware. Saves you from writing try/catch in every
 * controller.
 *
 *   router.get("/orders/:id", asyncHandler(async (req, res) => {
 *     const order = await orderService.getById(req.params.id);
 *     return success(res, order);
 *   }));
 */
function asyncHandler(fn) {
  return function asyncHandlerWrapper(req, res, next) {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

module.exports = asyncHandler;
