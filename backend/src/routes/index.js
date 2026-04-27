const express = require("express");
const healthRoutes = require("./healthRoutes");
const authRoutes = require("./authRoutes");
const producerRoutes = require("./producerRoutes");
const customerRoutes = require("./customerRoutes");
const addressRoutes = require("./addressRoutes");
const deliveryRoutes = require("./deliveryRoutes");
const truckRoutes = require("./truckRoutes");
const orderRoutes = require("./orderRoutes");
const paymentRoutes = require("./paymentRoutes");
const catalogRoutes = require("./catalogRoutes");
const itemRoutes = require("./itemRoutes");
const userManagementRoutes = require("./userManagementRoutes");
const roleMenuRoutes = require("./roleMenuRoutes");
const activityLogRoutes = require("./activityLogRoutes");

const router = express.Router();

router.use(healthRoutes);
router.use(authRoutes);
router.use(producerRoutes);
router.use(customerRoutes);
router.use(addressRoutes);
router.use(deliveryRoutes);
router.use(truckRoutes);
router.use(catalogRoutes);
router.use(itemRoutes);
router.use(userManagementRoutes);
router.use(roleMenuRoutes);
router.use(activityLogRoutes);
router.use(orderRoutes);
router.use(paymentRoutes);

module.exports = router;
