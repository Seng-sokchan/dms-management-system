const depotRepository = require("../repositories/depots");
const itemRepository = require("../repositories/items");
const depotItemPriceRepository = require("../repositories/depotItemPrices");
const { BadRequestError, NotFoundError } = require("../errors");

function normalizeCurrency(currency) {
  return String(currency || "KHR").toUpperCase() === "USD" ? "USD" : "KHR";
}

async function assertDepotAccess(user, depotId) {
  const depot = await depotRepository.getDepotById(depotId);
  if (!depot) throw new BadRequestError("Depot not found");
  if (user.role === "Owner" && String(depot.ownerUserId) !== String(user.sub)) {
    throw new BadRequestError("You can only manage prices for your own depot");
  }
  if (user.role === "Depot" && String(depot.depotUserId) !== String(user.sub)) {
    throw new BadRequestError("You can only manage prices for your own depot");
  }
  return depot;
}

async function list(user) {
  const rows = await depotItemPriceRepository.listDepotItemPrices();
  if (user.role === "Admin") return rows;
  if (user.role === "Owner") {
    const owned = await depotRepository.listDepotsByOwnerUserId(user.sub);
    const ownedIds = new Set(owned.map((d) => String(d.id)));
    return rows.filter((row) => ownedIds.has(String(row.depotId)));
  }
  if (user.role === "Depot") {
    const depot = await depotRepository.getDepotByDepotUserId(user.sub);
    if (!depot) return [];
    return rows.filter((row) => String(row.depotId) === String(depot.id));
  }
  return rows;
}

async function upsert(user, payload) {
  await assertDepotAccess(user, payload.depotId);

  const item = await itemRepository.getItemById(payload.itemId);
  if (!item) throw new BadRequestError("Item not found");

  if (Number(payload.unitPrice) < 0) {
    throw new BadRequestError("Unit price must be non-negative");
  }

  return depotItemPriceRepository.upsertDepotItemPrice({
    depotId: payload.depotId,
    itemId: payload.itemId,
    currency: normalizeCurrency(payload.currency),
    unitPrice: payload.unitPrice,
  });
}

async function remove(user, id) {
  const rows = await depotItemPriceRepository.listDepotItemPrices();
  const existing = rows.find((row) => String(row.id) === String(id));
  if (!existing) throw new NotFoundError("Depot item price not found");

  if (user.role !== "Admin") {
    await assertDepotAccess(user, existing.depotId);
  }

  const deleted = await depotItemPriceRepository.deleteDepotItemPrice(id);
  if (!deleted) throw new NotFoundError("Depot item price not found");
}

module.exports = {
  list,
  upsert,
  remove,
};
