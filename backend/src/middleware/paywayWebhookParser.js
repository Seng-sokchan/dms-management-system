const express = require("express");

/**
 * PayWay may POST JSON or form-urlencoded. Chain both parsers on the webhook route only.
 */
const paywayWebhookParser = [
  express.urlencoded({ extended: true }),
  express.json({ limit: "256kb" }),
];

module.exports = { paywayWebhookParser };
