# Admin Post Detail - Components & Requirements for Sequence & Class Diagrams

## Overview

`/admin/posts/[id]` renders a unified review experience for any post submitted
by institutions. The wrapper component detects the post type then mounts one of
three rich detail views:

- **Program detail** (`AdminProgramDetail`)
- **Scholarship detail** (`AdminScholarshipDetail`)
- **Research lab detail** (`AdminResearchLabDetail`)

Each variant loads data from `/api/admin/posts/:id`, reuses explore/applicant UI
pieces to preview how the listing appears publicly, and layers moderation
controls (approve, reject, require updates) plus applicant-facing actions
(apply, wishlist, file upload) for QA validation.

---

## 1. ROUTER SWITCHER (`AdminPostDetail`)

- Uses `useParams` to read `id`, fetches the type (currently mocked as
  `'Program'`; replace with `/api/admin/posts/:id/type`).
- While loading, shows a full-screen spinner; unknown types return an error
  message.
- Delegates to the appropriate detail component once type determined.

---

## 2. PROGRAM DETAIL (`AdminProgramDetail`)

### 2.1 Key Components & UI

- Integrates hero carousel, info sidebar, requirement accordion, institution
  summary, related scholarships, and admin modals.
- Uses `Breadcrumb`, `ProgramCard`, `ScholarshipCard`, `Modal`,
  `ApplicationUpdateResponseModal`, `ErrorModal`, `Pagination`, and `Button`
  components from `@/components/ui`.
- Tab set includes Overview, Requirements, Institution, FAQ, and Manage
  Documents (with upload inputs bound to document types).

### 2.2 Hooks & Services

- **`useFileUpload`** – uploads supporting documents to S3 (category
  `application-documents`).
- **`useWishlist`** – loads wishlist items for toggle buttons; ensures admin can
  test wishlist flows.
- **`useNotification`** – surfaces success/error toasts when actions complete.
- **`useAuthCheck`** – verifies session; determines whether to show auth modal
  before applying/wishlisting.
- **`useApiWrapper`** – wraps fetches with standardized error handling (e.g.,
  for update requests).
- **`applicationService`** – used for:
  - `getApplications({ postId })` – check if the reviewer already applied while
    testing the flow.
  - `submitApplication` – simulate application submission to validate the
    listing.

### 2.3 API Calls

- `GET /api/admin/posts/:id` – core data (post, institution, requirements,
  timeline, update requests) mapped into local `currentProgram` state.
- `GET /api/explore/scholarships/by-institution?institutionId=...` – fetches
  related scholarships with pagination for cross-promotion carousel.
- `POST /api/applications` via `applicationService.submitApplication` – used
  when “Apply Now” is triggered inside the admin preview (mirrors applicant flow
  but authenticates as current admin user).
- `POST /api/applications/:applicationId/update-request` (via `apiWrapper`) –
  create manual update requests (Require Update modal).
- `POST /api/admin/posts/:id` (various actions) – publish, reject, request
  updates; responses show success toasts.

### 2.4 State Highlights

- `currentProgram`, `hasApplied`, `isApplying`, `isCheckingApplication`,
  `applicationStatus`, `applicationId` for application testing.
- `uploadedFiles`, `showManageModal`, `showDeleteConfirmModal` for file uploads.
- Admin modals: `showRejectModal`, `showRequirementsModal` collect
  reasons/notes.
- Pagination states for related scholarships.

### 2.5 Flow Summary

1. Fetch program detail and map subdiscipline data for UI compatibility.
2. If an institution is linked, fetch their scholarships for the related slider.
3. Allow reviewer to upload sample documents; `useFileUpload` returns signed
   URLs which are appended to local `uploadedFiles`.
4. Reviewer can toggle wishlist (calls `/api/wishlist` via hook) or attempt to
   apply (calls `/api/applications`).
5. Admin-specific actions (publish, reject, require update) open modals;
   submissions use `useApiWrapper` to POST to admin endpoints.

---

## 3. SCHOLARSHIP DETAIL (`AdminScholarshipDetail`)

- Shares much of the explore scholarship UI (tabs for details, eligibility,
  requirements) with admin-only modals for reject/require-update.
- Hooks: `useAuthCheck`, `useWishlist` for wishlist toggles; manages
  `eligibilityFilters`, `eligibilityPrograms`, and pagination for listing
  matching programs.
- API interactions:
  - `GET /api/admin/posts/:id` for scholarship data.
  - `GET /api/explore/programs/by-scholarship` (future) – currently stubbed by
    `mockScholarships`; plan to replace with actual endpoint once available.
  - Wishlist toggles use `/api/wishlist/toggle` through `useWishlist`.
- Admin modals mirror program detail; `rejectReason` and
  `additionalRequirements` captured and submitted to `/api/admin/posts/:id` with
  action-specific payloads.

---

## 4. RESEARCH LAB DETAIL (`AdminResearchLabDetail`)

- Previews research lab opportunities, showing job description,
  responsibilities, requirements, compensation, and contact info.
- Derives lab-specific fields (research areas, facility info, contract type)
  from the admin API response and normalizes them for UI reuse.
- Hooks: `useWishlist`, `useAuthCheck` for toggles/auth modal.
- API calls: `GET /api/admin/posts/:id` only (no secondary fetches yet).
- Admin controls: modals for rejection/requirements, ability to simulate
  apply/wishlist to ensure listing works.

---

## 5. CROSS-CUTTING CONCERNS

- **Authentication:** Admins must already be authenticated (handled by `/admin`
  layout). Detail components still check `useAuthCheck` to decide whether to
  show the auth modal before running applicant-style flows.
- **Notifications:** `useNotification.showSuccess/showError` centralize toast
  messaging for applies, uploads, and admin actions.
- **File Uploads:** `useFileUpload` requires an upload API that issues signed
  URLs; configuration uses category `application-documents`.
- **Modals:** All modals share consistent props (`isOpen`, `onClose`,
  `onConfirm`). Admin-specific modals ensure reasons are captured and passed to
  the API payloads.

---

## 6. SEQUENCE SUMMARY

1. Admin visits `/admin/posts/:id`.
2. `AdminPostDetail` resolves type (initially mocked) and renders the
   corresponding component.
3. Component fetches data from `/api/admin/posts/:id`; handles loading/error
   states.
4. Reviewer interacts with tabs, uploads files, tests wishlist/application
   flows.
5. When ready, admin action buttons trigger POST requests (publish, reject,
   require update) and the UI surfaces success/error notifications.
6. Navigation back to `/admin/posts` handled by breadcrumbs or browser history.
