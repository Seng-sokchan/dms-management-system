const express = require("express");
const { listItems, createItem, updateItem, deleteItem } = require("../controllers/itemController");
const { requireAuth, requireRoles } = require("../middleware/auth");

const router = express.Router();

router.get("/items", requireAuth, listItems);
router.post("/items", requireAuth, requireRoles("Admin", "Owner"), createItem);
router.post("/items/:id", requireAuth, requireRoles("Admin", "Owner"), updateItem);
router.delete("/items/:id", requireAuth, requireRoles("Admin", "Owner"), deleteItem);

module.exports = router;
