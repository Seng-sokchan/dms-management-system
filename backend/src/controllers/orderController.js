const { z } = require("zod");
const { getNextAllowedStatuses } = require("../services/orderService");
const {
  getCustomerById,
  getCustomerByUserId,
  getItemById,
  getTruckById,
  listOrders: listOrdersDb,
  createOrder: createOrderDb,
  getOrderById,
  updateOrderAssignment,
  updateOrderStatus: updateOrderStatusDb,
  confirmOrderDelivery,
  getDashboardSummary,
  listOrderStatuses,
} = require("../db/dataStore");

function filterOrdersForLogistics(orders = []) {
  return orders.filter((row) => row.status === "SENT_TO_LOGISTICS_SUPPLIER");
}

async function listOrders(req, res) {
  const orders = await listOrdersDb();
  if (req.user?.role === "Customer") {
    const customer = await getCustomerByUserId(req.user.sub);
    if (!customer) {
      return res.json([]);
    }
    return res.json(orders.filter((row) => String(row.customerId) === String(customer.id)));
  }
  if (req.user?.role === "Logistics" || req.user?.role === "Delivery") {
    return res.json(filterOrdersForLogistics(orders));
  }
  return res.json(orders);
}

async function createOrder(req, res) {
  const schema = z.object({
    customerId: z.string().min(1),
    itemId: z.string().min(1),
    orderedQty: z.number().int().positive(),
    unitPrice: z.number().nonnegative().optional(),
    producerId: z.string().optional().nullable(),
    truckId: z.string().optional().nullable(),
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: "Invalid order payload" });
  }

  const { customerId, itemId, orderedQty, unitPrice, producerId, truckId } = parsed.data;
  const customer = await getCustomerById(customerId);
  if (!customer) {
    return res.status(400).json({ message: "Customer not found" });
  }
  const catalogItem = await getItemById(itemId);
  if (!catalogItem) {
    return res.status(400).json({ message: "Item not found" });
  }
  const resolvedUnitPrice = unitPrice != null ? unitPrice : catalogItem.defaultUnitPrice;
  if (truckId) {
    const truck = await getTruckById(truckId);
    if (!truck) {
      return res.status(400).json({ message: "Truck not found" });
    }
  }

  const order = await createOrderDb({
    customerId,
    addressId: customer.address,
    itemId,
    orderedQty,
    unitPrice: resolvedUnitPrice,
    producerId: producerId || null,
    truckId: truckId || null,
  });
  return res.status(201).json(order);
}

async function assignOrder(req, res) {
  const order = await getOrderById(req.params.id);
  if (!order) {
    return res.status(404).json({ message: "Order not found" });
  }
  const schema = z.object({
    producerId: z.string().nullable().optional(),
    truckId: z.string().nullable().optional(),
    deliveryTime: z.string().datetime().optional(),
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: "Invalid assignment payload" });
  }
  if (parsed.data.truckId) {
    const truck = await getTruckById(parsed.data.truckId);
    if (!truck) {
      return res.status(400).json({ message: "Truck not found" });
    }
  }
  const updatedOrder = await updateOrderAssignment(req.params.id, parsed.data);
  return res.json(updatedOrder);
}

async function getStatusNames() {
  const rows = await listOrderStatuses();
  return rows.map((row) => row.name);
}

async function listStatuses(_req, res) {
  const statuses = await listOrderStatuses();
  return res.json(statuses);
}

async function updateOrderStatus(req, res) {
  const order = await getOrderById(req.params.id);
  if (!order) {
    return res.status(404).json({ message: "Order not found" });
  }
  if ((req.user?.role === "Logistics" || req.user?.role === "Delivery") && order.status !== "SENT_TO_LOGISTICS_SUPPLIER") {
    return res.status(400).json({
      message: "Logistics/Delivery can update status only when order is SENT_TO_LOGISTICS_SUPPLIER",
    });
  }
  const statusNames = await getStatusNames();
  const schema = z.object({ status: z.string().min(1) });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success || !statusNames.includes(parsed.data.status)) {
    return res.status(400).json({ message: "Invalid status payload" });
  }

  const allowed = getNextAllowedStatuses(order.status, statusNames);
  if (!allowed.includes(parsed.data.status)) {
    return res.status(400).json({
      message: `Invalid transition from ${order.status} to ${parsed.data.status}`,
      allowedNext: allowed,
    });
  }
  const updatedOrder = await updateOrderStatusDb(req.params.id, parsed.data.status, {
    changedByUserId: req.user.sub,
  });
  return res.json(updatedOrder);
}

async function confirmDelivery(req, res) {
  const order = await getOrderById(req.params.id);
  if (!order) {
    return res.status(404).json({ message: "Order not found" });
  }
  const schema = z.object({
    deliveredQty: z.number().int().nonnegative(),
    lossQty: z.number().int().nonnegative().default(0),
    remainingQty: z.number().int().nonnegative().default(0),
    deliveryProofType: z.enum(["PHOTO", "SIGNATURE", "OTP"]),
    deliveryProofValue: z.string().min(1),
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: "Invalid confirmation payload" });
  }

  const total = parsed.data.deliveredQty + parsed.data.lossQty + parsed.data.remainingQty;
  if (total > order.orderedQty) {
    return res.status(400).json({
      message: "Invalid quantities: delivered + loss + remaining cannot exceed ordered quantity",
      orderedQty: order.orderedQty,
    });
  }

  const updatedOrder = await confirmOrderDelivery(
    req.params.id,
    parsed.data.deliveredQty,
    parsed.data.lossQty,
    parsed.data.remainingQty,
    parsed.data.deliveryProofType,
    parsed.data.deliveryProofValue,
  );
  return res.json(updatedOrder);
}

async function dashboardSummary(_req, res) {
  const summary = await getDashboardSummary();
  res.json(summary);
}

async function mobileListOrders(req, res) {
  const orders = await listOrdersDb();
  const scoped = req.user?.role === "Logistics" || req.user?.role === "Delivery" ? filterOrdersForLogistics(orders) : orders;
  res.json({ data: scoped, count: scoped.length });
}

async function mobileUpdateStatus(req, res) {
  const statusNames = await getStatusNames();
  const schema = z.object({ status: z.string().min(1) });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success || !statusNames.includes(parsed.data.status)) {
    return res.status(400).json({ message: "Invalid mobile status payload" });
  }
  const order = await getOrderById(req.params.id);
  if (!order) {
    return res.status(404).json({ message: "Order not found" });
  }
  if ((req.user?.role === "Logistics" || req.user?.role === "Delivery") && order.status !== "SENT_TO_LOGISTICS_SUPPLIER") {
    return res.status(400).json({
      message: "Logistics/Delivery can update status only when order is SENT_TO_LOGISTICS_SUPPLIER",
    });
  }
  const updatedOrder = await updateOrderStatusDb(req.params.id, parsed.data.status, {
    changedByUserId: req.user.sub,
  });
  return res.json({ data: updatedOrder });
}

module.exports = {
  listStatuses,
  listOrders,
  createOrder,
  assignOrder,
  updateOrderStatus,
  confirmDelivery,
  dashboardSummary,
  mobileListOrders,
  mobileUpdateStatus,
};
