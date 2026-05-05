const truckService = require("../services/truckService");
const { success, created, noContent } = require("../utils/response");
const { asyncHandler } = require("../errors");

const listTrucks = asyncHandler(async (_req, res) => {
  const trucks = await truckService.listTrucks();
  return success(res, trucks);
});

const createTruck = asyncHandler(async (req, res) => {
  const truck = await truckService.createTruck(req.body);
  return created(res, truck);
});

const updateTruck = asyncHandler(async (req, res) => {
  const truck = await truckService.updateTruck(req.params.id, req.body);
  return success(res, truck);
});

const deleteTruck = asyncHandler(async (req, res) => {
  await truckService.deleteTruck(req.params.id);
  return noContent(res);
});

module.exports = {
  listTrucks,
  createTruck,
  updateTruck,
  deleteTruck,
};
