const { z } = require("zod");
const {
  getCatalogById,
  listItems: listItemsDb,
  createItem: createItemDb,
  updateItem: updateItemDb,
  deleteItem: deleteItemDb,
} = require("../repositories");

async function listItems(_req, res) {
  const items = await listItemsDb();
  res.json(items);
}

function itemSchema() {
  return z.object({
    catalogId: z.string().min(1),
    name: z.string().min(2),
    sku: z.string().max(40).optional().default(""),
    defaultUnitPriceUsd: z.number().nonnegative(),
    defaultUnitPriceKhr: z.number().nonnegative(),
  });
}

async function createItem(req, res) {
  const parsed = itemSchema().safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: "Invalid item payload" });
  }
  const catalog = await getCatalogById(parsed.data.catalogId);
  if (!catalog) {
    return res.status(400).json({ message: "Catalog not found" });
  }
  const item = await createItemDb(parsed.data);
  return res.status(201).json(item);
}

async function updateItem(req, res) {
  const parsed = itemSchema().safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: "Invalid item payload" });
  }
  const catalog = await getCatalogById(parsed.data.catalogId);
  if (!catalog) {
    return res.status(400).json({ message: "Catalog not found" });
  }
  const item = await updateItemDb(req.params.id, parsed.data);
  if (!item) {
    return res.status(404).json({ message: "Item not found" });
  }
  return res.json(item);
}

async function deleteItem(req, res) {
  const deleted = await deleteItemDb(req.params.id);
  if (!deleted) {
    return res.status(404).json({ message: "Item not found" });
  }
  return res.status(204).send();
}

module.exports = {
  listItems,
  createItem,
  updateItem,
  deleteItem,
};
