# View Application Detail - Components & Requirements for Sequence & Class Diagrams

## Overview

The View Application Detail feature allows authenticated institutions to view
complete details of a specific application, including applicant profile
snapshot, application documents, post information, and update requests.

---

## 1. KEY COMPONENTS

### 1.1 ApplicantDetailPage Component

**Location:**
`src/app/(institution)/institution/dashboard/applications/[applicationId]/ApplicantDetailPage.tsx`

**Purpose:** Page wrapper for applicant detail view

**Key Features:**

- Fetches applicant data from API
- Wraps ApplicantDetailView component
- Handles navigation and callbacks

**State Management:**

- `applicant` - Applicant data
- `loading` - Loading state
- `error` - Error message

**Key Methods:**

- `handleBack()` - Navigate back to list
- `handleApprove()` - Refresh after approval
- `handleReject()` - Refresh after rejection
- `handleRequireUpdate()` - Refresh after update request

### 1.2 ApplicantDetailView Component

**Location:**
`src/components/profile/institution/components/ApplicantDetailView.tsx`

**Purpose:** Main component for displaying application details

**Key Features:**

- Tabbed interface (Personal Info, Academic Profile, Documents, Post Info)
- Application status display
- Action buttons (Approve, Reject, Require Update)
- Document viewing and downloading
- Update requests display
- Profile snapshot data display

**State Management:**

- `applicationDetails` - Full application details
- `loading` - Loading state
- `error` - Error message
- `activeTab` - Active tab
- `processingStatus` - Current action being processed

**Key Methods:**

- `fetchApplicationDetails()` - Fetches application details
- `handleDownloadFile()` - Downloads document
- `handleApprove()` - Approves application
- `handleReject()` - Rejects application
- `handleUpdateRequest()` - Sends update request

---

## 2. API ROUTES

### 2.1 GET /api/applications/institution/[applicationId]

**Location:** `src/app/api/applications/institution/[applicationId]/route.ts`

**Purpose:** Fetch detailed application information for institutions

**Authentication:** Required via `requireAuth()`

**Process:**

1. Validates authentication
2. Fetches institution for user
3. Verifies application belongs to institution
4. Fetches application with relations:
   - `ApplicationProfileSnapshot`
   - `updateRequests` with requestedBy and responseDocuments
   - `applicant` with user and subdiscipline
   - `post` with institution, programPost, scholarshipPost, jobPost
   - `details` (application documents)
5. Fetches documents from snapshot `document_ids`
6. Fetches subdisciplines for documents
7. Transforms data to frontend format

**Response:**

```typescript
{
  success: true,
  data: {
    application: {
      applicationId: string,
      applicantId: string,
      postId: string,
      status: string,
      applyAt: string, // ISO date
      documents: Array<{
        documentId: string,
        name: string,
        url: string,
        size: number,
        documentType: string,
        uploadDate: string
      }>,
      updateDocuments: Array<{
        documentId: string,
        name: string,
        url: string,
        size: number,
        documentType: string,
        uploadDate: string,
        updateRequestId: string
      }>,
      post: {
        id: string,
        title: string,
        startDate: string,
        endDate: string,
        location: string,
        institution: {
          name: string,
          logo: string,
          country: string
        },
        program: {...} | undefined,
        scholarship: {...} | undefined,
        job: {...} | undefined
      }
    },
    applicant: {
      applicantId: string,
      userId: string,
      firstName: string,
      lastName: string,
      name: string,
      email: string,
      image: string,
      birthday: string,
      gender: string,
      nationality: string,
      phoneNumber: string,
      countryCode: string,
      graduated: boolean,
      level: string,
      subdiscipline: Array<{
        id: string,
        name: string,
        disciplineName: string
      }>,
      disciplines: string[],
      gpa: number,
      university: string,
      countryOfStudy: string,
      hasForeignLanguage: boolean,
      languages: string[],
      favoriteCountries: string[],
      subdisciplineIds: string[],
      documents: Array<{
        documentId: string,
        name: string,
        url: string,
        size: number,
        documentType: string,
        uploadDate: string,
        title: string | null,
        subdiscipline: string[]
      }>
    },
    updateRequests: Array<{
      updateRequestId: string,
      requestMessage: string,
      requestedDocuments: string[],
      status: string,
      createdAt: string,
      responseSubmittedAt: string | null,
      responseMessage: string | null,
      requestedBy: {
        userId: string,
        name: string,
        email: string
      },
      responseDocuments: Array<{
        documentId: string,
        name: string,
        url: string,
        size: number,
        documentType: string,
        updatedAt: string
      }>
    }>
  }
}
```

---

## 3. DATA FLOW

### 3.1 View Application Detail Flow

1. **User Navigates to Detail**
   - URL: `/institution/dashboard/applications/{applicationId}`
   - ApplicantDetailPage component mounts
   - Application ID extracted from URL params

2. **Fetch Applicant Data**
   - Fetches basic applicant data from list API
   - Sets applicant in state

3. **Fetch Application Details**
   - `fetchApplicationDetails()` called in ApplicantDetailView
   - `GET /api/applications/institution/{applicationId}` request sent

4. **API Processing**
   - Authentication validated
   - Institution verified
   - Application ownership verified
   - Application fetched with all relations
   - Documents fetched from snapshot `document_ids`
   - Subdisciplines fetched for documents
   - Data transformed to frontend format

5. **Response Handling**
   - Application details set in state
   - Loading state cleared

6. **Render Detail View**
   - Tabbed interface displayed
   - Personal Info tab: Basic applicant information
   - Academic Profile tab: Academic details, GPA, university, etc.
   - Documents tab: Application documents, update documents
   - Post Info tab: Post details, institution info
   - Action buttons displayed (if applicable)
   - Update requests displayed

### 3.2 Document Viewing Flow

1. **User Views Document**
   - Document list displayed in Documents tab
   - Documents from snapshot (preserves state at application time)
   - Update documents (submitted in response to update requests)

2. **User Downloads Document**
   - `handleDownloadFile()` called
   - Document URL fetched
   - File downloaded via browser

---

## 4. DATABASE OPERATIONS

### 4.1 Fetch Application Detail

```typescript
const application = await prismaClient.application.findFirst({
	where: {
		application_id: params.applicationId,
		post: {
			institution_id: institution.institution_id,
		},
	},
	include: {
		ApplicationProfileSnapshot: true,
		updateRequests: {
			include: {
				requestedBy: {
					select: { id: true, name: true, email: true },
				},
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
		},
		applicant: {
			include: {
				user: {
					select: { id: true, name: true, email: true, image: true },
				},
				subdiscipline: {
					select: {
						subdiscipline_id: true,
						name: true,
						discipline: { select: { name: true } },
					},
				},
			},
		},
		post: {
			include: {
				institution: {
					select: { name: true, logo: true, country: true },
				},
				programPost: true,
				scholarshipPost: true,
				jobPost: true,
			},
		},
		details: true,
	},
});
```

### 4.2 Fetch Documents from Snapshot

```typescript
// Extract document IDs from snapshot
const documentIds = snapshot.document_ids; // Array or comma-separated string

// Fetch documents (no status filter - preserves state at application time)
const snapshotDocs = await prismaClient.applicantDocument.findMany({
	where: {
		document_id: { in: documentIds },
	},
	include: {
		documentType: true,
	},
});
```

### 4.3 Fetch Subdisciplines for Documents

```typescript
// Batch fetch subdisciplines by ID and name
const subdisciplinesById = await prismaClient.subdiscipline.findMany({
	where: {
		subdiscipline_id: { in: subdisciplineIds },
	},
	include: {
		discipline: { select: { name: true } },
	},
});

const subdisciplinesByName = await prismaClient.subdiscipline.findMany({
	where: {
		name: { in: subdisciplineNames },
	},
	include: {
		discipline: { select: { name: true } },
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
	status: ApplicationStatus;
	apply_at: DateTime;
	snapshot_id: string(FK) | null;
}
```

**Relations:**

- `ApplicationProfileSnapshot` - ApplicationProfileSnapshot (optional)
- `updateRequests` - ApplicationUpdateRequest[]
- `applicant` - Applicant
- `post` - OpportunityPost
- `details` - ApplicationDetail[]

### 5.2 ApplicationProfileSnapshot

```typescript
{
  snapshot_id: string (PK)
  application_id: string (FK)
  user_name: string
  user_email: string
  user_image: string | null
  first_name: string
  last_name: string
  nationality: string | null
  phone_number: string | null
  country_code: string | null
  birthday: DateTime | null
  gender: boolean | null
  graduated: boolean
  level: string | null
  subdiscipline_id: string | null
  gpa: number | null
  university: string | null
  country_of_study: string | null
  has_foreign_language: boolean
  languages: string[]
  favorite_countries: string[]
  subdiscipline_ids: string[]
  document_ids: string[] | string
}
```

### 5.3 ApplicationUpdateRequest

```typescript
{
  update_request_id: string (PK)
  application_id: string (FK)
  requested_by_user_id: string (FK)
  request_message: string
  requested_documents: string[]
  status: string
  created_at: DateTime
  response_submitted_at: DateTime | null
  response_message: string | null
}
```

**Relations:**

- `requestedBy` - User
- `responseDocuments` - ApplicationDetail[]

### 5.4 ApplicationDetail

```typescript
{
	detail_id: string(PK);
	application_id: string(FK);
	document_id: string(FK);
	document_type: string;
	name: string;
	url: string;
	size: number;
	is_update_submission: boolean;
	update_request_id: string(FK) | null;
	update_at: DateTime | null;
}
```

### 5.5 ApplicantDocument

```typescript
{
  document_id: string (PK)
  applicant_id: string (FK)
  document_type_id: string (FK)
  name: string
  url: string
  size: number
  title: string | null
  subdiscipline: string[]
  upload_at: DateTime
  status: boolean
  deleted_at: DateTime | null
}
```

---

## 6. INTERFACES

### 6.1 Application Details (Frontend)

```typescript
interface ApplicationDetails {
	application: {
		applicationId: string;
		applicantId: string;
		postId: string;
		status: string;
		applyAt: string;
		documents: Document[];
		updateDocuments: UpdateDocument[];
		post: PostDetails;
	};
	applicant: {
		applicantId: string;
		userId: string;
		firstName: string;
		lastName: string;
		name: string;
		email: string;
		image: string;
		birthday: string;
		gender: string;
		nationality: string;
		phoneNumber: string;
		countryCode: string;
		graduated: boolean;
		level: string;
		subdiscipline: Array<{
			id: string;
			name: string;
			disciplineName: string;
		}>;
		disciplines: string[];
		gpa: number;
		university: string;
		countryOfStudy: string;
		hasForeignLanguage: boolean;
		languages: string[];
		favoriteCountries: string[];
		subdisciplineIds: string[];
		documents: Document[];
	};
	updateRequests: UpdateRequest[];
}
```

---

## 7. FEATURES

### 7.1 Tabbed Interface

- **Personal Info:** Basic applicant information (name, email, phone,
  nationality, etc.)
- **Academic Profile:** Academic details (degree level, subdiscipline, GPA,
  university, etc.)
- **Documents:** Application documents and update documents
- **Post Info:** Post details, institution information

### 7.2 Application Information

- Application status
- Applied date
- Post title and details
- Institution information

### 7.3 Document Management

- View application documents (from snapshot)
- View update documents (submitted in response to update requests)
- Download documents
- Document type and size display

### 7.4 Update Requests

- Display update requests history
- Show request message
- Show requested documents
- Show response status
- Show response documents

---

## 8. SEQUENCE DIAGRAM ACTORS

1. **User** - Views application detail
2. **ApplicantDetailPage** - Page component
3. **ApplicantDetailView** - Detail component
4. **API Route Handler** - Server endpoint
5. **requireAuth** - Authentication
6. **Prisma Client** - Database
7. **Database** - PostgreSQL

---

## 9. CLASS DIAGRAM ENTITIES

### 9.1 Frontend Classes

- `ApplicantDetailPage` (Page component)
- `ApplicantDetailView` (Component)

### 9.2 Backend Classes

- API Route Handler (GET)
- `requireAuth` (Utility)
- Prisma Models (Application, ApplicationProfileSnapshot,
  ApplicationUpdateRequest, ApplicationDetail, ApplicantDocument, Applicant,
  User, OpportunityPost)

---

## 10. KEY METHODS

### 10.1 Component Methods

- `fetchApplicationDetails()` - Fetch application details
- `handleDownloadFile()` - Download document
- `handleApprove()` - Approve application
- `handleReject()` - Reject application
- `handleUpdateRequest()` - Send update request

### 10.2 API Methods

- `GET()` - Fetch application details

---

## 11. FILE STRUCTURE

```
src/
├── app/(institution)/institution/dashboard/applications/
│   └── [applicationId]/
│       ├── page.tsx
│       └── ApplicantDetailPage.tsx
├── components/profile/institution/components/
│   └── ApplicantDetailView.tsx
└── app/api/applications/institution/[applicationId]/
    └── route.ts (GET handler)
```

---

## 12. DIAGRAM REQUIREMENTS

### Sequence Diagram:

- User navigation → Page → Component → API → Database → Transform → Display
- Document download flow
- Include all database operations (application, snapshot, documents,
  subdisciplines)

### Class Diagram:

- Page component
- Detail component class
- API route handler
- Database models and relationships
- Data transformation logic

---

## 13. NOTES

### 13.1 Snapshot Data

- Application details use `ApplicationProfileSnapshot` to preserve applicant
  data at application time
- Documents are fetched from snapshot `document_ids` to show state at
  application time
- Even if documents are deleted later, they still display if they were in the
  snapshot

### 13.2 Update Documents

- Documents submitted in response to update requests are stored in
  `ApplicationDetail` with `is_update_submission: true`
- These are separate from original application documents

---

## END OF DOCUMENT
