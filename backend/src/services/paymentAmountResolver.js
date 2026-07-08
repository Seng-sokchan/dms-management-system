const customerItemPriceRepository = require("../repositories/customerItemPrices");
const { BadRequestError } = require("../errors");
const {
  normalizePaymentCurrency,
  convertPaymentAmount,
} = require("../utils/paymentCurrency");

const PAYMENT_CURRENCIES = ["KHR", "USD"];

async function resolveOrderPaymentAmount(order, currency) {
  const selected = normalizePaymentCurrency(currency);
  const orderCurrency = normalizePaymentCurrency(order?.currency);
  if (selected === orderCurrency) {
    return Number(order.amountTotal);
  }

  const mappedPrice = await customerItemPriceRepository.getCustomerItemPrice(
    order.customerId,
    order.itemId,
    selected,
  );
  if (mappedPrice?.unitPrice != null) {
    return Number(order.orderedQty || 0) * Number(mappedPrice.unitPrice);
  }

  return convertPaymentAmount(Number(order.amountTotal), orderCurrency, selected);
}

async function resolveOrdersPaymentAmount(orders, currency) {
  if (!Array.isArray(orders) || orders.length === 0) {
    throw new BadRequestError("At least one order is required");
  }

  let total = 0;
  for (const order of orders) {
    total += await resolveOrderPaymentAmount(order, currency);
  }
  return total;
}

async function resolveOrderPaymentAmounts(order) {
  const amounts = {};
  for (const currency of PAYMENT_CURRENCIES) {
    amounts[currency] = await resolveOrderPaymentAmount(order, currency);
  }
  return amounts;
}

async function resolveOrdersPaymentAmounts(orders) {
  const amounts = {};
  for (const currency of PAYMENT_CURRENCIES) {
    amounts[currency] = await resolveOrdersPaymentAmount(orders, currency);
  }
  return amounts;
}

module.exports = {
  PAYMENT_CURRENCIES,
  normalizePaymentCurrency,
  resolveOrderPaymentAmount,
  resolveOrdersPaymentAmount,
  resolveOrderPaymentAmounts,
  resolveOrdersPaymentAmounts,
};
