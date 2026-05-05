const {
  createProducer: createProducerDb,
  listProducers: listProducersDb,
  updateProducer: updateProducerDb,
  deleteProducer: deleteProducerDb,
} = require("../repositories");
const { NotFoundError } = require("../errors");

async function listProducers() {
  return listProducersDb();
}

async function createProducer(payload) {
  return createProducerDb(payload);
}

async function updateProducer(producerId, payload) {
  const producer = await updateProducerDb(producerId, payload);
  if (!producer) throw new NotFoundError("Producer not found");
  return producer;
}

async function deleteProducer(producerId) {
  const deleted = await deleteProducerDb(producerId);
  if (!deleted) throw new NotFoundError("Producer not found");
}

module.exports = {
  listProducers,
  createProducer,
  updateProducer,
  deleteProducer,
};
