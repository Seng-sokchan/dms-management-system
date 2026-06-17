const orderRoutes = require("./ops/orderRoutes");
const paymentRoutes = require("./ops/paymentRoutes");
const customerRoutes = require("./ops/customerRoutes");
const borrowMaterialRoutes = require("./ops/borrowMaterialRoutes");
const customerBorrowedMaterialRoutes = require("./ops/customerBorrowedMaterialRoutes");
const borrowMaterialLoanRoutes = require("./ops/borrowMaterialLoanRoutes");

module.exports = [
  orderRoutes,
  paymentRoutes,
  customerRoutes,
  borrowMaterialRoutes,
  customerBorrowedMaterialRoutes,
  borrowMaterialLoanRoutes,
];
