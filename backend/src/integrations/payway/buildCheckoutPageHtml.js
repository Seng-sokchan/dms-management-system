const { getCheckoutScriptUrl, resolveCheckoutPluginBase } = require("./paywayClient");

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

/**
 * Full HTML page for PayWay checkout2-0.js (hosted URL so WebView can load external scripts).
 * @param {{ action: string, fields: Record<string, string|number>, pluginBase?: string, scriptUrl?: string }} paywayCheckout
 */
function buildCheckoutPageHtml(paywayCheckout) {
  if (!paywayCheckout?.action || !paywayCheckout?.fields) return null;

  const fieldInputs = Object.entries(paywayCheckout.fields)
    .filter(([, value]) => value !== "" && value != null)
    .map(
      ([key, value]) =>
        `<input type="hidden" name="${escapeHtml(key)}" value="${escapeHtml(String(value))}"/>`,
    )
    .join("");

  const action = escapeHtml(paywayCheckout.action);
  const pluginBase = paywayCheckout.pluginBase || resolveCheckoutPluginBase(paywayCheckout.action);
  const checkoutScriptUrl = paywayCheckout.scriptUrl || getCheckoutScriptUrl();

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no"/>
  <title>PayWay Checkout</title>
  <style>
    html, body { margin: 0; padding: 0; height: 100%; background: #f3f4f6; font-family: sans-serif; }
    #status { padding: 24px; text-align: center; color: #374151; font-size: 14px; }
    #aba_main_modal { min-height: 100%; }
  </style>
</head>
<body>
  <div id="status">Loading PayWay checkout…</div>
  <div id="aba_main_modal" class="aba-modal">
    <div class="aba-modal-content">
      <form method="POST" target="aba_webservice" action="${action}" id="aba_merchant_request">
        ${fieldInputs}
      </form>
    </div>
  </div>
  <script src="${pluginBase}/plugins/bs.js"></script>
  <script src="${pluginBase}/plugins/bridge.js"></script>
  <script src="${checkoutScriptUrl}?n=${Date.now()}"></script>
  <script>
    (function () {
      var attempts = 0;
      var maxAttempts = 40;

      function notify(type, detail) {
        try {
          if (window.ReactNativeWebView && window.ReactNativeWebView.postMessage) {
            window.ReactNativeWebView.postMessage(JSON.stringify({ type: type, detail: detail || null }));
          }
        } catch (e) {}
      }

      function setStatus(text) {
        var el = document.getElementById("status");
        if (el) el.textContent = text || "";
      }

      function launchCheckout() {
        attempts += 1;
        if (window.AbaPayway && typeof window.AbaPayway.checkout === "function") {
          setStatus("");
          notify("payway:ready");
          try {
            window.AbaPayway.checkout();
            notify("payway:launched");
          } catch (err) {
            notify("payway:error", String(err && err.message ? err.message : err));
          }
          return;
        }
        if (attempts >= maxAttempts) {
          setStatus("PayWay checkout failed to load. Please try again.");
          notify("payway:timeout");
          return;
        }
        setTimeout(launchCheckout, 250);
      }

      if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", function () {
          setTimeout(launchCheckout, 800);
        });
      } else {
        setTimeout(launchCheckout, 800);
      }
    })();
  </script>
</body>
</html>`;
}

module.exports = {
  buildCheckoutPageHtml,
};
