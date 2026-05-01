const crypto = require("crypto");
const { getPool } = require("../db/pool");
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
} = require("../repositories");
const { createKhqr, checkTransactionByMd5List } = require("../services/khqrService");
const { success, created } = require("../utils/response");
const {
  asyncHandler,
  BadRequestError,
  NotFoundError,
  ForbiddenError,
  UnauthorizedError,
} = require("../errors");

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

const listPayments = asyncHandler(async (req, res) => {
  const payments = await listPaymentsDb();
  if (req.user?.role === "Customer") {
    const customer = await getCustomerByUserId(req.user.sub);
    if (!customer) {
      return success(res, []);
    }
    const orders = await listOrdersDb();
    const allowedOrderIds = new Set(
      orders
        .filter((order) => String(order.customerId) === String(customer.id))
        .map((order) => String(order.id)),
    );
    return success(res, payments.filter((payment) => allowedOrderIds.has(String(payment.orderId))));
  }
  return success(res, payments);
});

const listPaymentMethods = asyncHandler(async (_req, res) => {
  const methods = await listPaymentMethodsDb();
  return success(res, methods);
});

const createPayment = asyncHandler(async (req, res) => {
  const order = await getOrderById(req.body.orderId);
  if (!order) {
    throw new NotFoundError("Order not found for payment");
  }

  const methodId = req.body.method;
  const methods = await listPaymentMethodsDb();
  if (!methods.some((item) => Number(item.id) === methodId)) {
    throw new BadRequestError("Invalid payment method");
  }

  const payment = await createPaymentDb({ ...req.body, method: methodId });
  const updatedOrder = await applyPaymentToOrder(req.body.orderId, req.body.amount);
  return created(res, { payment, order: updatedOrder });
});

const generatePaymentKhqr = asyncHandler(async (req, res) => {
  let order = null;
  let remaining = 0;
  let billPrefix = "ORD";

  if (req.body.orderId) {
    order = await getOrderById(req.body.orderId);
    if (!order) {
      throw new NotFoundError("Order not found for KHQR");
    }
    if (req.user?.role === "Customer") {
      const customer = await getCustomerByUserId(req.user.sub);
      if (!customer || String(order.customerId) !== String(customer.id)) {
        throw new ForbiddenError("You can only generate KHQR for your own order");
      }
    }
    remaining = Math.max(0, Number(order.amountTotal || 0) - Number(order.amountPaid || 0));
    billPrefix = `ORD-${order.id}`;
  } else {
    if (req.user?.role !== "Customer") {
      throw new BadRequestError("orderId is required for this role");
    }
    const customer = await getCustomerByUserId(req.user.sub);
    if (!customer) {
      throw new NotFoundError("Customer not found");
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
    throw new BadRequestError("No outstanding balance for KHQR");
  }

  const amount = req.body.amount != null ? req.body.amount : remaining;
  if (amount > remaining) {
    throw new BadRequestError("KHQR amount cannot exceed outstanding balance");
  }

  try {
    const billNumber = `${billPrefix}-${Date.now()}`;
    const generated = createKhqr({
      amount,
      billNumber,
      currency: req.body.currency || process.env.BAKONG_CURRENCY || "USD",
    });
    return success(res, {
      orderId: order ? order.id : null,
      amount,
      outstanding: remaining,
      currency: generated.currency,
      khqr: generated.qr,
      md5: generated.md5,
      billNumber,
    });
  } catch (_error) {
    throw new BadRequestError("Failed to generate KHQR");
  }
});

const checkPaymentKhqrByMd5List = asyncHandler(async (req, res) => {
  try {
    const tokenRecord = await getLatestBakongToken();
    const accessToken = String(tokenRecord?.accessToken || "").trim();
    if (!accessToken) {
      throw new UnauthorizedError("Bakong token is missing. Please update token in database.");
    }
    const expMs = decodeJwtExpMs(accessToken);
    if (expMs && Date.now() >= expMs) {
      throw new UnauthorizedError("Bakong token expired. Please renew token.");
    }

    const normalizedMd5List = req.body.map((item) => {
      const value = String(item || "").trim();
      if (/^[a-f0-9]{32}$/i.test(value)) {
        return value.toLowerCase();
      }
      return crypto.createHash("md5").update(value).digest("hex");
    });
    const data = await checkTransactionByMd5List(normalizedMd5List, accessToken);
    return success(res, data);
  } catch (error) {
    if (Number(error?.statusCode) === 401) {
      throw new UnauthorizedError("Bakong token expired. Please renew token.");
    }
    throw new BadRequestError(error?.message || "Failed to check transaction by md5 list");
  }
});

const confirmPaymentKhqrTransaction = asyncHandler(async (req, res) => {
  if (!req.body.orderId && !req.body.orderIds?.length) {
    throw new BadRequestError("orderId or orderIds is required");
  }

  const tx = req.body.transaction;
  const txStatus = String(tx.status || "").toUpperCase();
  if (!(txStatus === "SUCCESS" || txStatus === "APPROVED" || txStatus === "COMPLETED")) {
    throw new BadRequestError("Transaction status is not successful");
  }

  const requestedOrderIds = req.body.orderIds?.length
    ? req.body.orderIds.map((id) => String(id))
    : [String(req.body.orderId)];
  const uniqueOrderIds = Array.from(new Set(requestedOrderIds));

  const orders = [];
  for (const orderId of uniqueOrderIds) {
    const order = await getOrderById(orderId);
    if (!order) {
      throw new NotFoundError(`Order not found: ${orderId}`);
    }
    orders.push(order);
  }

  if (req.user?.role === "Customer") {
    const customer = await getCustomerByUserId(req.user.sub);
    const notOwned = !customer || orders.some((order) => String(order.customerId) !== String(customer.id));
    if (notOwned) {
      throw new ForbiddenError("You can only confirm payment for your own order");
    }
  }

  const conn = await getPool().getConnection();
  try {
    await conn.beginTransaction();

    const existingTx = await getBakongTransactionByMd5(tx.md5, conn);
    if (existingTx) {
      await conn.rollback();
      return success(res, {
        alreadyConfirmed: true,
        transaction: existingTx,
        orders,
      });
    }

    if (!tx.data) {
      await conn.rollback();
      throw new BadRequestError("Transaction data is required");
    }

    const d = tx.data;
    const amount = Number(d.amount);
    if (!Number.isFinite(amount) || !(amount > 0)) {
      await conn.rollback();
      throw new BadRequestError("Transaction amount must be greater than zero");
    }

    const orderOutstanding = orders.map((order) => ({
      order,
      outstanding: Math.max(0, Number(order.amountTotal || 0) - Number(order.amountPaid || 0)),
    }));
    const totalOutstanding = orderOutstanding.reduce((sum, item) => sum + item.outstanding, 0);
    if (totalOutstanding <= 0) {
      await conn.rollback();
      throw new BadRequestError("No outstanding balance for selected orders");
    }
    const targetAmount = Math.min(amount, totalOutstanding);

    let savedTx;
    try {
      savedTx = await createBakongTransaction({
        orderId: String(orders[0].id),
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
        rawPayload: { ...tx, orderIds: uniqueOrderIds },
      }, conn);
    } catch (err) {
      if (err?.code === "ER_DUP_ENTRY" || err?.errno === 1062) {
        const row = await getBakongTransactionByMd5(tx.md5, conn);
        if (row) {
          await conn.rollback();
          return success(res, { alreadyConfirmed: true, transaction: row, orders });
        }
      }
      throw err;
    }

    let remainingToApply = targetAmount;
    const paymentNote = `Bakong ${tx.md5}${d?.externalRef ? ` (${d.externalRef})` : ""}`;
    const payments = [];
    const updatedOrders = [];

    for (const item of orderOutstanding) {
      if (remainingToApply <= 0) break;
      if (item.outstanding <= 0) continue;
      const applyAmount = Math.min(item.outstanding, remainingToApply);
      const payment = await createPaymentDb({
        orderId: String(item.order.id),
        amount: applyAmount,
        method: 2,
        note: paymentNote,
      }, conn);
      const updatedOrder = await applyPaymentToOrder(String(item.order.id), applyAmount, conn);
      payments.push(payment);
      updatedOrders.push(updatedOrder);
      remainingToApply -= applyAmount;
    }

    if (payments[0]?.id) {
      await updateBakongTransactionPaymentIdByMd5(tx.md5, payments[0].id, conn);
    }

    savedTx = (await getBakongTransactionByMd5(tx.md5, conn)) || savedTx;
    await conn.commit();

    return created(res, {
      alreadyConfirmed: false,
      transaction: savedTx,
      payments,
      orders: updatedOrders,
      appliedAmount: Number((targetAmount - Math.max(0, remainingToApply)).toFixed(2)),
    });
  } catch (error) {
    await conn.rollback();
    throw error;
  } finally {
    conn.release();
  }
});

const getBakongTokenStatus = asyncHandler(async (_req, res) => {
  const latest = await getLatestBakongToken();
  if (!latest) {
    return success(res, { hasToken: false });
  }
  return success(res, {
    hasToken: true,
    expiresAt: latest.expiresAt,
    updatedAt: latest.updatedAt,
  });
});

const saveBakongToken = asyncHandler(async (req, res) => {
  const accessToken = String(req.body.accessToken).trim();
  const expMs = decodeJwtExpMs(accessToken);
  const expiresAt = expMs ? new Date(expMs) : null;
  await insertBakongToken({ accessToken, expiresAt });
  const latest = await getLatestBakongToken();
  return created(res, {
    message: "Bakong token saved",
    hasToken: true,
    expiresAt: latest?.expiresAt || null,
    updatedAt: latest?.updatedAt || null,
  });
});

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
