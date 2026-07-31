export function localDateKey(date) {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-");
}

function addLocalDays(date, days) {
  const next = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  next.setDate(next.getDate() + days);
  return next;
}

export function getLocalDayDate(day = "today") {
  const today = new Date();
  if (day === "yesterday") return addLocalDays(today, -1);
  return addLocalDays(today, 0);
}

/** True when created_at is on the given local calendar day (Date or YYYY-MM-DD). */
export function isCreatedOnLocalDay(createdAt, dayDate) {
  if (createdAt == null || createdAt === "") return false;
  const targetKey =
    typeof dayDate === "string" ? dayDate : localDateKey(dayDate instanceof Date ? dayDate : new Date());
  const raw = String(createdAt).trim();
  const datePart = raw.slice(0, 10);
  if (/^\d{4}-\d{2}-\d{2}$/.test(datePart)) {
    return datePart === targetKey;
  }
  const parsed = new Date(raw);
  if (Number.isNaN(parsed.getTime())) return false;
  return localDateKey(parsed) === targetKey;
}

/** True when created_at is on the user's local calendar day. */
export function isCreatedToday(createdAt) {
  return isCreatedOnLocalDay(createdAt, getLocalDayDate("today"));
}

export function isCreatedYesterday(createdAt) {
  return isCreatedOnLocalDay(createdAt, getLocalDayDate("yesterday"));
}

export function filterOrdersCreatedToday(orders) {
  return (orders || []).filter((order) => isCreatedToday(order.createdAt));
}

export function filterOrdersCreatedYesterday(orders) {
  return (orders || []).filter((order) => isCreatedYesterday(order.createdAt));
}

/** @param {"today"|"yesterday"} day */
export function filterOrdersByDay(orders, day = "today") {
  if (day === "yesterday") return filterOrdersCreatedYesterday(orders);
  return filterOrdersCreatedToday(orders);
}

export function formatTodayLabel() {
  return formatDayLabel(getLocalDayDate("today"));
}

export function formatDayLabel(dayOrDate = "today") {
  const date =
    dayOrDate instanceof Date
      ? dayOrDate
      : dayOrDate === "yesterday"
        ? getLocalDayDate("yesterday")
        : getLocalDayDate("today");
  return date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function buildAgentLookup(deliveryAgents) {
  const map = new Map();
  (deliveryAgents || []).forEach((a) => {
    if (a?.id != null) map.set(String(a.id), a);
  });
  return map;
}

export function getCustomerLabelForCopy(order, dash) {
  const name =
    order.customerName != null && String(order.customerName).trim() !== ""
      ? String(order.customerName).trim()
      : null;
  return name || dash;
}

export function getCustomerLabel(order, dash) {
  const fromDirectory =
    order.customerDirectoryName != null && String(order.customerDirectoryName).trim() !== ""
      ? String(order.customerDirectoryName).trim()
      : null;
  if (fromDirectory) return fromDirectory;
  return getCustomerLabelForCopy(order, dash);
}

export function getCustomerKey(order, dash) {
  if (order.customerId != null && String(order.customerId).trim() !== "") {
    return `id:${order.customerId}`;
  }
  return `name:${getCustomerLabel(order, dash)}`;
}

/**
 * Pivot orders into one row per customer with item names as columns.
 * @param {Map<string, { depotName?: string }>|Record<string, { depotName?: string }>|null} [customersById]
 * @returns {{ itemColumns: string[], rows: Array<{ customerKey: string, customerLabel: string, depotName: string, qtyByItem: Record<string, number> }> }}
 */
export function pivotOrdersByCustomer(orders, dash, customersById = null) {
  const itemSet = new Set();
  const rowMap = new Map();
  const lookup =
    customersById instanceof Map
      ? customersById
      : customersById && typeof customersById === "object"
        ? new Map(Object.entries(customersById))
        : null;

  for (const order of orders || []) {
    const itemName = order.itemName != null ? String(order.itemName).trim() : "";
    if (itemName) {
      itemSet.add(itemName);
    }

    const customerKey = getCustomerKey(order, dash);
    if (!rowMap.has(customerKey)) {
      const customerId =
        order.customerId != null && String(order.customerId).trim() !== ""
          ? String(order.customerId)
          : "";
      const customer = customerId && lookup ? lookup.get(customerId) : null;
      const depotName =
        customer?.depotName != null && String(customer.depotName).trim() !== ""
          ? String(customer.depotName).trim()
          : "";
      rowMap.set(customerKey, {
        customerKey,
        customerLabel: getCustomerLabel(order, dash),
        depotName,
        qtyByItem: {},
      });
    }

    if (!itemName) continue;
    const row = rowMap.get(customerKey);
    const qty = Number(order.orderedQty || 0);
    row.qtyByItem[itemName] = (row.qtyByItem[itemName] || 0) + qty;
  }

  const itemColumns = Array.from(itemSet).sort((a, b) => a.localeCompare(b));
  const rows = Array.from(rowMap.values()).sort((a, b) =>
    a.customerLabel.localeCompare(b.customerLabel),
  );

  return { itemColumns, rows };
}

export function sumRowQty(row, itemColumns) {
  return itemColumns.reduce((sum, item) => sum + Number(row.qtyByItem[item] || 0), 0);
}

export function computePivotTotals(rows, itemColumns) {
  const totalsByItem = Object.fromEntries(itemColumns.map((item) => [item, 0]));
  let grandTotal = 0;
  for (const row of rows || []) {
    for (const item of itemColumns) {
      const qty = Number(row.qtyByItem[item] || 0);
      totalsByItem[item] += qty;
      grandTotal += qty;
    }
  }
  return { totalsByItem, grandTotal };
}

/**
 * Clipboard:
 * {date}: {driver}
 * {Total amount}: {order qty sum}
 * -{customer}: {item qty summary}
 */
export function formatTruckCopyText(truckRow, dash, locale, totalAmountLabel = "Total amount") {
  const dateStr = new Date().toLocaleString(locale || undefined, {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const driver = truckRow.truckLabel || dash;
  const rows = truckRow.rows || [];

  const totalQty = rows.reduce((sum, order) => sum + Number(order.orderedQty || 0), 0);

  const lines = [
    `${dateStr}: ${driver}`,
    `${totalAmountLabel}: ${totalQty}`,
    "",
  ];

  const byCustomerAddress = new Map();
  for (const order of rows) {
    const customerAddr = getCustomerLabelForCopy(order, dash);
    if (!byCustomerAddress.has(customerAddr)) byCustomerAddress.set(customerAddr, []);
    byCustomerAddress.get(customerAddr).push(order);
  }

  for (const [custAddr, addrOrders] of byCustomerAddress) {
    const itemStrs = addrOrders.map((order) => {
      const itemName = (order.itemName || dash).trim();
      const qty = Number(order.orderedQty || 0);
      return `${itemName} ចំនួន: ${qty}`;
    });
    lines.push(`-${custAddr}: ${itemStrs.join(" + ")}`);
  }

  return lines.join("\n");
}

export async function copyTextToClipboard(text) {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
    return;
  }
  const ta = document.createElement("textarea");
  ta.value = text;
  ta.setAttribute("readonly", "");
  ta.style.position = "fixed";
  ta.style.left = "-9999px";
  document.body.appendChild(ta);
  ta.select();
  document.execCommand("copy");
  document.body.removeChild(ta);
}
