const {
  getCatalogById,
  listItems: listItemsDb,
  createItem: createItemDb,
  updateItem: updateItemDb,
  deleteItem: deleteItemDb,
} = require("../repositories");
const { BadRequestError, NotFoundError } = require("../errors");

async function listItems() {
  return listItemsDb();
}

async function createItem(payload) {
  const catalog = await getCatalogById(payload.catalogId);
  if (!catalog) throw new BadRequestError("Catalog not found");
  return createItemDb(payload);
}

async function updateItem(itemId, payload) {
  const catalog = await getCatalogById(payload.catalogId);
  if (!catalog) throw new BadRequestError("Catalog not found");
  const item = await updateItemDb(itemId, payload);
  if (!item) throw new NotFoundError("Item not found");
  return item;
}

async function deleteItem(itemId) {
  const deleted = await deleteItemDb(itemId);
  if (!deleted) throw new NotFoundError("Item not found");
}

module.exports = {
  listItems,
  createItem,
  updateItem,
  deleteItem,
};
