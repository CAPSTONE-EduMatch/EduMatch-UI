# Admin Post List - Components & Requirements for Sequence & Class Diagrams

## Overview

`src/app/admin/posts/page.tsx` provides an admin-facing table for browsing all
institution posts (programs, scholarships, jobs, research labs). The page shows
aggregate statistics, exposes filters (search, status, type, sort), and routes
to detail pages. Data is powered by the `useAdminPostManagement` hook that talks
to `/api/admin/posts`.

---

## 1. FRONTEND COMPONENTS

### 1.1 `AdminPostsPage`

- Wraps the whole screen with header, stat cards, filters, and table.
- Uses `motion.div` for fade-in animations.
- Handles navigation to `/admin/posts/[id]` via `router.push` from the table’s
  action column.

### 1.2 UI Building Blocks

- **`Card`, `CardContent`** – display top-line stats (total, published, closed
  posts).
- **`SearchAndFilter`**
  (`@/components/profile/institution/components/SearchAndFilter`)
  - Repurposed to provide search input, status dropdown, sort toggles, and type
    filters for the admin API.
- **`AdminTable`** (`@/components/admin/AdminTable`)
  - Receives `data`, `columns`, and pagination metadata to render a responsive
    table with tooltips.
  - `columns` definitions include custom renderers for status chips, posted
    date, type, and “View Details” button.

### 1.3 Styling & Icons

- `lucide-react` icons (`Users`, `ChevronRight`) emphasise stats and actions.

---

## 2. HOOKS & DATA FETCHING

### 2.1 `useAdminPostManagement` (`src/hooks/admin/useAdminPostManagement.tsx`)

- Maintains `filters` state (search, status, type, sortBy, sortDirection,
  pagination) and exposes `updateFilters`, `changePage`, `resetFilters`.
- Fetches posts via `GET /api/admin/posts` with query parameters derived from
  filters.
- Exposes `posts`, `stats`, `pagination`, `isLoading`, `error`, and
  `updateStatus` (for PATCHing status, even though this page currently only
  reads data).
- Uses TanStack Query for caching responses with a 30-second stale time.

### 2.2 Table Interaction Flow

1. Initial mount uses default filters (newest first) to request posts.
2. Search input updates `filters.search` (trimmed) and triggers refetch.
3. Status filter maps to `status=<PostStatus>` or `status=all`.
4. Type filter toggles between `Program`, `Scholarship`, and `Job` by calling
   `updateFilters({ type })`.
5. Sort change toggles `sortDirection` between `desc` (newest) and `asc`
   (oldest) while keeping `sortBy='create_at'`.
6. Pagination uses `AdminTable` calls to `changePage` which updates filter state
   and triggers fetch.

---

## 3. API CONTRACTS

- **GET `/api/admin/posts`** – returns
  `{ success, posts, stats, pagination, filters }` as defined in the hook. Each
  post contains `id`, `title`, `status`, `postedBy`, `type`, `postedDate`, etc.
- **PATCH `/api/admin/posts`** – optional action invoked from
  `useAdminPostManagement.updateStatus` when statuses need to change.

All requests require admin authentication; errors propagate through the hook’s
`error` property (page currently displays empty state text via `AdminTable`).

---

## 4. NAVIGATION FLOW

1. User selects filters and reviews table results.
2. Clicking “View Details” pushes to `/admin/posts/${post.id}` which renders the
   consolidated detail experience (Program/Scholarship/Research components).

---

## 5. EXTENSION NOTES

- Replace mock `Card` metrics with API-driven stats (currently `stats` from hook
  already includes total/published/closed; ensure API returns up-to-date
  counts).
- Consider wiring `updateStatus` to inline status dropdowns for faster
  moderation.
- Add error banners when `useAdminPostManagement.error` is non-null to mirror
  other admin pages.
