const { z } = require("zod");
const {
  createTruck: createTruckDb,
  listTrucks: listTrucksDb,
  updateTruck: updateTruckDb,
  deleteTruck: deleteTruckDb,
} = require("../repositories");
const { success, created, noContent, fail } = require("../utils/response");

async function listTrucks(_req, res) {
  const trucks = await listTrucksDb();
  return success(res, trucks);
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
    return fail(res, { status: 400, message: "Invalid truck payload" });
  }
  const truck = await createTruckDb(parsed.data);
  return created(res, truck);
}

async function updateTruck(req, res) {
  const parsed = truckSchema().safeParse(req.body);
  if (!parsed.success) {
    return fail(res, { status: 400, message: "Invalid truck payload" });
  }
  const truck = await updateTruckDb(req.params.id, parsed.data);
  if (!truck) {
    return fail(res, { status: 400, message: "Truck not found" });
  }
  return success(res, truck);
}

async function deleteTruck(req, res) {
  const deleted = await deleteTruckDb(req.params.id);
  if (!deleted) {
    return fail(res, { status: 400, message: "Truck not found" });
  }
  return noContent(res);
}

module.exports = {
  listTrucks,
  createTruck,
  updateTruck,
  deleteTruck,
};
