const express = require("express");
const { nowIso } = require("../utils");

const router = express.Router();

router.get("/health", (_req, res) => {
  res.json({ status: "ok", time: nowIso() });
});

module.exports = router;
