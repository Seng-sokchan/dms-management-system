const {
  createDeliveryAgent: createDeliveryAgentDb,
  listDeliveryAgents: listDeliveryAgentsDb,
  updateDeliveryAgent: updateDeliveryAgentDb,
  deleteDeliveryAgent: deleteDeliveryAgentDb,
} = require("../repositories");
const { NotFoundError } = require("../errors");

async function listDeliveryAgents() {
  return listDeliveryAgentsDb();
}

async function createDeliveryAgent(payload) {
  return createDeliveryAgentDb(payload);
}

async function updateDeliveryAgent(deliveryAgentId, payload) {
  const deliveryAgent = await updateDeliveryAgentDb(deliveryAgentId, payload);
  if (!deliveryAgent) throw new NotFoundError("Delivery agent not found");
  return deliveryAgent;
}

async function deleteDeliveryAgent(deliveryAgentId) {
  const deleted = await deleteDeliveryAgentDb(deliveryAgentId);
  if (!deleted) throw new NotFoundError("Delivery agent not found");
}

module.exports = {
  listDeliveryAgents,
  createDeliveryAgent,
  updateDeliveryAgent,
  deleteDeliveryAgent,
};
