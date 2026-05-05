const express = require("express");
const healthRoutes = require("./healthRoutes");
const authRoutes = require("./authRoutes");
const masterDataRoutes = require("./groups/masterDataRoutes");
const opsRoutes = require("./groups/opsRoutes");
const adminRoutes = require("./groups/adminRoutes");

const router = express.Router();

router.use(healthRoutes);
router.use(authRoutes);
for (const routes of masterDataRoutes) router.use(routes);
for (const routes of opsRoutes) router.use(routes);
for (const routes of adminRoutes) router.use(routes);

module.exports = router;
