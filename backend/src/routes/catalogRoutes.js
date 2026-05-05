const express = require("express");
const {
  listCatalogs,
  createCatalog,
  updateCatalog,
  deleteCatalog,
} = require("../controllers/catalogController");
const { requireAuth, requireRoles } = require("../middleware/auth");
const { validate } = require("../validators/validate");
const { catalogBodySchema, catalogIdParamsSchema } = require("../validators/catalog.validator");

const router = express.Router();

router.get("/catalogs", requireAuth, listCatalogs);
router.post(
  "/catalogs",
  requireAuth,
  requireRoles("Admin", "Owner"),
  validate({ body: catalogBodySchema }),
  createCatalog,
);
router.post(
  "/catalogs/:id",
  requireAuth,
  requireRoles("Admin", "Owner"),
  validate({ params: catalogIdParamsSchema, body: catalogBodySchema }),
  updateCatalog,
);
router.delete(
  "/catalogs/:id",
  requireAuth,
  requireRoles("Admin", "Owner"),
  validate({ params: catalogIdParamsSchema }),
  deleteCatalog,
);

module.exports = router;
