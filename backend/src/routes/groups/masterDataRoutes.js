const catalogRoutes = require("../catalogRoutes");
const itemRoutes = require("../itemRoutes");
const producerRoutes = require("../producerRoutes");
const deliveryRoutes = require("../deliveryRoutes");
const truckRoutes = require("../truckRoutes");
const addressRoutes = require("../addressRoutes");
const depotRoutes = require("../depotRoutes");

module.exports = [
  catalogRoutes,
  itemRoutes,
  producerRoutes,
  deliveryRoutes,
  truckRoutes,
  addressRoutes,
  depotRoutes,
];
