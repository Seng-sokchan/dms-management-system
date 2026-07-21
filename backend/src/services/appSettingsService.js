const appSettingsRepository = require("../repositories/appSettings");

const SPECIAL_DAY_KEY = "special_day_enabled";
const NORMAL_UNPAID_RECEIVED_LIMIT = 1;
const SPECIAL_DAY_UNPAID_RECEIVED_LIMIT = 2;

function parseEnabled(value) {
  const raw = String(value ?? "0").trim().toLowerCase();
  return raw === "1" || raw === "true" || raw === "yes" || raw === "on";
}

async function getSpecialDayEnabled() {
  const row = await appSettingsRepository.getSetting(SPECIAL_DAY_KEY);
  return parseEnabled(row?.setting_value);
}

async function setSpecialDayEnabled(enabled) {
  const next = Boolean(enabled);
  await appSettingsRepository.setSetting(SPECIAL_DAY_KEY, next ? "1" : "0");
  return {
    enabled: next,
    unpaidReceivedLimit: next ? SPECIAL_DAY_UNPAID_RECEIVED_LIMIT : NORMAL_UNPAID_RECEIVED_LIMIT,
  };
}

async function getSpecialDaySettings() {
  const enabled = await getSpecialDayEnabled();
  return {
    enabled,
    unpaidReceivedLimit: enabled
      ? SPECIAL_DAY_UNPAID_RECEIVED_LIMIT
      : NORMAL_UNPAID_RECEIVED_LIMIT,
  };
}

async function getUnpaidReceivedOrderLimit() {
  const enabled = await getSpecialDayEnabled();
  return enabled ? SPECIAL_DAY_UNPAID_RECEIVED_LIMIT : NORMAL_UNPAID_RECEIVED_LIMIT;
}

module.exports = {
  getSpecialDayEnabled,
  setSpecialDayEnabled,
  getSpecialDaySettings,
  getUnpaidReceivedOrderLimit,
  NORMAL_UNPAID_RECEIVED_LIMIT,
  SPECIAL_DAY_UNPAID_RECEIVED_LIMIT,
};
