const userDomain = require("./domain/userDomain");
const masterDataDomain = require("./domain/masterDataDomain");
const customerDomain = require("./domain/customerDomain");
const orderDomain = require("./domain/orderDomain");

module.exports = {
  ...userDomain,
  ...masterDataDomain,
  ...customerDomain,
  ...orderDomain,
};
