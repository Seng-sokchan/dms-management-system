const express = require("express");
const healthRoutes = require("./healthRoutes");
const authRoutes = require("./authRoutes");
const producerRoutes = require("./producerRoutes");
const customerRoutes = require("./customerRoutes");
const depotRoutes = require("./depotRoutes");
const addressRoutes = require("./addressRoutes");
const deliveryRoutes = require("./deliveryRoutes");
const truckRoutes = require("./truckRoutes");
const orderRoutes = require("./orderRoutes");
const catalogRoutes = require("./catalogRoutes");
const itemRoutes = require("./itemRoutes");
const userManagementRoutes = require("./userManagementRoutes");
const roleMenuRoutes = require("./roleMenuRoutes");
const activityLogRoutes = require("./activityLogRoutes");
const borrowMaterialRoutes = require("./borrowMaterialRoutes");
const customerBorrowedMaterialRoutes = require("./customerBorrowedMaterialRoutes");

const router = express.Router();

router.use(healthRoutes);
router.use(authRoutes);
router.use(producerRoutes);
router.use(customerRoutes);
router.use(depotRoutes);
router.use(addressRoutes);
router.use(deliveryRoutes);
router.use(truckRoutes);
router.use(catalogRoutes);
router.use(itemRoutes);
router.use(userManagementRoutes);
router.use(roleMenuRoutes);
router.use(activityLogRoutes);
router.use(borrowMaterialRoutes);
router.use(customerBorrowedMaterialRoutes);
router.use(orderRoutes);

module.exports = router;
