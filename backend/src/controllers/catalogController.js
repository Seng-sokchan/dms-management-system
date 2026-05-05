const catalogService = require("../services/catalogService");
const { success, created, noContent } = require("../utils/response");
const { asyncHandler } = require("../errors");

const listCatalogs = asyncHandler(async (_req, res) => {
  const catalogs = await catalogService.listCatalogs();
  return success(res, catalogs);
});

const createCatalog = asyncHandler(async (req, res) => {
  const row = await catalogService.createCatalog(req.body);
  return created(res, row);
});

const updateCatalog = asyncHandler(async (req, res) => {
  const row = await catalogService.updateCatalog(req.params.id, req.body);
  return success(res, row);
});

const deleteCatalog = asyncHandler(async (req, res) => {
  await catalogService.deleteCatalog(req.params.id);
  return noContent(res);
});

module.exports = {
  listCatalogs,
  createCatalog,
  updateCatalog,
  deleteCatalog,
};
