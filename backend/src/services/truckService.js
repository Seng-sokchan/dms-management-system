const {
  createTruck: createTruckDb,
  listTrucks: listTrucksDb,
  updateTruck: updateTruckDb,
  deleteTruck: deleteTruckDb,
} = require("../repositories");
const { NotFoundError } = require("../errors");

async function listTrucks() {
  return listTrucksDb();
}

async function createTruck(payload) {
  return createTruckDb(payload);
}

async function updateTruck(truckId, payload) {
  const truck = await updateTruckDb(truckId, payload);
  if (!truck) throw new NotFoundError("Truck not found");
  return truck;
}

async function deleteTruck(truckId) {
  const deleted = await deleteTruckDb(truckId);
  if (!deleted) throw new NotFoundError("Truck not found");
}

module.exports = {
  listTrucks,
  createTruck,
  updateTruck,
  deleteTruck,
};
