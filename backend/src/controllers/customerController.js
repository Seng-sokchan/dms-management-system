const {
  listCustomers: listCustomersDb,
  listCustomersByDepotId,
  listCustomersByOwnerUserId,
  createCustomer: createCustomerDb,
  updateCustomer: updateCustomerDb,
  deleteCustomer: deleteCustomerDb,
  listUsers: listUsersDb,
  getUserById,
  getDepotById,
  getDepotByDepotUserId,
} = require("../repositories");
const { success, created, noContent } = require("../utils/response");
const {
  asyncHandler,
  BadRequestError,
  NotFoundError,
} = require("../errors");

async function getAllowedCustomers(req) {
  if (req.user.role === "Admin") {
    return listCustomersDb();
  }
  if (req.user.role === "Owner") {
    return listCustomersByOwnerUserId(req.user.sub);
  }
  if (req.user.role === "Depot") {
    const depot = await getDepotByDepotUserId(req.user.sub);
    if (!depot) return [];
    return listCustomersByDepotId(depot.id);
  }
  return [];
}

async function assertDepotAccess(req, depotId) {
  if (!depotId) {
    if (req.user.role === "Depot") {
      throw new BadRequestError("Depot users must assign customers to their own depot");
    }
    return;
  }
  const depot = await getDepotById(depotId);
  if (!depot) {
    throw new BadRequestError("Depot not found");
  }
  if (req.user.role === "Owner" && String(depot.ownerUserId) !== String(req.user.sub)) {
    throw new BadRequestError("Owner can only manage customers in owned depots");
  }
  if (req.user.role === "Depot" && String(depot.depotUserId) !== String(req.user.sub)) {
    throw new BadRequestError("Depot can only manage customers in own depot");
  }
}

const listCustomers = asyncHandler(async (req, res) => {
  const customers = await getAllowedCustomers(req);
  return success(res, customers);
});

const listCustomerUsers = asyncHandler(async (req, res) => {
  const users = await listUsersDb();
  let customerUsers = users.filter((user) => user.role === "Customer" && user.isActive);
  if (req.user.role === "Depot") {
    const scopedCustomers = await getAllowedCustomers(req);
    const assignedUserIds = new Set(scopedCustomers.map((customer) => customer.userId).filter(Boolean));
    customerUsers = customerUsers.filter((user) => !assignedUserIds.has(user.id));
  }
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
  if (req.user.role === "Depot") {
    const depot = await getDepotByDepotUserId(req.user.sub);
    if (!depot) {
      throw new BadRequestError("Depot profile not found for current user");
    }
    req.body.depotId = depot.id;
  }
  await assertDepotAccess(req, req.body.depotId);
  const customer = await createCustomerDb(req.body);
  return created(res, customer);
});

const updateCustomer = asyncHandler(async (req, res) => {
  const allowedCustomers = await getAllowedCustomers(req);
  const canAccess = allowedCustomers.some((customer) => String(customer.id) === String(req.params.id));
  if (!canAccess) {
    throw new NotFoundError("Customer not found");
  }
  await validateCustomerUser(req.body.userId);
  if (req.user.role === "Depot") {
    const depot = await getDepotByDepotUserId(req.user.sub);
    if (!depot) {
      throw new BadRequestError("Depot profile not found for current user");
    }
    req.body.depotId = depot.id;
  }
  await assertDepotAccess(req, req.body.depotId);
  const customer = await updateCustomerDb(req.params.id, req.body);
  if (!customer) {
    throw new NotFoundError("Customer not found");
  }
  return success(res, customer);
});

const deleteCustomer = asyncHandler(async (req, res) => {
  const allowedCustomers = await getAllowedCustomers(req);
  const canAccess = allowedCustomers.some((customer) => String(customer.id) === String(req.params.id));
  if (!canAccess) {
    throw new NotFoundError("Customer not found");
  }
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
