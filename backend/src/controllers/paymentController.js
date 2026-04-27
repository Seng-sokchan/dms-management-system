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

module.exports = {
  listPayments,
  listPaymentMethods,
  createPayment,
};
