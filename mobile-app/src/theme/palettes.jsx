/** Light palette (default) */
export const lightColors = {
  background: "#F7F7F8",
  backgroundSoft: "#EFEFF2",
  surface: "#FFFFFF",
  surfaceSoft: "#F4F4F6",
  surfaceMuted: "#EFEFF2",
  textPrimary: "#111111",
  textSecondary: "#6B7280",
  textMuted: "#A0A5B0",
  border: "#E8E8ED",
  primary: "#111111",
  primaryPressed: "#2D2D2D",
  onPrimary: "#FFFFFF",
  success: "#16A34A",
  successPressed: "#15803D",
  successSoft: "#DCFCE7",
  warningSoft: "#FEF3C7",
  danger: "#DC2626",
  dangerSoft: "#FEE2E2",
  overlay: "rgba(17, 17, 17, 0.45)",
};

/** Dark palette */
export const darkColors = {
  background: "#0F0F10",
  backgroundSoft: "#1A1A1C",
  surface: "#1E1E21",
  surfaceSoft: "#252528",
  surfaceMuted: "#2C2C30",
  textPrimary: "#F4F4F5",
  textSecondary: "#A1A1AA",
  textMuted: "#71717A",
  border: "#2E2E33",
  primary: "#F4F4F5",
  primaryPressed: "#D4D4D8",
  onPrimary: "#111111",
  success: "#22C55E",
  successPressed: "#16A34A",
  successSoft: "#14532D",
  warningSoft: "#422006",
  danger: "#EF4444",
  dangerSoft: "#450A0A",
  overlay: "rgba(0, 0, 0, 0.6)",
};

export function getFloatingTabBar(colors) {
  return {
    background: colors.surfaceSoft,
    active: colors.textPrimary,
    inactive: colors.textMuted,
  };
}

export function getShadows() {
  return {
    card: {
      shadowColor: "#000000",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.06,
      shadowRadius: 16,
      elevation: 3,
    },
    soft: {
      shadowColor: "#000000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.04,
      shadowRadius: 8,
      elevation: 2,
    },
  };
}
