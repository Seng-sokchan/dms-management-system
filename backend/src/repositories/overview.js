const { getPool } = require("../../database/pool");
const { listOrderStatuses } = require("./lookups");
const V = require("./sql/readViews");

async function getDashboardSummary() {
  const statusDefinitions = await listOrderStatuses();
  const [statusRows] = await getPool().query(`SELECT * FROM ${V.DASHBOARD_STATUS_SUMMARY}`);
  const [totalsRows] = await getPool().query(`SELECT * FROM ${V.DASHBOARD_TOTALS}`);
  const [currencyTotalsRows] = await getPool().query(`SELECT * FROM ${V.DASHBOARD_CURRENCY_TOTALS}`);

  const statusSummary = statusDefinitions.reduce((acc, row) => ({ ...acc, [row.name]: 0 }), {});
  statusRows.forEach((row) => {
    statusSummary[row.status] = Number(row.total);
  });

  const totals = totalsRows[0] || {};
  const currencyTotals = currencyTotalsRows[0] || {};
  const totalRevenueUsd = Number(currencyTotals.total_revenue_usd || 0);
  const totalCollectedUsd = Number(currencyTotals.total_collected_usd || 0);
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
      totalOrderedQty: Number(totals.totalOrderedQty || 0),
      totalDeliveredQty: Number(totals.totalDeliveredQty || 0),
      totalLossQty: Number(totals.totalLossQty || 0),
      totalRemainingQty: Number(totals.totalRemainingQty || 0),
    },
    statusSummary,
  };
}

module.exports = {
  getDashboardSummary,
};
