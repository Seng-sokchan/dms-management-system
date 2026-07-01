const depotRepository = require("../repositories/depots");
const itemRepository = require("../repositories/items");
const depotItemPriceRepository = require("../repositories/depotItemPrices");
const {
  assertDepotAccess,
  listDepotsForUser,
  hasDataScope,
} = require("./accessScopeService");
const { BadRequestError, NotFoundError } = require("../errors");

function normalizeCurrency(currency) {
  return String(currency || "KHR").toUpperCase() === "USD" ? "USD" : "KHR";
}

async function list(user) {
  const rows = await depotItemPriceRepository.listDepotItemPrices();
  if (hasDataScope(user, "all")) return rows;
  const depots = await listDepotsForUser(user);
  const ownedIds = new Set(depots.map((d) => String(d.id)));
  return rows.filter((row) => ownedIds.has(String(row.depotId)));
}

async function upsert(user, payload) {
  await assertDepotAccess(user, await depotRepository.getDepotById(payload.depotId));

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

  if (!hasDataScope(user, "all")) {
    await assertDepotAccess(user, await depotRepository.getDepotById(existing.depotId));
  }

  const deleted = await depotItemPriceRepository.deleteDepotItemPrice(id);
  if (!deleted) throw new NotFoundError("Depot item price not found");
}

module.exports = {
  list,
  upsert,
  remove,
};
