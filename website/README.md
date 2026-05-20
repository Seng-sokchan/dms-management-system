# DMS Mobile — APK download site

Static landing page for distributing the Android release APK.

## Folder layout

```
website/
├── index.html
├── style.css
├── i18n.js
├── icon.png
└ app.apk      ← generated (not in git)
```

The page supports **English** and **ខ្មែរ** via the language switcher (preference is saved in the browser).

## Build and publish APK

From the `mobile-app` directory:

```powershell
npm run android:release
npm run website:apk
```

This copies `android/app/build/outputs/apk/release/app-release.apk` to `website/app.apk`.

## Preview locally

From the repo root:

```powershell
npx serve website
```

Open the URL shown in the terminal, then use **Download APK** on a phone or emulator.

## Deploy

`app.apk` is gitignored. When uploading to a host, include the full `website/` folder (HTML, CSS, icon, and the built `app.apk`).

## Bump version

Update the `version` strings in `i18n.js` (English and Khmer) when you change `mobile-app/package.json`.
