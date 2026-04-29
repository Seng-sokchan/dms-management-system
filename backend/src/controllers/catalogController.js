const { z } = require("zod");
const {
  listCatalogs: listCatalogsDb,
  createCatalog: createCatalogDb,
  updateCatalog: updateCatalogDb,
  deleteCatalog: deleteCatalogDb,
} = require("../repositories");

async function listCatalogs(_req, res) {
  const catalogs = await listCatalogsDb();
  res.json(catalogs);
}

async function createCatalog(req, res) {
  const schema = z.object({
    name: z.string().min(2),
    note: z.string().optional().default(""),
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: "Invalid catalog payload" });
  }
  const row = await createCatalogDb(parsed.data);
  return res.status(201).json(row);
}

async function updateCatalog(req, res) {
  const schema = z.object({
    name: z.string().min(2),
    note: z.string().optional().default(""),
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: "Invalid catalog payload" });
  }
  const row = await updateCatalogDb(req.params.id, parsed.data);
  if (!row) {
    return res.status(404).json({ message: "Catalog not found" });
  }
  return res.json(row);
}

async function deleteCatalog(req, res) {
  const deleted = await deleteCatalogDb(req.params.id);
  if (!deleted) {
    return res.status(404).json({ message: "Catalog not found" });
  }
  return res.status(204).send();
}

module.exports = {
  listCatalogs,
  createCatalog,
  updateCatalog,
  deleteCatalog,
};
