import {
  getCambodiaMinutesSinceMidnight,
  getMsUntilOrderWindowChange,
  isOrderWindowOpen,
  ORDER_WINDOW_CLOSE_HOUR,
  ORDER_WINDOW_OPEN_HOUR,
} from "../orderWindow";

function atCambodiaTime({ year, month, day, hour, minute = 0, second = 0 }) {
  return new Date(Date.UTC(year, month - 1, day, hour - 7, minute, second));
}

describe("orderWindow", () => {
  describe("isOrderWindowOpen", () => {
    it("is closed at 05:59 Cambodia time", () => {
      const now = atCambodiaTime({ year: 2026, month: 7, day: 17, hour: 5, minute: 59 });
      expect(isOrderWindowOpen(now)).toBe(false);
    });

    it("is open at 06:00 Cambodia time", () => {
      const now = atCambodiaTime({ year: 2026, month: 7, day: 17, hour: 6 });
      expect(isOrderWindowOpen(now)).toBe(true);
    });

    it("is open at 17:59 Cambodia time", () => {
      const now = atCambodiaTime({ year: 2026, month: 7, day: 17, hour: 17, minute: 59 });
      expect(isOrderWindowOpen(now)).toBe(true);
    });

    it("is closed at 18:00 Cambodia time", () => {
      const now = atCambodiaTime({ year: 2026, month: 7, day: 17, hour: 18 });
      expect(isOrderWindowOpen(now)).toBe(false);
    });

    it("is closed after 18:00 Cambodia time", () => {
      const now = atCambodiaTime({ year: 2026, month: 7, day: 17, hour: 21, minute: 30 });
      expect(isOrderWindowOpen(now)).toBe(false);
    });
  });

  describe("getCambodiaMinutesSinceMidnight", () => {
    it("returns minutes since midnight in Cambodia time", () => {
      const now = atCambodiaTime({ year: 2026, month: 7, day: 17, hour: 6, minute: 30 });
      expect(getCambodiaMinutesSinceMidnight(now)).toBe(6 * 60 + 30);
    });
  });

  describe("getMsUntilOrderWindowChange", () => {
    it("returns ms until close when window is open", () => {
      const now = atCambodiaTime({ year: 2026, month: 7, day: 17, hour: 17, minute: 0, second: 0 });
      const closeAt = atCambodiaTime({
        year: 2026,
        month: 7,
        day: 17,
        hour: ORDER_WINDOW_CLOSE_HOUR,
      });
      expect(getMsUntilOrderWindowChange(now)).toBe(closeAt.getTime() - now.getTime());
    });

    it("returns ms until next-day open when window is closed after close hour", () => {
      const now = atCambodiaTime({ year: 2026, month: 7, day: 17, hour: 19, minute: 0, second: 0 });
      const openAt = atCambodiaTime({
        year: 2026,
        month: 7,
        day: 18,
        hour: ORDER_WINDOW_OPEN_HOUR,
      });
      expect(getMsUntilOrderWindowChange(now)).toBe(openAt.getTime() - now.getTime());
    });

    it("returns ms until same-day open when window is closed before open hour", () => {
      const now = atCambodiaTime({ year: 2026, month: 7, day: 17, hour: 4, minute: 0, second: 0 });
      const openAt = atCambodiaTime({
        year: 2026,
        month: 7,
        day: 17,
        hour: ORDER_WINDOW_OPEN_HOUR,
      });
      expect(getMsUntilOrderWindowChange(now)).toBe(openAt.getTime() - now.getTime());
    });

    it("never returns a negative value", () => {
      const now = atCambodiaTime({ year: 2026, month: 7, day: 17, hour: 12 });
      expect(getMsUntilOrderWindowChange(now)).toBeGreaterThan(0);
    });

    it("returns a positive fallback at the exact close boundary", () => {
      const now = atCambodiaTime({ year: 2026, month: 7, day: 17, hour: 18 });
      expect(getMsUntilOrderWindowChange(now)).toBeGreaterThan(0);
    });
  });
});
