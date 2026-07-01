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
    };
  }

  const root = response.data && typeof response.data === "object" ? response.data : response;
  const code = response?.status?.code ?? response?.status;
  const ok = code == null || String(code) === "00" || code === 0;

  const qrString = root?.qrString || root?.qr_string || null;
  const qrImage = root?.qrImage || root?.qr_image || null;

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
  };
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

  const response = await fetch(paywayCheckout.action, {
    method: "POST",
    body: formData,
  });

  const text = await response.text();
  let json = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
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
