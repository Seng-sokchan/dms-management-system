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
 * Admin/Owner: all; Depot: linked depot only.
 */
async function listOrderPaymentTotals({ user } = {}) {
  const role = user?.role;
  const userId = toUserId(user?.sub);

  if (role === "Admin" || role === "Owner") {
    return {
      byCustomer: await paymentTotalsRepository.listTotalsByCustomerAll(),
      byDepot: await paymentTotalsRepository.listTotalsByDepotAll(),
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
