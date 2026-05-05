const { getDashboardSummary } = require("../overview");
const {
  listOrders,
  getOrderById,
  createOrder,
  updateOrderAssignment,
  updateOrderStatus,
  confirmOrderDelivery,
  deleteOrder,
} = require("../orders");

module.exports = {
  getDashboardSummary,
  listOrders,
  getOrderById,
  createOrder,
  updateOrderAssignment,
  updateOrderStatus,
  confirmOrderDelivery,
  deleteOrder,
};
