const depotRepository = require("../repositories/depots");
const customerRepository = require("../repositories/customers");
const { getDataScope } = require("./rulesCache");
const { ForbiddenError, NotFoundError } = require("../errors");

async function getDepotForUser(user) {
  const scope = getDataScope(user.role);
  if (scope === "depot") {
    return depotRepository.getDepotByDepotUserId(user.sub);
  }
  return null;
}

async function getAllowedCustomerIds(user) {
  const scope = getDataScope(user.role);
  // Single-owner system: Owner sees all business data (same breadth as Admin).
  if (scope === "all" || scope === "owner") return null;
  if (scope === "depot") {
    const depot = await depotRepository.getDepotByDepotUserId(user.sub);
    if (!depot) return new Set();
    const customers = await customerRepository.listCustomersByDepotId(depot.id);
    return new Set(customers.map((c) => String(c.id)));
  }
  if (scope === "customer") {
    const customer = await customerRepository.getCustomerByUserId(user.sub);
    return customer ? new Set([String(customer.id)]) : new Set();
  }
  return new Set();
}

function filterRowsByCustomerIds(rows, allowedIds, customerIdField = "customerId") {
  if (allowedIds === null) return rows;
  return rows.filter((row) => allowedIds.has(String(row[customerIdField])));
}

async function assertDepotAccess(user, depot) {
  if (!depot) throw new NotFoundError("Depot not found");
  const scope = getDataScope(user.role);
  if (scope === "all" || scope === "owner") return depot;
  if (scope === "depot") {
    const linked = await depotRepository.getDepotByDepotUserId(user.sub);
    if (linked && String(linked.id) === String(depot.id)) return depot;
  }
  throw new ForbiddenError("Unauthorized depot access");
}

async function assertCustomerAccess(user, customerId) {
  const allowedIds = await getAllowedCustomerIds(user);
  if (allowedIds === null) return;
  if (!allowedIds.has(String(customerId))) {
    throw new ForbiddenError("Unauthorized customer access");
  }
}

async function listCustomersForUser(user) {
  const scope = getDataScope(user.role);
  if (scope === "all" || scope === "owner") return customerRepository.listCustomers();
  if (scope === "depot") {
    const depot = await depotRepository.getDepotByDepotUserId(user.sub);
    if (!depot) return [];
    return customerRepository.listCustomersByDepotId(depot.id);
  }
  if (scope === "customer") {
    const customer = await customerRepository.getCustomerByUserId(user.sub);
    return customer ? [customer] : [];
  }
  return [];
}

async function listDepotsForUser(user) {
  const scope = getDataScope(user.role);
  if (scope === "all" || scope === "owner") return depotRepository.listDepots();
  if (scope === "depot") {
    const depot = await depotRepository.getDepotByDepotUserId(user.sub);
    return depot ? [depot] : [];
  }
  return [];
}

function hasDataScope(user, scopeName) {
  return getDataScope(user.role) === scopeName;
}

module.exports = {
  getDepotForUser,
  getAllowedCustomerIds,
  filterRowsByCustomerIds,
  assertDepotAccess,
  assertCustomerAccess,
  listCustomersForUser,
  listDepotsForUser,
  hasDataScope,
  getDataScopeForUser: (user) => getDataScope(user.role),
};
