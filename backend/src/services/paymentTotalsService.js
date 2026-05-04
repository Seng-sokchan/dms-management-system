const depotRepository = require("../repositories/depots");
const paymentTotalsRepository = require("../repositories/paymentTotals");
const { ForbiddenError } = require("../errors");

function toUserId(sub) {
  if (sub == null || sub === "") return null;
  const n = Number(sub);
  return Number.isFinite(n) ? n : null;
}

/**
 * Aggregated order amounts by customer and by managing depot.
 * Scoped like customer listing: Admin all, Owner owned depots + unassigned-depot customers, Depot single depot.
 */
async function listOrderPaymentTotals({ user } = {}) {
  const role = user?.role;
  const userId = toUserId(user?.sub);

  if (role === "Admin") {
    return {
      byCustomer: await paymentTotalsRepository.listTotalsByCustomerAll(),
      byDepot: await paymentTotalsRepository.listTotalsByDepotAll(),
    };
  }

  if (role === "Owner" && userId != null) {
    return {
      byCustomer: await paymentTotalsRepository.listTotalsByCustomerForOwner(userId),
      byDepot: await paymentTotalsRepository.listTotalsByDepotForOwner(userId),
    };
  }

  if (role === "Depot" && userId != null) {
    const depot = await depotRepository.getDepotByDepotUserId(userId);
    if (!depot) {
      return { byCustomer: [], byDepot: [] };
    }
    const depotId = Number(depot.id);
    return {
      byCustomer: await paymentTotalsRepository.listTotalsByCustomerForDepot(depotId),
      byDepot: await paymentTotalsRepository.listTotalsByDepotForDepot(depotId),
    };
  }

  throw new ForbiddenError("Not allowed");
}

module.exports = {
  listOrderPaymentTotals,
};
