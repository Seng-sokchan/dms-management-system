/**
 * React Native 0.85+ CLI uses util.styleText (Node 20.12+ / 22+).
 * On older Node (e.g. 21.5), Metro start fails with "styleText is not a function".
 * Load with: node -r ./scripts/polyfill-util-styletext.cjs ...
 */
"use strict";

const util = require("util");

if (typeof util.styleText !== "function") {
  Object.defineProperty(util, "styleText", {
    configurable: true,
    enumerable: true,
    writable: true,
    value: function styleText(_format, string) {
      return String(string);
    },
  });
}
