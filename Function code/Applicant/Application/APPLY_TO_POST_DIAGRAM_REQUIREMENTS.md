# Apply To Post - Components & Requirements for Sequence & Class Diagrams

## Overview

The Apply To Post feature allows authenticated applicants to submit applications
to opportunity posts (programs, scholarships, research labs) with optional
document uploads. The system creates a profile snapshot at application time and
sends notifications to institutions.

---

## 1. KEY COMPONENTS

### 1.1 Post Detail Pages

- **ProgramDetail**
  (`src/app/(applicant)/explore/programmes/[id]/ProgramDetail.tsx`)
- **ScholarshipDetail**
  (`src/app/(applicant)/explore/scholarships/[id]/ScholarshipDetail.tsx`)
- **ResearchLabDetail**
  (`src/app/(applicant)/explore/research-labs/[id]/ResearchLabDetail.tsx`)

**Key Features:**

- Apply button with loading state
- File upload interface
- Document type selection
- Duplicate application check
- Success/error modals

**State Management:**

- `hasApplied` - Application status check
- `isApplying` - Application submission state
- `isCheckingApplication` - Checking existing application
- `uploadedFiles` - Files to upload
- `isUploading` - File upload state

**Key Methods:**

- `checkExistingApplication()` - Checks if already applied
- `handleApply()` - Submits application
- `handleFileUpload()` - Handles file uploads to S3
- `getDocumentType()` - Determines document type from filename

### 1.2 Service

**ApplicationService** (`src/services/application/application-service.ts`)

**Method:**

```typescript
async submitApplication(
  applicationData: ApplicationRequest
): Promise<ApplicationResponse>
```

**Process:**

- Makes POST request to `/api/applications`
- Handles response and errors
- Returns application data

### 1.3 Hook

**useApplications** (`src/hooks/application/useApplications.ts`)

**Method:**

```typescript
submitApplication(data: ApplicationRequest): Promise<void>
```

**Functionality:**

- Calls ApplicationService
- Refreshes applications list after submission
- Refreshes statistics
- Handles errors

---

## 2. API ROUTE

### 2.1 POST /api/applications

**Location:** `src/app/api/applications/route.ts`

**Request Body:**

```typescript
{
  postId: string
  documents?: Array<{
    documentTypeId: string
    name: string
    url: string
    size: number
  }>
  coverLetter?: string
  additionalInfo?: string
}
```

**Process:**

1. **Authentication Check**
   - Validates user via `requireAuth()`
   - Extracts userId from session

2. **Validation**
   - Validates postId is provided (400 if missing)
   - Checks applicant profile exists (404 if not found)
   - Verifies post exists (404 if not found)

3. **Duplicate Check**
   - Checks if user already applied to this post
   - Returns 409 if duplicate exists

4. **Profile Snapshot Creation**
   - Fetches full applicant profile data
   - Creates ApplicationProfileSnapshot with:
     - Basic info (name, birthday, gender, etc.)
     - Academic info (degree, GPA, university, etc.)
     - Preferences (favorite countries)
     - Document IDs (references to profile documents)
     - Subdiscipline IDs (interests)

5. **Application Creation**
   - Creates Application record:
     - `application_id` (UUID)
     - `applicant_id`
     - `post_id`
     - `status: "SUBMITTED"`
     - `apply_at` (timestamp)

6. **Document Creation**
   - Maps document type IDs to enum values
   - Creates ApplicationDetail records for each document
   - Links documents to application

7. **Notification**
   - Sends notification to institution
   - Uses NotificationUtils.sendApplicationStatusNotification()
   - Includes application ID, post title, status

8. **Response**
   - Returns application data with post information

**Response:**

```typescript
{
  success: true,
  application: {
    applicationId: string
    applicantId: string
    postId: string
    status: "SUBMITTED"
    applyAt: string
    documents: ApplicationDocument[]
    post: {
      id: string
      title: string
      institution: { name, logo, country }
    }
  }
}
```

**Error Responses:**

- `400` - Post ID required
- `404` - Applicant profile not found / Post not found
- `409` - Already applied
- `500` - Server error

---

## 3. DATA FLOW

### 3.1 Complete Application Flow

1. **User Views Post Detail**
   - Navigates to post detail page
   - Component checks if already applied
   - `checkExistingApplication()` called on mount

2. **Check Existing Application**
   - Fetches applications for user
   - Checks if postId exists in applications
   - Updates `hasApplied` state
   - Disables apply button if already applied

3. **User Clicks Apply Button**
   - `handleApply()` called
   - Validates postId exists
   - Checks `hasApplied` flag (shows error if true)

4. **File Upload (Optional)**
   - User selects files
   - `handleFileUpload()` called for each file
   - File uploaded to S3 via presigned URL
   - S3 URL stored in `uploadedFiles` state
   - Document type determined from filename

5. **Application Submission**
   - `setIsApplying(true)`
   - Documents mapped to request format
   - `applicationService.submitApplication()` called
   - Request sent to `POST /api/applications`

6. **API Processing**
   - Authentication validated
   - Duplicate check performed
   - Profile snapshot created
   - Application record created
   - Documents saved
   - Notification sent

7. **Response Handling**
   - Success: `setHasApplied(true)`, show success modal
   - Error: Show error modal with retry option
   - `setIsApplying(false)`

8. **UI Update**
   - Apply button disabled
   - Status badge shown
   - Success message displayed

---

## 4. DATABASE OPERATIONS

### 4.1 Application Creation

```typescript
await prismaClient.application.create({
	data: {
		application_id: crypto.randomUUID(),
		applicant_id: applicant.applicant_id,
		post_id: body.postId,
		apply_at: new Date(),
		status: 'SUBMITTED',
	},
});
```

### 4.2 Profile Snapshot Creation

```typescript
await prismaClient.applicationProfileSnapshot.create({
	data: {
		snapshot_id: crypto.randomUUID(),
		application_id: application.application_id,
		// Profile fields
		first_name: applicantProfile.first_name,
		last_name: applicantProfile.last_name,
		// ... other fields
		document_ids: applicantProfile.documents.map((doc) => doc.document_id),
		subdiscipline_ids: applicantProfile.interests.map(
			(i) => i.subdiscipline.subdiscipline_id
		),
	},
});
```

### 4.3 Document Creation

```typescript
await prismaClient.applicationDetail.createMany({
	data: documents.map((doc) => ({
		document_id: crypto.randomUUID(),
		application_id: application.application_id,
		url: doc.url,
		name: doc.name,
		size: doc.size,
		document_type: mapDocumentType(doc.documentTypeId),
		update_at: new Date(),
	})),
});
```

---

## 5. FILE UPLOAD FLOW

### 5.1 S3 Upload Process

1. **File Selection**
   - User selects file via input
   - File validation (type, size)

2. **Presigned URL Request**
   - `POST /api/files/presigned-url`
   - Returns presigned URL and filename

3. **Direct S3 Upload**
   - PUT request to presigned URL
   - File uploaded directly to S3

4. **URL Storage**
   - Public S3 URL constructed
   - URL stored in component state
   - Ready for application submission

---

## 6. VALIDATION

### 6.1 Client-Side Validation

- Post ID must exist
- File type validation (PDF, DOC, DOCX, JPG, PNG)
- File size limits
- Duplicate application check

### 6.2 Server-Side Validation

- Authentication required
- Applicant profile required
- Post must exist
- Duplicate application check
- Document type mapping

---

## 7. ERROR HANDLING

### 7.1 Error Scenarios

- **Already Applied:** Shows error modal, disables apply button
- **Post Not Found:** Shows error message
- **Profile Not Found:** Redirects to profile creation
- **Network Error:** Shows error with retry option
- **Upload Error:** Shows specific upload error

### 7.2 Error Display

- Error modals with messages
- Retry functionality
- Loading states during operations

---

## 8. INTERFACES

### 8.1 ApplicationRequest

```typescript
interface ApplicationRequest {
	postId: string;
	documents?: ApplicationDocument[];
	coverLetter?: string;
	additionalInfo?: string;
}
```

### 8.2 ApplicationDocument

```typescript
interface ApplicationDocument {
	documentTypeId: string;
	name: string;
	url: string;
	size: number;
}
```

### 8.3 ApplicationResponse

```typescript
interface ApplicationResponse {
	success: boolean;
	application?: Application;
	error?: string;
}
```

---

## 9. NOTIFICATIONS

### 9.1 Institution Notification

- Sent via SQS/Email service
- Includes:
  - Institution user ID and email
  - Application ID
  - Post title
  - Status ("SUBMITTED")
  - Institution name

---

## 10. SEQUENCE DIAGRAM ACTORS

1. **User** - Initiates application
2. **Post Detail Component** - UI and file handling
3. **useApplications Hook** - State management
4. **ApplicationService** - API client
5. **API Route Handler** - Server endpoint
6. **requireAuth** - Authentication
7. **Prisma Client** - Database operations
8. **Database** - PostgreSQL
9. **S3 Service** - File storage
10. **Notification Service** - Email notifications

---

## 11. CLASS DIAGRAM ENTITIES

### 11.1 Frontend Classes

- `ProgramDetail` / `ScholarshipDetail` / `ResearchLabDetail` (Components)
- `useApplications` (Hook)
- `ApplicationService` (Service)

### 11.2 Backend Classes

- API Route Handler (POST method)
- `requireAuth` (Utility)
- Prisma Models (Application, ApplicationProfileSnapshot, ApplicationDetail)

---

## 12. KEY METHODS

### 12.1 Component Methods

- `checkExistingApplication()` - Check if applied
- `handleApply()` - Submit application
- `handleFileUpload()` - Upload files
- `getDocumentType()` - Determine document type

### 12.2 Service Methods

- `submitApplication(data)` - POST request

### 12.3 API Methods

- `POST()` - Create application with snapshot

---

## 13. FILE STRUCTURE

```
src/
├── app/(applicant)/explore/
│   ├── programmes/[id]/ProgramDetail.tsx
│   ├── scholarships/[id]/ScholarshipDetail.tsx
│   └── research-labs/[id]/ResearchLabDetail.tsx
├── hooks/application/
│   └── useApplications.ts
├── services/application/
│   └── application-service.ts
├── app/api/applications/
│   └── route.ts (POST handler)
└── types/api/
    └── application-api.ts
```

---

## 14. DIAGRAM REQUIREMENTS

### Sequence Diagram:

- User action → Component → Hook → Service → API → Database
- Show file upload flow to S3
- Show profile snapshot creation
- Show notification sending
- Include error handling paths

### Class Diagram:

- Component classes with methods
- Hook class with methods
- Service class with methods
- API route handler
- Database models and relationships

---

## END OF DOCUMENT
