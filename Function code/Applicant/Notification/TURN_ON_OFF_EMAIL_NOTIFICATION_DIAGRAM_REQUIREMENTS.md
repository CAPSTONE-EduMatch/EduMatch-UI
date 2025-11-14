# Turn On & Turn Off Email Notification - Components & Requirements for Sequence & Class Diagrams

## Overview

The Turn On & Turn Off Email Notification feature allows authenticated users to
control which email notifications they receive. Users can toggle three types of
email notifications: Application Status Updates, Wishlist Deadlines, and Payment
reminders. Settings are stored in the database and checked before sending
emails.

---

## 1. KEY COMPONENTS

### 1.1 SettingsSection Component (Applicant)

**Location:** `src/components/profile/applicant/sections/SettingsSection.tsx`

**Purpose:** Settings page component with notification preferences

**Key Features:**

- Three toggle switches for notification types
- Real-time UI updates (optimistic updates)
- Loading states
- Error handling with rollback

**State Management:**

- `notifications` - Current notification settings state
  - `applicationStatus: boolean`
  - `wishlistDeadline: boolean`
  - `payment: boolean`
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
- Descriptions for each notification type
- Loading spinner
- Disabled state during save

### 1.2 InstitutionSettingsSection Component

**Location:**
`src/components/profile/institution/sections/InstitutionSettingsSection.tsx`

**Purpose:** Similar settings component for institutions

**Features:**

- Same notification toggles
- Same functionality as applicant version

### 1.3 ApiService

**Location:** `src/services/api/axios-config.ts`

**Methods:**

- `getNotificationSettings()` - GET /api/notification-settings
- `updateNotificationSettings(settings)` - PUT /api/notification-settings

---

## 2. API ROUTES

### 2.1 GET /api/notification-settings

**Location:** `src/app/api/notification-settings/route.ts`

**Purpose:** Fetch user notification settings

**Authentication:** Required via `requireAuth()`

**Process:**

1. Validates authentication
2. Fetches settings from database
3. If settings don't exist, creates default settings (all enabled)
4. Transforms database fields to frontend format
5. Returns settings

**Response:**

```typescript
{
  success: true,
  settings: {
    applicationStatus: boolean,
    wishlistDeadline: boolean,
    payment: boolean
  }
}
```

**Default Values:**

- All notifications enabled (true) if settings don't exist
- Auto-creates settings record on first fetch

### 2.2 PUT /api/notification-settings

**Location:** `src/app/api/notification-settings/route.ts`

**Purpose:** Update user notification settings

**Authentication:** Required via `requireAuth()`

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
2. Validates all fields are boolean (400 if invalid)
3. Upserts settings (create if doesn't exist, update if exists)
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

**Error Responses:**

- `400` - Invalid input (non-boolean values)
- `401` - Authentication required
- `500` - Server error

---

## 3. DATA FLOW

### 3.1 View Notification Settings Flow

1. **User Navigates to Settings**
   - Accesses profile settings page
   - `SettingsSection` component mounts

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
   - `APPLICATION_STATUS_UPDATE` → "application"
   - `DOCUMENT_UPDATED` → "wishlist"
   - `WISHLIST_DEADLINE` → "wishlist"
   - `PAYMENT_DEADLINE` → "subscription"

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

---

## 6. INTERFACES

### 6.1 NotificationSettings

```typescript
interface NotificationSettings {
	applicationStatus: boolean;
	wishlistDeadline: boolean;
	payment: boolean;
}
```

### 6.2 NotificationSettingsResponse

```typescript
interface NotificationSettingsResponse {
	success: boolean;
	settings?: NotificationSettings;
	error?: string;
	message?: string;
}
```

### 6.3 NotificationType

```typescript
'application' | 'wishlist' | 'subscription';
```

---

## 7. NOTIFICATION TYPES

### 7.1 Application Status Updates

- **Setting:** `notify_application`
- **Notification Type:** `APPLICATION_STATUS_UPDATE`
- **Description:** Get notified when application status changes
- **Default:** Enabled

### 7.2 Wishlist Deadlines

- **Setting:** `notify_wishlist`
- **Notification Types:** `WISHLIST_DEADLINE`, `DOCUMENT_UPDATED`
- **Description:** Get email notifications when events in wishlist are about to
  expire
- **Default:** Enabled (nullable, defaults to true)

### 7.3 Payment Reminders

- **Setting:** `notify_subscription`
- **Notification Type:** `PAYMENT_DEADLINE`
- **Description:** Get email notifications 3 days before membership fee payment
  is due
- **Default:** Enabled

### 7.4 Always Sent Notifications

These notification types are always sent regardless of settings:

- `WELCOME`
- `PROFILE_CREATED`
- `PASSWORD_CHANGED`
- `ACCOUNT_DELETED`
- `SESSION_REVOKED`
- `USER_BANNED`

---

## 8. FEATURES

### 8.1 Toggle Switches

- Custom styled toggle switches
- Visual feedback (green when enabled)
- Disabled during save operation
- Smooth animations

### 8.2 Optimistic Updates

- UI updates immediately on toggle
- Rollback on error
- Better user experience

### 8.3 Auto-Creation

- Settings auto-created on first fetch
- Default values: all enabled
- No manual setup required

### 8.4 Real-time Validation

- Boolean validation on server
- Type checking before save
- Error messages for invalid input

---

## 9. VALIDATION

### 9.1 Client-Side Validation

- Toggle switches only allow boolean values
- No additional validation needed (controlled components)

### 9.2 Server-Side Validation

- All three fields must be boolean (400 if invalid)
- Authentication required (401 if not authenticated)
- Type checking before database operation

---

## 10. ERROR HANDLING

### 10.1 Error Scenarios

- **Fetch Error:** Default values used, error logged
- **Save Error:** UI reverted, error message shown
- **Invalid Input:** 400 error, validation message
- **Authentication Error:** 401 error, redirect to login

### 10.2 Error Display

- Alert messages for save errors
- Loading states during operations
- Disabled states during save
- Rollback on error

---

## 11. HELPER FUNCTIONS

### 11.1 isNotificationEnabled

**Location:** `src/utils/notifications/notification-settings-helper.ts`

**Purpose:** Check if notification type is enabled for user

**Parameters:**

- `userId: string`
- `notificationType: "application" | "wishlist" | "subscription"`

**Returns:** `Promise<boolean>`

**Behavior:**

- Fetches settings from database
- Returns true if settings don't exist (backward compatibility)
- Returns false if disabled
- Returns true if enabled
- Defaults to true on error (ensures notifications aren't blocked)

**Usage:**

- Called by `EmailService.sendNotificationEmail()`
- Checks before sending each email
- Skips email if disabled

---

## 12. EMAIL SERVICE INTEGRATION

### 12.1 Email Sending Flow

1. `EmailService.sendNotificationEmail()` called
2. Notification type determined
3. `isNotificationEnabled()` called
4. Settings checked
5. Email sent or skipped based on setting

### 12.2 Notification Type Mapping

```typescript
switch (message.type) {
	case NotificationType.APPLICATION_STATUS_UPDATE:
		shouldSendEmail = await isNotificationEnabled(userId, 'application');
		break;
	case NotificationType.DOCUMENT_UPDATED:
		shouldSendEmail = await isNotificationEnabled(userId, 'wishlist');
		break;
	case NotificationType.WISHLIST_DEADLINE:
		shouldSendEmail = await isNotificationEnabled(userId, 'wishlist');
		break;
	case NotificationType.PAYMENT_DEADLINE:
		shouldSendEmail = await isNotificationEnabled(userId, 'subscription');
		break;
	default:
		shouldSendEmail = true; // Always sent
}
```

---

## 13. SEQUENCE DIAGRAM ACTORS

1. **User** - Toggles notification settings
2. **SettingsSection Component** - UI component
3. **ApiService** - API client
4. **API Route Handler** - Server endpoint
5. **requireAuth** - Authentication
6. **Prisma Client** - Database operations
7. **Database** - PostgreSQL
8. **EmailService** - Email sending (checks settings)
9. **isNotificationEnabled** - Settings checker

---

## 14. CLASS DIAGRAM ENTITIES

### 14.1 Frontend Classes

- `SettingsSection` (Component)
- `InstitutionSettingsSection` (Component)
- `ApiService` (Service)

### 14.2 Backend Classes

- API Route Handlers (GET, PUT)
- `requireAuth` (Utility)
- `isNotificationEnabled` (Helper)
- `EmailService` (Service)
- Prisma Models (NotificationSetting, User)

---

## 15. KEY METHODS

### 15.1 Component Methods

- `fetchNotificationSettings()` - Fetch settings
- `handleNotificationChange()` - Handle toggle

### 15.2 Service Methods

- `getNotificationSettings()` - GET request
- `updateNotificationSettings()` - PUT request

### 15.3 API Methods

- `GET()` - Fetch/create settings
- `PUT()` - Update settings

### 15.4 Helper Methods

- `isNotificationEnabled()` - Check if enabled

---

## 16. FILE STRUCTURE

```
src/
├── components/profile/
│   ├── applicant/sections/
│   │   └── SettingsSection.tsx
│   └── institution/sections/
│       └── InstitutionSettingsSection.tsx
├── services/api/
│   └── axios-config.ts
├── app/api/notification-settings/
│   └── route.ts (GET, PUT handlers)
└── utils/notifications/
    └── notification-settings-helper.ts
```

---

## 17. DIAGRAM REQUIREMENTS

### Sequence Diagram:

- View Settings: User → Component → API → Database
- Toggle Setting: User → Component → Optimistic Update → API → Database →
  Response
- Email Check: EmailService → Helper → Database → Decision

### Class Diagram:

- Component classes with methods
- Service classes
- API route handlers
- Helper functions
- Database models and relationships

---

## 18. DEFAULT BEHAVIOR

### 18.1 New Users

- Settings auto-created on first fetch
- All notifications enabled by default
- No manual setup required

### 18.2 Missing Settings

- Defaults to enabled (backward compatibility)
- Ensures notifications aren't blocked
- Settings created on next fetch

### 18.3 Error Handling

- Defaults to enabled on error
- Ensures notifications aren't blocked
- Logs errors for debugging

---

## END OF DOCUMENT
