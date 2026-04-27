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
  const [currencyTotalsRows] = await getPool().query(
    `SELECT
       COALESCE(SUM(o.ordered_qty * i.default_unit_price_khr), 0) AS total_revenue_khr,
       COALESCE(
         SUM(
           CASE
             WHEN o.amount_total > 0 THEN (o.amount_paid / o.amount_total) * (o.ordered_qty * i.default_unit_price_khr)
             ELSE 0
           END
         ),
         0
       ) AS total_collected_khr
     FROM orders o
     INNER JOIN items i ON i.id = o.item_id`,
  );

  const statusSummary = statusDefinitions.reduce((acc, row) => ({ ...acc, [row.name]: 0 }), {});
  statusRows.forEach((row) => { statusSummary[row.status] = Number(row.total); });
  const paymentSummary = PAYMENT_STATUS.reduce((acc, status) => ({ ...acc, [status]: 0 }), {});
  paymentRows.forEach((row) => { paymentSummary[row.payment_status] = Number(row.total); });

  const totals = totalsRows[0] || {};
  const currencyTotals = currencyTotalsRows[0] || {};
  const totalRevenueUsd = Number(totals.totalRevenue || 0);
  const totalCollectedUsd = Number(totals.totalCollected || 0);
  const outstandingUsd = totalRevenueUsd - totalCollectedUsd;
  const totalRevenueKhr = Number(currencyTotals.total_revenue_khr || 0);
  const totalCollectedKhr = Number(currencyTotals.total_collected_khr || 0);
  const outstandingKhr = totalRevenueKhr - totalCollectedKhr;

  return {
    totals: {
      orders: Number(totals.orders || 0),
      producers: Number(totals.producers || 0),
      deliveryAgents: Number(totals.deliveryAgents || 0),
      payments: Number(totals.payments || 0),
      totalRevenue: totalRevenueUsd,
      totalCollected: totalCollectedUsd,
      outstandingBalance: outstandingUsd,
      totalRevenueKhr,
      totalCollectedKhr,
      outstandingBalanceKhr: outstandingKhr,
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
