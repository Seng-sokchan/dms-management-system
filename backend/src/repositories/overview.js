const { getPool } = require("../db/pool");
const { listOrderStatuses } = require("./lookups");
const { unwrapProcedureRows } = require("./unwrap");

async function getDashboardSummary() {
  const statusDefinitions = await listOrderStatuses();
  const [statusRowsRaw] = await getPool().query("CALL sp_list_dashboard_status_summary()");
  const statusRows = unwrapProcedureRows(statusRowsRaw);
  const [totalsRowsRaw] = await getPool().query("CALL sp_dashboard_totals()");
  const totalsRows = unwrapProcedureRows(totalsRowsRaw);
  const [currencyTotalsRaw] = await getPool().query("CALL sp_dashboard_currency_totals()");
  const currencyTotalsRows = unwrapProcedureRows(currencyTotalsRaw);

  const statusSummary = statusDefinitions.reduce((acc, row) => ({ ...acc, [row.name]: 0 }), {});
  statusRows.forEach((row) => {
    statusSummary[row.status] = Number(row.total);
  });

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
  };
}

module.exports = {
  getDashboardSummary,
};
