const catalogRoutes = require("./masterData/catalogRoutes");
const itemRoutes = require("./masterData/itemRoutes");
const producerRoutes = require("./masterData/producerRoutes");
const deliveryRoutes = require("./masterData/deliveryRoutes");
const provinceRoutes = require("./masterData/provinceRoutes");
const depotRoutes = require("./masterData/depotRoutes");
const customerItemPriceRoutes = require("./masterData/customerItemPriceRoutes");
const depotItemPriceRoutes = require("./masterData/depotItemPriceRoutes");

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
