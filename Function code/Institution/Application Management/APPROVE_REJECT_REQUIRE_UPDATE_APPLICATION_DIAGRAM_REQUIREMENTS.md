# Approve/Reject/Require Update Application - Components & Requirements for Sequence & Class Diagrams

## Overview

The Approve/Reject/Require Update Application feature allows authenticated
institutions to update application statuses (Approve, Reject, or Require
Update), send notifications to applicants, and create update requests with
messaging.

---

## 1. KEY COMPONENTS

### 1.1 ApplicantDetailView Component

**Location:**
`src/components/profile/institution/components/ApplicantDetailView.tsx`

**Purpose:** Main component for application actions

**Key Features:**

- Approve button
- Reject button
- Require Update button (with message modal)
- Status display
- Processing states

**State Management:**

- `processingStatus` - Current action being processed ('approve' | 'reject' |
  'update' | null)
- `applicationDetails` - Application details
- `loading` - Loading state
- `error` - Error message

**Key Methods:**

- `handleApprove()` - Approves application
- `handleReject()` - Rejects application
- `handleUpdateRequest()` - Sends update request with message

### 1.2 ApplicantDetailPage Component

**Location:**
`src/app/(institution)/institution/dashboard/applications/[applicationId]/ApplicantDetailPage.tsx`

**Purpose:** Page wrapper that handles callbacks

**Key Methods:**

- `handleApprove()` - Refreshes page after approval
- `handleReject()` - Refreshes page after rejection
- `handleRequireUpdate()` - Refreshes page after update request

---

## 2. API ROUTES

### 2.1 PUT /api/applications/institution/[applicationId]

**Location:** `src/app/api/applications/institution/[applicationId]/route.ts`

**Purpose:** Update application status (Approve, Reject, or Require Update)

**Authentication:** Required via `requireAuth()`

**Request Body:**

```typescript
{
  status: "ACCEPTED" | "REJECTED" | "REQUIRE_UPDATE" | "SUBMITTED" | "UPDATED",
  message?: string, // Required for REQUIRE_UPDATE
  requestedDocuments?: string[] // Optional for REQUIRE_UPDATE
}
```

**Process:**

1. Validates authentication
2. Fetches institution for user
3. Validates status (must be one of: SUBMITTED, REQUIRE_UPDATE, ACCEPTED,
   REJECTED, UPDATED)
4. Verifies application belongs to institution
5. Gets old status for notification
6. Updates application status
7. If status is REQUIRE_UPDATE:
   - Creates `ApplicationUpdateRequest` record
   - Sends message via Box messaging system (creates Box if needed)
8. Sends notification to applicant via SQS
9. Returns success response

**Response:**

```typescript
{
  success: true,
  message: "Application status updated successfully",
  application: {
    applicationId: string,
    status: string
  }
}
```

---

## 3. DATA FLOW

### 3.1 Approve Application Flow

1. **User Clicks Approve Button**
   - `handleApprove()` called
   - `processingStatus` set to 'approve'

2. **API Request**
   - `PUT /api/applications/institution/{applicationId}` request sent
   - Body: `{ status: "ACCEPTED" }`

3. **API Processing**
   - Authentication validated
   - Institution verified
   - Application ownership verified
   - Application status updated to ACCEPTED
   - Notification sent to applicant

4. **Response Handling**
   - Success: Application details refreshed, parent callback called
   - Error: Error message displayed

5. **UI Update**
   - Status badge updated
   - Action buttons updated (if needed)
   - Processing state cleared

### 3.2 Reject Application Flow

1. **User Clicks Reject Button**
   - `handleReject()` called
   - `processingStatus` set to 'reject'

2. **API Request**
   - `PUT /api/applications/institution/{applicationId}` request sent
   - Body: `{ status: "REJECTED" }`

3. **API Processing**
   - Similar to approve flow
   - Application status updated to REJECTED
   - Notification sent to applicant

4. **Response Handling**
   - Similar to approve flow

### 3.3 Require Update Flow

1. **User Clicks Require Update Button**
   - Update request modal shown
   - User enters message (required)

2. **User Submits Update Request**
   - `handleUpdateRequest(message)` called
   - `processingStatus` set to 'update'

3. **API Request**
   - `PUT /api/applications/institution/{applicationId}` request sent
   - Body:
     `{ status: "REQUIRE_UPDATE", message: string, requestedDocuments?: string[] }`

4. **API Processing**
   - Authentication validated
   - Institution verified
   - Application ownership verified
   - Application status updated to REQUIRE_UPDATE
   - `ApplicationUpdateRequest` created:
     - `update_request_id` generated
     - `application_id` set
     - `requested_by_user_id` set to institution user
     - `request_message` set
     - `requested_documents` set (if provided)
     - `status` set to "PENDING"
   - Box messaging:
     - Gets or creates Box between institution and applicant
     - Creates Message with request message
   - Notification sent to applicant

5. **Response Handling**
   - Success: Application details refreshed, update request visible
   - Error: Error message displayed

6. **UI Update**
   - Status badge updated
   - Update requests section updated
   - Processing state cleared

### 3.4 Notification Flow

1. **Status Update Triggers Notification**
   - `NotificationUtils.sendApplicationStatusNotification()` called
   - Notification message created
   - Sent to SQS queue

2. **Notification Processing**
   - SQS handler processes notification
   - Email sent to applicant
   - Notification stored (if applicable)

---

## 4. DATABASE OPERATIONS

### 4.1 Update Application Status

```typescript
const updatedApplication = await prismaClient.application.update({
	where: { application_id: params.applicationId },
	data: {
		status: status, // ACCEPTED, REJECTED, or REQUIRE_UPDATE
	},
});
```

### 4.2 Create Update Request

```typescript
await prismaClient.applicationUpdateRequest.create({
	data: {
		update_request_id: randomUUID(),
		application_id: params.applicationId,
		requested_by_user_id: user.id,
		request_message: message.trim(),
		requested_documents: requestedDocuments || [],
		status: 'PENDING',
		created_at: new Date(),
	},
});
```

### 4.3 Get or Create Box

```typescript
let box = await prismaClient.box.findFirst({
	where: {
		OR: [
			{
				user_one_id: user.id,
				user_two_id: applicant.user.id,
			},
			{
				user_one_id: applicant.user.id,
				user_two_id: user.id,
			},
		],
	},
});

if (!box) {
	box = await prismaClient.box.create({
		data: {
			box_id: randomUUID(),
			user_one_id: user.id,
			user_two_id: applicant.user.id,
			created_at: new Date(),
			updated_at: new Date(),
		},
	});
}
```

### 4.4 Create Message

```typescript
await prismaClient.message.create({
	data: {
		message_id: randomUUID(),
		box_id: box.box_id,
		sender_id: user.id,
		body: message.trim(),
		send_at: new Date(),
	},
});
```

---

## 5. DATABASE MODELS

### 5.1 Application

```typescript
{
	application_id: string(PK);
	post_id: string(FK);
	applicant_id: string(FK);
	status: ApplicationStatus(
		SUBMITTED,
		ACCEPTED,
		REJECTED,
		REQUIRE_UPDATE,
		UPDATED
	);
	apply_at: DateTime;
	snapshot_id: string(FK) | null;
}
```

### 5.2 ApplicationUpdateRequest

```typescript
{
  update_request_id: string (PK)
  application_id: string (FK)
  requested_by_user_id: string (FK)
  request_message: string
  requested_documents: string[]
  status: string (PENDING, COMPLETED, etc.)
  created_at: DateTime
  response_submitted_at: DateTime | null
  response_message: string | null
}
```

**Relations:**

- `requestedBy` - User
- `responseDocuments` - ApplicationDetail[]

### 5.3 Box

```typescript
{
	box_id: string(PK);
	user_one_id: string(FK);
	user_two_id: string(FK);
	created_at: DateTime;
	updated_at: DateTime;
	last_message: string | null;
	last_message_at: DateTime | null;
}
```

### 5.4 Message

```typescript
{
	message_id: string(PK);
	box_id: string(FK);
	sender_id: string(FK);
	body: string;
	send_at: DateTime;
	is_read: boolean;
	read_at: DateTime | null;
}
```

---

## 6. VALIDATION

### 6.1 Status Validation

- Must be one of: SUBMITTED, REQUIRE_UPDATE, ACCEPTED, REJECTED, UPDATED
- Invalid status returns 400 error

### 6.2 Message Validation (Require Update)

- Message is required when status is REQUIRE_UPDATE
- Message must be non-empty string

### 6.3 Application Ownership

- Application must belong to institution's posts
- Verified before any update operation

---

## 7. INTERFACES

### 7.1 Update Application Request

```typescript
interface UpdateApplicationRequest {
	status: 'ACCEPTED' | 'REJECTED' | 'REQUIRE_UPDATE' | 'SUBMITTED' | 'UPDATED';
	message?: string; // Required for REQUIRE_UPDATE
	requestedDocuments?: string[]; // Optional for REQUIRE_UPDATE
}
```

### 7.2 Update Application Response

```typescript
interface UpdateApplicationResponse {
	success: boolean;
	message: string;
	application: {
		applicationId: string;
		status: string;
	};
}
```

---

## 8. FEATURES

### 8.1 Approve Application

- Changes status to ACCEPTED
- Sends notification to applicant
- Updates UI immediately
- Refreshes application details

### 8.2 Reject Application

- Changes status to REJECTED
- Sends notification to applicant
- Updates UI immediately
- Refreshes application details

### 8.3 Require Update

- Changes status to REQUIRE_UPDATE
- Creates update request record
- Sends message via Box messaging
- Sends notification to applicant
- Updates UI with update request
- Refreshes application details

### 8.4 Notifications

- Email notification sent to applicant
- Notification includes:
  - Application ID
  - Post title
  - Old status
  - New status
  - Institution name
  - Update message (if REQUIRE_UPDATE)

### 8.5 Messaging Integration

- When REQUIRE_UPDATE is sent with message:
  - Box created if doesn't exist
  - Message sent to applicant
  - Applicant can respond via messaging system

---

## 9. SEQUENCE DIAGRAM ACTORS

1. **User** - Approves/rejects/requires update
2. **ApplicantDetailView** - Component
3. **API Route Handler** - Server endpoint
4. **requireAuth** - Authentication
5. **Prisma Client** - Database
6. **Database** - PostgreSQL
7. **SQS Service** - Notification queue
8. **Email Service** - Email notifications
9. **Box/Messaging System** - Real-time messaging

---

## 10. CLASS DIAGRAM ENTITIES

### 10.1 Frontend Classes

- `ApplicantDetailView` (Component)
- `ApplicantDetailPage` (Page component)

### 10.2 Backend Classes

- API Route Handler (PUT)
- `requireAuth` (Utility)
- `NotificationUtils` (Notification service)
- Prisma Models (Application, ApplicationUpdateRequest, Box, Message)

---

## 11. KEY METHODS

### 11.1 Component Methods

- `handleApprove()` - Approve application
- `handleReject()` - Reject application
- `handleUpdateRequest()` - Send update request

### 11.2 API Methods

- `PUT()` - Update application status

### 11.3 Service Methods

- `sendApplicationStatusNotification()` - Send notification via SQS

---

## 12. FILE STRUCTURE

```
src/
├── app/(institution)/institution/dashboard/applications/
│   └── [applicationId]/
│       └── ApplicantDetailPage.tsx
├── components/profile/institution/components/
│   └── ApplicantDetailView.tsx
└── app/api/applications/institution/[applicationId]/
    └── route.ts (PUT handler)
```

---

## 13. DIAGRAM REQUIREMENTS

### Sequence Diagram:

- User action → Component → API → Validation → Database → Notification →
  Response
- Include all database operations (update application, create update request,
  create box, create message)
- Include notification flow (SQS, email)
- Include messaging flow (Box creation, message sending)
- Include error handling paths

### Class Diagram:

- Component classes with methods
- API route handler
- Notification service
- Database models and relationships
- Messaging system integration

---

## 14. ERROR HANDLING

### 14.1 Error Scenarios

- **Invalid Status:** Returns 400 error
- **Application Not Found:** Returns 404 error
- **Access Denied:** Returns 403 error (application doesn't belong to
  institution)
- **Update Request Creation Fails:** Logs error but doesn't fail status update
- **Message Sending Fails:** Logs error but doesn't fail status update
- **Notification Fails:** Logs error but doesn't fail status update

### 14.2 Error Display

- Error alerts shown to user
- Processing state cleared on error
- Application details preserved

---

## 15. NOTES

### 15.1 Status Transitions

- **SUBMITTED → ACCEPTED:** Application approved
- **SUBMITTED → REJECTED:** Application rejected
- **SUBMITTED → REQUIRE_UPDATE:** Update requested
- **REQUIRE_UPDATE → UPDATED:** Applicant submitted update
- **UPDATED → ACCEPTED/REJECTED:** Final decision after update

### 15.2 Update Request Lifecycle

1. Institution creates update request (status: PENDING)
2. Applicant receives notification and message
3. Applicant submits update documents
4. Update request status changes (if tracked)
5. Institution reviews update and makes final decision

### 15.3 Messaging Integration

- When REQUIRE_UPDATE is sent with a message, it automatically creates a Box (if
  needed) and sends a message
- This allows applicants to respond directly via the messaging system
- The message appears in the institution's messages inbox

---

## END OF DOCUMENT
