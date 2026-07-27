/**
 * Telegram Bot API notifications for factory and delivery alerts.
 */
const { BadRequestError } = require("../errors");
const { logError } = require("../utils/logger");

const TELEGRAM_API_BASE = "https://api.telegram.org";
const REQUEST_TIMEOUT_MS = 10_000;

const NOTIFY_FAILURE_MESSAGE =
  "Could not notify factory on Telegram. Order was not submitted.";

function getBotToken() {
  return String(process.env.TELEGRAM_BOT_TOKEN || "").trim();
}

function getFallbackChatId() {
  return String(process.env.TELEGRAM_CHAT_ID || "").trim();
}

function getFactoryChatId() {
  return (
    String(process.env.TELEGRAM_CHAT_ID_FACTORY || "").trim() || getFallbackChatId()
  );
}

function getDeliveredChatId() {
  return (
    String(process.env.TELEGRAM_CHAT_ID_DELIVERED || "").trim() || getFallbackChatId()
  );
}

function isFactoryTelegramConfigured() {
  return Boolean(getBotToken() && getFactoryChatId());
}

function isDeliveredTelegramConfigured() {
  return Boolean(getBotToken() && getDeliveredChatId());
}

/** True when bot token and at least one usable chat ID are set. */
function isTelegramConfigured() {
  return Boolean(getBotToken() && (getFactoryChatId() || getDeliveredChatId()));
}

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function pad2(value) {
  return String(value).padStart(2, "0");
}

function formatDateTime(date = new Date()) {
  const year = date.getFullYear();
  const month = pad2(date.getMonth() + 1);
  const day = pad2(date.getDate());
  return `${day}.${month}.${year}`;
}

function formatQty(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return String(value ?? "—");
  return n.toLocaleString("en-US");
}

function normalizeOrders(orderOrOrders) {
  if (Array.isArray(orderOrOrders)) return orderOrOrders.filter(Boolean);
  return orderOrOrders ? [orderOrOrders] : [];
}

function addItemQty(items, itemKey, itemName, orderedQty) {
  const current = items.get(itemKey);
  const qty = Number(orderedQty);

  if (current) {
    const currentQty = Number(current.qty);
    current.qty =
      Number.isFinite(currentQty) && Number.isFinite(qty)
        ? currentQty + qty
        : orderedQty;
    return;
  }

  items.set(itemKey, {
    name: itemName,
    qty: orderedQty,
  });
}

function getOrderProvinceName(order) {
  return String(
    order?.customerProvinceName ||
      order?.provinceName ||
      order?.customer_province_name ||
      order?.province_name ||
      "",
  ).trim();
}

function formatOrderSentToFactoryMessage(orderOrOrders) {
  const orders = normalizeOrders(orderOrOrders);
  const firstOrder = orders[0] || {};

  // Customized names
  const driverName = firstOrder.deliveryAgentName || "—";
  const provinceNames = [
    ...new Set(
      orders
        .map(getOrderProvinceName)
        .filter(Boolean),
    ),
  ];
  const provinceName = provinceNames.length > 0 ? provinceNames.join(", ") : "—";

  // Group by customers and items
  const customers = new Map();
  const totalItems = new Map();
  let totalOrderQty = 0;
  for (const order of orders) {
    const customerKey = order.customerId || order.customerName || `order-${order.id}`;
    if (!customers.has(customerKey)) {
      customers.set(customerKey, {
        name: order.customerName || "—",
        items: new Map(),
      });
    }

    const customer = customers.get(customerKey);
    const itemName = order.itemName || "—";
    const itemKey = order.itemId || itemName;

    addItemQty(customer.items, itemKey, itemName, order.orderedQty);
    addItemQty(totalItems, itemKey, itemName, order.orderedQty);

    // Count all order quantity (order.orderedQty)
    const qty = Number(order.orderedQty);
    if (Number.isFinite(qty) && qty > 0) {
      totalOrderQty += qty;
    }
  }

  // Header with Khmer prefix for province
  const provinceDisplay = `ខេត្ត ${escapeHtml(provinceName)}`;
  const dateStr = escapeHtml(formatDateTime());
  const driverDisplay = escapeHtml(driverName);

  const lines = [];

  // 27.07.2026: ចេង ពិសិដ្ឋ  - ខេត្ត កំពង់ស្ពឺ
  lines.push(`${dateStr}: ${driverDisplay}  - ${provinceDisplay}`);

  lines.push(""); // blank line

  // -សរុប: total order quantity
  lines.push(`-សរុប: ${escapeHtml(formatQty(totalOrderQty))}`);

  lines.push(""); // blank line

  // Items list:
  // បេ ស គ្រាប់ធំ ( 20kg ): ចំនួន: 1
  for (const item of totalItems.values()) {
    lines.push(`${escapeHtml(item.name)}: ចំនួន: ${escapeHtml(formatQty(item.qty))}`);
  }

  lines.push(""); // blank line

  // Customer lines
  for (const customer of customers.values()) {
    // Items for customer: បេ ស គ្រាប់ធំ ( 20kg ) ចំនួន: 1
    const itemsStr = [...customer.items.values()]
      .map((item) => `${escapeHtml(item.name)} ចំនួន: ${escapeHtml(formatQty(item.qty))}`)
      .join(" + ");
    // -សុ គា ត្រែងត្រយឹង: បេ ស គ្រាប់ធំ ( 20kg ) ចំនួន: 1
    lines.push(`-${escapeHtml(customer.name)}: ${itemsStr}`);
  }

  return lines.join("\n");
}

async function sendMessage(text, chatId) {
  const token = getBotToken();
  const targetChatId = String(chatId || "").trim();
  if (!token || !targetChatId) {
    throw new BadRequestError(NOTIFY_FAILURE_MESSAGE);
  }

  const url = `${TELEGRAM_API_BASE}/bot${token}/sendMessage`;

  let response;
  try {
    response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: targetChatId,
        text,
        parse_mode: "HTML",
      }),
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
  } catch (err) {
    logError("Telegram sendMessage network error", {
      message: err?.message || String(err),
      chatId: targetChatId,
    });
    throw new BadRequestError(NOTIFY_FAILURE_MESSAGE);
  }

  let body;
  try {
    body = await response.json();
  } catch (err) {
    logError("Telegram sendMessage invalid JSON response", {
      status: response.status,
      message: err?.message || String(err),
      chatId: targetChatId,
    });
    throw new BadRequestError(NOTIFY_FAILURE_MESSAGE);
  }

  if (!response.ok || !body?.ok) {
    logError("Telegram sendMessage API error", {
      status: response.status,
      description: body?.description,
      errorCode: body?.error_code,
      chatId: targetChatId,
    });
    throw new BadRequestError(NOTIFY_FAILURE_MESSAGE);
  }

  return body;
}

async function notifyOrderSentToFactory(orderOrOrders, user) {
  if (!isFactoryTelegramConfigured()) {
    logError("Telegram not configured for factory notification", {
      orderId: normalizeOrders(orderOrOrders)[0]?.id,
    });
    throw new BadRequestError(NOTIFY_FAILURE_MESSAGE);
  }

  const text = formatOrderSentToFactoryMessage(orderOrOrders, user);
  await sendMessage(text, getFactoryChatId());
}

function formatOrderDeliveredMessage(order, { deliveredQty, lossQty } = {}) {
  const driverName = order?.deliveryAgentName || "—";
  const customerName = order?.customerName || "—";
  const itemName = order?.itemName || "—";
  const orderedQty = order?.orderedQty;

  const lines = [
    `${escapeHtml(formatDateTime())}: ${escapeHtml(driverName)}`,
    "",
    "-បានដឹកជញ្ជូន",
    `អតិថិជន៖ ${escapeHtml(customerName)} | ផលិតផល៖ ${escapeHtml(itemName)}`,
    `បញ្ជាទិញ៖ ${escapeHtml(formatQty(orderedQty))} | បានដឹកជញ្ជូន៖ ${escapeHtml(formatQty(deliveredQty))} | បាត់បង់៖ ${escapeHtml(formatQty(lossQty))}`,
  ];

  return lines.join("\n");
}

/**
 * Soft-fail: logs and returns on missing config or send errors so delivery confirm is not blocked.
 */
async function notifyOrderDelivered(order, { deliveredQty, lossQty } = {}) {
  if (!isDeliveredTelegramConfigured()) {
    logError("Telegram not configured for delivered notification", {
      orderId: order?.id,
    });
    return;
  }

  try {
    const text = formatOrderDeliveredMessage(order, { deliveredQty, lossQty });
    await sendMessage(text, getDeliveredChatId());
  } catch (err) {
    logError("Telegram delivered notification failed", {
      orderId: order?.id,
      message: err?.message || String(err),
    });
  }
}

module.exports = {
  isTelegramConfigured,
  isFactoryTelegramConfigured,
  isDeliveredTelegramConfigured,
  formatOrderSentToFactoryMessage,
  formatOrderDeliveredMessage,
  sendMessage,
  notifyOrderSentToFactory,
  notifyOrderDelivered,
};
