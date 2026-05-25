const orderRoutes = require("../orderRoutes");
const paymentRoutes = require("../paymentRoutes");
const customerRoutes = require("../customerRoutes");
const borrowMaterialRoutes = require("../borrowMaterialRoutes");
const customerBorrowedMaterialRoutes = require("../customerBorrowedMaterialRoutes");
const borrowMaterialLoanRoutes = require("../borrowMaterialLoanRoutes");

module.exports = [
  orderRoutes,
  paymentRoutes,
  customerRoutes,
  borrowMaterialRoutes,
  customerBorrowedMaterialRoutes,
  borrowMaterialLoanRoutes,
];
