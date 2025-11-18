# Reset Password Page - Components & Requirements for Sequence & Class Diagrams

## Overview

`src/app/(public)/forgot-password/ForgotPassword.tsx` implements the password
reset UI. It reads the BetterAuth reset token from the URL, validates the new
password against strength criteria, and submits the update via
`authClient.resetPassword`. Animations and layout mirror other auth pages.

---

## 1. FRONTEND COMPONENTS

- **`ForgotPassword`** – client component rendered at `/forgot-password`.
- UI elements include `PasswordField` (for new password), `Input` (for confirm),
  `Button`, and numerous `framer-motion` animations for hero and panel
  transitions.
- Displays success and error banners using inline text elements.

---

## 2. STATE & VALIDATION

- `newPassword`, `confirmNewPassword`, `showConfirmNewPassword` track user
  inputs.
- `newPasswordIsValid` toggles based on criteria (length, uppercase, lowercase,
  number, special character) managed inside `PasswordField`.
- `errors` object stores validation messages for each field and a `general`
  error.
- `successMessage` indicates completion and triggers redirect to `/signin` after
  2 seconds.
- `token` derived from `window.location.search` on mount; stored in state.

### Validation Flow

1. `validate()` ensures password meets criteria and matches confirm input.
2. If invalid, `errors` is populated and submission halts.
3. On valid input, `handlePasswordReset` calls the API.

---

## 3. API INTEGRATION

- **`authClient.resetPassword({ newPassword, token })`** – BetterAuth endpoint
  that finalizes the reset. Returns `{ error }` on failure.
- Successful calls set `successMessage` and redirect after timeout.
- Errors set `errors.general` and keep the form enabled.

---

## 4. USER FLOW

1. User clicks reset link (from email) and lands on
   `/forgot-password?token=abc123`.
2. Component reads the `token` query param on mount.
3. User enters new password + confirmation.
4. Clicking “Update password” triggers validation and, if valid, calls
   `authClient.resetPassword`.
5. On success, success message displays and window redirects to `/signin` after
   2 seconds.

---

## 5. EXTENSIONS

- Add guard to show error if `token` missing or invalid before user enters data.
- Implement password strength meter to mirror `PasswordCriteriaChecker` from
  other forms.
- Replace inline success/error text with toast components for consistency.
