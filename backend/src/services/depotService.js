const {
  getDepotById: getDepotByIdDb,
  createDepot: createDepotDb,
  updateDepot: updateDepotDb,
  deleteDepot: deleteDepotDb,
  getUserById,
  setDepotUserLink,
} = require("../repositories");
const {
  listDepotsForUser,
  assertDepotAccess,
} = require("./accessScopeService");
const { BadRequestError, NotFoundError } = require("../errors");

async function validateDepotUser(depotUserId) {
  if (!depotUserId) return;
  const user = await getUserById(depotUserId);
  if (!user || !user.isActive) throw new BadRequestError("Depot user not found");
  if (user.role !== "Depot") throw new BadRequestError("Selected depot user must have Depot role");
}

async function syncDepotUserLink(depotId, depotUserId) {
  const hasLink = depotUserId != null && String(depotUserId).trim() !== "";
  if (hasLink) {
    await validateDepotUser(depotUserId);
    await setDepotUserLink(null, Number(depotId), Number(depotUserId));
  } else {
    await setDepotUserLink(null, Number(depotId), null);
  }
}

async function listDepots(user) {
  return listDepotsForUser(user);
}

async function getDepotById(user, depotId) {
  const depot = await getDepotByIdDb(depotId);
  return assertDepotAccess(user, depot);
}

async function createDepot(_user, payload) {
  await validateDepotUser(payload.depotUserId);
  const created = await createDepotDb(payload);
  await syncDepotUserLink(created.id, payload.depotUserId);
  return getDepotByIdDb(created.id);
}

async function updateDepot(user, depotId, payload) {
  const existing = await getDepotByIdDb(depotId);
  if (!existing) throw new NotFoundError("Depot not found");
  await assertDepotAccess(user, existing);
  const shouldSyncLink = Object.prototype.hasOwnProperty.call(payload, "depotUserId");
  if (shouldSyncLink) await validateDepotUser(payload.depotUserId);
  const depot = await updateDepotDb(depotId, payload);
  if (!depot) throw new NotFoundError("Depot not found");
  if (shouldSyncLink) await syncDepotUserLink(depotId, payload.depotUserId);
  return getDepotByIdDb(depotId);
}

async function deleteDepot(user, depotId) {
  const existing = await getDepotByIdDb(depotId);
  if (!existing) throw new NotFoundError("Depot not found");
  await assertDepotAccess(user, existing);
  await setDepotUserLink(null, Number(depotId), null);
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
