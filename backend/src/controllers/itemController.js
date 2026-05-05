const itemService = require("../services/itemService");
const { success, created, noContent } = require("../utils/response");
const { asyncHandler } = require("../errors");

const listItems = asyncHandler(async (_req, res) => {
  const items = await itemService.listItems();
  return success(res, items);
});

const createItem = asyncHandler(async (req, res) => {
  const item = await itemService.createItem(req.body);
  return created(res, item);
});

const updateItem = asyncHandler(async (req, res) => {
  const item = await itemService.updateItem(req.params.id, req.body);
  return success(res, item);
});

const deleteItem = asyncHandler(async (req, res) => {
  await itemService.deleteItem(req.params.id);
  return noContent(res);
});

module.exports = {
  listItems,
  createItem,
  updateItem,
  deleteItem,
};
