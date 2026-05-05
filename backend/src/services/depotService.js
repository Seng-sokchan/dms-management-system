const {
  listDepots: listDepotsDb,
  listDepotsByOwnerUserId,
  getDepotById: getDepotByIdDb,
  getDepotByDepotUserId,
  createDepot: createDepotDb,
  updateDepot: updateDepotDb,
  deleteDepot: deleteDepotDb,
  getUserById,
} = require("../repositories");
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
  if (user.role === "Depot") {
    const depot = await getDepotByDepotUserId(user.sub);
    return depot ? [depot] : [];
  }
  if (user.role === "Owner") return listDepotsByOwnerUserId(user.sub);
  return listDepotsDb();
}

async function getDepotById(user, depotId) {
  const depot = await getDepotByIdDb(depotId);
  if (!depot) throw new NotFoundError("Depot not found");
  if (user.role === "Owner" && String(depot.ownerUserId) !== String(user.sub)) {
    throw new BadRequestError("You can only access your own depot");
  }
  if (user.role === "Depot" && String(depot.depotUserId) !== String(user.sub)) {
    throw new BadRequestError("You can only access your own depot");
  }
  return depot;
}

async function createDepot(user, payload) {
  const nextPayload = { ...payload };
  if (user.role === "Owner") nextPayload.ownerUserId = user.sub;
  await validateOwnerUser(nextPayload.ownerUserId);
  await validateDepotUser(nextPayload.depotUserId);
  return createDepotDb(nextPayload);
}

async function updateDepot(user, depotId, payload) {
  const existing = await getDepotByIdDb(depotId);
  if (!existing) throw new NotFoundError("Depot not found");
  if (user.role === "Owner" && String(existing.ownerUserId) !== String(user.sub)) {
    throw new BadRequestError("You can only update your own depot");
  }
  const nextPayload = { ...payload };
  if (user.role === "Owner") nextPayload.ownerUserId = user.sub;
  await validateOwnerUser(nextPayload.ownerUserId);
  await validateDepotUser(nextPayload.depotUserId);
  const depot = await updateDepotDb(depotId, nextPayload);
  if (!depot) throw new NotFoundError("Depot not found");
  return depot;
}

async function deleteDepot(user, depotId) {
  const existing = await getDepotByIdDb(depotId);
  if (!existing) throw new NotFoundError("Depot not found");
  if (user.role === "Owner" && String(existing.ownerUserId) !== String(user.sub)) {
    throw new BadRequestError("You can only delete your own depot");
  }
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
