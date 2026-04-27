const bakongKhqr = require("bakong-khqr");

function normalizeCurrency(input) {
  const value = String(input || process.env.BAKONG_CURRENCY || "USD").trim().toUpperCase();
  return value === "KHR" ? "KHR" : "USD";
}

function getMerchantConfig() {
  const bankAccount = String(process.env.BAKONG_BANK_ACCOUNT || process.env.BAKONG_ACCOUNT_ID || "").trim();
  const merchantName = String(process.env.BAKONG_MERCHANT_NAME || process.env.BAKONG_DISPLAY_NAME || "").trim();
  const merchantCity = String(process.env.BAKONG_MERCHANT_CITY || process.env.BAKONG_CITY || "").trim();
  if (!bankAccount || !merchantName || !merchantCity) {
    throw new Error("Missing Bakong merchant config: BAKONG_BANK_ACCOUNT/BAKONG_ACCOUNT_ID, BAKONG_MERCHANT_NAME/BAKONG_DISPLAY_NAME, BAKONG_MERCHANT_CITY/BAKONG_CITY");
  }
  return {
    bankAccount,
    merchantName,
    merchantCity,
    storeLabel: String(process.env.BAKONG_STORE_LABEL || "").trim() || undefined,
    terminalLabel: String(process.env.BAKONG_TERMINAL_LABEL || "").trim() || undefined,
    phoneNumber: String(process.env.BAKONG_PHONE_NUMBER || "").trim() || undefined,
    expirationMinutes: Number(process.env.BAKONG_QR_EXPIRATION_MINUTES || 5),
    merchantId: Number(process.env.BAKONG_MERCHANT_ID || 0) || undefined,
    acquiringBank: String(process.env.BAKONG_ACQUIRING_BANK || "").trim() || undefined,
    merchantCategoryCode: String(process.env.BAKONG_MERCHANT_CATEGORY_CODE || "5999").trim() || "5999",
  };
}

function createKhqr({ amount, billNumber, currency }) {
  const cfg = getMerchantConfig();
  const normalizedCurrency = normalizeCurrency(currency);

  // Support the modern package API first.
  if (typeof bakongKhqr.KHQR === "function") {
    const khqr = new bakongKhqr.KHQR();
    const qr = khqr.createQR({
      bankAccount: cfg.bankAccount,
      merchantName: cfg.merchantName,
      merchantCity: cfg.merchantCity,
      amount: Number(amount),
      currency: normalizedCurrency,
      billNumber,
      storeLabel: cfg.storeLabel,
      terminalLabel: cfg.terminalLabel,
      phoneNumber: cfg.phoneNumber,
      merchantCategoryCode: cfg.merchantCategoryCode,
      static: false,
      expiration: Math.max(1, Math.ceil(cfg.expirationMinutes / 1440)),
    });
    const md5 = typeof khqr.generateMD5 === "function" ? khqr.generateMD5(qr) : null;
    return { qr, md5, currency: normalizedCurrency };
  }

  // Backward compatibility with old API shape.
  const {
    BakongKHQR,
    khqrData,
    MerchantInfo,
    IndividualInfo,
  } = bakongKhqr;
  if (typeof BakongKHQR !== "function") {
    throw new Error("bakong-khqr package API not supported");
  }
  const optionalData = {
    currency: normalizedCurrency === "KHR" ? khqrData.currency.khr : khqrData.currency.usd,
    amount: Number(amount),
    billNumber,
    expirationTimestamp: Date.now() + Math.max(1, cfg.expirationMinutes) * 60 * 1000,
    storeLabel: cfg.storeLabel,
    terminalLabel: cfg.terminalLabel,
    mobileNumber: cfg.phoneNumber,
    merchantCategoryCode: cfg.merchantCategoryCode,
  };
  const khqr = new BakongKHQR();
  let generated;
  if (cfg.merchantId && cfg.acquiringBank && typeof MerchantInfo === "function") {
    const merchantInfo = new MerchantInfo(
      cfg.bankAccount,
      cfg.merchantName,
      cfg.merchantCity,
      cfg.merchantId,
      cfg.acquiringBank,
      optionalData,
    );
    generated = khqr.generateMerchant(merchantInfo);
  } else if (typeof IndividualInfo === "function") {
    const individualInfo = new IndividualInfo(
      cfg.bankAccount,
      cfg.merchantName,
      cfg.merchantCity,
      optionalData,
    );
    generated = khqr.generateIndividual(individualInfo);
  } else {
    throw new Error("bakong-khqr IndividualInfo export not found");
  }

  if (generated?.status?.code !== 0) {
    throw new Error(generated?.status?.message || "KHQR generation failed");
  }
  const qr = generated?.data?.qr || generated?.qr || generated;
  const md5 = generated?.data?.md5 || generated?.md5 || null;
  if (!qr || typeof qr !== "string") {
    throw new Error("KHQR generation returned empty QR payload");
  }
  return { qr, md5, currency: normalizedCurrency };
}

module.exports = {
  createKhqr,
};

