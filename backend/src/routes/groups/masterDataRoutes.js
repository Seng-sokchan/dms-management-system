const catalogRoutes = require("../catalogRoutes");
const itemRoutes = require("../itemRoutes");
const producerRoutes = require("../producerRoutes");
const deliveryRoutes = require("../deliveryRoutes");
const depotRoutes = require("../depotRoutes");
const customerItemPriceRoutes = require("../customerItemPriceRoutes");
const depotItemPriceRoutes = require("../depotItemPriceRoutes");

module.exports = [
  catalogRoutes,
  itemRoutes,
  producerRoutes,
  deliveryRoutes,
  depotRoutes,
  customerItemPriceRoutes,
  depotItemPriceRoutes,
];
