# Admin Dashboard - Components & Requirements for Sequence & Class Diagrams

## Overview

The Admin Dashboard (`src/app/admin/page.tsx`) gives administrators a
consolidated view of key metrics (users, applications, profit) and provides
quick entry points to management pages. The current implementation renders
animated statistic cards, donut charts, and a revenue line chart using mock
data; production should replace the mock arrays with API-driven metrics
services.

---

## 1. FRONTEND COMPONENTS

### 1.1 Main Page Component

- **`AdminDashboard`**
  - Hydrates on client only to avoid server/DOM mismatches.
  - Renders page header, metric cards, charts, and navigation buttons.
  - Uses `useRouter` to transition to `/admin/users` and `/admin/payments` on
    CTA clicks.

### 1.2 Reusable UI Helpers (defined in same file)

- **`StatCard`** – wraps `Card`/`CardContent`/`CardHeader` from
  `@/components/ui` and displays an icon, title, value, and optional slot
  content.
- **`SimpleDonutChart`** – renders a donut chart via SVG arcs for
  applicant/institution breakdowns.
- **`SimpleLineChart`** – renders revenue trends as an SVG polyline with
  gridlines and point markers.

### 1.3 Libraries & Dependencies

- `framer-motion` animates sections and CTA buttons.
- `lucide-react` icons (Users, GraduationCap, Building2, etc.) highlight card
  context.
- React state hooks manage hydration (`isClient`).

---

## 2. DATA SOURCES & STATE

- `applicantData`, `institutionData`, and `profitData` arrays act as
  placeholders for eventual API payloads.
- `isClient` toggles once `useEffect` runs, preventing chart rendering during
  SSR.
- Future implementation should replace static arrays with results from
  `/api/admin/users/stats`, `/api/admin/applications/stats`, and
  `/api/admin/revenue` (or equivalent services), caching responses per session.

---

## 3. EXPECTED API INTEGRATIONS

Although the current dashboard uses mock data, the intended calls are:

1. **GET `/api/admin/users/stats`** – total users, applicants status breakdown,
   institutions status breakdown.
2. **GET `/api/admin/applications/stats`** – counts of new/review/accepted
   applications.
3. **GET `/api/admin/revenue`** – monthly revenue/profit arrays for the
   `SimpleLineChart`.

Each request should include admin authentication (BetterAuth session) and return
JSON structures that mirror the `StatCard` needs.

---

## 4. USER FLOW

1. **Load** – Admin navigates to `/admin`; dashboard waits for client hydration
   (`isClient`).
2. **Fetch Metrics** – Replace mock data with concurrent fetches (via
   `Promise.all`) to the stats endpoints; update local state with resolved
   payloads.
3. **Render** – Metric cards, donut charts, and line chart display aggregated
   values. Animations play through `motion.div` blocks.
4. **Navigate** – CTA buttons leverage `router.push` to open User Management or
   Payment Management workflows.

---

## 5. ERROR & LOADING STATES

- While `isClient` is false, a centered spinner is shown.
- When wiring APIs, wrap fetches with try/catch and surface failures in
  replacement cards (e.g., “Failed to load metrics” with retry buttons) to
  maintain parity with other admin pages.
