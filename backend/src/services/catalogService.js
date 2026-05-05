const {
  listCatalogs: listCatalogsDb,
  createCatalog: createCatalogDb,
  updateCatalog: updateCatalogDb,
  deleteCatalog: deleteCatalogDb,
} = require("../repositories");
const { NotFoundError } = require("../errors");

async function listCatalogs() {
  return listCatalogsDb();
}

async function createCatalog(payload) {
  return createCatalogDb(payload);
}

async function updateCatalog(catalogId, payload) {
  const row = await updateCatalogDb(catalogId, payload);
  if (!row) throw new NotFoundError("Catalog not found");
  return row;
}

async function deleteCatalog(catalogId) {
  const deleted = await deleteCatalogDb(catalogId);
  if (!deleted) throw new NotFoundError("Catalog not found");
}

module.exports = {
  listCatalogs,
  createCatalog,
  updateCatalog,
  deleteCatalog,
};
