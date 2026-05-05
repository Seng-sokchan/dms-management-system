const depotService = require("../services/depotService");
const { success, created, noContent } = require("../utils/response");
const { asyncHandler } = require("../errors");

const listDepots = asyncHandler(async (req, res) => {
  const depots = await depotService.listDepots(req.user);
  return success(res, depots);
});

const getDepotById = asyncHandler(async (req, res) => {
  const depot = await depotService.getDepotById(req.user, req.params.id);
  return success(res, depot);
});

const createDepot = asyncHandler(async (req, res) => {
  const depot = await depotService.createDepot(req.user, req.body);
  return created(res, depot);
});

const updateDepot = asyncHandler(async (req, res) => {
  const depot = await depotService.updateDepot(req.user, req.params.id, req.body);
  return success(res, depot);
});

const deleteDepot = asyncHandler(async (req, res) => {
  await depotService.deleteDepot(req.user, req.params.id);
  return noContent(res);
});

module.exports = {
  listDepots,
  getDepotById,
  createDepot,
  updateDepot,
  deleteDepot,
};
