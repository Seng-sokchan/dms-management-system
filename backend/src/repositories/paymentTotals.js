const { getPool } = require("../db/pool");

const BASE_BY_CUSTOMER = `
  SELECT o.customer_id AS customer_id, c.name AS customer_name, o.currency AS currency,
         COUNT(*) AS order_count, SUM(o.amount_total) AS total_amount
  FROM orders o
  INNER JOIN customers c ON c.id = o.customer_id AND c.is_active = 1
`;

const BASE_BY_DEPOT = `
  SELECT d.id AS depot_id, d.name AS depot_name, o.currency AS currency,
         COUNT(*) AS order_count, SUM(o.amount_total) AS total_amount
  FROM orders o
  INNER JOIN customers c ON c.id = o.customer_id AND c.is_active = 1
  INNER JOIN depots d ON d.id = c.depot_id AND d.is_active = 1
`;

function mapCustomerRow(row) {
  return {
    customerId: String(row.customer_id),
    customerName: row.customer_name,
    currency: row.currency || "USD",
    orderCount: Number(row.order_count || 0),
    totalAmount: Number(row.total_amount),
  };
}

function mapDepotRow(row) {
  return {
    depotId: String(row.depot_id),
    depotName: row.depot_name,
    currency: row.currency || "USD",
    orderCount: Number(row.order_count || 0),
    totalAmount: Number(row.total_amount),
  };
}

async function listTotalsByCustomerAll() {
  const sql = `${BASE_BY_CUSTOMER}
  GROUP BY o.customer_id, c.name, o.currency
  ORDER BY c.name ASC, o.currency ASC`;
  const [rows] = await getPool().query(sql);
  return rows.map(mapCustomerRow);
}

async function listTotalsByCustomerForDepot(depotId) {
  const sql = `${BASE_BY_CUSTOMER}
  WHERE c.depot_id = ?
  GROUP BY o.customer_id, c.name, o.currency
  ORDER BY c.name ASC, o.currency ASC`;
  const [rows] = await getPool().query(sql, [depotId]);
  return rows.map(mapCustomerRow);
}

async function listTotalsByCustomerForOwner(ownerUserId) {
  const sql = `${BASE_BY_CUSTOMER}
  LEFT JOIN depots d ON d.id = c.depot_id AND d.is_active = 1
  WHERE (c.depot_id IS NULL OR d.owner_user_id = ?)
  GROUP BY o.customer_id, c.name, o.currency
  ORDER BY c.name ASC, o.currency ASC`;
  const [rows] = await getPool().query(sql, [ownerUserId]);
  return rows.map(mapCustomerRow);
}

async function listTotalsByDepotAll() {
  const sql = `${BASE_BY_DEPOT}
  GROUP BY d.id, d.name, o.currency
  ORDER BY d.name ASC, o.currency ASC`;
  const [rows] = await getPool().query(sql);
  return rows.map(mapDepotRow);
}

async function listTotalsByDepotForOwner(ownerUserId) {
  const sql = `${BASE_BY_DEPOT}
  WHERE d.owner_user_id = ?
  GROUP BY d.id, d.name, o.currency
  ORDER BY d.name ASC, o.currency ASC`;
  const [rows] = await getPool().query(sql, [ownerUserId]);
  return rows.map(mapDepotRow);
}

async function listTotalsByDepotForDepot(depotId) {
  const sql = `${BASE_BY_DEPOT}
  WHERE d.id = ?
  GROUP BY d.id, d.name, o.currency
  ORDER BY d.name ASC, o.currency ASC`;
  const [rows] = await getPool().query(sql, [depotId]);
  return rows.map(mapDepotRow);
}

module.exports = {
  listTotalsByCustomerAll,
  listTotalsByCustomerForDepot,
  listTotalsByCustomerForOwner,
  listTotalsByDepotAll,
  listTotalsByDepotForOwner,
  listTotalsByDepotForDepot,
};
