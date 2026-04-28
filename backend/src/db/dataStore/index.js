/**
 * Data access split by app menu / domain. Public API is unchanged: require("../db/dataStore") or require("../dataStore") from db/.
 */

// overview
const { getDashboardSummary } = require("./overview");

// users
const {
  listUsers,
  getUserByUsername,
  getUserById,
  createUser,
  updateUser,
  deactivateUser,
} = require("./users");

// users / admin — role & menu access
const {
  getRoleIdByName,
  listMenuKeysForRoleName,
  listRoleMenusMap,
  replaceRoleMenus,
} = require("./roleMenus");

// activityLogs
const { listUserActivityLogs, createUserActivityLog } = require("./activityLogs");
const { listAddresses } = require("./addresses");
const { listOrderGroups, getOrderGroupById } = require("./orderGroups");

// catalogs
const {
  listCatalogs,
  getCatalogById,
  createCatalog,
  updateCatalog,
  deleteCatalog,
} = require("./catalogs");

// items
const {
  listItems,
  getItemById,
  createItem,
  updateItem,
  deleteItem,
} = require("./items");

// customers
const {
  listCustomers,
  getCustomerById,
  getCustomerByUserId,
  createCustomer,
  updateCustomer,
  deleteCustomer,
} = require("./customers");

// producers
const {
  listProducers,
  getProducerById,
  createProducer,
  updateProducer,
  deleteProducer,
} = require("./producers");

// deliveryAgents
const {
  listDeliveryAgents,
  getDeliveryAgentById,
  createDeliveryAgent,
  updateDeliveryAgent,
  deleteDeliveryAgent,
} = require("./deliveryAgents");

// trucks
const {
  listTrucks,
  getTruckById,
  createTruck,
  updateTruck,
  deleteTruck,
} = require("./trucks");

// orders + shared lookup helpers (status list for dashboard / orders UI)
const { listOrderStatuses } = require("./lookups");
const {
  listOrders,
  getOrderById,
  createOrder,
  updateOrderAssignment,
  updateOrderStatus,
  confirmOrderDelivery,
  deleteOrder,
} = require("./orders");

// payments
const {
  listPayments,
  listPaymentMethods,
  createPayment,
  applyPaymentToOrder,
} = require("./payments");
const { getLatestBakongToken, insertBakongToken } = require("./bakongTokens");
const {
  getBakongTransactionByMd5,
  createBakongTransaction,
  updateBakongTransactionPaymentIdByMd5,
} = require("./bakongTransactions");

module.exports = {
  // select (list/report)
  listUsers,
  listCustomers,
  listProducers,
  listDeliveryAgents,
  listTrucks,
  listCatalogs,
  listItems,
  listAddresses,
  listOrderGroups,
  listOrderStatuses,
  listOrders,
  listPayments,
  listPaymentMethods,
  listUserActivityLogs,
  getDashboardSummary,

  // get (single/read)
  getUserByUsername,
  getUserById,
  listMenuKeysForRoleName,
  listRoleMenusMap,
  replaceRoleMenus,
  getCustomerById,
  getCustomerByUserId,
  getProducerById,
  getDeliveryAgentById,
  getTruckById,
  getCatalogById,
  getItemById,
  getOrderById,
  getOrderGroupById,

  // create
  createUser,
  createCustomer,
  createProducer,
  createDeliveryAgent,
  createTruck,
  createCatalog,
  createItem,
  createOrder,
  createPayment,
  createUserActivityLog,

  // update
  updateUser,
  updateCustomer,
  updateProducer,
  updateDeliveryAgent,
  updateTruck,
  updateCatalog,
  updateItem,
  updateOrderAssignment,
  updateOrderStatus,
  confirmOrderDelivery,
  deleteOrder,
  applyPaymentToOrder,
  getLatestBakongToken,
  insertBakongToken,
  getBakongTransactionByMd5,
  createBakongTransaction,
  updateBakongTransactionPaymentIdByMd5,

  // delete
  deactivateUser,
  deleteCustomer,
  deleteProducer,
  deleteDeliveryAgent,
  deleteTruck,
  deleteCatalog,
  deleteItem,
};
