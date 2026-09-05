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
