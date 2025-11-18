# Admin User Management - Components & Requirements for Sequence & Class Diagrams

## Overview

The Admin User Management page (`src/app/admin/users/page.tsx`) lets admins
switch between applicant, institution, and admin users, filter the list, view
details, and create new admin accounts. It combines the `UserManagementTable`
data grid with a modal form that provisions BetterAuth admin users.

---

## 1. FRONTEND COMPONENTS

### 1.1 Page Shell

- **`AdminUserManagement`** – Client component that drives tab selection, modal
  visibility, and hydration state.
- Renders a hero header with CTA (`Add Admin`) that opens the admin-creation
  modal when the “Admins” tab is active.
- Wraps the table in a `motion.div` for enter animations and ensures SSR safety
  using `isClient`.

### 1.2 Data Table

- **`UserManagementTable`** (`src/components/admin/UserManagementTable.tsx`)
  - Accepts `userType` and `onViewDetails` props.
  - Provides search, status filters, sort controls, and pagination around the
    `useAdminUserManagement` hook.
  - Debounces search input, renders `SearchAndFilter`, and delegates row actions
    to the parent for routing (to `/admin/users/[id]` or
    `/admin/institutions/[id]`).

### 1.3 Modal & Form Controls

- **`Modal`** (`@/components/ui/modals/Modal`) wraps the Create Admin form.
- **`Input`, `Button`** components handle text fields and actions.
- **`PasswordCriteriaChecker`** shows password requirements; the form disables
  submission until criteria are satisfied.
- Includes password visibility toggle icons (`Eye`, `EyeOff`).

### 1.4 Routing & Navigation

- `useRouter` is used to navigate to detail pages based on current tab
  (`/admin/users/[id]` for applicants/admins, `/admin/institutions/[id]` for
  institutions).

---

## 2. HOOKS & STATE MANAGEMENT

### 2.1 `useAdminUserManagement`

- Located at `src/hooks/admin/useAdminUserManagement.tsx`.
- Uses TanStack Query to call `/api/admin/users` with filters (search, status,
  sort, role, userType, pagination).
- Exposes `users`, `loading`, `error`, `pagination`, `updateFilters`, `setPage`,
  and mutations (`banUser`, `unbanUser`, `removeUser`).
- Server expects JSON with `success`, `users`, and pagination metadata.

### 2.2 Local State

- `activeTab` toggles between applicant/institution/admin lists.
- Modal form state (`formData`, `showPassword`, `passwordCriteria`,
  `passwordIsValid`) ensures validations before calling BetterAuth APIs.
- `isCreateModalOpen`, `isLoading`, `error`, `success` manage modal UX.
- `isClient` prevents rendering before hydration to avoid mismatches.

---

## 3. AUTH & SERVICE INTEGRATIONS

- **BetterAuth Admin API** (`authClient.admin.createUser`) provisions admin
  accounts inside the modal. The method returns `{ data, error }`; errors
  surface in the modal.
- **BetterAuth Session** (implicit) – gating to ensure only signed-in admins
  access the page (enforced via layout & middleware). No explicit call here, but
  the modal leverages BetterAuth context.
- **User Detail Navigation** – clicking table rows calls `/admin/users/[id]` or
  `/admin/institutions/[id]`, which in turn hit `/api/admin/users/:id` or
  `/api/admin/institutions/:id`.

---

## 4. USER FLOW

1. **Hydration** – Spinner renders until `isClient` is true.
2. **Tab Selection** – Buttons update `activeTab`; table requests
   `/api/admin/users?userType=<tab>` automatically via `useAdminUserManagement`.
3. **Filter/Search** – Input changes debounce to update filters; TanStack Query
   refetches data.
4. **View Details** – `onViewDetails` pushes to the appropriate detail route.
5. **Create Admin** – Clicking “Add Admin” opens modal; on submit,
   `authClient.admin.createUser` runs; success message displays then modal
   auto-closes.

---

## 5. ERROR & EDGE CASES

- Table shows built-in loading/error states handled inside `UserManagementTable`
  (spinners, retry UI).
- Modal displays success/error banners with icons.
- Password validation runs on each keystroke; submission disabled unless
  criteria met.
- Hydration guard ensures SSR-friendly behavior.
