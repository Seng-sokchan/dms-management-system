const customerRepository = require("../repositories/customers");
const itemRepository = require("../repositories/items");
const customerItemPriceRepository = require("../repositories/customerItemPrices");
const { BadRequestError, NotFoundError } = require("../errors");

function normalizeCurrency(currency) {
  return String(currency || "KHR").toUpperCase() === "USD" ? "USD" : "KHR";
}

async function list() {
  return customerItemPriceRepository.listCustomerItemPrices();
}

async function upsert(payload) {
  const customer = await customerRepository.getCustomerById(payload.customerId);
  if (!customer) throw new BadRequestError("Customer not found");
  if (customer.depotId) {
    throw new BadRequestError(
      "This customer is assigned to a depot. Set prices in the depot pricing section instead.",
    );
  }

  const item = await itemRepository.getItemById(payload.itemId);
  if (!item) throw new BadRequestError("Item not found");

  if (Number(payload.unitPrice) < 0) {
    throw new BadRequestError("Unit price must be non-negative");
  }

  return customerItemPriceRepository.upsertCustomerItemPrice({
    customerId: payload.customerId,
    itemId: payload.itemId,
    currency: normalizeCurrency(payload.currency),
    unitPrice: payload.unitPrice,
  });
}

async function remove(id) {
  const deleted = await customerItemPriceRepository.deleteCustomerItemPrice(id);
  if (!deleted) throw new NotFoundError("Customer item price not found");
}

module.exports = {
  list,
  upsert,
  remove,
};
