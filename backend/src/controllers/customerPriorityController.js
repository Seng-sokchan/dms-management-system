const customerPriorityService = require("../services/customerPriorityService");
const { success } = require("../utils/response");
const { asyncHandler } = require("../errors");

const getCustomerPriorities = asyncHandler(async (req, res) => {
  const data = await customerPriorityService.getForProvince(req.user, req.query.provinceId);
  return success(res, data);
});

const reorderCustomerPriorities = asyncHandler(async (req, res) => {
  const data = await customerPriorityService.reorder(req.user, req.body);
  return success(res, data);
});

module.exports = {
  getCustomerPriorities,
  reorderCustomerPriorities,
};
