# Google Play Console checklist — DMS

Use this when creating the Android app listing and submitting the first production build (AAB).

## Identity

| Field | Value |
|--------|--------|
| Package name (applicationId) | `com.dmscambodia.app` (must match Play Console forever) |
| Current Gradle `applicationId` | `com.dmscambodia.app` |
| Display name | DMS |
| Privacy Policy URL | https://dmscambodia.com/privacy |
| Terms of Service | https://dmscambodia.com/terms |
| Support email | admin@dmscambodia.com |

Paste the **Privacy Policy URL** into Play Console → App content → Privacy policy.

### Align package name with iOS

iOS uses `com.dmscambodia.app`. Before creating the Play app (package names cannot be changed later), set in `android/app/build.gradle`:

```gradle
namespace "com.dmscambodia.app"
defaultConfig {
    applicationId "com.dmscambodia.app"
    // ...
}
```

Also rename/move the Kotlin/Java package under `android/app/src/main/java/` to match, or keep `namespace` consistent with the existing source package and only change `applicationId` if you understand the split. Prefer one clean rename to `com.dmscambodia.app` before store release.

## Signing (upload key)

Play requires a **release** keystore (not the debug keystore).

1. Generate an upload keystore (keep it and passwords offline / in a secrets vault):

```sh
keytool -genkeypair -v -storetype PKCS12 -keystore dms-upload.keystore -alias dms-upload -keyalg RSA -keysize 2048 -validity 10000
```

2. Add `android/keystore.properties` (do **not** commit; add to `.gitignore`):

```properties
storeFile=../path/to/dms-upload.keystore
storePassword=***
keyAlias=dms-upload
keyPassword=***
```

3. Wire `signingConfigs.release` in `android/app/build.gradle` and use it for `buildTypes.release`.

4. Prefer **Play App Signing** (Google holds the app signing key; you upload with the upload key).

## Build & upload

### Windows path length (important)

This repo path contains spaces (`Mr. Lyheng`), which breaks React Native’s CMake/ninja release build (`Filename longer than 260 characters`).

**Build from a short copy instead:**

```powershell
# One-time / when deps change: sync to short path
robocopy "D:\Mr. Lyheng\Project\app\mobile-app" "C:\rn\dms" /E /XD .git android\.gradle android\build android\app\build android\app\.cxx node_modules\.cache

cd C:\rn\dms\android
.\gradlew.bat clean
.\gradlew.bat bundleRelease
```

AAB output:

`C:\rn\dms\android\app\build\outputs\bundle\release\app-release.aab`

Copy it to the project if you want it under the repo:

`mobile-app\android\app\build\outputs\bundle\release\app-release.aab`

Upload that `.aab` in Play Console → Production (or Internal testing first).

### macOS / Linux / short Windows path

From `mobile-app/android`:

```sh
./gradlew bundleRelease
```

Output: `app/build/outputs/bundle/release/app-release.aab`

Bump before each store release:

| Field | File | Notes |
|--------|------|--------|
| `versionCode` | `android/app/build.gradle` | Integer; must increase every upload |
| `versionName` | same | User-visible, e.g. `1.0.0` |

## Data safety form

Match answers to real collection (same intent as iOS App Privacy / `PrivacyInfo.xcprivacy`):

| Data type | Collected | Shared | Required / optional | Purpose |
|-----------|-----------|--------|---------------------|---------|
| Name | Yes | No (unless required by payment processor as processor) | Required for account | App functionality |
| Email address | Yes (if provided) | No | Optional | App functionality |
| User IDs | Yes | No | Required | App functionality |
| Approximate location | Yes | No | Required for delivery / tracking roles | App functionality |
| Precise location | Yes | No | Required for delivery / tracking roles | App functionality |
| Purchase history | Yes | No | Required for orders/payments | App functionality |
| Payment info | Yes (transaction refs / status via PayWay; not full card numbers) | Shared with PayWay as payment processor | Required for checkout | App functionality |
| App interactions | Yes | No | Optional / diagnostics as applicable | App functionality |

**Data collection:** Yes (account, orders, location for delivery).

**Data encrypted in transit:** Yes (HTTPS to API).

**Users can request deletion:** Yes — in-app Profile → Delete account (`DELETE /users/me`), also described in the Privacy Policy.

**Independent security review:** No (unless you complete one later).

**Advertising / tracking / Ads ID:** No — do not declare advertising ID collection. No ATT-style ads SDKs in current build.

## Permissions (declare honestly)

Declared in `android/app/src/main/AndroidManifest.xml`:

| Permission | Why |
|------------|-----|
| `INTERNET` | API, maps, payments |
| `ACCESS_NETWORK_STATE` | Connectivity checks |
| `ACCESS_COARSE_LOCATION` / `ACCESS_FINE_LOCATION` | Delivery GPS + customer/depot tracking maps |
| `ACCESS_BACKGROUND_LOCATION` | Declared today; **runtime request not implemented** and tracking is when-in-use — remove from the manifest before submission unless you ship a real background-tracking feature and justify it in Play Console |

Also note for review notes: deep links (`dms://payment/...`) and ABA / PayGo package queries are for PayWay checkout return flows.

## Content rating

Complete the IARC questionnaire in Play Console for a B2B ordering / delivery app:

- No unrestricted web browsing, gambling, or mature content
- No alcohol/tobacco sales focus, violence, or sexual content
- Expected rating: **Everyone** / low maturity (confirm when filling the form)

## Store listing assets

Minimum for production (confirm current Play Console requirements):

1. App icon (512×512)
2. Feature graphic (1024×500)
3. Phone screenshots (at least 2; typically 16:9 or 9:16)
4. Optional: 7" / 10" tablet screenshots if you target tablets

Suggested screenshot set (same as iOS):

1. Login
2. Customer item list / cart
3. Order tracking map
4. Delivery live tracking (if submitting Delivery role flows)
5. Profile with Privacy / Terms links visible

Use demo data; avoid production customer PII.

## Short / full description (draft)

**Short (≤80 chars):**  
DMS — order, pay, and track deliveries for your depot network.

**Full (edit to taste):**  
DMS helps customers pre-order products, depots manage fulfillment, and delivery agents navigate live routes. Sign in with your DMS account to browse the catalog, place orders, complete PayWay checkout, and track Ready for Delivery orders on the map. Privacy Policy: https://dmscambodia.com/privacy

## Categories & contact

| Field | Suggestion |
|--------|------------|
| App category | Business or Shopping (pick one primary) |
| Contact email | admin@dmscambodia.com |
| Website | https://dmscambodia.com |

## Capabilities / declarations not required (current build)

- Advertising ID / ads SDKs
- Foreground service for location (unless you add one later)
- Health / SMS / call log sensitive permissions

## Pre-release hardening (do before production)

- [x] Set `applicationId` / package to `com.dmscambodia.app`
- [ ] Release signing + Play App Signing enabled
- [ ] Production `API_BASE_URL` (HTTPS), not emulator `10.0.2.2`
- [ ] Restrict Google Maps API key (Android app restriction: package + SHA-1)
- [ ] Set `android:usesCleartextTraffic="false"` for release (debug-only cleartext if needed)
- [ ] Remove unused `ACCESS_BACKGROUND_LOCATION` **or** implement + declare background location properly
- [ ] Deploy https://dmscambodia.com/privacy and `/terms` (HTTP 200)
- [ ] Internal testing track smoke test (Customer + Delivery + Depot)

## Pre-upload checklist

- [ ] Privacy policy URL set in Play Console
- [ ] Data safety form filled as above
- [ ] Content rating questionnaire completed
- [ ] Target audience / news apps / COVID / etc. declarations answered truthfully
- [ ] Screenshots + feature graphic uploaded
- [ ] AAB signed with upload key; `versionCode` / `versionName` set
- [ ] Countries / pricing selected
- [ ] Submit to Internal testing first, then Production when stable
