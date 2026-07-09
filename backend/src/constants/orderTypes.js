/** Master order type on `orders` table. */
const ORDER_TYPE_CUSTOMER = 1;
const ORDER_TYPE_DEPOT = 2;

const ORDER_NO_PREFIX_CUSTOMER = "ORD";
const ORDER_NO_PREFIX_DEPOT = "DEP";
const ORDER_NO_PAD_LENGTH = 6;

function orderNoPrefix(targetType) {
  return Number(targetType) === ORDER_TYPE_DEPOT ? ORDER_NO_PREFIX_DEPOT : ORDER_NO_PREFIX_CUSTOMER;
}

function formatOrderNo(targetType, sequence) {
  const prefix = orderNoPrefix(targetType);
  return `${prefix}-${String(sequence).padStart(ORDER_NO_PAD_LENGTH, "0")}`;
}

module.exports = {
  ORDER_TYPE_CUSTOMER,
  ORDER_TYPE_DEPOT,
  ORDER_NO_PREFIX_CUSTOMER,
  ORDER_NO_PREFIX_DEPOT,
  ORDER_NO_PAD_LENGTH,
  orderNoPrefix,
  formatOrderNo,
};
