# Admin Institution Detail - Components & Requirements for Sequence & Class Diagrams

## Overview

`src/app/admin/institutions/[id]/page.tsx` equips admins with a complete
institution dossier: branding, contact info, subscription status, accreditation
documents, and moderation controls. It mirrors the applicant detail experience
but adds status workflows (approve, deny, require info) and a tabbed interface
for overview/documents/posts.

---

## 1. FRONTEND COMPONENTS

### 1.1 Layout

- **`InstitutionDetailPage`** – client component orchestrating data fetches, tab
  state (`overview`, `documents`, `posts`), and admin actions.
- **`ProfileSidebar`** – same admin sidebar with the “Institution” nav entry
  marked active.
- Left column displays logo, tags, contact info (`Mail`, `Phone`, `Globe`
  icons), address, business hours, and quick action buttons (contact, ban/unban,
  revoke sessions, approve/deny, require info).
- Right column wraps tab content inside `motion.div` for smooth transitions.

### 1.2 Tab Content

- **`InstitutionOverviewTab`** (`@/components/admin/InstitutionOverviewTab`)
  shows registration data, subscription tier, and action buttons for
  approval/denial.
- **`InstitutionDocumentSection`** components (one per document type) list file
  cards with download buttons.
- Placeholder “Posts” tab reserves space for listing institution posts.

### 1.3 Modals

- **`BanUnbanModal`** – collects ban reason/duration.
- **`RequireAdditionalInfoModal`** – sends additional-info request notes.

### 1.4 Dependencies

- `useAdminAuth` ensures admin privileges.
- `useParams`/`useRouter` handle routing.
- `framer-motion` provides entry animations.
- `lucide-react` icons for UI cues (Building2, Mail, Phone, Globe, Download,
  etc.).

---

## 2. API CONTRACTS

### 2.1 Fetch Institution

- **Endpoint:** `GET /api/admin/institutions/:id`
- **Response:** `{ success: boolean; data?: InstitutionDetails }` where data
  includes legal name, abbreviation, type, status, contact channels, documents
  (accreditation, operating license, tax, representative, other), subscription
  info, and ban metadata.

### 2.2 Action Endpoint

- **Endpoint:** `POST /api/admin/institutions/:id/actions`
- **Supported actions:** `contact`, `revoke-sessions`, `ban`, `unban`,
  `approve`, `deny`, `require-info`.
- **Payload examples:**
  - `{ action: 'ban', banReason, banDuration }`
  - `{ action: 'require-info', note }`
  - `{ action: 'approve' }`
- All responses checked with `response.ok`; errors bubble through `alert()`.

---

## 3. STATE MANAGEMENT

- `institutionData`: holds `InstitutionDetails` struct used throughout the UI.
- `activeTab`: `'overview' | 'documents' | 'posts'` toggles between tab panels.
- Action flags: `showBanModal`, `showRequireInfoModal`, `actionLoading` guard
  repeated mutations.
- `loading`, `error`, `isClient`, `adminLoading` control skeletons/spinners.

---

## 4. USER FLOW

1. **Initialization** – `useEffect` sets `isClient` and fetches data when
   `params.id` is available.
2. **Loading/Error** – show spinner until both `useAdminAuth` and fetch
   complete; render error fallback with “Go Back” button when fetch fails.
3. **Overview Tab** – displays profile data plus `InstitutionOverviewTab`, which
   exposes action buttons for approval/denial and reuses
   `handleContactInstitution`/`handleDeactivateInstitution` via props.
4. **Documents Tab** – lists document cards and disables “Download all” when no
   files exist.
5. **Posts Tab** – placeholder messaging; extend later to list posts associated
   with the institution.
6. **Admin Actions** – Buttons call `handleContactInstitution`,
   `handleRevokeSessions`, `handleBanUnban`, `handleApprove`, `handleDeny`,
   `handleRequireInfoConfirm`, each POSTing to `/actions` and refreshing via
   `loadInstitutionData`.

---

## 5. EXTENSIONS & NOTES

- Replace `alert` usage with toast notifications.
- Wire “Download all” to `/api/admin/institutions/:id/documents/download-all`
  once available.
- Implement posts tab by calling `/api/admin/posts?institutionId=...` and
  reusing `AdminTable`.
