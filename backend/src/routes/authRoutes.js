const express = require("express");
const { login, me, deleteMyAccount } = require("../controllers/authController");
const { requireAuth } = require("../middleware/auth");
const { authLoginRateLimit } = require("../middleware/rateLimit");
const { validate } = require("../validators/validate");
const { loginSchema } = require("../validators/auth.validator");

const router = express.Router();

router.post("/auth/login", authLoginRateLimit, validate({ body: loginSchema }), login);
router.get("/users/me", requireAuth, me);
router.delete("/users/me", requireAuth, deleteMyAccount);

module.exports = router;
