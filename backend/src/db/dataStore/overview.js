const { getPool } = require("../pool");
const { PAYMENT_STATUS } = require("../../constants");
const { listOrderStatuses } = require("./lookups");
const { unwrapProcedureRows } = require("./unwrap");

async function getDashboardSummary() {
  const statusDefinitions = await listOrderStatuses();
  const [statusRows] = await getPool().query(
    `SELECT s.name AS status, COUNT(*) AS total
     FROM orders o
     INNER JOIN status s ON s.id = o.status
     GROUP BY s.name`,
  );
  const [paymentRows] = await getPool().query(
    `SELECT ps.name AS payment_status, COUNT(*) AS total
     FROM orders o
     INNER JOIN payment_statuses ps ON ps.id = o.payment_status
     GROUP BY ps.name`,
  );
  const [totalsRowsRaw] = await getPool().query("CALL sp_dashboard_totals()");
  const totalsRows = unwrapProcedureRows(totalsRowsRaw);

  const statusSummary = statusDefinitions.reduce((acc, row) => ({ ...acc, [row.name]: 0 }), {});
  statusRows.forEach((row) => { statusSummary[row.status] = Number(row.total); });
  const paymentSummary = PAYMENT_STATUS.reduce((acc, status) => ({ ...acc, [status]: 0 }), {});
  paymentRows.forEach((row) => { paymentSummary[row.payment_status] = Number(row.total); });

  const totals = totalsRows[0] || {};
  return {
    totals: {
      orders: Number(totals.orders || 0),
      producers: Number(totals.producers || 0),
      deliveryAgents: Number(totals.deliveryAgents || 0),
      payments: Number(totals.payments || 0),
      totalRevenue: Number(totals.totalRevenue || 0),
      totalCollected: Number(totals.totalCollected || 0),
      outstandingBalance: Number(totals.totalRevenue || 0) - Number(totals.totalCollected || 0),
      totalDiscrepancy: Number(totals.totalDiscrepancy || 0),
      totalLossQty: Number(totals.totalLossQty || 0),
      totalRemainingQty: Number(totals.totalRemainingQty || 0),
    },
    statusSummary,
    paymentSummary,
  };
}

module.exports = {
  getDashboardSummary,
};
