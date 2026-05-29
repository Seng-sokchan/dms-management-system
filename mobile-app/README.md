# DMS App (Android, no Expo)

React Native CLI app for **Customer** users:
- Login / logout
- Item list
- Add to cart
- Pre-order from cart
- Popup sample QR code after pre-order

## Backend API requirements

This app uses your existing backend endpoints:
- `POST /auth/login`
- `GET /users/me`
- `GET /items`
- `POST /orders`

Default base URL is configured in `src/config/appConfig.js`:

```js
export const API_BASE_URL = "http://10.0.2.2:4000/v1";
```

`10.0.2.2` is correct for Android emulator to reach host machine localhost.

## Customer id note

Order creation requires `customerId`. The app resolves this from existing `/orders` data.

If your customer has no orders yet, set the fallback manually in `src/config/appConfig.js`:

```js
export const FALLBACK_CUSTOMER_ID = "YOUR_CUSTOMER_ID";
```

## Run on Android

From `mobile-app`:

```sh
npm install
npm start
```

In a second terminal:

```sh
npm run android
```

## Manual test checklist

1. Login with a `Customer` account.
2. Verify item list loads.
3. Add multiple items to cart.
4. Change quantities and remove item in cart.
5. Tap `Pre-Order` and verify API success.
6. Verify QR modal appears with sample QR code.
7. Close QR modal and confirm navigation returns to items.
8. Logout and confirm session is cleared.

## Commands

- Lint: `npm run lint`
- Tests: `npm test -- --watch=false`
