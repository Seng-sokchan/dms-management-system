const { z } = require("zod");
const {
  createPayment: createPaymentDb,
  listPayments: listPaymentsDb,
  listPaymentMethods: listPaymentMethodsDb,
  getOrderById,
  listOrders: listOrdersDb,
  getCustomerByUserId,
  applyPaymentToOrder,
} = require("../db/dataStore");
const { createKhqr } = require("../services/khqrService");

async function listPayments(req, res) {
  const payments = await listPaymentsDb();
  if (req.user?.role === "Customer") {
    const customer = await getCustomerByUserId(req.user.sub);
    if (!customer) {
      return res.json([]);
    }
    const orders = await listOrdersDb();
    const allowedOrderIds = new Set(
      orders
        .filter((order) => String(order.customerId) === String(customer.id))
        .map((order) => String(order.id)),
    );
    return res.json(payments.filter((payment) => allowedOrderIds.has(String(payment.orderId))));
  }
  res.json(payments);
}

async function listPaymentMethods(_req, res) {
  const methods = await listPaymentMethodsDb();
  res.json(methods);
}

async function createPayment(req, res) {
  const schema = z.object({
    orderId: z.string().min(1),
    amount: z.number().positive(),
    method: z.coerce.number().int().positive(),
    note: z.string().optional().default(""),
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: "Invalid payment payload" });
  }

  const order = await getOrderById(parsed.data.orderId);
  if (!order) {
    return res.status(404).json({ message: "Order not found for payment" });
  }

  const methodId = parsed.data.method;
  const methods = await listPaymentMethodsDb();
  if (!methods.some((item) => Number(item.id) === methodId)) {
    return res.status(400).json({ message: "Invalid payment method" });
  }

  const payment = await createPaymentDb({ ...parsed.data, method: methodId });
  const updatedOrder = await applyPaymentToOrder(parsed.data.orderId, parsed.data.amount);
  return res.status(201).json({ payment, order: updatedOrder });
}

async function generatePaymentKhqr(req, res) {
  const schema = z.object({
    orderId: z.string().min(1).optional(),
    amount: z.number().positive().optional(),
    currency: z.enum(["USD", "KHR"]).optional(),
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: "Invalid KHQR payload" });
  }

  let order = null;
  let remaining = 0;
  let billPrefix = "ORD";

  if (parsed.data.orderId) {
    order = await getOrderById(parsed.data.orderId);
    if (!order) {
      return res.status(404).json({ message: "Order not found for KHQR" });
    }
    if (req.user?.role === "Customer") {
      const customer = await getCustomerByUserId(req.user.sub);
      if (!customer || String(order.customerId) !== String(customer.id)) {
        return res.status(403).json({ message: "You can only generate KHQR for your own order" });
      }
    }
    remaining = Math.max(0, Number(order.amountTotal || 0) - Number(order.amountPaid || 0));
    billPrefix = `ORD-${order.id}`;
  } else {
    if (req.user?.role !== "Customer") {
      return res.status(400).json({ message: "orderId is required for this role" });
    }
    const customer = await getCustomerByUserId(req.user.sub);
    if (!customer) {
      return res.status(404).json({ message: "Customer not found" });
    }
    const orders = await listOrdersDb();
    remaining = orders
      .filter((row) => String(row.customerId) === String(customer.id))
      .reduce(
        (sum, row) => sum + Math.max(0, Number(row.amountTotal || 0) - Number(row.amountPaid || 0)),
        0,
      );
    billPrefix = `CUS-${customer.id}`;
  }

  if (remaining <= 0) {
    return res.status(400).json({ message: "No outstanding balance for KHQR" });
  }

  const amount = parsed.data.amount != null ? parsed.data.amount : remaining;
  if (amount > remaining) {
    return res.status(400).json({ message: "KHQR amount cannot exceed outstanding balance" });
  }

  try {
    const billNumber = `${billPrefix}-${Date.now()}`;
    const generated = createKhqr({
      amount,
      billNumber,
      currency: parsed.data.currency || process.env.BAKONG_CURRENCY || "USD",
    });
    return res.json({
      orderId: order ? order.id : null,
      amount,
      outstanding: remaining,
      currency: generated.currency,
      khqr: generated.qr,
      md5: generated.md5,
      billNumber,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to generate KHQR",
      detail: error.message,
    });
  }
}

module.exports = {
  listPayments,
  listPaymentMethods,
  createPayment,
  generatePaymentKhqr,
};
