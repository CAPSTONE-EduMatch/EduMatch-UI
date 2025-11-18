# Admin Payments Dashboard - Components & Requirements for Sequence & Class Diagrams

## Overview

`src/app/admin/payments/page.tsx` gives administrators insight into subscription
revenue and transaction health. It combines KPI cards, a revenue spline chart,
export operations, and a historical invoice table fed by
`/api/admin/payment-stats`, `/api/admin/export-*`, and `/api/admin/invoices`.

---

## 1. FRONTEND COMPONENTS

### 1.1 Page Layout (`PaymentsPage`)

- Guards against SSR mismatches via `isClient` and handles loading/error
  fallbacks.
- Renders header (“Payment Management”), KPI grids, chart section, export panel,
  and `PaymentHistoryTable`.
- Uses `motion.div` to animate the main content.

### 1.2 KPI Cards

- **`PaymentStatCard`** (local helper) accepts title, value, icon, optional
  tooltip/subtitle, and renders using `Card`/`CardContent`.
- Icons: `DollarSign`, `CreditCard`, `Users`, `CheckCircle`, `Clock`, `XCircle`
  (lucide-react).

### 1.3 Chart & Exports

- **`SplineArea`** (`@/components/charts/SplineArea`) plots revenue vs.
  transactions over time; receives `series` and `categories` arrays produced by
  `prepareChartData()`.
- Period selector (All, 7d, 1m, 3m, 6m) updates `selectedPeriod`, triggering a
  re-fetch.
- Export buttons call `handleExportTransactions`/`handleExportStatistics`,
  downloading CSV/TXT blobs from admin APIs.

### 1.4 Payment History Table

- **`PaymentHistoryTable`** (`src/components/payment/PaymentHistoryTable.tsx`)
  - Uses the `useInvoices` hook to page through `/api/admin/invoices`.
  - Displays invoices with date, billing period, payment method, amount, status
    badge, and “View Details” link (hosted Stripe invoice URL).
  - Includes pagination, loading spinner, and retry UI.

---

## 2. DATA FLOW & HOOKS

### 2.1 Local State

- `selectedPeriod`: `'all' | '7d' | '1m' | '3m' | '6m'` – appended to stats &
  export API calls.
- `stats`: `PaymentStats | null` – totals for revenue, transactions,
  subscriptions, and status counts.
- `chartData`: `ChartDataPoint[]` – month, revenue, transaction values for the
  spline chart.
- `loading`, `error`, `exporting` – control UI fallback states.

### 2.2 Fetch Logic (`fetchPaymentStats`)

- Calls **GET `/api/admin/payment-stats?period=${selectedPeriod}`**.
- Expects
  `{ success: true, data: { stats: PaymentStats, chartData: ChartDataPoint[] } }`.
- Sets `stats` and `chartData`; errors show message with retry button.

### 2.3 Export Operations

- **GET `/api/admin/export-transactions?period=...`** – returns CSV; code
  creates a blob, builds a download link, and auto-clicks.
- **GET `/api/admin/export-statistics?period=...`** – returns plain-text report;
  same blob download flow.
- Buttons are disabled while one export is running (`exporting` state).

### 2.4 Invoice Hook (`useInvoices`)

- Located at `src/hooks/subscription/useInvoices.ts`.
- Sends GET `/api/admin/invoices?page=X&limit=Y&status?=&userType?=` (with
  credentials) and returns invoices + pagination.
- Exposes `refetch` for retry, `loading`, and `error` strings used by the table.

---

## 3. USER FLOW

1. Admin visits `/admin/payments`; spinner appears until hydration completes.
2. `fetchPaymentStats(selectedPeriod)` runs; KPI cards and chart populate.
3. Selecting a new period updates `selectedPeriod`, triggering a new fetch.
4. Export buttons download transaction or statistics files.
5. `PaymentHistoryTable` automatically loads invoices for `currentPage`;
   pagination buttons call `setCurrentPage`, causing `useInvoices` to refetch.

---

## 4. ERROR HANDLING

- Stats fetch failure renders an error message with a retry button.
- Export failures show `alert()` with error text.
- `PaymentHistoryTable` surfaces hook errors inline with a retry button.
- Loading states: full-screen spinner while stats load; table-level spinner
  while invoices load.

---

## 5. EXTENSIONS

- Replace `alert` with toast notifications for exports.
- Add filters to `PaymentHistoryTable` (status, userType) by passing props into
  `useInvoices`.
- Integrate role-based checks inside `PaymentsPage` by leveraging `useAdminAuth`
  before fetching data.
