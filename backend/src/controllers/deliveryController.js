const { z } = require("zod");
const {
  createDeliveryAgent: createDeliveryAgentDb,
  listDeliveryAgents: listDeliveryAgentsDb,
  updateDeliveryAgent: updateDeliveryAgentDb,
  deleteDeliveryAgent: deleteDeliveryAgentDb,
} = require("../repositories");
const { success, created, noContent, fail } = require("../utils/response");

async function listDeliveryAgents(_req, res) {
  const deliveryAgents = await listDeliveryAgentsDb();
  return success(res, deliveryAgents);
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
    return fail(res, { status: 400, message: "Invalid delivery payload" });
  }
  const deliveryAgent = await createDeliveryAgentDb(parsed.data);
  return created(res, deliveryAgent);
}

async function updateDeliveryAgent(req, res) {
  const parsed = deliverySchema().safeParse(req.body);
  if (!parsed.success) {
    return fail(res, { status: 400, message: "Invalid delivery payload" });
  }
  const deliveryAgent = await updateDeliveryAgentDb(req.params.id, parsed.data);
  if (!deliveryAgent) {
    return fail(res, { status: 400, message: "Delivery agent not found" });
  }
  return success(res, deliveryAgent);
}

async function deleteDeliveryAgent(req, res) {
  const deleted = await deleteDeliveryAgentDb(req.params.id);
  if (!deleted) {
    return fail(res, { status: 400, message: "Delivery agent not found" });
  }
  return noContent(res);
}

module.exports = {
  listDeliveryAgents,
  createDeliveryAgent,
  updateDeliveryAgent,
  deleteDeliveryAgent,
};
