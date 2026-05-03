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
  listCustomersByDepotId,
  listCustomersByOwnerUserId,
  getCustomerById,
  getCustomerByUserId,
  createCustomer,
  updateCustomer,
  deleteCustomer,
} = require("./customers");
const {
  listDepots,
  listDepotsByOwnerUserId,
  getDepotById,
  getDepotByOwnerUserId,
  getDepotByDepotUserId,
  createDepot,
  updateDepot,
  deleteDepot,
} = require("./depots");

// borrowMaterials
const {
  listBorrowMaterials,
  getBorrowMaterialById,
  createBorrowMaterial,
  updateBorrowMaterial,
  deleteBorrowMaterial,
} = require("./borrowMaterials");

// customerBorrowedMaterials (per-customer current balance)
const {
  listCustomerBorrowedMaterialsByCustomer,
  listAllCustomerBorrowedMaterials,
  upsertCustomerBorrowedMaterial,
  deleteCustomerBorrowedMaterial,
} = require("./customerBorrowedMaterials");

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
  listCustomersByDepotId,
  listCustomersByOwnerUserId,
  listDepots,
  listDepotsByOwnerUserId,
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
  listBorrowMaterials,
  listCustomerBorrowedMaterialsByCustomer,
  listAllCustomerBorrowedMaterials,
  getDashboardSummary,

  // get (single/read)
  getUserByUsername,
  getUserById,
  listMenuKeysForRoleName,
  listRoleMenusMap,
  replaceRoleMenus,
  getCustomerById,
  getCustomerByUserId,
  getDepotById,
  getDepotByOwnerUserId,
  getDepotByDepotUserId,
  getProducerById,
  getDeliveryAgentById,
  getTruckById,
  getCatalogById,
  getItemById,
  getOrderById,
  getOrderGroupById,
  getBorrowMaterialById,

  // create
  createUser,
  createCustomer,
  createDepot,
  createProducer,
  createDeliveryAgent,
  createTruck,
  createCatalog,
  createItem,
  createOrder,
  createPayment,
  createUserActivityLog,
  createBorrowMaterial,

  // update
  updateUser,
  updateCustomer,
  updateDepot,
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
  updateBorrowMaterial,
  upsertCustomerBorrowedMaterial,

  // delete
  deactivateUser,
  deleteCustomer,
  deleteDepot,
  deleteProducer,
  deleteDeliveryAgent,
  deleteTruck,
  deleteCatalog,
  deleteItem,
  deleteBorrowMaterial,
  deleteCustomerBorrowedMaterial,
};
