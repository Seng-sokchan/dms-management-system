const deliveryService = require("../services/deliveryService");
const { success, created, noContent } = require("../utils/response");
const { asyncHandler } = require("../errors");

const listDeliveryAgents = asyncHandler(async (_req, res) => {
  const deliveryAgents = await deliveryService.listDeliveryAgents();
  return success(res, deliveryAgents);
});

const createDeliveryAgent = asyncHandler(async (req, res) => {
  const deliveryAgent = await deliveryService.createDeliveryAgent(req.body);
  return created(res, deliveryAgent);
});

const updateDeliveryAgent = asyncHandler(async (req, res) => {
  const deliveryAgent = await deliveryService.updateDeliveryAgent(req.params.id, req.body);
  return success(res, deliveryAgent);
});

const deleteDeliveryAgent = asyncHandler(async (req, res) => {
  await deliveryService.deleteDeliveryAgent(req.params.id);
  return noContent(res);
});

module.exports = {
  listDeliveryAgents,
  createDeliveryAgent,
  updateDeliveryAgent,
  deleteDeliveryAgent,
};
