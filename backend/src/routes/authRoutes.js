const express = require("express");
const { login, me } = require("../controllers/authController");
const { requireAuth } = require("../middleware/auth");
const { authLoginRateLimit } = require("../middleware/rateLimit");

const router = express.Router();

router.post("/auth/login", authLoginRateLimit, login);
router.get("/users/me", requireAuth, me);

module.exports = router;
