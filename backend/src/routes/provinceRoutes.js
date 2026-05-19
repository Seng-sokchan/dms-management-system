const express = require("express");
const {
  listProvinces,
  createProvince,
  updateProvince,
  deleteProvince,
} = require("../controllers/provinceController");
const { requireAuth } = require("../middleware/auth");
const { validate } = require("../validators/validate");
const { provinceBodySchema, provinceIdParamsSchema } = require("../validators/province.validator");

const router = express.Router();

router.get("/provinces", requireAuth, listProvinces);
router.post(
  "/provinces",
  requireAuth,
  validate({ body: provinceBodySchema }),
  createProvince,
);
router.post(
  "/provinces/:id",
  requireAuth,
  validate({ params: provinceIdParamsSchema, body: provinceBodySchema }),
  updateProvince,
);
router.delete(
  "/provinces/:id",
  requireAuth,
  validate({ params: provinceIdParamsSchema }),
  deleteProvince,
);

module.exports = router;
