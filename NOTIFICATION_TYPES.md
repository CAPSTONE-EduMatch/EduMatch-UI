# Email & In-App Notification Types

## Overview

This document lists all email sending and in-app notification functionality in
the EduMatch application.

---

## 📧 Email Types

### 1. **WELCOME** - Welcome Email

- **Template**: `EmailTemplates.generateWelcomeEmail()`
- **Trigger**: When a new user signs up
- **Recipient**: New user
- **Subject**: `Welcome to EduMatch, {firstName}!`
- **Content**: Welcome message, next steps, profile creation link
- **Settings**: Always sent (not user-configurable)
- **Utility Function**: `NotificationUtils.sendWelcomeNotification()`

### 2. **PROFILE_CREATED** - Profile Created Email

- **Template**: `EmailTemplates.generateProfileCreatedEmail()`
- **Trigger**: When a user creates their profile (applicant or institution)
- **Recipient**: User who created profile
- **Subject**: `Profile Created Successfully - Welcome to EduMatch!`
- **Content**: Confirmation, profile visibility info, explore link
- **Settings**: Always sent (not user-configurable)
- **Utility Function**: `NotificationUtils.sendProfileCreatedNotification()`

### 3. **PAYMENT_DEADLINE** - Payment Deadline Reminder

- **Template**: `EmailTemplates.generatePaymentDeadlineEmail()`
- **Trigger**: When payment deadline is approaching
- **Recipient**: User with subscription
- **Subject**: `Payment Deadline Reminder - {planName} Subscription`
- **Content**: Payment details, amount, deadline, payment link
- **Settings**: User-configurable (subscription category)
- **Utility Function**: `NotificationUtils.sendPaymentDeadlineNotification()`

### 4. **PAYMENT_SUCCESS** - Payment Success Email

- **Template**: `EmailTemplates.generatePaymentSuccessEmail()`
- **Trigger**: When payment is successfully processed
- **Recipient**: User who made payment
- **Subject**: `Payment Successful - {planName} Subscription`
- **Content**: Payment confirmation, transaction ID, subscription status
- **Settings**: Always sent (not user-configurable)
- **Utility Function**: `NotificationUtils.sendPaymentSuccessNotification()`

### 5. **PAYMENT_FAILED** - Payment Failed Email

- **Template**: `EmailTemplates.generatePaymentFailedEmail()`
- **Trigger**: When payment processing fails
- **Recipient**: User whose payment failed
- **Subject**: `Payment Failed - {planName} Subscription`
- **Content**: Failure reason, update payment method link
- **Settings**: Always sent (not user-configurable)
- **Utility Function**: `NotificationUtils.sendPaymentFailedNotification()`

### 6. **SUBSCRIPTION_EXPIRING** - Subscription Expiring Soon

- **Template**: `EmailTemplates.generateSubscriptionExpiringEmail()`
- **Trigger**: When subscription is about to expire
- **Recipient**: User with expiring subscription
- **Subject**: `Subscription Expiring Soon - {planName}`
- **Content**: Expiry date, days remaining, renewal link
- **Settings**: Always sent (not user-configurable)
- **Utility Function**:
  `NotificationUtils.sendSubscriptionExpiringNotification()`

### 7. **APPLICATION_STATUS_UPDATE** - Application Status Update

- **Template**: `EmailTemplates.generateApplicationStatusEmail()`
- **Trigger**: When application status changes
- **Recipient**: Applicant or Institution (depending on update)
- **Subject**: `Application Status Update - {programName}`
- **Content**: Status change details, program info, institution info
- **Status Types**:
  - `accepted` - Application approved
  - `rejected` - Application not selected
  - `require_update` - Action required from applicant
  - `submitted` - Application under review
  - `updated` - Application updated
- **Settings**: User-configurable (application category)
- **Utility Function**: `NotificationUtils.sendApplicationStatusNotification()`

### 8. **DOCUMENT_UPDATED** - Document Updated Email

- **Template**: `EmailTemplates.generateDocumentUpdatedEmail()`
- **Trigger**: When applicant uploads/updates documents
- **Recipient**: Institution
- **Subject**: `Document Updated - {programName}`
- **Content**: Document count, applicant name, review link
- **Settings**: User-configurable (wishlist category - may need review)
- **Utility Function**: `NotificationUtils.sendDocumentUpdateNotification()`

### 9. **WISHLIST_DEADLINE** - Wishlist Deadline Reminder

- **Template**: `EmailTemplates.generateWishlistDeadlineEmail()`
- **Trigger**: When wishlist item deadline is approaching
- **Recipient**: User with item in wishlist
- **Subject**: `Deadline Approaching - {postTitle}`
- **Content**: Opportunity details, deadline, days remaining, view link
- **Settings**: User-configurable (wishlist category)
- **Utility Function**: `NotificationUtils.sendWishlistDeadlineNotification()`

### 10. **USER_BANNED** - Account Suspended Email

- **Template**: `EmailTemplates.generateBanEmail()`
- **Trigger**: When user account is banned/suspended
- **Recipient**: Banned user
- **Subject**: `Account Suspended - EduMatch`
- **Content**: Suspension reason, duration, appeal process
- **Settings**: Always sent (not user-configurable)
- **Utility Function**: Not directly exposed (internal use)

### 11. **SESSION_REVOKED** - Session Revoked Email

- **Template**: `EmailTemplates.generateRevokeSessionEmail()`
- **Trigger**: When admin revokes user session
- **Recipient**: User whose session was revoked
- **Subject**: `Security Alert - Session Revoked`
- **Content**: Revocation reason, security tips, sign in link
- **Settings**: Always sent (not user-configurable)
- **Utility Function**: Not directly exposed (internal use)

### 12. **PASSWORD_CHANGED** - Password Changed Email

- **Template**: `EmailTemplates.generatePasswordChangedEmail()`
- **Trigger**: When user changes password
- **Recipient**: User who changed password
- **Subject**: `Security Alert: Password Changed - EduMatch`
- **Content**: Change time, IP address, security review link
- **Settings**: Always sent (not user-configurable)
- **Utility Function**: Not directly exposed (internal use)

### 13. **ACCOUNT_DELETED** - Account Deleted Email

- **Template**: `EmailTemplates.generateAccountDeletedEmail()`
- **Trigger**: When user account is deleted
- **Recipient**: Deleted user
- **Subject**: `Account Deleted - EduMatch`
- **Content**: Deletion confirmation, data retention info
- **Settings**: Always sent (not user-configurable)
- **Utility Function**: Not directly exposed (internal use)

### 14. **Support Request Emails** (Custom)

- **Method**: `EmailService.sendCompanyEmail()`
- **Trigger**: When support request is submitted
- **Recipients**:
  - Admin(s) - Multiple emails from `SUPPORT_RECEIVER_EMAIL` env var
    (semicolon-separated)
  - Customer - Confirmation email to requester
- **Admin Subject**: `Support Request: {problemType}`
- **Customer Subject**: `Support Request Received - {problemType}`
- **Content**:
  - Admin: Request details, sender info, attachments
  - Customer: Confirmation, request details, support ID (if stored)
- **Location**: `src/app/api/support/route.ts`

---

## 🔔 In-App Notification Types

All notifications are stored in the database and displayed in the app. They use
the same notification types as emails.

### Notification Storage

- **Table**: `notification` (Prisma)
- **Fields**: `notification_id`, `user_id`, `type`, `title`, `body`, `url`,
  `send_at`
- **Handler**: `SQSMessageHandler.logNotification()` and
  `NotificationUtils.storeNotificationDirectly()`

### 1. **WELCOME** - Welcome Notification

- **Title**: "Welcome to EduMatch!"
- **Body**: "Welcome {firstName}! Your account has been created successfully."
- **URL**: `/profile/create`
- **Stored**: Yes (via `storeNotificationDirectly()`)

### 2. **PROFILE_CREATED** - Profile Created Notification

- **Title**: "Profile Created Successfully!"
- **Body**: "Your {role} profile has been created and is now live."
- **URL**:
  - Institution: `/institution/dashboard/profile`
  - Applicant: `/profile/view`
- **Stored**: Yes (via `storeNotificationDirectly()`)

### 3. **PAYMENT_DEADLINE** - Payment Deadline Notification

- **Title**: "Payment Deadline Reminder"
- **Body**: "Your {planName} payment is due on {deadlineDate}."
- **URL**:
  - Institution: `/institution/dashboard/payment`
  - Applicant: `/pricing`
- **Stored**: Yes (via SQS handler)

### 4. **APPLICATION_STATUS_UPDATE** - Application Status Notification

- **Title**: "Application Status Update - {programName}"
- **Body**: Varies by status and user role:
  - **For Institutions**:
    - `submitted`: "📝 New application received for '{programName}' from an
      applicant. Please review the application."
  - **For Applicants**:
    - `accepted`: "🎉 Congratulations! Your application for '{programName}' has
      been approved by {institutionName}."
    - `rejected`: "Your application for '{programName}' was not selected by
      {institutionName} this time."
    - `require_update`: "📋 Action Required: {institutionName} has reviewed your
      application and requires additional information."
    - `submitted`: "Your application for '{programName}' has been submitted and
      is currently being reviewed."
    - `updated`: "Your application for '{programName}' has been updated. The
      institution will review your changes."
- **URL**:
  - Institution: `/institution/dashboard/applications/{applicationId}`
  - Applicant: `/applications`
- **Stored**: Yes (via `storeNotificationDirectly()`)

### 5. **DOCUMENT_UPDATED** - Document Updated Notification

- **Title**: "Document Updated - {programName}"
- **Body**: "📄 {applicantName} has uploaded or updated {documentCount}
  document(s) for their application to '{programName}'. Please review the
  updated documents."
- **URL**: `/institution/dashboard/applications/{applicationId}`
- **Stored**: Yes (via `storeNotificationDirectly()`)

### 6. **WISHLIST_DEADLINE** - Wishlist Deadline Notification

- **Title**: "Deadline Approaching - {postTitle}"
- **Body**: "⏰ Don't miss this opportunity! '{postTitle}' is approaching its
  deadline in {daysRemaining} days. Make sure to submit your application before
  it expires!"
- **Recipient**: Applicants only (institutions don't have wishlists)
- **URL** (varies by post type):
  - Programme: `/explore/programmes/{postId}`
  - Scholarship: `/explore/scholarships/{postId}`
  - Research Lab: `/explore/research-labs/{postId}`
- **Note**: Post type is determined from metadata (`postType` field)
- **Stored**: Yes (via `storeNotificationDirectly()`)

---

## 🔧 Email Service Methods

### 1. `EmailService.sendNotificationEmail(message: NotificationMessage)`

- Sends email based on notification message type
- Checks user notification settings before sending
- Uses appropriate email template
- **Used by**: SQS email queue processor

### 2. `EmailService.sendCustomEmail(to, subject, html, from?, attachments?)`

- Sends a simple email with custom HTML content
- Supports attachments
- **Used by**: `sendCompanyEmail()` and direct calls

### 3. `EmailService.sendCompanyEmail(to, subject, options, attachments?)`

- Sends company-branded email using shared template
- Uses `renderCompanyEmail()` for consistent branding
- Supports CTA buttons, footer, help center links
- **Used by**: Support request emails

---

## 🔄 SQS Message Processing

### Queues

1. **NOTIFICATIONS Queue**: Processes notification messages
2. **EMAILS Queue**: Processes email messages

### Processing Flow

1. Notification message sent to SQS → NOTIFICATIONS queue
2. `SQSMessageHandler.processNotificationMessages()` processes notification
3. Notification logged to database
4. Message forwarded to EMAILS queue
5. `SQSMessageHandler.processEmailMessages()` processes email
6. `EmailService.sendNotificationEmail()` sends email

### Background Processing

- **Processor**: `BackgroundJobProcessor`
- **Interval**: Every 30 seconds
- **Methods**:
  - `startProcessing()` - Start background processing
  - `stopProcessing()` - Stop background processing
  - `isRunning()` - Check if processing is active

---

## 📝 Notification Utility Functions

Located in `NotificationUtils` class:

1. `sendWelcomeNotification(userId, userEmail, firstName, lastName)`
2. `sendProfileCreatedNotification(userId, userEmail, profileId, firstName, lastName, role)`
3. `sendPaymentDeadlineNotification(userId, userEmail, subscriptionId, planName, deadlineDate, amount, currency)`
4. `sendApplicationStatusNotification(userId, userEmail, applicationId, programName, oldStatus, newStatus, institutionName, message?)`
5. `sendPaymentSuccessNotification(userId, userEmail, subscriptionId, planName, amount, currency, transactionId)`
6. `sendPaymentFailedNotification(userId, userEmail, subscriptionId, planName, amount, currency, failureReason)`
7. `sendSubscriptionExpiringNotification(userId, userEmail, subscriptionId, planName, expiryDate, daysRemaining)`
8. `sendDocumentUpdateNotification(userId, userEmail, applicationId, programName, applicantName, institutionName, documentCount)`
9. `sendWishlistDeadlineNotification(userId, userEmail, postId, postTitle, deadlineDate, daysRemaining, institutionName?)`

---

## ⚙️ User Notification Settings

Some notification types respect user preferences:

- **APPLICATION_STATUS_UPDATE**: Checks "application" category
- **DOCUMENT_UPDATED**: Checks "wishlist" category (may need review)
- **PAYMENT_DEADLINE**: Checks "subscription" category
- **WISHLIST_DEADLINE**: Checks "wishlist" category

Other types are always sent (security, account, welcome, etc.)

---

## 📊 Summary

### Total Email Types: 14

- 13 notification-based emails
- 1 support request email (custom)

### Total In-App Notification Types: 6

- All notifications are stored in database
- Displayed in app notification center
- Linked to relevant pages via URL field

### Email Templates: 13

- All use `EmailTemplates` class methods
- Support request uses `sendCompanyEmail()` with custom template

### Utility Functions: 9

- Helper functions for sending common notifications
- All send to SQS queue for processing
