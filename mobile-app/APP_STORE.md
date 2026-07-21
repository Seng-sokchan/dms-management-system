# App Store Connect checklist — DMS

Use this when creating the iOS app record and submitting the first build.

## Identity

| Field | Value |
|--------|--------|
| Bundle ID | `com.dmscambodia.app` |
| Display name | DMS |
| Privacy Policy URL | https://dmscambodia.com/privacy |
| Terms of Service | https://dmscambodia.com/terms |
| Support email | admin@dmscambodia.com |

Paste the **Privacy Policy URL** into App Store Connect → App Information → Privacy Policy URL.

## Export compliance

`ITSAppUsesNonExemptEncryption` is set to `false` in `ios/MobileApp/Info.plist` (HTTPS / standard encryption only).

In App Store Connect, answer that the app uses encryption only for standard HTTPS and qualifies for the exemption (unless you later add custom crypto).

## App Privacy (nutrition labels)

Match answers to `ios/MobileApp/PrivacyInfo.xcprivacy` and real collection:

| Data type | Collected | Linked to user | Used for tracking | Purpose |
|-----------|-----------|----------------|--------------------|---------|
| Name | Yes | Yes | No | App Functionality |
| Email Address | Yes (if provided) | Yes | No | App Functionality |
| User ID | Yes | Yes | No | App Functionality |
| Precise Location | Yes | Yes | No | App Functionality |
| Coarse Location | Yes | Yes | No | App Functionality |
| Purchase History | Yes | Yes | No | App Functionality |
| Payment Info | Yes (transaction refs / status via PayWay; not full card numbers) | Yes | No | App Functionality |
| Product Interaction | Yes | Yes | No | App Functionality |

**Tracking:** No (no advertising ID / ATT). Do not declare tracking domains.

**Account deletion:** In-app via Profile → Delete account (`DELETE /users/me`), also described in the Privacy Policy.

## Age rating

Expected questionnaire direction for a B2B distribution / ordering app:

- No unrestricted web browsing, gambling, or mature content
- Infrequent / none for alcohol, tobacco, drugs, violence, sexual content
- Likely **4+** or **9+** depending on Connect questionnaire answers (confirm when filling the form)

## Screenshots (required before review)

Capture on required device sizes in App Store Connect (typically 6.7" and 6.5" iPhone, plus iPad if `TARGETED_DEVICE_FAMILY` includes iPad):

1. Login
2. Customer item list / cart
3. Order tracking map
4. Delivery live tracking (if submitting Delivery role flows)
5. Profile with Privacy / Terms links visible

Use real or demo data that does not expose production customer PII unnecessarily.

## Capabilities not required (current build)

- App Tracking Transparency — no IDFA / ads SDKs
- Sign in with Apple — username/password only
- Background location mode — when-in-use only

## Pre-upload checklist

- [ ] Deploy frontend so `https://dmscambodia.com/privacy` and `/terms` return 200
- [ ] Register bundle ID `com.dmscambodia.app` in Apple Developer
- [ ] Set signing team in Xcode
- [ ] Archive / upload build
- [ ] Fill App Privacy labels as above
- [ ] Confirm export compliance exemption
- [ ] Attach screenshots and age rating
