const { z } = require("zod");
const {
  createDeliveryAgent: createDeliveryAgentDb,
  listDeliveryAgents: listDeliveryAgentsDb,
  updateDeliveryAgent: updateDeliveryAgentDb,
  deleteDeliveryAgent: deleteDeliveryAgentDb,
} = require("../repositories");

async function listDeliveryAgents(_req, res) {
  const deliveryAgents = await listDeliveryAgentsDb();
  res.json(deliveryAgents);
}

function deliverySchema() {
  return z.object({
    name: z.string().min(2),
    phone: z.string().min(5),
    vehicleType: z.string().min(2),
  });
}

async function createDeliveryAgent(req, res) {
  const parsed = deliverySchema().safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: "Invalid delivery payload" });
  }
  const deliveryAgent = await createDeliveryAgentDb(parsed.data);
  return res.status(201).json(deliveryAgent);
}

async function updateDeliveryAgent(req, res) {
  const parsed = deliverySchema().safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: "Invalid delivery payload" });
  }
  const deliveryAgent = await updateDeliveryAgentDb(req.params.id, parsed.data);
  if (!deliveryAgent) {
    return res.status(404).json({ message: "Delivery agent not found" });
  }
  return res.json(deliveryAgent);
}

async function deleteDeliveryAgent(req, res) {
  const deleted = await deleteDeliveryAgentDb(req.params.id);
  if (!deleted) {
    return res.status(404).json({ message: "Delivery agent not found" });
  }
  return res.status(204).send();
}

module.exports = {
  listDeliveryAgents,
  createDeliveryAgent,
  updateDeliveryAgent,
  deleteDeliveryAgent,
};
