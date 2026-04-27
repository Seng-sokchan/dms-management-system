const { z } = require("zod");
const {
  createProducer: createProducerDb,
  listProducers: listProducersDb,
  updateProducer: updateProducerDb,
  deleteProducer: deleteProducerDb,
} = require("../db/dataStore");

async function listProducers(_req, res) {
  const producers = await listProducersDb();
  res.json(producers);
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
    return res.status(400).json({ message: "Invalid producer payload" });
  }
  const producer = await createProducerDb(parsed.data);
  return res.status(201).json(producer);
}

async function updateProducer(req, res) {
  const parsed = producerSchema().safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: "Invalid producer payload" });
  }
  const producer = await updateProducerDb(req.params.id, parsed.data);
  if (!producer) {
    return res.status(404).json({ message: "Producer not found" });
  }
  return res.json(producer);
}

async function deleteProducer(req, res) {
  const deleted = await deleteProducerDb(req.params.id);
  if (!deleted) {
    return res.status(404).json({ message: "Producer not found" });
  }
  return res.status(204).send();
}

module.exports = {
  listProducers,
  createProducer,
  updateProducer,
  deleteProducer,
};
