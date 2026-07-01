const { getPool } = require("../../database/pool");
const {
  listUsers: listUsersDb,
  getUserById,
  getDepotById,
  getProvinceById,
  getCustomerById,
  setCustomerUserLink,
} = require("../repositories");
const {
  listCustomersForUser,
  getDepotForUser,
  hasDataScope,
  getDataScopeForUser,
} = require("./accessScopeService");
const { BadRequestError, NotFoundError } = require("../errors");

async function getAllowedCustomers(user) {
  return listCustomersForUser(user);
}

async function listCustomers(user) {
  return getAllowedCustomers(user);
}

async function listCustomerUsers(user) {
  const users = await listUsersDb();
  let customerUsers = users.filter((row) => row.role === "Customer" && row.isActive);
  if (hasDataScope(user, "depot")) {
    const scopedCustomers = await getAllowedCustomers(user);
    const scopedCustomerIds = new Set(scopedCustomers.map((c) => String(c.id)));
    customerUsers = customerUsers.filter(
      (row) => !row.customerId || !scopedCustomerIds.has(String(row.customerId)),
    );
  }
  return customerUsers;
}

async function validateCustomerUser(userId) {
  if (!userId) return;
  const u = await getUserById(userId);
  if (!u || !u.isActive) throw new BadRequestError("Customer user not found");
  if (u.role !== "Customer") throw new BadRequestError("Selected user must have Customer role");
}

async function assertDepotAccess(user, depotId) {
  if (!depotId) {
    if (hasDataScope(user, "depot")) {
      throw new BadRequestError("Depot users must assign customers to their own depot");
    }
    return;
  }
  const depot = await getDepotById(depotId);
  if (!depot) throw new BadRequestError("Depot not found");
  const scope = getDataScopeForUser(user);
  if (scope === "owner" && String(depot.ownerUserId) !== String(user.sub)) {
    throw new BadRequestError("Owner can only manage customers in owned depots");
  }
  if (scope === "depot" && String(depot.depotUserId) !== String(user.sub)) {
    throw new BadRequestError("Depot can only manage customers in own depot");
  }
}

async function assertProvinceExists(provinceId) {
  if (!provinceId) return;
  const province = await getProvinceById(provinceId);
  if (!province) throw new BadRequestError("Province not found");
}

async function createCustomer(user, payload) {
  const nextPayload = { ...payload };
  await validateCustomerUser(nextPayload.userId);
  if (hasDataScope(user, "depot")) {
    const depot = await getDepotForUser(user);
    if (!depot) throw new BadRequestError("Depot profile not found for current user");
    nextPayload.depotId = depot.id;
  }
  await assertDepotAccess(user, nextPayload.depotId);
  await assertProvinceExists(nextPayload.provinceId);

  const { userId, ...customerPayload } = nextPayload;
  const pool = getPool();
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const created = await require("../repositories").createCustomer(customerPayload, conn);
    if (userId) {
      await setCustomerUserLink(conn, Number(created.id), Number(userId));
    }
    await conn.commit();
    return getCustomerById(created.id);
  } catch (err) {
    await conn.rollback().catch(() => {});
    throw err;
  } finally {
    conn.release();
  }
}

async function updateCustomer(user, customerId, payload) {
  const allowedCustomers = await getAllowedCustomers(user);
  const canAccess = allowedCustomers.some((customer) => String(customer.id) === String(customerId));
  if (!canAccess) throw new NotFoundError("Customer not found");
  const nextPayload = { ...payload };
  await validateCustomerUser(nextPayload.userId);
  if (hasDataScope(user, "depot")) {
    const depot = await getDepotForUser(user);
    if (!depot) throw new BadRequestError("Depot profile not found for current user");
    nextPayload.depotId = depot.id;
  }
  await assertDepotAccess(user, nextPayload.depotId);
  await assertProvinceExists(nextPayload.provinceId);

  const { userId, ...customerPayload } = nextPayload;
  const pool = getPool();
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const customer = await require("../repositories").updateCustomer(customerId, customerPayload, conn);
    if (!customer) {
      await conn.rollback();
      throw new NotFoundError("Customer not found");
    }
    if (Object.prototype.hasOwnProperty.call(payload, "userId")) {
      if (userId) {
        await setCustomerUserLink(conn, Number(customerId), Number(userId));
      } else {
        await setCustomerUserLink(conn, Number(customerId), null);
      }
    }
    await conn.commit();
    return getCustomerById(customerId);
  } catch (err) {
    await conn.rollback().catch(() => {});
    throw err;
  } finally {
    conn.release();
  }
}

async function deleteCustomer(user, customerId) {
  const allowedCustomers = await getAllowedCustomers(user);
  const canAccess = allowedCustomers.some((customer) => String(customer.id) === String(customerId));
  if (!canAccess) throw new NotFoundError("Customer not found");
  const deleted = await require("../repositories").deleteCustomer(customerId);
  if (!deleted) throw new NotFoundError("Customer not found");
}

module.exports = {
  listCustomers,
  listCustomerUsers,
  createCustomer,
  updateCustomer,
  deleteCustomer,
};
