export const CAMBODIA_TZ = "Asia/Phnom_Penh";
export const ORDER_WINDOW_OPEN_HOUR = 6;
export const ORDER_WINDOW_CLOSE_HOUR = 18;

/** Cambodia uses UTC+7 year-round (no DST). Prefer offset math over Intl for Hermes reliability. */
const CAMBODIA_UTC_OFFSET_HOURS = 7;

/** Minimum delay returned by getMsUntilOrderWindowChange when near a boundary. */
export const ORDER_WINDOW_MIN_TIMER_MS = 1000;

function getCambodiaDateParts(now = new Date()) {
  const shifted = new Date(now.getTime() + CAMBODIA_UTC_OFFSET_HOURS * 60 * 60 * 1000);
  return {
    year: shifted.getUTCFullYear(),
    month: shifted.getUTCMonth() + 1,
    day: shifted.getUTCDate(),
    hour: shifted.getUTCHours(),
    minute: shifted.getUTCMinutes(),
    second: shifted.getUTCSeconds(),
  };
}

function cambodiaLocalToUtc({ year, month, day, hour, minute = 0, second = 0 }) {
  return new Date(
    Date.UTC(year, month - 1, day, hour - CAMBODIA_UTC_OFFSET_HOURS, minute, second),
  );
}

function cambodiaCalendarAddDays(year, month, day, deltaDays) {
  const anchor = cambodiaLocalToUtc({ year, month, day, hour: 12 });
  anchor.setUTCDate(anchor.getUTCDate() + deltaDays);
  const parts = getCambodiaDateParts(anchor);
  return { year: parts.year, month: parts.month, day: parts.day };
}

export function getCambodiaMinutesSinceMidnight(now = new Date()) {
  const { hour, minute } = getCambodiaDateParts(now);
  return hour * 60 + minute;
}

export function isOrderWindowOpen(now = new Date()) {
  const minutes = getCambodiaMinutesSinceMidnight(now);
  return (
    minutes >= ORDER_WINDOW_OPEN_HOUR * 60
    && minutes < ORDER_WINDOW_CLOSE_HOUR * 60
  );
}

export function getMsUntilOrderWindowChange(now = new Date()) {
  const { year, month, day, hour } = getCambodiaDateParts(now);
  const open = isOrderWindowOpen(now);

  let target;
  if (open) {
    target = cambodiaLocalToUtc({
      year,
      month,
      day,
      hour: ORDER_WINDOW_CLOSE_HOUR,
    });
  } else if (hour < ORDER_WINDOW_OPEN_HOUR) {
    target = cambodiaLocalToUtc({
      year,
      month,
      day,
      hour: ORDER_WINDOW_OPEN_HOUR,
    });
  } else {
    const nextDay = cambodiaCalendarAddDays(year, month, day, 1);
    target = cambodiaLocalToUtc({
      ...nextDay,
      hour: ORDER_WINDOW_OPEN_HOUR,
    });
  }

  const ms = target.getTime() - now.getTime();
  if (!Number.isFinite(ms) || ms <= 0) {
    return ORDER_WINDOW_MIN_TIMER_MS;
  }
  return ms;
}
