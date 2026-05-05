const orderRoutes = require("../orderRoutes");
const customerRoutes = require("../customerRoutes");
const borrowMaterialRoutes = require("../borrowMaterialRoutes");
const customerBorrowedMaterialRoutes = require("../customerBorrowedMaterialRoutes");
const borrowMaterialLoanRoutes = require("../borrowMaterialLoanRoutes");

module.exports = [
  orderRoutes,
  customerRoutes,
  borrowMaterialRoutes,
  customerBorrowedMaterialRoutes,
  borrowMaterialLoanRoutes,
];
