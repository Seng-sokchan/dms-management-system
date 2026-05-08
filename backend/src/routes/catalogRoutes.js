const express = require("express");
const {
  listCatalogs,
  createCatalog,
  updateCatalog,
  deleteCatalog,
} = require("../controllers/catalogController");
const { requireAuth } = require("../middleware/auth");
const { validate } = require("../validators/validate");
const { catalogBodySchema, catalogIdParamsSchema } = require("../validators/catalog.validator");

const router = express.Router();

router.get("/catalogs", requireAuth, listCatalogs);
router.post(
  "/catalogs",
  requireAuth,
  validate({ body: catalogBodySchema }),
  createCatalog,
);
router.post(
  "/catalogs/:id",
  requireAuth,
  validate({ params: catalogIdParamsSchema, body: catalogBodySchema }),
  updateCatalog,
);
router.delete(
  "/catalogs/:id",
  requireAuth,
  validate({ params: catalogIdParamsSchema }),
  deleteCatalog,
);

module.exports = router;
