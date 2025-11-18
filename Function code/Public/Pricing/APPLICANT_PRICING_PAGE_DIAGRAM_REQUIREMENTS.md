# Applicant Pricing Page - Components & Requirements for Sequence & Class Diagrams

## Overview

The Applicant Pricing page (`src/app/(applicant)/pricing/page.tsx`) combines
marketing sections (`PricingHero`, `FeatureComparison`, `FAQ`) with the
interactive `PricingCards` component that hooks into BetterAuth subscriptions.
Applicants can inspect plans, initiate upgrades, or cancel existing
subscriptions directly from this page.

---

## 1. PAGE COMPOSITION

- **`PricingHero`** – animated headline and supporting text that introduces the
  pricing section.
- **`PricingCards`** – interactive cards for Free, Standard, and Premium plans,
  with CTA buttons wired to subscription logic.
- **`FeatureComparison`** – table that compares included features/limits per
  plan (static data inside component).
- **`FAQ`** – collapsible questions related to billing and access.

All sections share a minimal page shell that sets `min-h-screen` and white
background.

---

## 2. PRICINGCARDS DETAILS (`src/components/pricing/PricingCards.tsx`)

### 2.1 Hooks & Services

- **`useSubscription`** – provides `subscriptions`, `currentPlan`,
  `canUpgradeTo`, `upgradeSubscription`, `cancelSubscription`, `loading`,
  `isAuthenticated`.
- **`useRouter`** – used to redirect unauthenticated users to `/signup` before
  attempting upgrades.
- Local state: `upgrading`, `cancelling`, `showSubscriptionModal`,
  `showCancelModal`, `pendingPlanId` manage confirm/cancel flows.

### 2.2 Plan Definitions

- Static `plans` array includes plan metadata (name, planId, price, description,
  features, limits, button text, “popular” flag).
- Limits align with `plan-limits.ts` definitions and surface to the UI for user
  clarity.

### 2.3 Actions

- **Upgrade:**
  1. If not authenticated → `router.push('/signup')`.
  2. If target plan is `free` → exit early (already on free tier).
  3. If an active paid subscription exists, show modal prompting to cancel
     first.
  4. Otherwise call `upgradeSubscription(planId)` and handle errors via hook
     (with local `upgrading` spinner).

- **Cancel:** When modal is confirmed, call
  `cancelSubscription(activeSubscription.id)` before invoking
  `upgradeSubscription` for the pending plan.

- **Modal:** `Modal` component warns that only one paid subscription can be
  active; user can proceed to cancel or keep existing plan.

### 2.4 UI States

- Buttons display “Processing...” states while `upgrading` or `cancelling` match
  respective plan IDs.
- Disabled states prevent duplicate submissions.
- Free plan CTA simply encourages signup (“Get Started Free”).

---

## 3. DATA FLOW

1. `useSubscription` fetches current subscriptions (BetterAuth
   `authClient.subscription.list`).
2. `currentPlan` determines which card shows “Current Plan” styling (handled
   inside component through `currentPlan` comparisons).
3. When user clicks a CTA, `handleUpgrade` checks authentication and active
   subscription state to decide whether to call the API or show the modal.
4. On successful upgrade/cancel, `useSubscription` refetches, refreshing button
   states.

---

## 4. EXTENSIONS

- Surface plan limits visually (progress bars for applications/scholarships)
  using `plan-limits.ts` helpers.
- Implement `showCancelModal` to allow cancellation without selecting a new
  plan.
- Add plan interval toggles (monthly/yearly) similar to the institution payment
  page.
