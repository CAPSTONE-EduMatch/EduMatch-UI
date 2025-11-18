# Admin Settings - Components & Requirements for Sequence & Class Diagrams

## Overview

`src/app/admin/settings/page.tsx` lets administrators update their password and
review password requirements. It enforces admin-only access via `useAdminAuth`,
loads the profile via BetterAuth session, and embeds the shared
`PasswordChangeSection` component that already handles field validation and API
calls.

---

## 1. FRONTEND COMPONENTS

### 1.1 `AdminSettingsPage`

- Client component that checks admin rights, fetches profile data, and renders
  the UI once both auth and profile requests complete.
- Header section uses `KeyRound` icon plus descriptive text.
- Main content contains two `Card`s: one for security settings (password form)
  and one listing password requirements.

### 1.2 `PasswordChangeSection`

- Located at `src/components/profile/shared/PasswordChangeSection.tsx`.
- Accepts `profile`, `showPassword`, and `setShowPassword` props.
- Handles old/new/confirm password inputs, strength meter, API calls to
  `/api/user/update-password`, and toast notifications.

### 1.3 UI Dependencies

- `Card`, `CardHeader`, `CardContent`, `CardTitle` from `@/components/ui`.
- `useRouter` for redirecting unauthorized users to `/signin`.

---

## 2. AUTH & DATA FLOW

### 2.1 Admin Verification

- `useAdminAuth` returns `{ isAdmin, isLoading }`.
- `useEffect` watches these flags; when `isLoading` is false and `isAdmin` is
  falsy, the user is redirected to `/signin`.

### 2.2 Profile Fetch

1. `authClient.getSession()` obtains the current BetterAuth session and extracts
   `user.id`.
2. `fetch('/api/profile/${userId}')` retrieves the admin’s profile document to
   feed into `PasswordChangeSection`.
3. Loading states: `loadingProfile` stays true until the profile call finishes;
   combined with `isLoading` to show spinner.

### 2.3 Password Update

- Handled entirely within `PasswordChangeSection`: it POSTs `oldPassword`,
  `newPassword`, `confirmPassword` to `/api/user/update-password`, shows
  success/error states, and clears sensitive values on success.

---

## 3. USER FLOW

1. Navigate to `/admin/settings`.
2. `useAdminAuth` verifies admin status; non-admins are redirected.
3. Session-derived profile fetch populates `PasswordChangeSection` (or shows
   spinner if profile missing).
4. Admin enters new password; section validates and calls the password update
   API.
5. Requirements card remains static, communicating minimum criteria (length,
   uppercase, lowercase, number, special character).

---

## 4. ERROR STATES

- If session retrieval fails or `/api/profile/:id` returns non-OK, the console
  logs the failure and `profile` stays null (password card shows spinner until
  resolved or can be extended to show errors).
- `PasswordChangeSection` itself surfaces inline errors for each field and
  API-level errors near the form.
