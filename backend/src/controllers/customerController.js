const {
  listCustomers: listCustomersDb,
  createCustomer: createCustomerDb,
  updateCustomer: updateCustomerDb,
  deleteCustomer: deleteCustomerDb,
  listUsers: listUsersDb,
  getUserById,
} = require("../repositories");
const { success, created, noContent } = require("../utils/response");
const {
  asyncHandler,
  BadRequestError,
  NotFoundError,
} = require("../errors");

const listCustomers = asyncHandler(async (_req, res) => {
  const customers = await listCustomersDb();
  return success(res, customers);
});

const listCustomerUsers = asyncHandler(async (_req, res) => {
  const users = await listUsersDb();
  const customerUsers = users.filter((user) => user.role === "Customer" && user.isActive);
  return success(res, customerUsers);
});

async function validateCustomerUser(userId) {
  const user = await getUserById(userId);
  if (!user || !user.isActive) {
    throw new BadRequestError("Customer user not found");
  }
  if (user.role !== "Customer") {
    throw new BadRequestError("Selected user must have Customer role");
  }
  return user;
}

const createCustomer = asyncHandler(async (req, res) => {
  await validateCustomerUser(req.body.userId);
  const customer = await createCustomerDb(req.body);
  return created(res, customer);
});

const updateCustomer = asyncHandler(async (req, res) => {
  await validateCustomerUser(req.body.userId);
  const customer = await updateCustomerDb(req.params.id, req.body);
  if (!customer) {
    throw new NotFoundError("Customer not found");
  }
  return success(res, customer);
});

const deleteCustomer = asyncHandler(async (req, res) => {
  const deleted = await deleteCustomerDb(req.params.id);
  if (!deleted) {
    throw new NotFoundError("Customer not found");
  }
  return noContent(res);
});

module.exports = {
  listCustomers,
  listCustomerUsers,
  createCustomer,
  updateCustomer,
  deleteCustomer,
};
