# Update Application - Components & Requirements for Sequence & Class Diagrams

## Overview

The Update Application feature allows applicants to respond to institution
update requests by submitting new documents and response messages. This occurs
when an application status is "REQUIRE_UPDATE".

---

## 1. KEY COMPONENTS

### 1.1 ApplicationUpdateResponseModal

**Location:**
`src/components/profile/applicant/sections/ApplicationUpdateResponseModal.tsx`

**Purpose:** Modal component for submitting update responses

**Key Features:**

- Displays institution update request
- File upload interface
- Document type selection
- Response message input
- Shows submitted documents (if already responded)
- Status display (PENDING/RESPONDED)

**State Management:**

- `updateRequest` - Update request data
- `loading` - Loading state
- `submitting` - Submission state
- `error` - Error message
- `responseMessage` - Response text
- `uploadedFiles` - Files to upload

**Key Methods:**

- `fetchUpdateRequest()` - Fetches update request data
- `handleFileUpload()` - Uploads file to S3
- `handleFileInput()` - Handles file selection
- `removeFile()` - Removes file from list
- `handleSubmit()` - Submits update response
- `handleClose()` - Closes modal

**Props:**

```typescript
interface ApplicationUpdateResponseModalProps {
	isOpen: boolean;
	onClose: () => void;
	applicationId: string;
	updateRequestId?: string;
	onSuccess?: () => void;
}
```

### 1.2 Service

**ApplicationService** - Not directly used, fetch API used directly

### 1.3 Hook Integration

- Used in `ApplicationSection` component
- Triggered when application status is "REQUIRE_UPDATE"

---

## 2. API ROUTES

### 2.1 GET /api/applications/[applicationId]/update-request

**Location:** `src/app/api/applications/[applicationId]/update-request/route.ts`

**Purpose:** Fetch update requests for an application

**Process:**

1. Validates authentication
2. Checks applicant profile
3. Verifies application ownership
4. Fetches all update requests for application
5. Includes requestedBy user data
6. Includes responseDocuments
7. Returns update requests array

**Response:**

```typescript
{
  success: true,
  updateRequests: Array<{
    updateRequestId: string
    applicationId: string
    requestedBy: { userId, name, email }
    requestMessage: string
    requestedDocuments: string[]
    status: "PENDING" | "RESPONDED"
    createdAt: string
    responseSubmittedAt?: string
    responseMessage?: string
    responseDocuments?: Array<{
      documentId: string
      name: string
      url: string
      size: number
      documentType: string
      updatedAt?: string
    }>
  }>
}
```

### 2.2 POST /api/applications/[applicationId]/update-request

**Location:** `src/app/api/applications/[applicationId]/update-request/route.ts`

**Purpose:** Submit update response with documents

**Request Body:**

```typescript
{
  documents: Array<{
    documentTypeId: string
    name: string
    url: string
    size: number
  }>
  responseMessage?: string
}
```

**Process:**

1. **Authentication Check**
   - Validates user via `requireAuth()`
   - Checks applicant profile

2. **Application Verification**
   - Verifies application exists
   - Verifies ownership (applicant_id match)
   - Checks status is "REQUIRE_UPDATE"
   - Returns 404 if invalid

3. **Update Request Check**
   - Fetches pending update request
   - Returns 404 if no pending request

4. **Validation**
   - Validates at least one document provided
   - Returns 400 if no documents

5. **Document Creation**
   - Maps document type IDs to enum values
   - Creates ApplicationDetail records:
     - `is_update_submission: true`
     - Links to `update_request_id`
   - Stores documents in database

6. **Update Request Update**
   - Updates ApplicationUpdateRequest:
     - `status: "RESPONDED"`
     - `response_submitted_at: new Date()`
     - `response_message: responseMessage`

7. **Application Status Update**
   - Checks if all update requests are responded
   - If all responded: Updates application status to "UPDATED"
   - If pending remain: Keeps "REQUIRE_UPDATE"

8. **Notification**
   - Sends notification to institution
   - Uses NotificationUtils.sendDocumentUpdateNotification()
   - Includes applicant name, document count

9. **Response**
   - Returns success with update request data

**Response:**

```typescript
{
  success: true,
  message: "Update response submitted successfully",
  updateRequest: {
    updateRequestId: string
    status: "RESPONDED"
    responseSubmittedAt: string
  },
  documentsCount: number
}
```

**Error Responses:**

- `400` - At least one document required
- `404` - Application not found / No pending request
- `500` - Server error

---

## 3. DATA FLOW

### 3.1 Update Application Flow

1. **User Sees Update Required Status**
   - Application card shows "Update Required" badge
   - Update button available

2. **User Clicks Update Button**
   - `ApplicationUpdateResponseModal` opens
   - `applicationId` passed to modal

3. **Fetch Update Request**
   - `fetchUpdateRequest()` called on modal open
   - `GET /api/applications/[applicationId]/update-request` called
   - Update request data loaded
   - Institution request message displayed

4. **User Uploads Documents**
   - User selects files
   - `handleFileInput()` called
   - `handleFileUpload()` processes each file:
     - Requests presigned URL from `/api/files/presigned-url`
     - Uploads file directly to S3
     - Constructs public URL
     - Adds to `uploadedFiles` state

5. **User Adds Response Message (Optional)**
   - User types message in textarea
   - `responseMessage` state updated

6. **User Submits Response**
   - `handleSubmit()` called
   - Validates at least one document uploaded
   - Prepares documents array
   - `POST /api/applications/[applicationId]/update-request` called

7. **API Processing**
   - Validates application and update request
   - Creates ApplicationDetail records
   - Updates ApplicationUpdateRequest status
   - Updates Application status (if all requests responded)
   - Sends notification to institution

8. **Response Handling**
   - Success: Modal closes, `onSuccess()` called
   - Error: Error message displayed
   - Application list refreshes

9. **UI Update**
   - Application status changes to "UPDATED" (if all responded)
   - Update button disabled
   - Status badge updated

---

## 4. FILE UPLOAD FLOW

### 4.1 Presigned URL Request

```typescript
POST / api / files / presigned - url;
{
	fileName: string;
	fileType: string;
	fileSize: number;
}
```

**Response:**

```typescript
{
	presignedUrl: string;
	fileName: string;
}
```

### 4.2 S3 Upload

- PUT request to presigned URL
- File uploaded directly to S3
- Public URL constructed from bucket name and region

### 4.3 URL Storage

- Public S3 URL stored in component state
- Ready for submission

---

## 5. DATABASE OPERATIONS

### 5.1 Fetch Update Requests

```typescript
const updateRequests = await prismaClient.applicationUpdateRequest.findMany({
	where: { application_id: params.applicationId },
	include: {
		requestedBy: { select: { id, name, email } },
		responseDocuments: {
			select: {
				document_id: true,
				name: true,
				url: true,
				size: true,
				document_type: true,
				update_at: true,
			},
		},
	},
	orderBy: { created_at: 'desc' },
});
```

### 5.2 Create Response Documents

```typescript
await prismaClient.applicationDetail.createMany({
	data: documents.map((doc) => ({
		document_id: randomUUID(),
		application_id: params.applicationId,
		update_request_id: pendingUpdateRequest.update_request_id,
		url: doc.url,
		name: doc.name,
		size: doc.size,
		document_type: mapDocumentType(doc.documentTypeId),
		is_update_submission: true,
		update_at: new Date(),
	})),
});
```

### 5.3 Update Update Request

```typescript
await prismaClient.applicationUpdateRequest.update({
	where: { update_request_id: pendingUpdateRequest.update_request_id },
	data: {
		status: 'RESPONDED',
		response_submitted_at: new Date(),
		response_message: responseMessage?.trim() || null,
	},
});
```

### 5.4 Update Application Status

```typescript
// Only if all update requests are responded
if (remainingPendingRequests.length === 0) {
	await prismaClient.application.update({
		where: { application_id: params.applicationId },
		data: { status: 'UPDATED' },
	});
}
```

---

## 6. INTERFACES

### 6.1 UpdateRequest

```typescript
interface UpdateRequest {
	updateRequestId: string;
	requestMessage: string;
	requestedDocuments: string[];
	status: 'PENDING' | 'RESPONDED';
	createdAt: string;
	responseSubmittedAt?: string;
	responseMessage?: string;
	responseDocuments?: Array<{
		documentId: string;
		name: string;
		url: string;
		size: number;
		documentType: string;
		updatedAt?: string;
	}>;
	requestedBy: {
		userId: string;
		name: string;
		email: string;
	};
}
```

### 6.2 UploadedFile

```typescript
interface UploadedFile {
	file: File;
	documentTypeId: string;
	name: string;
	url?: string;
	size: number;
}
```

---

## 7. VALIDATION

### 7.1 Client-Side Validation

- At least one document required
- File type validation
- File size limits
- Response message length (optional)

### 7.2 Server-Side Validation

- Authentication required
- Applicant profile required
- Application must exist and be owned by applicant
- Application status must be "REQUIRE_UPDATE"
- Pending update request must exist
- At least one document required

---

## 8. ERROR HANDLING

### 8.1 Error Scenarios

- **No Pending Request:** Shows error message
- **Application Not Found:** Shows error
- **No Documents:** Validation error
- **Upload Error:** Shows specific upload error
- **Network Error:** Shows error with retry

### 8.2 Error Display

- Error messages in modal
- Loading states during operations
- Disabled buttons during submission

---

## 9. NOTIFICATIONS

### 9.1 Institution Notification

- Sent via SQS/Email service
- Includes:
  - Institution user ID and email
  - Application ID
  - Post title
  - Applicant name
  - Institution name
  - Document count

---

## 10. STATUS MANAGEMENT

### 10.1 Update Request Status

- **PENDING** - Awaiting response
- **RESPONDED** - Response submitted

### 10.2 Application Status

- **REQUIRE_UPDATE** - Has pending update requests
- **UPDATED** - All update requests responded

---

## 11. SEQUENCE DIAGRAM ACTORS

1. **User** - Initiates update
2. **ApplicationUpdateResponseModal** - Modal component
3. **File Upload Service** - Presigned URL and S3
4. **API Route Handler** - Server endpoint
5. **requireAuth** - Authentication
6. **Prisma Client** - Database
7. **Database** - PostgreSQL
8. **Notification Service** - Email notifications

---

## 12. CLASS DIAGRAM ENTITIES

### 12.1 Frontend Classes

- `ApplicationUpdateResponseModal` (Component)
- `ApplicationSection` (Parent component)

### 12.2 Backend Classes

- API Route Handlers (GET, POST)
- `requireAuth` (Utility)
- Prisma Models (ApplicationUpdateRequest, ApplicationDetail, Application)

---

## 13. KEY METHODS

### 13.1 Modal Methods

- `fetchUpdateRequest()` - GET update request
- `handleFileUpload()` - Upload to S3
- `handleSubmit()` - POST update response
- `removeFile()` - Remove file

### 13.2 API Methods

- `GET()` - Fetch update requests
- `POST()` - Submit update response

---

## 14. FILE STRUCTURE

```
src/
├── components/profile/applicant/sections/
│   └── ApplicationUpdateResponseModal.tsx
├── app/api/applications/
│   └── [applicationId]/update-request/
│       └── route.ts (GET, POST handlers)
└── app/api/files/
    └── presigned-url/route.ts
```

---

## 15. DIAGRAM REQUIREMENTS

### Sequence Diagram:

- User action → Modal → File Upload → API → Database → Notification
- Show presigned URL flow
- Show document creation
- Show status update logic
- Include error handling

### Class Diagram:

- Modal component class
- API route handlers
- Database models and relationships
- File upload service

---

## END OF DOCUMENT
