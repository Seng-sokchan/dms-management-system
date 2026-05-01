const { z } = require("zod");
const {
  getCatalogById,
  getCustomerById,
  listItems: listItemsDb,
  createItem: createItemDb,
  updateItem: updateItemDb,
  deleteItem: deleteItemDb,
} = require("../repositories");
const { success, created, noContent, fail } = require("../utils/response");

async function listItems(req, res) {
  const customerId = req.query?.customerId;
  const items = await listItemsDb({ customerId });
  return success(res, items);
}

function itemSchema() {
  return z.object({
    catalogId: z.string().min(1),
    customerId: z.string().min(1).optional().nullable(),
    name: z.string().min(2),
    sku: z.string().max(40).optional().default(""),
    defaultUnitPriceUsd: z.number().nonnegative(),
    defaultUnitPriceKhr: z.number().nonnegative(),
  });
}

async function createItem(req, res) {
  const parsed = itemSchema().safeParse(req.body);
  if (!parsed.success) {
    return fail(res, { status: 400, message: "Invalid item payload" });
  }
  const catalog = await getCatalogById(parsed.data.catalogId);
  if (!catalog) {
    return fail(res, { status: 400, message: "Catalog not found" });
  }
  if (parsed.data.customerId) {
    const customer = await getCustomerById(parsed.data.customerId);
    if (!customer) {
      return fail(res, { status: 400, message: "Customer not found" });
    }
  }
  const item = await createItemDb(parsed.data);
  return created(res, item);
}

async function updateItem(req, res) {
  const parsed = itemSchema().safeParse(req.body);
  if (!parsed.success) {
    return fail(res, { status: 400, message: "Invalid item payload" });
  }
  const catalog = await getCatalogById(parsed.data.catalogId);
  if (!catalog) {
    return fail(res, { status: 400, message: "Catalog not found" });
  }
  if (parsed.data.customerId) {
    const customer = await getCustomerById(parsed.data.customerId);
    if (!customer) {
      return fail(res, { status: 400, message: "Customer not found" });
    }
  }
  const item = await updateItemDb(req.params.id, parsed.data);
  if (!item) {
    return fail(res, { status: 400, message: "Item not found" });
  }
  return success(res, item);
}

async function deleteItem(req, res) {
  const deleted = await deleteItemDb(req.params.id);
  if (!deleted) {
    return fail(res, { status: 400, message: "Item not found" });
  }
  return noContent(res);
}

module.exports = {
  listItems,
  createItem,
  updateItem,
  deleteItem,
};
