const fs = require("fs");
const path = require("path");

const source = path.join(
  __dirname,
  "..",
  "android",
  "app",
  "build",
  "outputs",
  "apk",
  "release",
  "app-release.apk"
);
const dest = path.join(__dirname, "..", "..", "website", "app.apk");

if (!fs.existsSync(source)) {
  console.error(
    "Release APK not found at:\n  " +
      source +
      "\n\nRun first: npm run android:release"
  );
  process.exit(1);
}

fs.mkdirSync(path.dirname(dest), { recursive: true });
fs.copyFileSync(source, dest);

const sizeMb = (fs.statSync(dest).size / (1024 * 1024)).toFixed(2);
console.log("Copied release APK to website/app.apk (" + sizeMb + " MB)");
