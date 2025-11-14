# View Application Detail - Components & Requirements for Sequence & Class Diagrams

## Overview

The View Application Detail feature allows applicants to view complete details
of a specific application, including post information, institution details,
application documents, and status.

---

## 1. KEY COMPONENTS

### 1.1 Application Detail Page/Component

**Location:** Accessed via navigation from application list

**Purpose:** Displays full application details

**Key Features:**

- Complete application information
- Post details (program/scholarship/job)
- Institution information
- Application documents
- Status display
- Application date
- Navigation back to list

**Data Displayed:**

- Application ID
- Application status
- Application date
- Post title and details
- Institution name, logo, country
- Program/Scholarship/Job specific data
- Uploaded documents
- Document types and sizes

### 1.2 Service

**ApplicationService** (`src/services/application/application-service.ts`)

**Method:**

```typescript
async getApplication(applicationId: string): Promise<ApplicationResponse>
```

**Process:**

- Makes GET request to `/api/applications/[applicationId]`
- Returns application data

### 1.3 Hook

**useApplications** (`src/hooks/application/useApplications.ts`)

**Method:**

```typescript
getApplication(applicationId: string): Promise<Application>
```

**Functionality:**

- Calls ApplicationService
- Returns application data
- Handles errors

---

## 2. API ROUTE

### 2.1 GET /api/applications/[applicationId]

**Location:** `src/app/api/applications/[applicationId]/route.ts`

**Process:**

1. **Authentication Check**
   - Validates user via `requireAuth()`
   - Extracts userId from session

2. **Applicant Profile Check**
   - Fetches applicant profile
   - Returns 404 if not found

3. **Application Fetch**
   - Fetches application by ID
   - Verifies ownership (applicant_id match)
   - Returns 404 if not found or not owned

4. **Data Inclusion**
   - Includes post data with relations:
     - Institution (name, logo, country)
     - ProgramPost (if program)
     - ScholarshipPost (if scholarship)
     - JobPost (if job)
   - Includes application details (documents)

5. **Data Transformation**
   - Transforms application to response format
   - Maps post data
   - Maps documents
   - Formats dates

6. **Response**
   - Returns transformed application

**Response:**

```typescript
{
  success: true,
  application: {
    applicationId: string
    applicantId: string
    postId: string
    status: ApplicationStatus
    applyAt: string
    documents: ApplicationDocument[]
    post: {
      id: string
      title: string
      startDate: string
      endDate?: string
      location?: string
      institution: {
        name: string
        logo?: string
        country?: string
      }
      program?: ProgramData
      scholarship?: ScholarshipData
      job?: JobData
    }
  }
}
```

**Error Responses:**

- `404` - Application not found / Applicant profile not found
- `500` - Server error

---

## 3. DATA FLOW

### 3.1 View Application Detail Flow

1. **User Navigation**
   - User clicks on application card or link
   - Navigates to application detail page/route
   - Application ID passed as parameter

2. **Component Mounts**
   - Detail component renders
   - Application ID extracted from route params

3. **Fetch Application**
   - `applicationService.getApplication(applicationId)` called
   - `GET /api/applications/[applicationId]` request sent

4. **API Processing**
   - Authentication validated
   - Applicant profile checked
   - Application fetched with relations
   - Ownership verified

5. **Data Display**
   - Application data displayed
   - Post information shown
   - Institution details shown
   - Documents listed
   - Status badge displayed

6. **Navigation**
   - Back button returns to list
   - Breadcrumb navigation available

---

## 4. DATABASE OPERATIONS

### 4.1 Fetch Application

```typescript
const application = await prismaClient.application.findFirst({
	where: {
		application_id: params.applicationId,
		applicant_id: applicant.applicant_id,
	},
	include: {
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

---

## 5. INTERFACES

### 5.1 Application

```typescript
interface Application {
	applicationId: string;
	applicantId: string;
	postId: string;
	status: ApplicationStatus;
	applyAt: string;
	documents: ApplicationDocument[];
	post: {
		id: string;
		title: string;
		startDate: string;
		endDate?: string;
		location?: string;
		institution: {
			name: string;
			logo?: string;
			country?: string;
		};
		program?: {
			post_id: string;
			duration: string;
			degree_level: string;
			attendance: string;
			// ... other program fields
		};
		scholarship?: {
			post_id: string;
			description: string;
			type: string;
			number: number;
			// ... other scholarship fields
		};
		job?: {
			post_id: string;
			contract_type: string;
			job_type: string;
			// ... other job fields
		};
	};
}
```

### 5.2 ApplicationDocument

```typescript
interface ApplicationDocument {
	documentTypeId: string;
	name: string;
	url: string;
	size: number;
	documentType: string;
}
```

---

## 6. FEATURES

### 6.1 Application Information

- Application ID
- Application status (badge)
- Application date
- Status history (if available)

### 6.2 Post Information

- Post title
- Post type (Program/Scholarship/Job)
- Start/End dates
- Location
- Type-specific details

### 6.3 Institution Information

- Institution name
- Institution logo
- Institution country
- Institution contact (if available)

### 6.4 Documents

- Document list
- Document names
- Document types
- File sizes
- Download/view links

---

## 7. SEQUENCE DIAGRAM ACTORS

1. **User** - Navigates to detail
2. **Detail Component** - UI component
3. **useApplications Hook** - State management
4. **ApplicationService** - API client
5. **API Route Handler** - Server endpoint
6. **requireAuth** - Authentication
7. **Prisma Client** - Database
8. **Database** - PostgreSQL

---

## 8. CLASS DIAGRAM ENTITIES

### 8.1 Frontend Classes

- Application Detail Component
- `useApplications` (Hook)
- `ApplicationService` (Service)

### 8.2 Backend Classes

- API Route Handler (GET method)
- `requireAuth` (Utility)
- Prisma Models (Application, OpportunityPost, Institution, ApplicationDetail)

---

## 9. KEY METHODS

### 9.1 Service Methods

- `getApplication(applicationId)` - GET request

### 9.2 Hook Methods

- `getApplication(applicationId)` - Fetch detail

### 9.3 API Methods

- `GET()` - Fetch application with relations

---

## 10. FILE STRUCTURE

```
src/
├── hooks/application/
│   └── useApplications.ts
├── services/application/
│   └── application-service.ts
├── app/api/applications/
│   └── [applicationId]/route.ts (GET handler)
└── types/api/
    └── application-api.ts
```

---

## 11. DIAGRAM REQUIREMENTS

### Sequence Diagram:

- Navigation → Component → Hook → Service → API → Database
- Show data fetching with relations
- Show ownership verification

### Class Diagram:

- Component class
- Hook class
- Service class
- API handler
- Database models and relationships

---

## END OF DOCUMENT
