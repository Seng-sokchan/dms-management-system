const express = require("express");
const { listAddresses } = require("../controllers/addressController");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();

router.get("/addresses", requireAuth, listAddresses);

module.exports = router;
