# 📧 Email & Notification Sending Locations

This document lists all places in the codebase where emails and notifications
are sent to users.

---

## 🎓 Application-Related Notifications

### 1. **New Application Notification (To Institution)**

**Location:** `src/app/api/applications/route.ts` (POST endpoint)

- **When:** When an applicant submits a new application to a post
- **Function:** `NotificationUtils.sendNewApplicationNotification()`
- **Recipient:** Institution user
- **Notification Type:** `APPLICATION_STATUS_UPDATE` (new application)
- **Line:** ~625

### 2. **Application Status Change (To Applicant) - PROGRESSING**

**Location:** `src/app/api/applications/institution/[applicationId]/route.ts`
(GET endpoint)

- **When:** When an institution views an application for the first time (status
  changes from SUBMITTED to PROGRESSING)
- **Function:** `NotificationUtils.sendApplicationStatusNotification()`
- **Recipient:** Applicant
- **Notification Type:** `APPLICATION_STATUS_UPDATE`
- **Line:** ~190

### 3. **Application Status Change (To Applicant) - ACCEPTED/REJECTED**

**Location:** `src/app/api/applications/institution/[applicationId]/route.ts`
(PUT endpoint)

- **When:** When an institution updates application status (ACCEPTED, REJECTED)
- **Function:** `NotificationUtils.sendApplicationStatusNotification()`
- **Recipient:** Applicant
- **Notification Type:** `APPLICATION_STATUS_UPDATE`
- **Line:** ~825

### 4. **Application Status Change (To Applicant) - General**

**Location:** `src/app/api/applications/[applicationId]/route.ts` (PUT endpoint)

- **When:** When application status is updated
- **Function:** `NotificationUtils.sendApplicationStatusNotification()`
- **Recipient:** Applicant
- **Notification Type:** `APPLICATION_STATUS_UPDATE`
- **Line:** ~379

---

## 📝 Post-Related Notifications

### 5. **Post Status Update (To Institution)**

**Location:** `src/app/api/admin/posts/[id]/route.ts` (PATCH endpoint)

- **When:** When an admin changes the status of an institution's post
  (PUBLISHED, REJECTED, CLOSED, etc.)
- **Function:** `NotificationUtils.sendPostStatusUpdateNotification()`
- **Recipient:** Institution user
- **Notification Type:** `POST_STATUS_UPDATE`
- **Line:** ~354

---

## 🏛️ Institution Profile Notifications

### 6. **Institution Profile Approved**

**Location:** `src/app/api/admin/institutions/[id]/actions/route.ts` (POST
endpoint - "approve" action)

- **When:** When an admin approves an institution's profile
- **Function:**
  `NotificationUtils.sendInstitutionProfileStatusUpdateNotification()`
- **Recipient:** Institution user
- **Notification Type:** `INSTITUTION_PROFILE_STATUS_UPDATE`
- **Line:** ~219

### 7. **Institution Profile Rejected**

**Location:** `src/app/api/admin/institutions/[id]/actions/route.ts` (POST
endpoint - "deny" action)

- **When:** When an admin rejects an institution's profile
- **Function:**
  `NotificationUtils.sendInstitutionProfileStatusUpdateNotification()`
- **Recipient:** Institution user
- **Notification Type:** `INSTITUTION_PROFILE_STATUS_UPDATE`
- **Line:** ~265

### 8. **Institution Profile Requires Update**

**Location:** `src/app/api/admin/institutions/[id]/actions/route.ts` (POST
endpoint - "require-info" action)

- **When:** When an admin requests additional information from an institution
- **Function:**
  `NotificationUtils.sendInstitutionProfileStatusUpdateNotification()`
- **Recipient:** Institution user
- **Notification Type:** `INSTITUTION_PROFILE_STATUS_UPDATE`
- **Line:** ~376

### 9. **Institution Profile Updated**

**Location:** `src/app/api/profile/route.ts` (PUT endpoint)

- **When:** When an institution updates their profile after receiving a
  REQUIRE_UPDATE status
- **Function:**
  `NotificationUtils.sendInstitutionProfileStatusUpdateNotification()`
- **Recipient:** Institution user (and admins)
- **Notification Type:** `INSTITUTION_PROFILE_STATUS_UPDATE`
- **Line:** ~617

---

## 👤 User Account Notifications

### 10. **Welcome Email**

**Location:** `src/app/api/profile/route.ts` (POST endpoint - profile creation)

- **When:** When a new user creates their account/profile
- **Function:** `NotificationUtils.sendWelcomeNotification()`
- **Recipient:** New user
- **Notification Type:** `WELCOME`
- **Line:** ~440

### 11. **Profile Created**

**Location:** `src/app/api/profile/route.ts` (POST endpoint - profile creation)

- **When:** When a user successfully creates their profile (applicant or
  institution)
- **Function:** `NotificationUtils.sendProfileCreatedNotification()`
- **Recipient:** User
- **Notification Type:** `PROFILE_CREATED`
- **Line:** ~448

### 12. **Account Deleted**

**Location:** `src/app/api/user/delete-account/route.ts` (DELETE endpoint)

- **When:** When a user deletes their account
- **Function:** `SQSService.sendEmailMessage()` (direct)
- **Recipient:** User
- **Notification Type:** `ACCOUNT_DELETED`
- **Line:** ~51

### 13. **Password Changed**

**Location:** `src/components/profile/shared/PasswordChangeSection.tsx` (client
component)

- **When:** When a user changes their password
- **Function:** `SQSService.sendEmailMessage()` (direct)
- **Recipient:** User
- **Notification Type:** `PASSWORD_CHANGED`
- **Line:** ~167

---

## 💳 Payment & Subscription Notifications

### 14. **Subscription Expiring**

**Location:** `src/app/api/webhooks/stripe/route.ts` (POST endpoint -
subscription webhook)

- **When:** When a subscription is about to expire (7 days before)
- **Function:** `NotificationUtils.sendSubscriptionExpiringNotification()`
- **Recipient:** User
- **Notification Type:** `SUBSCRIPTION_EXPIRING`
- **Line:** ~975

### 15. **Payment Success**

**Location:** `src/app/api/webhooks/stripe/route.ts` (POST endpoint - payment
webhook)

- **When:** When a payment is successfully processed
- **Function:** `NotificationUtils.sendPaymentSuccessNotification()`
- **Recipient:** User
- **Notification Type:** `PAYMENT_SUCCESS`
- **Lines:** ~1220, ~1341

### 16. **Payment Failed**

**Location:** `src/app/api/webhooks/stripe/route.ts` (POST endpoint - payment
webhook)

- **When:** When a payment fails
- **Function:** `NotificationUtils.sendPaymentFailedNotification()`
- **Recipient:** User
- **Notification Type:** `PAYMENT_FAILED`
- **Line:** ~1420

---

## 📋 Wishlist Notifications

### 17. **Wishlist Deadline Reminder**

**Location:** `src/app/api/cron/wishlist-deadlines/route.ts` (GET/POST
endpoint - cron job)

- **When:** Scheduled cron job that checks for wishlist items approaching
  deadline (within 7 days)
- **Function:** `NotificationUtils.sendWishlistDeadlineNotification()`
- **Recipient:** Applicant
- **Notification Type:** `WISHLIST_DEADLINE`
- **Line:** ~158

---

## 💬 Support Notifications

### 18. **Support Request Confirmation (To User)**

**Location:** `src/app/api/support/route.ts` (POST endpoint)

- **When:** When a user submits a support request
- **Function:** `EmailService.sendCompanyEmail()` (direct)
- **Recipient:** User who submitted the request
- **Type:** Custom email (not notification type)
- **Line:** ~153

### 19. **Support Request Notification (To Admin)**

**Location:** `src/app/api/support/route.ts` (POST endpoint)

- **When:** When a user submits a support request
- **Function:** `EmailService.sendCompanyEmail()` (direct)
- **Recipient:** Admin users
- **Type:** Custom email (not notification type)
- **Line:** ~171

### 20. **Support Reply (To User)**

**Location:** `src/app/api/admin/support/route.ts` (POST endpoint)

- **When:** When an admin replies to a support request
- **Function:** `EmailService.sendNotificationEmail()` (direct)
- **Recipient:** User who submitted the original request
- **Notification Type:** `SUPPORT_REPLY`
- **Line:** ~366

### 21. **Support Reply Confirmation (To Admin)**

**Location:** `src/app/api/admin/support/route.ts` (POST endpoint)

- **When:** When an admin replies to a support request
- **Function:** `EmailService.sendCompanyEmail()` (direct)
- **Recipient:** Admin who sent the reply
- **Type:** Custom email (not notification type)
- **Line:** ~394

---

## 🔐 Authentication Notifications

### 22. **OTP Email (Email Verification)**

**Location:** `src/config/auth.ts` (Better Auth configuration)

- **When:** When a user requests email verification OTP
- **Function:** `sendEmail()` (direct)
- **Recipient:** User
- **Type:** OTP code email
- **Line:** ~214

---

## 🧪 Test & Development

### 23. **Test Email Endpoint**

**Location:** `src/app/api/test/email/route.ts` (POST endpoint)

- **When:** Manual testing of email templates
- **Function:** `EmailService.sendNotificationEmail()` (direct)
- **Recipient:** Test email address
- **Type:** All notification types (for testing)
- **Line:** ~537

### 24. **Welcome Notification Test**

**Location:** `src/app/api/notifications/welcome/route.ts` (POST endpoint)

- **When:** Manual testing of welcome notifications
- **Function:** `NotificationUtils.sendWelcomeNotification()`
- **Recipient:** Test user
- **Notification Type:** `WELCOME`
- **Line:** ~23

---

## 🔄 Background Processing

### 25. **SQS Email Queue Processor**

**Location:** `src/app/api/notifications/send-email/route.ts` (POST endpoint)

- **When:** Called by AWS Lambda EmailProcessor when processing SQS email queue
- **Function:** `EmailService.sendNotificationEmail()`
- **Recipient:** Users from SQS queue
- **Type:** All notification types (processed from queue)
- **Line:** ~24

### 26. **SQS Notification Queue Processor**

**Location:** `src/services/messaging/sqs-handlers.ts` (SQSMessageHandler class)

- **When:** Processes messages from SQS notifications queue
- **Function:** `storeNotificationDirectly()` + forwards to email queue
- **Recipient:** Users from SQS queue
- **Type:** All notification types (stored in DB, then forwarded to email queue)
- **Line:** ~131, ~156

---

## 📊 Summary by Notification Type

| Notification Type                   | Count | Locations                                   |
| ----------------------------------- | ----- | ------------------------------------------- |
| `APPLICATION_STATUS_UPDATE`         | 4     | Applications API (3), Profile API (1)       |
| `POST_STATUS_UPDATE`                | 1     | Admin Posts API                             |
| `INSTITUTION_PROFILE_STATUS_UPDATE` | 4     | Admin Institutions API (3), Profile API (1) |
| `WELCOME`                           | 2     | Profile API, Test API                       |
| `PROFILE_CREATED`                   | 1     | Profile API                                 |
| `ACCOUNT_DELETED`                   | 1     | User Delete API                             |
| `PASSWORD_CHANGED`                  | 1     | Password Change Component                   |
| `SUBSCRIPTION_EXPIRING`             | 1     | Stripe Webhook                              |
| `PAYMENT_SUCCESS`                   | 2     | Stripe Webhook                              |
| `PAYMENT_FAILED`                    | 1     | Stripe Webhook                              |
| `WISHLIST_DEADLINE`                 | 1     | Cron Job                                    |
| `SUPPORT_REPLY`                     | 1     | Admin Support API                           |
| Custom Emails (Support)             | 4     | Support API (2), Admin Support API (2)      |
| OTP Email                           | 1     | Auth Config                                 |

**Total: 25+ locations sending emails/notifications**

---

## 🔧 Core Notification Functions

All notifications go through these utility functions in
`src/services/messaging/sqs-handlers.ts`:

1. `sendWelcomeNotification()` - Line ~394
2. `sendProfileCreatedNotification()` - Line ~440
3. `sendApplicationStatusNotification()` - Line ~711
4. `sendNewApplicationNotification()` - Line ~993
5. `sendPostStatusUpdateNotification()` - Line ~922
6. `sendInstitutionProfileStatusUpdateNotification()` - Line ~959
7. `sendWishlistDeadlineNotification()` - Line ~737
8. `sendSubscriptionExpiringNotification()` - Line ~801
9. `sendPaymentSuccessNotification()` - Line ~829
10. `sendPaymentFailedNotification()` - Line ~859

All these functions:

- Send message to SQS notifications queue via `SQSService.sendNotification()`
- Store notification directly in database via `storeNotificationDirectly()`
- Message is then processed by Lambda and forwarded to email queue
- Email is sent via `EmailService.sendNotificationEmail()`

---

## 📝 Notes

- All notification functions use `NotificationUtils` class from
  `src/services/messaging/sqs-handlers.ts`
- All email sending goes through `EmailService.sendNotificationEmail()` or
  `EmailService.sendCompanyEmail()`
- SQS queues are used for async processing: NOTIFICATIONS queue → EMAILS queue →
  Email sent
- Notifications are stored in database AND sent via email
- User notification preferences are checked before sending emails (for certain
  types)
