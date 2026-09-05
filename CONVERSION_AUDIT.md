# HTML/CSS/JavaScript → React conversion audit

Source of truth: original `html/`, `css/`, and `js/` project.

| Original source | React target | Status |
|---|---|---|
| `html/dashboard.html` + `css/dashboard.css` + `js/dashboard.js` | `src/pages/Dashboard.jsx` + `src/styles/dashboard.css` | Converted; Chart.js charts restored |
| `html/merchants.html` + `js/merchants.js` | `src/pages/Merchants.jsx` | React state filters retained; CSV export restored |
| `html/stores.html` + `js/stores.js` | `src/pages/Stores.jsx` | React filtering/refresh/navigation retained |
| `html/add-store.html` + `js/add-store.js` | `src/pages/AddStore.jsx` | Dynamic store blocks, validation, add/remove and renumbering implemented |
| `html/add-merchant.html` / `edit-merchant.html` + `js/merchant-form.js` | `src/pages/AddMerchant.jsx` | Multi-step state/validation/review/edit flow implemented |
| `html/merchant-store-details.html` + `js/merchant-store-details.js` | `src/pages/MerchantStores.jsx` | Merchant/store rendering and navigation implemented |
| `html/users.html` + `js/users.js` | `src/pages/Users.jsx` | React CRUD state, filters, password/PIN/photo handling retained |
| `html/pos-configuration.html` + `js/pos-configuration.js` | `src/pages/PosConfiguration.jsx` | React tabs and role creation/deletion implemented |
| `html/login.html` + `js/login.js` | `src/pages/Login.jsx` | React form/show-password behavior implemented |
| shared sidebar/header JS behavior | `src/layouts/AppLayout.jsx`, `src/components/Sidebar.jsx`, `src/components/Header.jsx` | React state/navigation |

## Dashboard JavaScript restored

`js/dashboard.js` created:
- 2 KPI mini line charts used by the dashboard HTML (merchant/store cards)
- Sales Overview line chart
- Synchronization Status doughnut chart
- Device Status doughnut chart
- original labels, values, colors, gradients, tooltip formatter, axes, tension, fill, point styling and responsive options
- refresh spinner/disabled state
- `/` keyboard shortcut to focus global search

## Required packages

Add:
- `chart.js`
- `react-chartjs-2`

Install with:

```bash
npm install
```

or explicitly:

```bash
npm install chart.js react-chartjs-2
```

## Run

```bash
npm install
npm run dev
```

Then open the Vite URL shown in the terminal.

## Important verification note

The conversion was checked statically against the supplied source files. A production build could not be completed in this environment because the package installation step timed out while fetching the newly required Chart.js packages. The React source and `package.json` therefore include the required dependencies, but the final browser/build verification should be run after `npm install` completes successfully.
