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
const { success, created, noContent } = require("../utils/response");
const {
  asyncHandler,
  BadRequestError,
  NotFoundError,
} = require("../errors");

async function validateOwnerUser(ownerUserId) {
  const user = await getUserById(ownerUserId);
  if (!user || !user.isActive) {
    throw new BadRequestError("Owner user not found");
  }
  if (user.role !== "Owner") {
    throw new BadRequestError("Selected owner user must have Owner role");
  }
}

async function validateDepotUser(depotUserId) {
  if (!depotUserId) return;
  const user = await getUserById(depotUserId);
  if (!user || !user.isActive) {
    throw new BadRequestError("Depot user not found");
  }
  if (user.role !== "Depot") {
    throw new BadRequestError("Selected depot user must have Depot role");
  }
}

const listDepots = asyncHandler(async (req, res) => {
  if (req.user.role === "Depot") {
    const depot = await getDepotByDepotUserId(req.user.sub);
    return success(res, depot ? [depot] : []);
  }
  if (req.user.role === "Owner") {
    const depots = await listDepotsByOwnerUserId(req.user.sub);
    return success(res, depots);
  }
  const depots = await listDepotsDb();
  return success(res, depots);
});

const getDepotById = asyncHandler(async (req, res) => {
  const depot = await getDepotByIdDb(req.params.id);
  if (!depot) {
    throw new NotFoundError("Depot not found");
  }
  if (req.user.role === "Owner" && String(depot.ownerUserId) !== String(req.user.sub)) {
    throw new BadRequestError("You can only access your own depot");
  }
  if (req.user.role === "Depot" && String(depot.depotUserId) !== String(req.user.sub)) {
    throw new BadRequestError("You can only access your own depot");
  }
  return success(res, depot);
});

const createDepot = asyncHandler(async (req, res) => {
  if (req.user.role === "Owner") {
    req.body.ownerUserId = req.user.sub;
  }
  await validateOwnerUser(req.body.ownerUserId);
  await validateDepotUser(req.body.depotUserId);
  const depot = await createDepotDb(req.body);
  return created(res, depot);
});

const updateDepot = asyncHandler(async (req, res) => {
  const existing = await getDepotByIdDb(req.params.id);
  if (!existing) {
    throw new NotFoundError("Depot not found");
  }
  if (req.user.role === "Owner" && String(existing.ownerUserId) !== String(req.user.sub)) {
    throw new BadRequestError("You can only update your own depot");
  }
  if (req.user.role === "Owner") {
    req.body.ownerUserId = req.user.sub;
  }
  await validateOwnerUser(req.body.ownerUserId);
  await validateDepotUser(req.body.depotUserId);
  const depot = await updateDepotDb(req.params.id, req.body);
  if (!depot) {
    throw new NotFoundError("Depot not found");
  }
  return success(res, depot);
});

const deleteDepot = asyncHandler(async (req, res) => {
  const existing = await getDepotByIdDb(req.params.id);
  if (!existing) {
    throw new NotFoundError("Depot not found");
  }
  if (req.user.role === "Owner" && String(existing.ownerUserId) !== String(req.user.sub)) {
    throw new BadRequestError("You can only delete your own depot");
  }
  const deleted = await deleteDepotDb(req.params.id);
  if (!deleted) {
    throw new NotFoundError("Depot not found");
  }
  return noContent(res);
});

module.exports = {
  listDepots,
  getDepotById,
  createDepot,
  updateDepot,
  deleteDepot,
};
