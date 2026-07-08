function unescapeUrl(value) {
  if (typeof value !== "string" || !value.trim()) return null;
  return value.trim().replace(/\\\//g, "/");
}

export function parsePaywayClientResponse(response) {
  if (!response || typeof response !== "object") {
    return {
      ok: false,
      message: "Invalid PayWay response",
      qrString: null,
      qrImageUrl: null,
      deeplinkUrl: null,
      playStoreUrl: null,
      appStoreUrl: null,
    };
  }

  const root = response.data && typeof response.data === "object" ? response.data : response;
  const code = response?.status?.code ?? response?.status;
  const ok = code == null || String(code) === "00" || code === 0;

  const qrString = root?.qrString || root?.qr_string || null;
  const qrImage = root?.qrImage || root?.qr_image || null;

  let deeplinkUrl = unescapeUrl(root?.abapay_deeplink || root?.deeplink);
  if (!deeplinkUrl && qrString) {
    deeplinkUrl = `abamobilebank://ababank.com?type=payway&qrcode=${encodeURIComponent(String(qrString).trim())}`;
  }

  let qrImageUrl = null;
  if (qrImage && String(qrImage).trim()) {
    const imageValue = String(qrImage).trim();
    qrImageUrl = imageValue.startsWith("data:image")
      ? imageValue
      : unescapeUrl(imageValue);
  }
  if (!qrImageUrl) {
    qrImageUrl = unescapeUrl(root?.checkout_qr_url || root?.checkout_url || root?.qr_image_url);
  }

  return {
    ok,
    message: response?.status?.message || response?.description || null,
    qrString: qrString ? String(qrString) : null,
    qrImageUrl,
    deeplinkUrl,
    playStoreUrl: unescapeUrl(root?.play_store),
    appStoreUrl: unescapeUrl(root?.app_store),
  };
}

function parseJsonBody(text) {
  const trimmed = String(text || "").trim().replace(/^\uFEFF/, "");
  if (!trimmed) return null;
  try {
    return JSON.parse(trimmed);
  } catch {
    const start = trimmed.indexOf("{");
    const end = trimmed.lastIndexOf("}");
    if (start >= 0 && end > start) {
      try {
        return JSON.parse(trimmed.slice(start, end + 1));
      } catch {
        return null;
      }
    }
    return null;
  }
}

export async function submitPaywayCheckoutForm(paywayCheckout) {
  if (!paywayCheckout?.action || !paywayCheckout?.fields) {
    throw new Error("PayWay checkout form is incomplete");
  }

  const formData = new FormData();
  for (const [key, value] of Object.entries(paywayCheckout.fields)) {
    if (value !== "" && value != null) {
      formData.append(key, String(value));
    }
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000);

  let response;
  const headers = {};
  if (paywayCheckout.referer) {
    headers.Referer = String(paywayCheckout.referer);
  }
  try {
    response = await fetch(paywayCheckout.action, {
      method: "POST",
      body: formData,
      signal: controller.signal,
      headers,
    });
  } catch (err) {
    if (err?.name === "AbortError") {
      throw new Error("PayWay request timed out");
    }
    throw err;
  } finally {
    clearTimeout(timeoutId);
  }

  const text = await response.text();
  const json = parseJsonBody(text);
  if (!json) {
    throw new Error("PayWay returned an invalid response");
  }

  const parsed = parsePaywayClientResponse(json);
  if (!parsed.ok) {
    throw new Error(parsed.message || "PayWay request failed");
  }
  if (!parsed.qrString && !parsed.qrImageUrl) {
    throw new Error("PayWay did not return KHQR data");
  }
  return parsed;
}
