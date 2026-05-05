const customerService = require("../services/customerService");
const { success, created, noContent } = require("../utils/response");
const { asyncHandler } = require("../errors");

const listCustomers = asyncHandler(async (req, res) => {
  const customers = await customerService.listCustomers(req.user);
  return success(res, customers);
});

const listCustomerUsers = asyncHandler(async (req, res) => {
  const customerUsers = await customerService.listCustomerUsers(req.user);
  return success(res, customerUsers);
});

const createCustomer = asyncHandler(async (req, res) => {
  const customer = await customerService.createCustomer(req.user, req.body);
  return created(res, customer);
});

const updateCustomer = asyncHandler(async (req, res) => {
  const customer = await customerService.updateCustomer(req.user, req.params.id, req.body);
  return success(res, customer);
});

const deleteCustomer = asyncHandler(async (req, res) => {
  await customerService.deleteCustomer(req.user, req.params.id);
  return noContent(res);
});

module.exports = {
  listCustomers,
  listCustomerUsers,
  createCustomer,
  updateCustomer,
  deleteCustomer,
};
