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
const { BadRequestError, NotFoundError } = require("../errors");

async function getAllowedCustomers(user) {
  if (user.role === "Admin") return listCustomersDb();
  if (user.role === "Owner") return listCustomersByOwnerUserId(user.sub);
  if (user.role === "Depot") {
    const depot = await getDepotByDepotUserId(user.sub);
    if (!depot) return [];
    return listCustomersByDepotId(depot.id);
  }
  return [];
}

async function listCustomers(user) {
  return getAllowedCustomers(user);
}

async function listCustomerUsers(user) {
  const users = await listUsersDb();
  let customerUsers = users.filter((row) => row.role === "Customer" && row.isActive);
  if (user.role === "Depot") {
    const scopedCustomers = await getAllowedCustomers(user);
    const assignedUserIds = new Set(
      scopedCustomers.map((customer) => customer.userId).filter(Boolean),
    );
    customerUsers = customerUsers.filter((row) => !assignedUserIds.has(row.id));
  }
  return customerUsers;
}

async function validateCustomerUser(userId) {
  if (!userId) return;
  const user = await getUserById(userId);
  if (!user || !user.isActive) throw new BadRequestError("Customer user not found");
  if (user.role !== "Customer") throw new BadRequestError("Selected user must have Customer role");
}

async function assertDepotAccess(user, depotId) {
  if (!depotId) {
    if (user.role === "Depot") {
      throw new BadRequestError("Depot users must assign customers to their own depot");
    }
    return;
  }
  const depot = await getDepotById(depotId);
  if (!depot) throw new BadRequestError("Depot not found");
  if (user.role === "Owner" && String(depot.ownerUserId) !== String(user.sub)) {
    throw new BadRequestError("Owner can only manage customers in owned depots");
  }
  if (user.role === "Depot" && String(depot.depotUserId) !== String(user.sub)) {
    throw new BadRequestError("Depot can only manage customers in own depot");
  }
}

async function createCustomer(user, payload) {
  const nextPayload = { ...payload };
  await validateCustomerUser(nextPayload.userId);
  if (user.role === "Depot") {
    const depot = await getDepotByDepotUserId(user.sub);
    if (!depot) throw new BadRequestError("Depot profile not found for current user");
    nextPayload.depotId = depot.id;
  }
  await assertDepotAccess(user, nextPayload.depotId);
  return createCustomerDb(nextPayload);
}

async function updateCustomer(user, customerId, payload) {
  const allowedCustomers = await getAllowedCustomers(user);
  const canAccess = allowedCustomers.some((customer) => String(customer.id) === String(customerId));
  if (!canAccess) throw new NotFoundError("Customer not found");
  const nextPayload = { ...payload };
  await validateCustomerUser(nextPayload.userId);
  if (user.role === "Depot") {
    const depot = await getDepotByDepotUserId(user.sub);
    if (!depot) throw new BadRequestError("Depot profile not found for current user");
    nextPayload.depotId = depot.id;
  }
  await assertDepotAccess(user, nextPayload.depotId);
  const customer = await updateCustomerDb(customerId, nextPayload);
  if (!customer) throw new NotFoundError("Customer not found");
  return customer;
}

async function deleteCustomer(user, customerId) {
  const allowedCustomers = await getAllowedCustomers(user);
  const canAccess = allowedCustomers.some((customer) => String(customer.id) === String(customerId));
  if (!canAccess) throw new NotFoundError("Customer not found");
  const deleted = await deleteCustomerDb(customerId);
  if (!deleted) throw new NotFoundError("Customer not found");
}

module.exports = {
  listCustomers,
  listCustomerUsers,
  createCustomer,
  updateCustomer,
  deleteCustomer,
};
