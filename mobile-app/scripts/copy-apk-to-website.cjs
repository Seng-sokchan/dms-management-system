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

const destinations = [
  path.join(__dirname, "..", "..", "website", "app.apk"),
  path.join(__dirname, "..", "..", "frontend", "public", "app.apk"),
];

if (!fs.existsSync(source)) {
  console.error(
    "Release APK not found at:\n  " +
      source +
      "\n\nRun first: npm run android:release"
  );
  process.exit(1);
}

const sizeMb = (fs.statSync(source).size / (1024 * 1024)).toFixed(2);

for (const dest of destinations) {
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.copyFileSync(source, dest);
  console.log("Copied release APK to " + path.relative(process.cwd(), dest) + " (" + sizeMb + " MB)");
}
