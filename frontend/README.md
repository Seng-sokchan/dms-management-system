# Frontend (Fix Asset)

React + Vite admin frontend for the Fix Asset order management system.

## Stack

- React 19
- React Router 7
- Axios
- i18next + browser language detector
- Vite 8

## Scripts

- `npm run dev` - start local dev server
- `npm run build` - production build
- `npm run preview` - preview built app
- `npm run lint` - run ESLint

## Local Run

1. Install dependencies:
   - `npm install`
2. Start dev server:
   - `npm run dev`
3. Open the URL shown by Vite (usually `http://localhost:5173`).

> The frontend expects backend APIs under `/v1/*` (default base URL: `http://localhost:4000/v1`).

## Authentication

- If no token exists, app shows the login page.
- JWT is stored in localStorage (`fix-asset-token`).
- On `401`, user is logged out and shown a session-expired message.

## Mobile app download (standalone route)

- `/download-app` — independent public page (routed in `main.jsx`, not part of the admin `App` shell or auth flow).
- APK file: `public/app.apk` (gitignored; copied by `npm run website:apk` in `mobile-app` after `npm run android:release`).
- Optional env: `VITE_MOBILE_APP_VERSION` (defaults to `0.0.1` on the download page).
- No links to/from the login or admin routes; share the URL directly.

## Routing

Admin routes (in `App.jsx`):

- `/overview`
- `/create-order`
- `/catalogs`
- `/items`
- `/producers`
- `/delivery-agents`
- `/orders`
- `/payments`

Redirects:

- `/` -> `/overview`
- `/create` -> `/create-order`

## Main Functional Flow

1. Create catalog in **Catalogs** page.
2. Add items in **Items** page and select catalog for each item.
3. Create order in **New order** using item dropdown.
4. Manage status and delivery confirmation in **Orders**.
5. Record payments in **Payments**.

## UI Notes

- Global shell with sidebar, topbar, language switcher, and flash message.
- Inputs now use visible labels above controls.
- List/table styling updated for a modern card/table look.
- Responsive behavior improved for tablet and mobile breakpoints:
  - Sidebar drawer on smaller screens
  - Denser spacing and compact topbar
  - Better horizontal table handling

## i18n

- Locales: English + Khmer
- Language key is stored as `fix-asset-lang`
- Translation files:
  - `src/locales/en.json`
  - `src/locales/km.json`

## Important Files

- `src/App.jsx` - route mapping + page composition
- `src/components/AdminLayout.jsx` - shared app shell
- `src/hooks/useAdminDashboard.js` - frontend state + actions
- `src/services/adminApi.js` - API calls
- `src/services/authStorage.js` - token persistence
- `src/App.css` - global styles and responsive rules
