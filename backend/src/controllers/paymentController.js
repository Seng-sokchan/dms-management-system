const { z } = require("zod");
const crypto = require("crypto");
const {
  createPayment: createPaymentDb,
  listPayments: listPaymentsDb,
  listPaymentMethods: listPaymentMethodsDb,
  getOrderById,
  listOrders: listOrdersDb,
  getCustomerByUserId,
  applyPaymentToOrder,
  getLatestBakongToken,
  insertBakongToken,
  getBakongTransactionByMd5,
  createBakongTransaction,
  updateBakongTransactionPaymentIdByMd5,
} = require("../db/dataStore");
const { createKhqr, checkTransactionByMd5List } = require("../services/khqrService");

function decodeJwtExpMs(token) {
  try {
    const parts = String(token || "").split(".");
    if (parts.length < 2) return null;
    const payloadRaw = Buffer.from(parts[1], "base64url").toString("utf8");
    const payload = JSON.parse(payloadRaw);
    if (!payload || typeof payload.exp !== "number") return null;
    return payload.exp * 1000;
  } catch {
    return null;
  }
}

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

async function checkPaymentKhqrByMd5List(req, res) {
  const schema = z.array(z.string().min(1)).min(1);
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: "Invalid md5 list payload" });
  }

  try {
    const tokenRecord = await getLatestBakongToken();
    const accessToken = String(tokenRecord?.accessToken || "").trim();
    if (!accessToken) {
      return res.status(401).json({
        message: "Bakong token is missing. Please update token in database.",
        errorCode: "BAKONG_TOKEN_EXPIRED",
      });
    }
    const expMs = decodeJwtExpMs(accessToken);
    if (expMs && Date.now() >= expMs) {
      return res.status(401).json({
        message: "Bakong token expired. Please renew token.",
        errorCode: "BAKONG_TOKEN_EXPIRED",
      });
    }

    const normalizedMd5List = parsed.data.map((item) => {
      const value = String(item || "").trim();
      if (/^[a-f0-9]{32}$/i.test(value)) {
        return value.toLowerCase();
      }
      return crypto.createHash("md5").update(value).digest("hex");
    });
    const data = await checkTransactionByMd5List(normalizedMd5List, accessToken);
    return res.json(data);
  } catch (error) {
    if (Number(error?.statusCode) === 401) {
      return res.status(401).json({
        message: "Bakong token expired. Please renew token.",
        errorCode: "BAKONG_TOKEN_EXPIRED",
        detail: error?.payload || null,
      });
    }
    const statusCode = Number(error?.statusCode) || 502;
    return res.status(statusCode).json({
      message: error?.message || "Failed to check transaction by md5 list",
      detail: error?.payload || null,
    });
  }
}

async function confirmPaymentKhqrTransaction(req, res) {
  const schema = z.object({
    orderId: z.string().min(1),
    transaction: z.object({
      md5: z.string().min(1),
      status: z.string().min(1),
      message: z.string().optional(),
      data: z.object({
        hash: z.string().optional().nullable(),
        fromAccountId: z.string().optional().nullable(),
        toAccountId: z.string().optional().nullable(),
        currency: z.string().optional().nullable(),
        amount: z.coerce.number().positive(),
        description: z.string().optional().nullable(),
        createdDateMs: z.coerce.number().optional().nullable(),
        acknowledgedDateMs: z.coerce.number().optional().nullable(),
        trackingStatus: z.string().optional().nullable(),
        receiverBank: z.string().optional().nullable(),
        receiverBankAccount: z.string().optional().nullable(),
        instructionRef: z.string().optional().nullable(),
        externalRef: z.string().optional().nullable(),
      }).optional().nullable(),
    }),
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: "Invalid KHQR confirm payload" });
  }

  const tx = parsed.data.transaction;
  const txStatus = String(tx.status || "").toUpperCase();
  if (!(txStatus === "SUCCESS" || txStatus === "APPROVED" || txStatus === "COMPLETED")) {
    return res.status(400).json({ message: "Transaction status is not successful" });
  }

  const order = await getOrderById(parsed.data.orderId);
  if (!order) {
    return res.status(404).json({ message: "Order not found" });
  }
  if (req.user?.role === "Customer") {
    const customer = await getCustomerByUserId(req.user.sub);
    if (!customer || String(order.customerId) !== String(customer.id)) {
      return res.status(403).json({ message: "You can only confirm payment for your own order" });
    }
  }

  const existingTx = await getBakongTransactionByMd5(tx.md5);
  if (existingTx) {
    return res.json({
      alreadyConfirmed: true,
      transaction: existingTx,
      order,
    });
  }

  if (!tx.data) {
    return res.status(400).json({ message: "Transaction data is required" });
  }

  const d = tx.data;
  const amount = Number(d.amount);
  if (!Number.isFinite(amount) || !(amount > 0)) {
    return res.status(400).json({ message: "Transaction amount must be greater than zero" });
  }

  const outstanding = Math.max(0, Number(order.amountTotal || 0) - Number(order.amountPaid || 0));
  const appliedAmount = Math.min(amount, outstanding);

  let savedTx;
  try {
    savedTx = await createBakongTransaction({
      orderId: parsed.data.orderId,
      paymentId: null,
      md5: tx.md5,
      status: txStatus,
      message: tx.message || "Transaction success",
      hash: d.hash || null,
      fromAccountId: d.fromAccountId || null,
      toAccountId: d.toAccountId || null,
      currency: d.currency || null,
      amount,
      description: d.description || null,
      createdDateMs: d.createdDateMs || null,
      acknowledgedDateMs: d.acknowledgedDateMs || null,
      trackingStatus: d.trackingStatus || null,
      receiverBank: d.receiverBank || null,
      receiverBankAccount: d.receiverBankAccount || null,
      instructionRef: d.instructionRef || null,
      externalRef: d.externalRef || null,
      rawPayload: tx,
    });
  } catch (err) {
    if (err?.code === "ER_DUP_ENTRY" || err?.errno === 1062) {
      const row = await getBakongTransactionByMd5(tx.md5);
      if (row) {
        return res.json({ alreadyConfirmed: true, transaction: row, order });
      }
    }
    throw err;
  }

  let payment = null;
  let updatedOrder = order;
  if (outstanding > 0 && amount > 0) {
    payment = await createPaymentDb({
      orderId: parsed.data.orderId,
      amount: appliedAmount,
      method: 2,
      note: `Bakong ${tx.md5}${d?.externalRef ? ` (${d.externalRef})` : ""}`,
    });
    updatedOrder = await applyPaymentToOrder(parsed.data.orderId, appliedAmount);
    if (payment?.id) {
      await updateBakongTransactionPaymentIdByMd5(tx.md5, payment.id);
    }
  }

  savedTx = (await getBakongTransactionByMd5(tx.md5)) || savedTx;

  return res.status(201).json({
    alreadyConfirmed: false,
    transaction: savedTx,
    payment,
    order: updatedOrder,
  });
}

async function getBakongTokenStatus(_req, res) {
  const latest = await getLatestBakongToken();
  if (!latest) {
    return res.json({ hasToken: false });
  }
  return res.json({
    hasToken: true,
    expiresAt: latest.expiresAt,
    updatedAt: latest.updatedAt,
  });
}

async function saveBakongToken(req, res) {
  const schema = z.object({
    accessToken: z.string().min(20),
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: "Invalid Bakong token payload" });
  }
  const accessToken = String(parsed.data.accessToken).trim();
  const expMs = decodeJwtExpMs(accessToken);
  const expiresAt = expMs ? new Date(expMs) : null;
  try {
    await insertBakongToken({ accessToken, expiresAt });
    const latest = await getLatestBakongToken();
    return res.status(201).json({
      message: "Bakong token saved",
      hasToken: true,
      expiresAt: latest?.expiresAt || null,
      updatedAt: latest?.updatedAt || null,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to save Bakong token",
      detail: error?.message || "Unknown error",
    });
  }
}

module.exports = {
  listPayments,
  listPaymentMethods,
  createPayment,
  generatePaymentKhqr,
  checkPaymentKhqrByMd5List,
  confirmPaymentKhqrTransaction,
  getBakongTokenStatus,
  saveBakongToken,
};
