const fs = require("fs");
const path = require("path");

const sharp = require("sharp");

const ROOT = path.join(__dirname, "..");
const LOGO_SVG = path.join(ROOT, "assets", "images", "logo.svg");

const ANDROID_SIZES = {
  "mipmap-mdpi": 48,
  "mipmap-hdpi": 72,
  "mipmap-xhdpi": 96,
  "mipmap-xxhdpi": 144,
  "mipmap-xxxhdpi": 192,
};

const IOS_ICONS = {
  "Icon-App-20x20@2x.png": 40,
  "Icon-App-20x20@3x.png": 60,
  "Icon-App-29x29@2x.png": 58,
  "Icon-App-29x29@3x.png": 87,
  "Icon-App-40x40@2x.png": 80,
  "Icon-App-40x40@3x.png": 120,
  "Icon-App-60x60@2x.png": 120,
  "Icon-App-60x60@3x.png": 180,
  "Icon-App-1024x1024@1x.png": 1024,
};

async function renderIcon(size) {
  const padding = Math.round(size * 0.08);
  const inner = size - padding * 2;

  return sharp(LOGO_SVG)
    .resize(inner, inner, { fit: "contain", background: { r: 255, g: 255, b: 255, alpha: 1 } })
    .extend({
      top: padding,
      bottom: padding,
      left: padding,
      right: padding,
      background: { r: 255, g: 255, b: 255, alpha: 1 },
    })
    .png()
    .toBuffer();
}

async function writeAndroidIcons() {
  const resDir = path.join(ROOT, "android", "app", "src", "main", "res");

  for (const [folder, size] of Object.entries(ANDROID_SIZES)) {
    const outDir = path.join(resDir, folder);
    fs.mkdirSync(outDir, { recursive: true });

    const png = await renderIcon(size);
    await fs.promises.writeFile(path.join(outDir, "ic_launcher.png"), png);
    await fs.promises.writeFile(path.join(outDir, "ic_launcher_round.png"), png);
  }
}

async function writeIosIcons() {
  const outDir = path.join(ROOT, "ios", "MobileApp", "Images.xcassets", "AppIcon.appiconset");
  fs.mkdirSync(outDir, { recursive: true });

  for (const [filename, size] of Object.entries(IOS_ICONS)) {
    const png = await renderIcon(size);
    await fs.promises.writeFile(path.join(outDir, filename), png);
  }
}

async function main() {
  if (!fs.existsSync(LOGO_SVG)) {
    throw new Error(`Logo not found: ${LOGO_SVG}`);
  }

  await writeAndroidIcons();
  await writeIosIcons();
  console.log("Launcher icons generated from assets/images/logo.svg");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
