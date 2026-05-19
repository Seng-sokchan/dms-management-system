const catalogRoutes = require("../catalogRoutes");
const itemRoutes = require("../itemRoutes");
const producerRoutes = require("../producerRoutes");
const deliveryRoutes = require("../deliveryRoutes");
const provinceRoutes = require("../provinceRoutes");
const depotRoutes = require("../depotRoutes");
const customerItemPriceRoutes = require("../customerItemPriceRoutes");
const depotItemPriceRoutes = require("../depotItemPriceRoutes");

module.exports = [
  catalogRoutes,
  itemRoutes,
  producerRoutes,
  deliveryRoutes,
  provinceRoutes,
  depotRoutes,
  customerItemPriceRoutes,
  depotItemPriceRoutes,
];
