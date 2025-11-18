# Sign Up Page - Components & Requirements for Sequence & Class Diagrams

## Overview

`src/app/(public)/signup/Signup.tsx` enables applicants/institutions to create
accounts. It walks users through email/password entry, enforces password
strength, and completes registration through an OTP verification modal powered
by BetterAuth’s email OTP endpoints.

---

## 1. FRONTEND COMPONENTS

- **`AuthLayout`** – shared two-column layout with hero image and content panel.
- **`FormField`** – reusable labeled input component for email.
- **`PasswordField`** – toggles password visibility and surfaces criteria
  feedback.
- **`GoogleButton`** – entry point for Google OAuth signup.
- Animations via `framer-motion` (`containerVariants`, `itemVariants`,
  `fadeIn`).

---

## 2. STATE & VALIDATION

- `email`, `password`, `confirmPassword`, `showPassword`, `errors` – primary
  form state.
- `passwordIsValid` computed from `PasswordField` helper (length, uppercase,
  lowercase, number, symbol) and gating for button disablement.
- OTP state: `showOTPPopup`, `otpDigits`, `OTPError`, `resendCountdown`,
  `canResend`, `globalOtpCooldown`, `lastOtpRequestEmail`.
- Animation toggle `animateForm` ensures fade-in effects on mount.

---

## 3. BETTERAUTH INTEGRATIONS

### 3.1 Send Verification OTP

- `authClient.emailOtp.sendVerificationOtp({ email, type: 'email_sign_up' })` is
  called in `handleSignup` before running the final sign-up step.
- Global cooldown persisted via `localStorage` (`otpCooldownEnd`,
  `otpCooldownEmail`) prevents spamming the endpoint.

### 3.2 Verify OTP & Create User

1. User enters OTP in modal; `handleVerifyOtp` concatenates digits and calls
   `authClient.emailOtp.verifyEmail({ email, otp })`.
2. On success, `authClient.signUp.email({ email, password, callbackURL })` is
   invoked to create the account.
3. After registration, user can be redirected (via callback) or the UI can show
   a success state (to be implemented).

### 3.3 Google / One Tap

- `GoogleButton` handles third-party signup; `authClient` integration is managed
  inside the shared component.

---

## 4. USER FLOW

1. User fills out email/password/confirm password fields.
2. Click “Create account” → `handleSignup` validates inputs (all required,
   password criteria met, passwords match).
3. On success, OTP modal opens and countdown starts (`resendCountdown`).
4. User enters 6-digit code; verifying the OTP triggers
   `authClient.signUp.email`.
5. After successful signup, user should be redirected (via callback) or shown
   success message (extend UI accordingly).
6. Resend OTP button remains disabled until `canResend` is true; timer stored in
   `localStorage` ensures persistence across reloads.

---

## 5. ERROR HANDLING

- Validation errors populate the `errors` object and show beneath inputs.
- OTP errors display inside modal (`OTPError` state).
- API failures (send OTP, verify, sign up) set error messages and stop loading
  spinners.

---

## 6. EXTENSIONS

- Add profile role selection (applicant vs institution) as part of signup and
  include it in the payload once backend supports it.
- Surface success confirmation before redirecting; optionally auto-login after
  signup.
