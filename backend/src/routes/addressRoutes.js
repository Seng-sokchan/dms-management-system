const express = require("express");
const {
  listAddresses,
  createAddress,
  updateAddress,
  deleteAddress,
} = require("../controllers/addressController");
const { requireAuth, requireRoles } = require("../middleware/auth");
const { validate } = require("../validators/validate");
const { addressBodySchema, addressIdParamsSchema } = require("../validators/address.validator");

const router = express.Router();

router.get("/addresses", requireAuth, listAddresses);
router.post(
  "/addresses",
  requireAuth,
  requireRoles("Admin", "Owner", "Depot"),
  validate({ body: addressBodySchema }),
  createAddress,
);
router.post(
  "/addresses/:id",
  requireAuth,
  requireRoles("Admin", "Owner", "Depot"),
  validate({ params: addressIdParamsSchema, body: addressBodySchema }),
  updateAddress,
);
router.delete(
  "/addresses/:id",
  requireAuth,
  requireRoles("Admin", "Owner", "Depot"),
  validate({ params: addressIdParamsSchema }),
  deleteAddress,
);

module.exports = router;
