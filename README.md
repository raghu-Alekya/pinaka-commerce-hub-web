# Pinaka Commerce Hub — React/Vite conversion

This project converts the supplied PCH HTML/CSS/JavaScript application into React + Vite + React Router.

## Run
```bash
npm install
npm run dev
```

## Structure
- `src/components/` reusable Sidebar and Header
- `src/layouts/` AppLayout with shared navigation
- `src/pages/` dashboard, merchants, stores, users, POS configuration and forms
- `src/data/` local mock data
- `src/styles/` migrated source CSS
- `src/assets/` migrated assets

## Main routes
`/login`, `/dashboard`, `/merchants`, `/merchants/new`, `/merchants/:merchantId/edit`, `/merchants/:merchantId/stores`, `/merchants/:merchantId/users`, `/stores`, `/stores/new`, `/pos-configuration`, plus the remaining sidebar routes.

## Preserved flows
Merchant → stores → users → POS configuration; add/edit merchant; add multiple stores; add/edit users with validation and localStorage; POS tabs and role creation/deletion; sidebar collapse/mobile state; dashboard refresh; merchant/store/user filtering.

The original CSS was retained and reused rather than replacing the visual system with a new generic template.

### Local merchant API integration

Start the NestJS merchant service from the backend directory with `node --import tsx apps/merchant-service/src/main.ts`. Configure its database environment as described in the backend setup.

For local React development, set `VITE_API_BASE_URL=/api/v1` and `VITE_API_PROXY_TARGET=http://localhost:3003` in `.env.development.local`, then run `npm run dev`. Existing environment files override the default local proxy. Authentication endpoints still require the configured auth service/reverse proxy; use your combined API proxy when testing login.

Merchant list, create, detail and edit use the existing `/api/v1/merchants` routes. Editing loads saved merchant, store and subscription data. Existing stores are updated and newly added stores are created; existing stores cannot be removed from this form.

For direct browser access, configure backend `CORS_ORIGINS` as a comma-separated list of frontend origins. Production should use the deployed API base URL or same-origin reverse proxy.
