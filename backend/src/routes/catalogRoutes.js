const express = require("express");
const { listCatalogs, createCatalog, updateCatalog, deleteCatalog } = require("../controllers/catalogController");
const { requireAuth, requireRoles } = require("../middleware/auth");

const router = express.Router();

router.get("/catalogs", requireAuth, listCatalogs);
router.post("/catalogs", requireAuth, requireRoles("Admin", "Owner"), createCatalog);
router.post("/catalogs/:id", requireAuth, requireRoles("Admin", "Owner"), updateCatalog);
router.delete("/catalogs/:id", requireAuth, requireRoles("Admin", "Owner"), deleteCatalog);

module.exports = router;
