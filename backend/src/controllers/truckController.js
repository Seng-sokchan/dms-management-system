const { z } = require("zod");
const {
  createTruck: createTruckDb,
  listTrucks: listTrucksDb,
  updateTruck: updateTruckDb,
  deleteTruck: deleteTruckDb,
} = require("../db/dataStore");

async function listTrucks(_req, res) {
  const trucks = await listTrucksDb();
  res.json(trucks);
}

function truckSchema() {
  return z.object({
    code: z.string().min(2),
    plateNo: z.string().min(3),
    deliveryAgentId: z.string().nullable().optional(),
    capacityNote: z.string().max(255).optional().default(""),
  });
}

async function createTruck(req, res) {
  const parsed = truckSchema().safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: "Invalid truck payload" });
  }
  const truck = await createTruckDb(parsed.data);
  return res.status(201).json(truck);
}

async function updateTruck(req, res) {
  const parsed = truckSchema().safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: "Invalid truck payload" });
  }
  const truck = await updateTruckDb(req.params.id, parsed.data);
  if (!truck) {
    return res.status(404).json({ message: "Truck not found" });
  }
  return res.json(truck);
}

async function deleteTruck(req, res) {
  const deleted = await deleteTruckDb(req.params.id);
  if (!deleted) {
    return res.status(404).json({ message: "Truck not found" });
  }
  return res.status(204).send();
}

module.exports = {
  listTrucks,
  createTruck,
  updateTruck,
  deleteTruck,
};
