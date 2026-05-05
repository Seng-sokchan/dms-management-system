const express = require("express");
const { listItems, createItem, updateItem, deleteItem } = require("../controllers/itemController");
const { requireAuth, requireRoles } = require("../middleware/auth");
const { validate } = require("../validators/validate");
const { itemBodySchema, itemIdParamsSchema } = require("../validators/item.validator");

const router = express.Router();

router.get("/items", requireAuth, listItems);
router.post(
  "/items",
  requireAuth,
  requireRoles("Admin", "Owner"),
  validate({ body: itemBodySchema }),
  createItem,
);
router.post(
  "/items/:id",
  requireAuth,
  requireRoles("Admin", "Owner"),
  validate({ params: itemIdParamsSchema, body: itemBodySchema }),
  updateItem,
);
router.delete(
  "/items/:id",
  requireAuth,
  requireRoles("Admin", "Owner"),
  validate({ params: itemIdParamsSchema }),
  deleteItem,
);

module.exports = router;
