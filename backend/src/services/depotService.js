const {
  getDepotById: getDepotByIdDb,
  createDepot: createDepotDb,
  updateDepot: updateDepotDb,
  deleteDepot: deleteDepotDb,
  getUserById,
} = require("../repositories");
const {
  listDepotsForUser,
  assertDepotAccess,
  hasDataScope,
} = require("./accessScopeService");
const { BadRequestError, NotFoundError } = require("../errors");

async function validateOwnerUser(ownerUserId) {
  const user = await getUserById(ownerUserId);
  if (!user || !user.isActive) throw new BadRequestError("Owner user not found");
  if (user.role !== "Owner") throw new BadRequestError("Selected owner user must have Owner role");
}

async function validateDepotUser(depotUserId) {
  if (!depotUserId) return;
  const user = await getUserById(depotUserId);
  if (!user || !user.isActive) throw new BadRequestError("Depot user not found");
  if (user.role !== "Depot") throw new BadRequestError("Selected depot user must have Depot role");
}

async function listDepots(user) {
  return listDepotsForUser(user);
}

async function getDepotById(user, depotId) {
  const depot = await getDepotByIdDb(depotId);
  return assertDepotAccess(user, depot);
}

async function createDepot(user, payload) {
  const nextPayload = { ...payload };
  if (hasDataScope(user, "owner")) nextPayload.ownerUserId = user.sub;
  await validateOwnerUser(nextPayload.ownerUserId);
  await validateDepotUser(nextPayload.depotUserId);
  return createDepotDb(nextPayload);
}

async function updateDepot(user, depotId, payload) {
  const existing = await getDepotByIdDb(depotId);
  if (!existing) throw new NotFoundError("Depot not found");
  await assertDepotAccess(user, existing);
  const nextPayload = { ...payload };
  if (hasDataScope(user, "owner")) nextPayload.ownerUserId = user.sub;
  await validateOwnerUser(nextPayload.ownerUserId);
  await validateDepotUser(nextPayload.depotUserId);
  const depot = await updateDepotDb(depotId, nextPayload);
  if (!depot) throw new NotFoundError("Depot not found");
  return depot;
}

async function deleteDepot(user, depotId) {
  const existing = await getDepotByIdDb(depotId);
  if (!existing) throw new NotFoundError("Depot not found");
  await assertDepotAccess(user, existing);
  const deleted = await deleteDepotDb(depotId);
  if (!deleted) throw new NotFoundError("Depot not found");
}

module.exports = {
  listDepots,
  getDepotById,
  createDepot,
  updateDepot,
  deleteDepot,
};
