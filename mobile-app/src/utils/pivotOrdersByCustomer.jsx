/**
 * Pivot mobile orders into one row per customer with item names as columns.
 * @param {Array} orders
 * @returns {{
 *   itemColumns: string[],
 *   rows: Array<{
 *     customerKey: string,
 *     customerLabel: string,
 *     qtyByItem: Record<string, number>,
 *     orderIds: string[],
 *   }>,
 * }}
 */
export function pivotOrdersByCustomer(orders) {
  const itemSet = new Set();
  const rowMap = new Map();

  for (const order of orders || []) {
    const itemName = order.itemName != null ? String(order.itemName).trim() : "";
    if (itemName) {
      itemSet.add(itemName);
    }

    const customerKey =
      order.customerId != null && String(order.customerId).trim() !== ""
        ? `id:${order.customerId}`
        : `name:${order.customerName || order.id}`;

    if (!rowMap.has(customerKey)) {
      rowMap.set(customerKey, {
        customerKey,
        customerLabel: order.customerName || "—",
        qtyByItem: {},
        orderIds: [],
      });
    }

    const row = rowMap.get(customerKey);
    row.orderIds.push(String(order.id));

    if (!itemName) continue;
    const qty = Number(order.orderedQty || 0);
    row.qtyByItem[itemName] = (row.qtyByItem[itemName] || 0) + qty;
  }

  const itemColumns = Array.from(itemSet).sort((a, b) => a.localeCompare(b));
  const rows = Array.from(rowMap.values()).sort((a, b) =>
    a.customerLabel.localeCompare(b.customerLabel),
  );

  return { itemColumns, rows };
}

export function sumPivotRowQty(row, itemColumns) {
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
