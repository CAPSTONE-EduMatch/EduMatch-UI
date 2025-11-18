# Admin User Detail - Components & Requirements for Sequence & Class Diagrams

## Overview

`src/app/admin/users/[id]/page.tsx` renders the detailed profile of a specific
applicant (or admin) for disciplinary actions. It loads data from
`/api/admin/users/:id`, shows academic & contact info, lists uploaded documents,
and exposes admin actions (ban/unban, revoke sessions, require contact, etc.)
through dedicated modals.

---

## 1. FRONTEND COMPONENTS

### 1.1 Page Structure

- **`UserDetailPage`** – main client component orchestrating fetches,
  loading/error guards, and action handlers.
- **`ProfileSidebar`** (`@/components/profile/layouts/ProfileSidebar`) – reused
  admin sidebar with nav items (Dashboard, Certifications, Posts, etc.),
  specifying custom styles and disabling navigation protection.
- **Info Panel** – left column card built with `motion.div` for animation;
  displays avatar, academics, contact info, ban status, and action buttons.
- **Documents Panel** – right column uses multiple `DocumentSection` instances
  (research papers, transcripts, degrees, language certificates, CV/resume) with
  download buttons per file.

### 1.2 Modals & Actions

- **`BanUnbanModal`** – collects ban reason/duration and calls `handleBanUnban`.
- **`RevokeSessionsModal`** – confirmation modal to revoke all BetterAuth
  sessions for the user.
- Buttons trigger `handleContactUser`, `handleDeactivateUser`,
  `handleRevokeSessions`, and `handleChangeStatus`.

### 1.3 Dependencies

- `useAdminAuth` ensures the viewer has admin privileges (`isLoading` gating).
- `useParams`, `useRouter` provide routing utilities.
- `lucide-react` icons (MessageCircle, LogOut, Download) support CTA visuals.
- `framer-motion` animates entry of cards and sections.

---

## 2. API INTERACTIONS

### 2.1 Fetch User Details

- **Endpoint:** `GET /api/admin/users/:id`
- **Response:** `{ success: boolean; data?: UserDetails }` where `UserDetails`
  includes profile image, academics, status, documents categorised arrays, ban
  metadata, and contact info.
- **Usage:** `loadUserData` is called on mount and after mutating actions to
  refresh the view.

### 2.2 Perform Actions (`/api/admin/users/:id/actions`)

All actions post JSON payloads with an `action` string:

| Action            | Body Fields                                 | Outcome                                     |
| ----------------- | ------------------------------------------- | ------------------------------------------- |
| `contact`         | `{ action: 'contact' }`                     | Sends contact notification/email to user.   |
| `revoke-sessions` | `{ action: 'revoke-sessions' }`             | Clears BetterAuth sessions (forces logout). |
| `ban`             | `{ action: 'ban', banReason, banDuration }` | Bans user until optional expiration.        |
| `unban`           | `{ action: 'unban' }`                       | Removes ban flags.                          |
| `activate`        | `{ action: 'activate' }`                    | Sets `status` to Active.                    |
| `deactivate`      | `{ action: 'deactivate' }`                  | Marks user as inactive.                     |

Responses are checked for `response.ok`; failures display `alert()`
notifications.

---

## 3. STATE MANAGEMENT

- `userData`: `UserDetails | null` – page snapshot used across sections.
- `loading`, `error`: control spinner vs. error view.
- Action states: `actionLoading`, `showBanModal`, `showRevokeModal` prevent
  duplicate submissions and disable buttons.
- `isClient`: ensures SSR-safe rendering.

---

## 4. USER FLOW

1. **Mount** – `useEffect` sets `isClient` and invokes
   `loadUserData(params.id)`.
2. **Loading State** – spinner renders while `loading` or `useAdminAuth` is
   fetching.
3. **Data Render** – profile + document sections display, download buttons
   disabled when arrays empty.
4. **Admin Actions** – pressing CTA shows modal (ban/unban or revoke). On
   confirm, POST request runs; success triggers `loadUserData` to refresh.
5. **Navigation** – sidebar items change routes using `router.push`; “Go Back”
   falls back via `router.back()` in error state.

---

## 5. EXTENSION POINTS

- Hook up document “Download all” button to
  `/api/admin/users/:id/documents/download-all` once implemented.
- Replace bare `alert()` calls with toasts/notification service for consistent
  UX.
- Consider central action handler service to consolidate fetch logic and error
  mapping across admin detail pages.
