const express = require("express");
const {
  getCustomerPriorities,
  reorderCustomerPriorities,
} = require("../../../controllers/customerPriorityController");
const { requireAuth } = require("../../../middleware/auth");
const { validate } = require("../../../validators/validate");
const {
  provinceIdQuerySchema,
  reorderCustomerPrioritiesSchema,
} = require("../../../validators/customerPriority.validator");

const router = express.Router();

router.get(
  "/customer-priorities",
  requireAuth,
  validate({ query: provinceIdQuerySchema }),
  getCustomerPriorities,
);
router.post(
  "/customer-priorities",
  requireAuth,
  validate({ body: reorderCustomerPrioritiesSchema }),
  reorderCustomerPriorities,
);

module.exports = router;
