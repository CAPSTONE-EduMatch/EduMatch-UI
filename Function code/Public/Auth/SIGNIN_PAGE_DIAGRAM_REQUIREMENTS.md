# Sign In Page - Components & Requirements for Sequence & Class Diagrams

## Overview

`src/app/(public)/signin/Signin.tsx` renders the main authentication experience
for applicants and institutions. It combines the marketing layout from
`AuthLayout` with a credentials form, Google/One Tap hooks, email-verification
OTP modal, and an embedded “forgot password” flow. The page orchestrates
multiple BetterAuth endpoints and uses Axios to detect whether the user already
has a profile so it can redirect accordingly.

---

## 1. FRONTEND COMPONENTS

### 1.1 Layout & Form

- **`AuthLayout`** – shared layout that splits the screen into hero imagery
  (LEFT_IMAGE) and the form panel.
- **`Input`**, **`PasswordField`**, **`GoogleButton`**, **`Button`** components
  – build the credential form with animations via `framer-motion`.
- Validation errors stored in the `errors` object; disabled states while
  `isLoading` true.

### 1.2 Modals

- **Forgot Password Modal** – `Modal` toggled by `showForgotPassword`; collects
  email and calls `authClient.requestPasswordReset` with cooldown logic.
- **OTP Verification Popup** – `Modal` toggled by `showOTPPopup`; collects
  6-digit code for verifying email before login completes. Includes resend
  timers and local storage persistence so cooldown survives refresh.

### 1.3 Animations & UX

- `motion` variants (`containerVariants`, `itemVariants`, `fadeIn`) animate form
  entry and button states.
- Countdown timers for OTP resend and forgot-password throttling managed via
  `setInterval` inside `useEffect` hooks.

---

## 2. AUTH & SERVICE INTERACTIONS

### 2.1 Session & Redirect Check

- On mount, `authClient.getSession()` is called; if a user already has an active
  session, `checkProfileAndRedirect()` runs.
- `checkProfileAndRedirect` uses `axios.get('/api/profile')` to determine
  whether the user has an applicant/institution profile and routes to
  `/profile/view`, `/profile/create`, or `/explore` accordingly.

### 2.2 Email/Password Sign In

1. User submits email/password.
2. `authClient.signIn.email({ email, password, callbackURL })` executes inside
   `handleSubmit`.
3. Response cases:
   - Success → call `checkProfileAndRedirect`.
   - `requiresVerification` → open OTP modal and send verification OTP.
   - Errors populate `errors.email`/`errors.password`.

### 2.3 Email Verification OTP

- Uses
  `authClient.emailOtp.sendVerificationOtp({ email, type: 'email_sign_in' })` to
  send codes.
- Verification via
  `authClient.emailOtp.verifyEmail({ email: pendingEmail, otp })`; on success,
  closes modal and reattempts sign-in.
- Resend cooldown stored in `localStorage` (`otpCooldownEnd`,
  `otpCooldownEmail`) to throttle requests.

### 2.4 Forgot Password Flow

- `authClient.requestPasswordReset({ email })` initiates reset emails.
- Cooldown enforced via `forgotPasswordCooldown` + `localStorage` entries
  (`forgotPasswordCooldownEnd`).
- Modal surfaces success/error messages in `forgotPasswordStatus` and disables
  repeated submissions until cooldown expires.

### 2.5 Google / One Tap

- `GoogleButton` handles OAuth sign-in (component-level logic).
- `authClient.oneTap` invoked when `handleGoogleOneTap` runs (wired near the
  button) to support Google One Tap sign-in.

---

## 3. STATE MANAGEMENT

- Form state: `email`, `password`, `showPassword`, `errors`, `isLoading`.
- OTP state: `otpDigits`, `showOTPPopup`, `pendingEmail`, `OTPError`,
  `isOTPLoading`, `resendCountdown`, `canResend`.
- Forgot password state: `showForgotPassword`, `forgotEmail`,
  `forgotPasswordStatus`, `forgotPasswordCooldown`, `canSendForgotPassword`,
  `hasSubmittedForgotEmail`.
- Animation state: `animateForm` toggles initial opacity transitions.

---

## 4. USER FLOW

1. User lands on `/signin`; animations reveal the form.
2. If a BetterAuth session exists, `checkProfileAndRedirect` sends them to the
   correct dashboard immediately.
3. User enters credentials and clicks “Sign In”.
4. `authClient.signIn.email` runs:
   - If success → profile check and redirect.
   - If verification required → OTP modal opens, sending verification OTP.
5. User enters OTP; `verifyEmail` confirms and closes modal, after which sign-in
   retriggers.
6. Optionally, they can open “Forgot password”, request reset email (respecting
   cooldown), and close the modal.

---

## 5. ERROR & EDGE CASES

- All async handlers wrap in try/catch; errors stored in `errors` or `OTPError`
  and displayed near fields.
- Both cooldown timers clear `localStorage` when time elapses to avoid stale
  states.
- `authClient` errors (401/verification) mapped to friendly text for better UX.
