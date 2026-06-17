const express = require("express");
const {
  listDepotItemPrices,
  upsertDepotItemPrice,
  deleteDepotItemPrice,
} = require("../../../controllers/depotItemPriceController");
const { requireAuth } = require("../../../middleware/auth");
const { validate } = require("../../../validators/validate");
const {
  depotItemPriceSchema,
  depotItemPriceIdParamsSchema,
} = require("../../../validators/depotItemPrice.validator");

const router = express.Router();

router.get(
  "/depot-item-prices",
  requireAuth,
  listDepotItemPrices,
);
router.post(
  "/depot-item-prices",
  requireAuth,
  validate({ body: depotItemPriceSchema }),
  upsertDepotItemPrice,
);
router.delete(
  "/depot-item-prices/:id",
  requireAuth,
  validate({ params: depotItemPriceIdParamsSchema }),
  deleteDepotItemPrice,
);

module.exports = router;
