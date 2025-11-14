# Turn On & Turn Off Email Notification (Institution) - Components & Requirements for Sequence & Class Diagrams

## Overview

The Turn On & Turn Off Email Notification feature allows authenticated
institutions to control which email notifications they receive. Institutions can
toggle three types of email notifications: New Application Received, Document
Updated, and Payment reminders. Settings are stored in the database and checked
before sending emails.

---

## 1. KEY COMPONENTS

### 1.1 InstitutionSettingsSection Component

**Location:**
`src/components/profile/institution/sections/InstitutionSettingsSection.tsx`

**Purpose:** Settings page component with notification preferences for
institutions

**Key Features:**

- Three toggle switches for notification types
- Institution-specific labels:
  - "New Application received" (instead of "Application Status Updates")
  - "Document updated" (instead of "Wishlist Deadlines")
  - "Payment"
- Real-time UI updates (optimistic updates)
- Loading states
- Error handling with rollback

**State Management:**

- `notifications` - Current notification settings state
  - `applicationStatus: boolean` - New Application received
  - `wishlistDeadline: boolean` - Document updated
  - `payment: boolean` - Payment reminders
- `loading` - Loading state for initial fetch
- `saving` - Saving state during updates

**Key Methods:**

- `fetchNotificationSettings()` - Fetches settings on mount
- `handleNotificationChange(key, value)` - Handles toggle change
  - Optimistic UI update
  - API call to save
  - Rollback on error

**UI Elements:**

- Toggle switches (custom styled checkboxes)
- Descriptions for each notification type (institution-specific)
- Loading spinner
- Disabled state during save

### 1.2 ApiService

**Location:** `src/services/api/axios-config.ts`

**Methods:**

- `getNotificationSettings()` - GET /api/notification-settings
- `updateNotificationSettings(settings)` - PUT /api/notification-settings

---

## 2. API ROUTES

### 2.1 GET /api/notification-settings

**Location:** `src/app/api/notification-settings/route.ts`

**Purpose:** Fetch user notification settings (works for both applicants and
institutions)

**Authentication:** Required via `requireAuth()`

**Process:**

1. Validates authentication
2. Fetches settings from database
3. If not found, creates default settings (all enabled)
4. Returns settings in frontend format

**Response:**

```typescript
{
  success: true,
  settings: {
    applicationStatus: boolean, // New Application received
    wishlistDeadline: boolean,  // Document updated
    payment: boolean            // Payment reminders
  }
}
```

### 2.2 PUT /api/notification-settings

**Location:** `src/app/api/notification-settings/route.ts`

**Purpose:** Update user notification settings (works for both applicants and
institutions)

**Request Body:**

```typescript
{
  applicationStatus: boolean,
  wishlistDeadline: boolean,
  payment: boolean
}
```

**Process:**

1. Validates authentication
2. Validates input (all booleans)
3. Upserts settings in database
4. Updates `update_at` timestamp
5. Returns updated settings

**Response:**

```typescript
{
  success: true,
  message: "Notification settings updated successfully",
  settings: {
    applicationStatus: boolean,
    wishlistDeadline: boolean,
    payment: boolean
  }
}
```

---

## 3. DATA FLOW

### 3.1 Load Settings Flow

1. **Component Mount**
   - InstitutionSettingsSection component mounts
   - Settings page accessed via `/institution/dashboard/settings`

2. **Fetch Settings**
   - `useEffect` triggers on mount
   - `fetchNotificationSettings()` called
   - `ApiService.getNotificationSettings()` called
   - `GET /api/notification-settings` request sent

3. **API Processing**
   - Authentication validated
   - Settings fetched from database
   - If not found, default settings created (all enabled)
   - Settings transformed to frontend format

4. **Update UI**
   - Settings loaded into component state
   - Toggle switches reflect current values
   - Loading state cleared

### 3.2 Toggle Notification Flow

1. **User Toggles Switch**
   - User clicks toggle switch
   - `handleNotificationChange(key, value)` called
   - Key: 'applicationStatus' | 'wishlistDeadline' | 'payment'
   - Value: boolean (new state)

2. **Optimistic Update**
   - UI updated immediately
   - Toggle switch reflects new state
   - `saving` state set to true

3. **API Call**
   - `ApiService.updateNotificationSettings()` called
   - All three settings sent (not just changed one)
   - `PUT /api/notification-settings` request sent

4. **API Processing**
   - Authentication validated
   - Input validated (all booleans)
   - Settings upserted in database
   - `update_at` timestamp updated

5. **Response Handling**
   - Success: Settings confirmed
   - Error: UI reverted to previous state
   - Error message shown to user
   - `saving` state cleared

### 3.3 Email Sending Check Flow

1. **Email Service Called**
   - `EmailService.sendNotificationEmail()` called
   - Notification type determined

2. **Check Settings**
   - `isNotificationEnabled(userId, notificationType)` called
   - Settings fetched from database
   - If settings don't exist, defaults to enabled

3. **Notification Type Mapping**
   - `APPLICATION_STATUS_UPDATE` → "application" (New Application received)
   - `DOCUMENT_UPDATED` → "wishlist" (Document updated)
   - `WISHLIST_DEADLINE` → "wishlist" (Document updated)
   - `PAYMENT_DEADLINE` → "subscription" (Payment)

4. **Decision**
   - If enabled: Email sent
   - If disabled: Email skipped (logged)

---

## 4. DATABASE OPERATIONS

### 4.1 Fetch Settings

```typescript
let settings = await prismaClient.notificationSetting.findUnique({
	where: { user_id: user.id },
});

// Auto-create if doesn't exist
if (!settings) {
	settings = await prismaClient.notificationSetting.create({
		data: {
			user_id: user.id,
			notify_application: true,
			notify_wishlist: true,
			notify_subscription: true,
			update_at: new Date(),
		},
	});
}
```

### 4.2 Update Settings (Upsert)

```typescript
const settings = await prismaClient.notificationSetting.upsert({
	where: { user_id: user.id },
	update: {
		notify_application: applicationStatus,
		notify_wishlist: wishlistDeadline,
		notify_subscription: payment,
		update_at: new Date(),
	},
	create: {
		user_id: user.id,
		notify_application: applicationStatus,
		notify_wishlist: wishlistDeadline,
		notify_subscription: payment,
		update_at: new Date(),
	},
});
```

### 4.3 Check Notification Enabled

```typescript
const settings = await prismaClient.notificationSetting.findUnique({
	where: { user_id: userId },
});

// Default to enabled if settings don't exist
if (!settings) {
	return true;
}

switch (notificationType) {
	case 'application':
		return settings.notify_application;
	case 'wishlist':
		return settings.notify_wishlist ?? true;
	case 'subscription':
		return settings.notify_subscription;
	default:
		return true;
}
```

---

## 5. DATABASE MODELS

### 5.1 NotificationSetting

```typescript
{
  user_id: string (PK, FK to User)
  notify_application: boolean
  notify_wishlist: boolean? (nullable, defaults to true)
  notify_subscription: boolean
  update_at: DateTime
}
```

**Relations:**

- `user` - User (user_id)

**Constraints:**

- One setting record per user (user_id is PK)
- Auto-created on first fetch if doesn't exist
- Shared between applicants and institutions

---

## 6. INTERFACES

### 6.1 Notification Settings (Frontend)

```typescript
interface NotificationSettings {
	applicationStatus: boolean; // New Application received
	wishlistDeadline: boolean; // Document updated
	payment: boolean; // Payment reminders
}
```

### 6.2 Notification Settings (Database)

```typescript
interface NotificationSetting {
	user_id: string;
	notify_application: boolean;
	notify_wishlist: boolean | null;
	notify_subscription: boolean;
	update_at: DateTime;
}
```

---

## 7. FEATURES

### 7.1 Notification Types (Institution-Specific Labels)

- **New Application received** (`applicationStatus`)
  - Get notified when a new applicant submits an application to your post
  - Maps to `notify_application` in database
  - Controls `APPLICATION_STATUS_UPDATE` emails

- **Document updated** (`wishlistDeadline`)
  - Get notified when an applicant uploads or updates required documents
  - Maps to `notify_wishlist` in database
  - Controls `DOCUMENT_UPDATED` and `WISHLIST_DEADLINE` emails

- **Payment** (`payment`)
  - Get email notifications 3 days before membership fee payment is due
  - Maps to `notify_subscription` in database
  - Controls `PAYMENT_DEADLINE` emails

### 7.2 Toggle Switches

- Custom styled checkboxes
- Green when enabled, gray when disabled
- Disabled during save operation
- Optimistic updates

### 7.3 Error Handling

- Rollback on save failure
- Error alerts
- Default values preserved on fetch failure

---

## 8. SEQUENCE DIAGRAM ACTORS

1. **User** - Toggles notification settings
2. **InstitutionSettingsSection** - Component
3. **ApiService** - API client
4. **API Route Handler** - Server endpoint
5. **requireAuth** - Authentication
6. **Prisma Client** - Database
7. **Database** - PostgreSQL
8. **EmailService** - Email sending (checks settings)

---

## 9. CLASS DIAGRAM ENTITIES

### 9.1 Frontend Classes

- `InstitutionSettingsSection` (Component)
- `ApiService` (Service)

### 9.2 Backend Classes

- API Route Handler (GET, PUT)
- `requireAuth` (Utility)
- `isNotificationEnabled` (Helper function)
- Prisma Models (NotificationSetting, User)

---

## 10. KEY METHODS

### 10.1 Component Methods

- `fetchNotificationSettings()` - Fetch settings
- `handleNotificationChange()` - Update setting

### 10.2 API Methods

- `GET()` - Fetch settings
- `PUT()` - Update settings

### 10.3 Helper Methods

- `isNotificationEnabled()` - Check if notification enabled

---

## 11. FILE STRUCTURE

```
src/
├── components/profile/institution/sections/
│   └── InstitutionSettingsSection.tsx
├── services/api/
│   └── axios-config.ts
├── utils/notifications/
│   └── notification-settings-helper.ts
└── app/api/notification-settings/
    └── route.ts (GET, PUT handlers)
```

---

## 12. DIAGRAM REQUIREMENTS

### Sequence Diagram:

- Component mount → Fetch settings → API → Database → Display
- Toggle switch → Optimistic update → API → Database → Confirm/Rollback
- Email sending → Check settings → Decision → Send/Skip

### Class Diagram:

- Component class
- API route handlers
- Helper functions
- Database models and relationships

---

## 13. NOTES

### 13.1 Shared Infrastructure

- Same API endpoint used by both applicants and institutions
- Same database model (`NotificationSetting`)
- Same helper function (`isNotificationEnabled`)
- Only UI labels differ between applicant and institution views

### 13.2 Notification Type Mapping

- Institution "New Application received" = `APPLICATION_STATUS_UPDATE` email
- Institution "Document updated" = `DOCUMENT_UPDATED` and `WISHLIST_DEADLINE`
  emails
- Institution "Payment" = `PAYMENT_DEADLINE` email

### 13.3 Default Behavior

- If settings don't exist, all notifications default to enabled
- This ensures backward compatibility
- Settings are auto-created on first fetch

---

## END OF DOCUMENT
