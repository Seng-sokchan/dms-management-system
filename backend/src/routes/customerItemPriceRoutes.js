const express = require("express");
const {
  listCustomerItemPrices,
  upsertCustomerItemPrice,
  deleteCustomerItemPrice,
} = require("../controllers/customerItemPriceController");
const { requireAuth } = require("../middleware/auth");
const { validate } = require("../validators/validate");
const {
  customerItemPriceSchema,
  customerItemPriceIdParamsSchema,
} = require("../validators/customerItemPrice.validator");

const router = express.Router();

router.get(
  "/customer-item-prices",
  requireAuth,
  listCustomerItemPrices,
);
router.post(
  "/customer-item-prices",
  requireAuth,
  validate({ body: customerItemPriceSchema }),
  upsertCustomerItemPrice,
);
router.delete(
  "/customer-item-prices/:id",
  requireAuth,
  validate({ params: customerItemPriceIdParamsSchema }),
  deleteCustomerItemPrice,
);

module.exports = router;
