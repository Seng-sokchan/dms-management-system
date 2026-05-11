const catalogRoutes = require("../catalogRoutes");
const itemRoutes = require("../itemRoutes");
const producerRoutes = require("../producerRoutes");
const deliveryRoutes = require("../deliveryRoutes");
const addressRoutes = require("../addressRoutes");
const depotRoutes = require("../depotRoutes");
const customerItemPriceRoutes = require("../customerItemPriceRoutes");

module.exports = [
  catalogRoutes,
  itemRoutes,
  producerRoutes,
  deliveryRoutes,
  addressRoutes,
  depotRoutes,
  customerItemPriceRoutes,
];
