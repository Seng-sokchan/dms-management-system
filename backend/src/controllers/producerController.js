const producerService = require("../services/producerService");
const { success, created, noContent } = require("../utils/response");
const { asyncHandler } = require("../errors");

const listProducers = asyncHandler(async (_req, res) => {
  const producers = await producerService.listProducers();
  return success(res, producers);
});

const createProducer = asyncHandler(async (req, res) => {
  const producer = await producerService.createProducer(req.body);
  return created(res, producer);
});

const updateProducer = asyncHandler(async (req, res) => {
  const producer = await producerService.updateProducer(req.params.id, req.body);
  return success(res, producer);
});

const deleteProducer = asyncHandler(async (req, res) => {
  await producerService.deleteProducer(req.params.id);
  return noContent(res);
});

module.exports = {
  listProducers,
  createProducer,
  updateProducer,
  deleteProducer,
};
