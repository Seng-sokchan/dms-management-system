const { z } = require("zod");
const {
  createProducer: createProducerDb,
  listProducers: listProducersDb,
  updateProducer: updateProducerDb,
  deleteProducer: deleteProducerDb,
} = require("../repositories");
const { success, created, noContent, fail } = require("../utils/response");

async function listProducers(_req, res) {
  const producers = await listProducersDb();
  return success(res, producers);
}

function producerSchema() {
  return z.object({
    name: z.string().min(2),
    phone: z.string().min(5),
    capacityNote: z.string().optional().default(""),
  });
}

async function createProducer(req, res) {
  const parsed = producerSchema().safeParse(req.body);
  if (!parsed.success) {
    return fail(res, { status: 400, message: "Invalid producer payload" });
  }
  const producer = await createProducerDb(parsed.data);
  return created(res, producer);
}

async function updateProducer(req, res) {
  const parsed = producerSchema().safeParse(req.body);
  if (!parsed.success) {
    return fail(res, { status: 400, message: "Invalid producer payload" });
  }
  const producer = await updateProducerDb(req.params.id, parsed.data);
  if (!producer) {
    return fail(res, { status: 400, message: "Producer not found" });
  }
  return success(res, producer);
}

async function deleteProducer(req, res) {
  const deleted = await deleteProducerDb(req.params.id);
  if (!deleted) {
    return fail(res, { status: 400, message: "Producer not found" });
  }
  return noContent(res);
}

module.exports = {
  listProducers,
  createProducer,
  updateProducer,
  deleteProducer,
};
