export const BASE_WIDTH = 375;
export const BASE_HEIGHT = 812;
export const TABLET_MIN_WIDTH = 600;
export const CONTENT_MAX_WIDTH = 560;
export const MODAL_MAX_WIDTH = 400;

const PHONE_SCALE_MIN = 0.9;
const PHONE_SCALE_MAX = 1.15;
const TABLET_SCALE_MIN = 0.95;
const TABLET_SCALE_MAX = 1.08;

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function isTabletWidth(width) {
  return width >= TABLET_MIN_WIDTH;
}

function widthScaleFactor(width) {
  const raw = width / BASE_WIDTH;
  if (isTabletWidth(width)) {
    return clamp(raw, TABLET_SCALE_MIN, TABLET_SCALE_MAX);
  }
  return clamp(raw, PHONE_SCALE_MIN, PHONE_SCALE_MAX);
}

function heightScaleFactor(height) {
  const raw = height / BASE_HEIGHT;
  return clamp(raw, 0.85, 1.2);
}

/** Scale horizontal sizes (widths, margins, radii). */
export function horizontalScale(size, width) {
  return Math.round(size * widthScaleFactor(width));
}

/** Scale vertical sizes (heights, map min-heights). */
export function verticalScale(size, height) {
  return Math.round(size * heightScaleFactor(height));
}

/** Scale typography with a dampening factor. */
export function moderateScale(size, width, factor = 0.35) {
  const scale = widthScaleFactor(width);
  return Math.round(size + (scale - 1) * size * factor);
}

export function getLayoutMetrics({ width, height }) {
  const isTablet = isTabletWidth(width);
  return {
    isTablet,
    contentMaxWidth: isTablet ? CONTENT_MAX_WIDTH : width,
    modalMaxWidth: Math.min(MODAL_MAX_WIDTH, width - 32),
    windowWidth: width,
    windowHeight: height,
  };
}

export function scaleSpacing(spacing, width) {
  const out = {};
  for (const key of Object.keys(spacing)) {
    out[key] = horizontalScale(spacing[key], width);
  }
  return out;
}

export const FONT_SIZE_SCALES = {
  small: 0.875,
  medium: 1,
  big: 1.125,
};

export function scaleTypography(typography, width) {
  const out = {};
  for (const key of Object.keys(typography)) {
    out[key] = moderateScale(typography[key], width);
  }
  return out;
}

export function applyFontSizeScale(typography, fontSizePreference) {
  const scale = FONT_SIZE_SCALES[fontSizePreference] ?? FONT_SIZE_SCALES.medium;
  const out = {};
  for (const key of Object.keys(typography)) {
    out[key] = Math.round(typography[key] * scale);
  }
  return out;
}

export function scaleRadii(radii, width) {
  const out = {};
  for (const key of Object.keys(radii)) {
    const value = radii[key];
    out[key] = value >= 900 ? value : horizontalScale(value, width);
  }
  return out;
}

/** Semantic component sizes derived from window dimensions. */
export function getSemanticSizes({ width, height }) {
  const mapMinHeight = Math.max(200, Math.round(height * 0.22));
  const mapEmbeddedHeight = Math.max(220, Math.round(height * 0.28));
  const touchTarget = horizontalScale(44, width);
  const iconLg = horizontalScale(56, width);
  const iconMd = horizontalScale(32, width);
  const qtyButton = horizontalScale(32, width);
  const qtyButtonSm = horizontalScale(28, width);
  const tabBarHeight = horizontalScale(64, width);
  const tabBarOffset = tabBarHeight + verticalScale(28, height);
  const tabItemMinWidth = horizontalScale(56, width);
  const buttonMinWidth = horizontalScale(140, width);
  const modalButtonMinWidth = horizontalScale(120, width);
  const sheetHandleWidth = horizontalScale(40, width);
  const qrImageSize = horizontalScale(220, width);

  return {
    touchTarget,
    iconLg,
    iconMd,
    qtyButton,
    qtyButtonSm,
    mapMinHeight,
    mapEmbeddedHeight,
    tabBarHeight,
    tabBarOffset,
    tabItemMinWidth,
    buttonMinWidth,
    modalButtonMinWidth,
    sheetHandleWidth,
    qrImageSize,
    qtyText: moderateScale(18, width),
    successIconText: moderateScale(28, width),
    qtyTextSm: moderateScale(16, width),
  };
}
