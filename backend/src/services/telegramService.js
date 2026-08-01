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

/** Compact date for factory message: 1.8.2026 */
function formatFactoryDate(date = new Date()) {
  return `${date.getDate()}.${date.getMonth() + 1}.${date.getFullYear()}`;
}

function formatQty(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return String(value ?? "—");
  return n.toLocaleString("en-US");
}

/** Display-only short names for Telegram (does not affect DB). */
const ITEM_SHORTCUT_NAMES = {
  1: "តូច",
  2: "ធំ",
  3: "តូច ស",
  4: "ធំ ស",
};

function getItemDisplayName(itemId, fallbackName) {
  const id = Number(itemId);
  if (Number.isFinite(id) && ITEM_SHORTCUT_NAMES[id]) {
    return ITEM_SHORTCUT_NAMES[id];
  }
  return fallbackName || "—";
}

function normalizeOrders(orderOrOrders) {
  if (Array.isArray(orderOrOrders)) return orderOrOrders.filter(Boolean);
  return orderOrOrders ? [orderOrOrders] : [];
}

function addItemQty(items, itemKey, itemName, orderedQty, itemId = null) {
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
    id: itemId,
    name: itemName,
    qty: orderedQty,
  });
}

function itemsSortedById(items) {
  return [...items.values()].sort((a, b) => {
    const aId = Number(a.id);
    const bId = Number(b.id);
    const aHasId = Number.isFinite(aId);
    const bHasId = Number.isFinite(bId);
    if (aHasId && bHasId && aId !== bId) return aId - bId;
    if (aHasId && !bHasId) return -1;
    if (!aHasId && bHasId) return 1;
    return String(a.name || "").localeCompare(String(b.name || ""), undefined, {
      sensitivity: "base",
    });
  });
}

function formatItemQtyPairs(items, { joiner = "+" } = {}) {
  return itemsSortedById(items)
    .map((item) => `${escapeHtml(item.name)} ${escapeHtml(formatQty(item.qty))}`)
    .join(joiner);
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

function getOrderProvinceKey(order) {
  const id =
    order?.customerProvinceId ??
    order?.provinceId ??
    order?.customer_province_id ??
    order?.province_id ??
    null;
  if (id != null && String(id).trim() !== "") return String(id);
  return getOrderProvinceName(order);
}

function getOrderCustomerPriority(order) {
  const raw =
    order?.customerPriority ??
    order?.customer_priority ??
    order?.priority ??
    null;
  if (raw == null || raw === "") return null;
  const n = Number(raw);
  return Number.isFinite(n) ? n : null;
}

function compareCustomersByProvincePriority(a, b) {
  const provinceCmp = String(a.provinceName || a.provinceKey || "").localeCompare(
    String(b.provinceName || b.provinceKey || ""),
    undefined,
    { sensitivity: "base" },
  );
  if (provinceCmp !== 0) return provinceCmp;

  const aPrio = a.priority;
  const bPrio = b.priority;
  if (aPrio != null && bPrio != null && aPrio !== bPrio) return aPrio - bPrio;
  if (aPrio != null && bPrio == null) return -1;
  if (aPrio == null && bPrio != null) return 1;

  return String(a.name || "").localeCompare(String(b.name || ""), undefined, {
    sensitivity: "base",
  });
}

function formatOrderSentToFactoryMessage(orderOrOrders) {
  const orders = normalizeOrders(orderOrOrders);
  const firstOrder = orders[0] || {};
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
        id: order.customerId != null && order.customerId !== "" ? Number(order.customerId) : null,
        name: order.customerName || "—",
        provinceKey: getOrderProvinceKey(order),
        provinceName: getOrderProvinceName(order),
        priority: getOrderCustomerPriority(order),
        items: new Map(),
      });
    }

    const customer = customers.get(customerKey);
    if (customer.priority == null) {
      customer.priority = getOrderCustomerPriority(order);
    }
    if (!customer.provinceName) {
      customer.provinceName = getOrderProvinceName(order);
      customer.provinceKey = getOrderProvinceKey(order);
    }

    const itemId =
      order.itemId != null && order.itemId !== "" ? Number(order.itemId) : null;
    const itemName = getItemDisplayName(order.itemId, order.itemName);
    const itemKey = order.itemId || itemName;

    addItemQty(customer.items, itemKey, itemName, order.orderedQty, itemId);
    addItemQty(totalItems, itemKey, itemName, order.orderedQty, itemId);

    const qty = Number(order.orderedQty);
    if (Number.isFinite(qty) && qty > 0) {
      totalOrderQty += qty;
    }
  }

  const customersSortedByPriority = [...customers.values()].sort(
    compareCustomersByProvincePriority,
  );

  // 1.8.2026 ចេង ពិសិដ្ឋ ឡានកំពង់ស្ពឺ
  const lines = [];
  lines.push(
    `${escapeHtml(formatFactoryDate())} ${escapeHtml(driverName)} ឡាន${escapeHtml(provinceName)}`,
  );
  lines.push("");

  // -សរុប 420
  // +តូច 345
  // +ធំ 65
  lines.push(`-សរុប ${escapeHtml(formatQty(totalOrderQty))}`);
  for (const item of itemsSortedById(totalItems)) {
    lines.push(
      `+${escapeHtml(item.name)} ${escapeHtml(formatQty(item.qty))}`,
    );
  }

  lines.push("");
  lines.push("");

  // -ចន្ថា តូច 135+ធំ 5
  let lastProvinceKey = null;
  for (const customer of customersSortedByPriority) {
    const provinceKey = customer.provinceKey || customer.provinceName || "";
    if (lastProvinceKey != null && provinceKey !== lastProvinceKey) {
      lines.push("");
    }
    lastProvinceKey = provinceKey;

    const itemsStr = formatItemQtyPairs(customer.items);
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
  const itemName = getItemDisplayName(order?.itemId, order?.itemName);
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
