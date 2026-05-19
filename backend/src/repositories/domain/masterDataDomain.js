const { listOrderStatuses } = require("../lookups");
const {
  listCatalogs,
  getCatalogById,
  createCatalog,
  updateCatalog,
  deleteCatalog,
} = require("../catalogs");
const { listItems, getItemById, createItem, updateItem, deleteItem } = require("../items");
const {
  listProducers,
  getProducerById,
  createProducer,
  updateProducer,
  deleteProducer,
} = require("../producers");
const {
  listDeliveryAgents,
  getDeliveryAgentById,
  createDeliveryAgent,
  updateDeliveryAgent,
  deleteDeliveryAgent,
} = require("../deliveryAgents");
const {
  listProvinces,
  getProvinceById,
  createProvince,
  updateProvince,
  deleteProvince,
} = require("../provinces");
module.exports = {
  listOrderStatuses,
  listCatalogs,
  getCatalogById,
  createCatalog,
  updateCatalog,
  deleteCatalog,
  listItems,
  getItemById,
  createItem,
  updateItem,
  deleteItem,
  listProducers,
  getProducerById,
  createProducer,
  updateProducer,
  deleteProducer,
  listDeliveryAgents,
  getDeliveryAgentById,
  createDeliveryAgent,
  updateDeliveryAgent,
  deleteDeliveryAgent,
  listProvinces,
  getProvinceById,
  createProvince,
  updateProvince,
  deleteProvince,
};
