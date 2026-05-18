/**
 * Telegram Bot API notifications for factory alerts.
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

function getChatId() {
  return String(process.env.TELEGRAM_CHAT_ID || "").trim();
}

function isTelegramConfigured() {
  return Boolean(getBotToken() && getChatId());
}

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function formatMoney(amount, currency) {
  const n = Number(amount);
  const cur = escapeHtml(currency || "KHR");
  if (!Number.isFinite(n)) return cur;
  return `${n.toLocaleString("en-US")} ${cur}`;
}

function formatOrderSentToFactoryMessage(order, user) {
  const customerLine = order.customerPhone
    ? `${escapeHtml(order.customerName || "—")} (${escapeHtml(order.customerPhone)})`
    : escapeHtml(order.customerName || "—");

  const itemLabel = order.itemSku
    ? `${escapeHtml(order.itemName || "—")} [${escapeHtml(order.itemSku)}]`
    : escapeHtml(order.itemName || "—");

  const submittedBy = user?.name
    ? `${escapeHtml(user.name)} (${escapeHtml(user.role || "—")})`
    : escapeHtml(user?.username || "—");

  const lines = [
    "<b>New order sent to factory</b>",
    "",
    `Order: <b>#${escapeHtml(order.id)}</b>`,
    `Customer: ${customerLine}`,
    `Item: ${itemLabel} x${escapeHtml(order.orderedQty)}`,
    `Total: ${formatMoney(order.amountTotal, order.currency)}`,
    `Delivery: ${escapeHtml(order.deliveryAgentName || "—")}`,
    `Group: ${escapeHtml(order.orderGroupName || "—")}`,
    `Submitted by: ${submittedBy}`,
  ];

  return lines.join("\n");
}

async function sendMessage(text) {
  const token = getBotToken();
  const chatId = getChatId();
  const url = `${TELEGRAM_API_BASE}/bot${token}/sendMessage`;

  let response;
  try {
    response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: "HTML",
      }),
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
  } catch (err) {
    logError("Telegram sendMessage network error", {
      message: err?.message || String(err),
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
    });
    throw new BadRequestError(NOTIFY_FAILURE_MESSAGE);
  }

  if (!response.ok || !body?.ok) {
    logError("Telegram sendMessage API error", {
      status: response.status,
      description: body?.description,
      errorCode: body?.error_code,
    });
    throw new BadRequestError(NOTIFY_FAILURE_MESSAGE);
  }

  return body;
}

async function notifyOrderSentToFactory(order, user) {
  if (!isTelegramConfigured()) {
    logError("Telegram not configured for factory notification", {
      orderId: order?.id,
    });
    throw new BadRequestError(NOTIFY_FAILURE_MESSAGE);
  }

  const text = formatOrderSentToFactoryMessage(order, user);
  await sendMessage(text);
}

module.exports = {
  isTelegramConfigured,
  formatOrderSentToFactoryMessage,
  sendMessage,
  notifyOrderSentToFactory,
};
