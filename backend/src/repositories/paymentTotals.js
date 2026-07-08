const { getPool } = require("../../database/pool");

const BASE_BY_CUSTOMER = `
  SELECT od.customer_id AS customer_id, c.name AS customer_name, c.depot_id AS depot_id, od.currency AS currency,
         COUNT(*) AS order_count, SUM(od.amount_total) AS total_amount
  FROM order_details od
  INNER JOIN customers c ON c.id = od.customer_id AND c.is_active = 1
`;

const BASE_BY_DEPOT = `
  SELECT d.id AS depot_id, d.name AS depot_name, od.currency AS currency,
         COUNT(*) AS order_count, SUM(od.amount_total) AS total_amount
  FROM order_details od
  INNER JOIN customers c ON c.id = od.customer_id AND c.is_active = 1
  INNER JOIN depots d ON d.id = c.depot_id AND d.is_active = 1
`;

function mapCustomerRow(row) {
  return {
    customerId: String(row.customer_id),
    customerName: row.customer_name,
    depotId: row.depot_id == null ? null : String(row.depot_id),
    currency: row.currency || "KHR",
    orderCount: Number(row.order_count || 0),
    totalAmount: Number(row.total_amount),
  };
}

function mapDepotRow(row) {
  return {
    depotId: String(row.depot_id),
    depotName: row.depot_name,
    currency: row.currency || "KHR",
    orderCount: Number(row.order_count || 0),
    totalAmount: Number(row.total_amount),
  };
}

async function listTotalsByCustomerAll() {
  const sql = `${BASE_BY_CUSTOMER}
  GROUP BY od.customer_id, c.name, c.depot_id, od.currency
  ORDER BY c.name ASC, od.currency ASC`;
  const [rows] = await getPool().query(sql);
  return rows.map(mapCustomerRow);
}

async function listTotalsByCustomerForDepot(depotId) {
  const sql = `${BASE_BY_CUSTOMER}
  WHERE c.depot_id = ?
  GROUP BY od.customer_id, c.name, c.depot_id, od.currency
  ORDER BY c.name ASC, od.currency ASC`;
  const [rows] = await getPool().query(sql, [depotId]);
  return rows.map(mapCustomerRow);
}

async function listTotalsByDepotAll() {
  const sql = `${BASE_BY_DEPOT}
  GROUP BY d.id, d.name, od.currency
  ORDER BY d.name ASC, od.currency ASC`;
  const [rows] = await getPool().query(sql);
  return rows.map(mapDepotRow);
}

async function listTotalsByDepotForDepot(depotId) {
  const sql = `${BASE_BY_DEPOT}
  WHERE d.id = ?
  GROUP BY d.id, d.name, od.currency
  ORDER BY d.name ASC, od.currency ASC`;
  const [rows] = await getPool().query(sql, [depotId]);
  return rows.map(mapDepotRow);
}

module.exports = {
  listTotalsByCustomerAll,
  listTotalsByCustomerForDepot,
  listTotalsByDepotAll,
  listTotalsByDepotForDepot,
};
