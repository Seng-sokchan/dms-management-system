const { z } = require("zod");
const {
  listCatalogs: listCatalogsDb,
  createCatalog: createCatalogDb,
  updateCatalog: updateCatalogDb,
  deleteCatalog: deleteCatalogDb,
} = require("../repositories");
const { success, created, noContent, fail } = require("../utils/response");

async function listCatalogs(_req, res) {
  const catalogs = await listCatalogsDb();
  return success(res, catalogs);
}

async function createCatalog(req, res) {
  const schema = z.object({
    name: z.string().min(2),
    note: z.string().optional().default(""),
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    return fail(res, { status: 400, message: "Invalid catalog payload" });
  }
  const row = await createCatalogDb(parsed.data);
  return created(res, row);
}

async function updateCatalog(req, res) {
  const schema = z.object({
    name: z.string().min(2),
    note: z.string().optional().default(""),
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    return fail(res, { status: 400, message: "Invalid catalog payload" });
  }
  const row = await updateCatalogDb(req.params.id, parsed.data);
  if (!row) {
    return fail(res, { status: 400, message: "Catalog not found" });
  }
  return success(res, row);
}

async function deleteCatalog(req, res) {
  const deleted = await deleteCatalogDb(req.params.id);
  if (!deleted) {
    return fail(res, { status: 400, message: "Catalog not found" });
  }
  return noContent(res);
}

module.exports = {
  listCatalogs,
  createCatalog,
  updateCatalog,
  deleteCatalog,
};
