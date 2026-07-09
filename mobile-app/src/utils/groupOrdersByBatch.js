import { ORDER_TYPE_CUSTOMER, ORDER_TYPE_DEPOT } from "../constants/orderTypes";

function sortSections(sections) {
  sections.sort((a, b) => {
    const idA =
      a.type === "batch"
        ? Math.max(...a.orders.map((order) => Number(order.id) || 0))
        : Number(a.order.id) || 0;
    const idB =
      b.type === "batch"
        ? Math.max(...b.orders.map((order) => Number(order.id) || 0))
        : Number(b.order.id) || 0;
    return idB - idA;
  });
  return sections;
}

/** Customer cart: master order type 1 with multiple line items. */
export function groupCustomerOrders(orders) {
  const batchMap = new Map();
  const singles = [];

  for (const order of orders) {
    if (order?.masterOrderType === ORDER_TYPE_DEPOT) {
      singles.push({ type: "single", order });
      continue;
    }

    const masterOrderId = order?.masterOrderId;
    if (!masterOrderId) {
      singles.push({ type: "single", order });
      continue;
    }

    if (!batchMap.has(masterOrderId)) batchMap.set(masterOrderId, []);
    batchMap.get(masterOrderId).push(order);
  }

  const sections = [];
  for (const [masterOrderId, batchOrders] of batchMap.entries()) {
    const isCustomerBatch =
      batchOrders.length >= 2
      && batchOrders.every((order) => order?.masterOrderType !== ORDER_TYPE_DEPOT);

    if (isCustomerBatch) {
      sections.push({
        type: "batch",
        masterOrderId,
        orders: batchOrders,
      });
    } else {
      for (const order of batchOrders) {
        singles.push({ type: "single", order });
      }
    }
  }

  for (const item of singles) {
    sections.push(item);
  }

  return sortSections(sections);
}

/** Depot prepare batch: master order type 2. */
export function groupDepotOrders(orders) {
  const batchMap = new Map();
  const singles = [];

  for (const order of orders) {
    if (order?.masterOrderType !== ORDER_TYPE_DEPOT) {
      singles.push({ type: "single", order });
      continue;
    }

    const masterOrderId = order?.masterOrderId;
    if (!masterOrderId) {
      singles.push({ type: "single", order });
      continue;
    }

    if (!batchMap.has(masterOrderId)) batchMap.set(masterOrderId, []);
    batchMap.get(masterOrderId).push(order);
  }

  const sections = [];
  for (const [masterOrderId, batchOrders] of batchMap.entries()) {
    sections.push({ type: "batch", masterOrderId, orders: batchOrders });
  }
  for (const item of singles) {
    sections.push(item);
  }

  return sortSections(sections);
}

export function sumBatchAmountDue(orders) {
  return (orders || []).reduce((sum, order) => {
    const status = order?.paymentStatus || "unpaid";
    if (status === "paid") return sum;
    return sum + Number(order?.amountTotal || 0);
  }, 0);
}
