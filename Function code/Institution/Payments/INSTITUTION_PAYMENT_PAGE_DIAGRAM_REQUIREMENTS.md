# Institution Payment Page - Components & Requirements for Sequence & Class Diagrams

## Overview

`src/app/(institution)/institution/dashboard/payment/page.tsx` is the
subscription hub for institution users. It determines whether the institution
has an active BetterAuth subscription and either shows the payment onboarding
experience or existing plan details with billing portal access.

---

## 1. FRONTEND COMPONENTS

- **`PaymentPage`** – main client component. Wraps content in a `motion.div` for
  entry animation and reads subscription info via `useSubscription`.
- **`InstitutionPaymentSection`**
  (`src/components/payment/InstitutionPaymentSection.tsx`)
  - Displays plan benefits, billing cycle toggle (monthly vs. yearly), and
    “Start Plan” button.
  - Uses `useSubscription.upgradeSubscription` to create the Stripe checkout
    session.
  - Handles auth gating: unauthenticated institutions are redirected to
    `/signup`.
- **`InstitutionSubscriptionFeaturesCard`** – outlines entitlements of the
  active plan.
- **`BillingPortalCard`** – deep links to the Stripe billing portal for managing
  payment methods/cancellations.

---

## 2. HOOKS & DATA FLOW

### 2.1 `useSubscription`

- Fetches BetterAuth subscriptions (`authClient.subscription.list`).
- Exposes `subscriptions`, `currentPlan`, `loading`, `upgradeSubscription`,
  `cancelSubscription`, etc.
- The page inspects `subscriptions.some(sub => sub.status === 'active')` to
  decide which UI to render.

### 2.2 Upgrade Flow (`InstitutionPaymentSection`)

1. User selects billing cycle; component maps to plan IDs `institution_monthly`
   or `institution_yearly`.
2. Clicking “Start Plan” checks `isAuthenticated`:
   - If false → redirect to `/signup`.
   - If true → call `upgradeSubscription(planId)`; hook triggers
     BetterAuth/Stripe integration.
3. Optional `onStartPlan` callback allows parent to track conversion events.

### 2.3 Active Subscription Flow

- When `hasActiveSubscription` is true, the page renders:
  - Heading (“My Subscription”) with helper text.
  - `InstitutionSubscriptionFeaturesCard` summarizing current plan, seats,
    limits.
  - `BillingPortalCard` so institutions can self-manage billing through Stripe.

---

## 3. USER FLOW

1. Institution navigates to `/institution/dashboard/payment`.
2. `useSubscription` loads subscriptions; spinner can be added using `loading`
   flag.
3. If no active subscription → show `InstitutionPaymentSection` with plan
   description, features, and CTA.
4. After successful `upgradeSubscription`, `useSubscription` should refetch
   (hook can be extended) causing the view to switch to the “My Subscription”
   layout.
5. If already subscribed → review plan features and optionally open billing
   portal to update payment details.

---

## 4. EXTENSIONS

- Show plan status (trialing, past due) and upcoming invoice information above
  the features card.
- Surface cancellation controls directly on the page instead of sending users to
  the billing portal.
- Provide error toasts when `upgradeSubscription` throws (currently logged in
  dev mode only).
