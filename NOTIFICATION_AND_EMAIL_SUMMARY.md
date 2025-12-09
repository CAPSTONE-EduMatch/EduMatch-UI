# Email and Push Notification Summary

This document lists all email sending and push notification points in the
EduMatch project.

## 📧 Email Sending Points

### 1. Authentication Emails (via `src/config/auth.ts`)

- **OTP Verification Email** (`sendEmail` function)
  - Trigger: User requests OTP for signup/verification
  - Location: `src/config/auth.ts:221` (via `emailOTP.sendVerificationOTP`)
  - Template: OTP code display
- **Password Reset Email** (`sendEmail` function)
  - Trigger: User requests password reset
  - Location: `src/config/auth.ts:676` (via
    `emailAndPassword.sendResetPassword`)
  - Template: Password reset link with button

- **Email Verification** (commented out, not active)
  - Location: `src/config/auth.ts:704`

### 2. Notification-Based Emails (via `src/services/email/email-service.ts`)

All notification emails are sent through `EmailService.sendNotificationEmail()`
which checks user notification preferences before sending.

**Email Types:**

1. **WELCOME** - Welcome email on signup
   - Template: `generateWelcomeEmailTemplate`
   - Always sent (not user-configurable)

2. **PROFILE_CREATED** - Profile creation confirmation
   - Template: `generateProfileCreatedEmailTemplate`
   - Always sent (not user-configurable)

3. **APPLICATION_STATUS_UPDATE** - Application status changes
   - Template: `generateApplicationStatusEmailTemplate`
   - User-configurable: `application` notification setting
   - Statuses: accepted, rejected, require_update, submitted, updated

4. **DOCUMENT_UPDATED** - Document upload/update notifications
   - Template: `generateDocumentUpdatedEmailTemplate`
   - User-configurable: `wishlist` notification setting

5. **PAYMENT_DEADLINE** - Payment due reminders
   - Template: `generatePaymentDeadlineEmailTemplate`
   - User-configurable: `subscription` notification setting

6. **PAYMENT_SUCCESS** - Successful payment confirmation
   - Template: `generatePaymentSuccessEmailTemplate`
   - Always sent

7. **PAYMENT_FAILED** - Failed payment notification
   - Template: `generatePaymentFailedEmailTemplate`
   - Always sent

8. **SUBSCRIPTION_EXPIRING** - Subscription expiration warning
   - Template: `generateSubscriptionExpiringEmailTemplate`
   - Always sent

9. **WISHLIST_DEADLINE** - Wishlist item deadline approaching
   - Template: `generateWishlistDeadlineEmailTemplate`
   - User-configurable: `wishlist` notification setting

10. **PASSWORD_CHANGED** - Password change confirmation
    - Template: `generatePasswordChangedEmailTemplate`
    - Always sent

11. **ACCOUNT_DELETED** - Account deletion confirmation
    - Template: `generateAccountDeletedEmailTemplate`
    - Always sent

12. **SUPPORT_REPLY** - Support ticket reply
    - Template: `generateSupportReplyEmailTemplate`
    - Always sent (important for customer service)

13. **POST_STATUS_UPDATE** - Post (program/scholarship/research lab) status
    changes
    - Template: `generatePostStatusUpdateEmailTemplate`
    - Always sent

14. **INSTITUTION_PROFILE_STATUS_UPDATE** - Institution profile
    approval/rejection
    - Template: `generateInstitutionProfileStatusUpdateEmailTemplate`
    - Always sent

### 3. Direct Email Sending (via `src/app/api/send-email/route.ts`)

- **Generic Email API** (`POST /api/send-email`)
  - Used for custom email sending
  - Location: `src/app/api/send-email/route.ts`

### 4. Support Emails (via `src/app/api/support/route.ts`)

- **Support Ticket Submission** - User submits support ticket
  - Location: `src/app/api/support/route.ts:153`
  - Uses: `EmailService.sendCompanyEmail`

- **Support Ticket Reply** - Admin replies to support ticket
  - Location: `src/app/api/support/route.ts:171`
  - Uses: `EmailService.sendCompanyEmail`

- **Support Ticket Auto-Reply** - Automatic confirmation
  - Location: `src/app/api/support/route.ts:232, 254`
  - Uses: `EmailService.sendCompanyEmail`

### 5. Admin Support Emails (via `src/app/api/admin/support/route.ts`)

- **Support Reply Notification** - Admin sends reply notification
  - Location: `src/app/api/admin/support/route.ts:366`
  - Uses: `EmailService.sendNotificationEmail` (SUPPORT_REPLY type)

- **Support Email** - Admin sends support email
  - Location: `src/app/api/admin/support/route.ts:394`
  - Uses: `EmailService.sendCompanyEmail`

### 6. Password Change Email (via `src/components/profile/shared/PasswordChangeSection.tsx`)

- **Password Changed Notification**
  - Location: `src/components/profile/shared/PasswordChangeSection.tsx:169`
  - Uses: `SQSService.sendEmailMessage` (PASSWORD_CHANGED type)

### 7. Account Deletion Email (via `src/app/api/user/delete-account/route.ts`)

- **Account Deleted Notification**
  - Location: `src/app/api/user/delete-account/route.ts:51`
  - Uses: `SQSService.sendEmailMessage` (ACCOUNT_DELETED type)

---

## 🔔 Push Notification Sending Points

All notifications are sent via `NotificationUtils` class methods which:

1. Create notification message
2. Send to SQS queue (`SQSService.sendNotification`)
3. Store directly in database for immediate display
   (`storeNotificationDirectly`)

### Notification Types (from `src/config/sqs-config.ts`)

1. **WELCOME** - Welcome notification on signup
   - Method: `NotificationUtils.sendWelcomeNotification()`
   - Triggered by: `src/app/api/notifications/welcome/route.ts` (POST)
   - Location: `src/services/messaging/sqs-handlers.ts:401`

2. **PROFILE_CREATED** - Profile creation success
   - Method: `NotificationUtils.sendProfileCreatedNotification()`
   - Triggered by: `src/app/api/profile/route.ts:454` (POST - profile creation)
   - Location: `src/services/messaging/sqs-handlers.ts:439`

3. **APPLICATION_STATUS_UPDATE** - Application status changes
   - Method: `NotificationUtils.sendApplicationStatusNotification()`
   - Triggered by:
     - `src/app/api/applications/institution/[applicationId]/route.ts:165`
       (PROGRESSING status)
     - `src/app/api/applications/institution/[applicationId]/route.ts:771`
       (status updates)
     - `src/app/api/applications/[applicationId]/route.ts:378` (status updates)
   - Location: `src/services/messaging/sqs-handlers.ts:737`
   - Statuses: accepted, rejected, require_update, submitted, updated,
     progressing

4. **NEW_APPLICATION** (uses APPLICATION_STATUS_UPDATE type)
   - Method: `NotificationUtils.sendNewApplicationNotification()`
   - Triggered by: `src/app/api/applications/route.ts:636` (POST - new
     application)
   - Location: `src/services/messaging/sqs-handlers.ts:1019`

5. **DOCUMENT_UPDATED** - Document upload/update
   - Method: `NotificationUtils.sendDocumentUpdateNotification()`
   - Location: `src/services/messaging/sqs-handlers.ts:861`
   - Note: Currently defined but not actively used in codebase

6. **PAYMENT_DEADLINE** - Payment due reminder
   - Method: `NotificationUtils.sendPaymentDeadlineNotification()`
   - Location: `src/services/messaging/sqs-handlers.ts:707`
   - Note: Currently defined but not actively used in codebase

7. **PAYMENT_SUCCESS** - Successful payment
   - Method: `NotificationUtils.sendPaymentSuccessNotification()`
   - Triggered by:
     - `src/app/api/webhooks/stripe/route.ts:1220` (payment succeeded)
     - `src/app/api/webhooks/stripe/route.ts:1341` (invoice payment succeeded)
   - Location: `src/services/messaging/sqs-handlers.ts:773`

8. **PAYMENT_FAILED** - Failed payment
   - Method: `NotificationUtils.sendPaymentFailedNotification()`
   - Triggered by: `src/app/api/webhooks/stripe/route.ts:1420` (payment failed)
   - Location: `src/services/messaging/sqs-handlers.ts:803`

9. **SUBSCRIPTION_EXPIRING** - Subscription expiration warning
   - Method: `NotificationUtils.sendSubscriptionExpiringNotification()`
   - Triggered by: `src/app/api/webhooks/stripe/route.ts:975` (subscription
     canceling)
   - Location: `src/services/messaging/sqs-handlers.ts:833`

10. **WISHLIST_DEADLINE** - Wishlist item deadline approaching
    - Method: `NotificationUtils.sendWishlistDeadlineNotification()`
    - Triggered by: `src/app/api/cron/wishlist-deadlines/route.ts:158` (cron
      job)
    - Location: `src/services/messaging/sqs-handlers.ts:894`

11. **POST_STATUS_UPDATE** - Post status changes (program/scholarship/research
    lab)
    - Method: `NotificationUtils.sendPostStatusUpdateNotification()`
    - Triggered by: `src/app/api/admin/posts/[id]/route.ts:400` (admin updates
      post status)
    - Location: `src/services/messaging/sqs-handlers.ts:948`
    - Statuses: PUBLISHED, CLOSED, REJECTED, SUBMITTED, UPDATED, DRAFT

12. **INSTITUTION_PROFILE_STATUS_UPDATE** - Institution profile
    approval/rejection
    - Method:
      `NotificationUtils.sendInstitutionProfileStatusUpdateNotification()`
    - Triggered by:
      - `src/app/api/admin/institutions/[id]/actions/route.ts:218` (approve)
      - `src/app/api/admin/institutions/[id]/actions/route.ts:263` (reject)
      - `src/app/api/admin/institutions/[id]/actions/route.ts:373` (require
        update)
      - `src/app/api/profile/route.ts:639` (status updated to UPDATED)
    - Location: `src/services/messaging/sqs-handlers.ts:985`
    - Statuses: PENDING, APPROVED, REJECTED, REQUIRE_UPDATE, UPDATED

---

## 🔄 Notification Flow

1. **Notification Creation**: `NotificationUtils` methods create notification
   messages
2. **SQS Queue**: Messages sent to SQS queue via `SQSService.sendNotification()`
3. **Lambda Processing**: AWS Lambda processes SQS messages:
   - Stores notification in database (via `/api/notifications/store`)
   - Forwards to email queue for email sending
4. **Email Queue**: Another Lambda processes email queue and sends emails via
   `EmailService.sendNotificationEmail()`
5. **Direct Storage**: Some notifications also stored directly in database for
   immediate display

---

## 📍 Key Files

- **Notification Utils**: `src/services/messaging/sqs-handlers.ts`
- **Email Service**: `src/services/email/email-service.ts`
- **Email Templates**: `src/services/email/email-template.ts`
- **SQS Config**: `src/config/sqs-config.ts`
- **Auth Emails**: `src/config/auth.ts`
- **Notification Store API**: `src/app/api/notifications/store/route.ts`
- **Email Send API**: `src/app/api/notifications/send-email/route.ts`

---

## ⚙️ Notification Settings

Users can control email notifications for:

- **Application** notifications (APPLICATION_STATUS_UPDATE)
- **Wishlist** notifications (WISHLIST_DEADLINE, DOCUMENT_UPDATED)
- **Subscription** notifications (PAYMENT_DEADLINE)

Other notification types are always sent (WELCOME, PROFILE_CREATED,
PAYMENT_SUCCESS, etc.)

---

## 🔍 Deduplication

- Notifications are deduplicated using `notification_id` (message.id)
- Both `logNotification` and `storeNotificationDirectly` check for existing
  notifications before storing
- SQS FIFO queue uses `MessageDeduplicationId` to prevent duplicate messages
