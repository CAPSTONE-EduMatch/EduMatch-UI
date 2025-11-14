# View Post Detail (with Delete, Update, Close) - Components & Requirements for Sequence & Class Diagrams

## Overview

The View Post Detail feature allows authenticated institutions to view detailed
information about their posts, including applications, and perform actions like
Update, Close, and navigate to edit mode. Note: Posts are not deleted but closed
(status changed to CLOSED).

---

## 1. KEY COMPONENTS

### 1.1 InstitutionProgramDetail Component

**Location:**
`src/app/(institution)/institution/dashboard/programmes/[id]/InstitutionProgramDetail.tsx`

**Purpose:** Display program post details for institutions

**Key Features:**

- Tabbed interface (Overview, Structure, Admission, Fee, Scholarship, Other)
- Post information display
- Applications list
- Suggested applicants
- Edit button
- Close post button
- Status display

**State Management:**

- `currentProgram` - Program data
- `activeTab` - Active tab
- `transformedApplicants` - Applications list
- `suggestedApplicants` - Suggested applicants
- `isLoadingProgram` - Loading state
- `isLoadingApplications` - Applications loading state
- `breadcrumbItems` - Breadcrumb navigation

**Key Methods:**

- `fetchProgramDetail()` - Fetches program details
- `fetchApplications()` - Fetches applications
- `handleEditProgram()` - Navigates to edit mode
- `handleCloseProgram()` - Closes the post
- `handleApplicantDetail()` - Navigates to applicant detail
- `transformApplications()` - Transforms application data

### 1.2 InstitutionScholarshipDetail Component

**Location:**
`src/app/(institution)/institution/dashboard/scholarships/[id]/InstitutionScholarshipDetail.tsx`

**Purpose:** Display scholarship post details

**Features:**

- Similar to program detail
- Scholarship-specific tabs (Detail, Eligibility, Requirements)

### 1.3 InstitutionResearchLabDetail Component

**Location:**
`src/app/(institution)/institution/dashboard/reseach-labs/[id]/InstitutionResearchLabDetail.tsx`

**Purpose:** Display research lab post details

**Features:**

- Similar to program detail
- Research lab-specific tabs (Job Description, Requirements, Offer, Lab Info)

---

## 2. API ROUTES

### 2.1 GET /api/explore/programs/program-detail

**Location:** `src/app/api/explore/programs/program-detail/route.ts`

**Purpose:** Fetch program post details

**Query Parameters:**

- `id` - Post ID (required)

**Response:**

```typescript
{
  success: true,
  data: {
    post_id: string,
    title: string,
    description: string,
    startDate: string,
    endDate: string,
    location: string,
    status: string,
    program: {
      duration: string,
      attendance: string,
      courseInclude: string,
      gpa: number,
      gre: number,
      gmat: number,
      tuitionFee: number,
      feeDescription: string,
      scholarshipInfo: string,
      certificates: Array<{
        language: string,
        name: string,
        score: string
      }>
    },
    subdiscipline: Array<{
      name: string
    }>,
    documents: Array<{
      name: string,
      description: string
    }>
  }
}
```

### 2.2 GET /api/applications/institution

**Location:** `src/app/api/applications/institution/route.ts`

**Purpose:** Fetch applications for institution posts

**Query Parameters:**

- `postId` - Post ID (optional)
- `page` - Page number (optional)
- `limit` - Items per page (optional)

**Response:**

```typescript
{
  success: true,
  data: Array<{
    application_id: string,
    post_id: string,
    applicant_id: string,
    status: string,
    applied_date: DateTime,
    applicant: {
      name: string,
      degree_level: string,
      subdiscipline: string
    },
    snapshotData: {
      gpa: number
    }
  }>
}
```

### 2.3 PUT /api/posts/programs

**Location:** `src/app/api/posts/programs/route.ts`

**Purpose:** Update program post or change status

**Request Body (for Close):**

```typescript
{
  postId: string,
  status: "CLOSED"
}
```

**Request Body (for Update):**

```typescript
{
  postId: string,
  // ... all program fields (same as create)
}
```

**Process:**

1. Validates authentication
2. Verifies post belongs to institution
3. Updates OpportunityPost
4. Updates ProgramPost
5. Updates related records (certificates, documents, subdisciplines)

**Response:**

```typescript
{
  success: true,
  post: {
    id: string,
    title: string
  }
}
```

### 2.4 PUT /api/posts/scholarships

**Location:** `src/app/api/posts/scholarships/route.ts`

**Purpose:** Update scholarship post or change status

**Similar to programs endpoint**

### 2.5 PUT /api/posts/research

**Location:** `src/app/api/posts/research/route.ts`

**Purpose:** Update research lab post or change status

**Similar to programs endpoint**

---

## 3. DATA FLOW

### 3.1 View Post Detail Flow

1. **User Navigates to Detail Page**
   - URL: `/institution/dashboard/programmes/{id}`
   - Component mounts
   - Post ID extracted from URL params

2. **Fetch Post Details**
   - `fetchProgramDetail()` called
   - `GET /api/explore/programs/program-detail?id={id}` request sent
   - Post data fetched with all relations
   - Data transformed and set in state

3. **Fetch Applications**
   - `fetchApplications()` called
   - `GET /api/applications/institution?postId={id}` request sent
   - Applications fetched
   - Data transformed to Applicant interface
   - Suggested applicants filtered (matching score >= 80)

4. **Render Detail Page**
   - Post information displayed
   - Tabbed interface rendered
   - Applications table displayed
   - Suggested applicants displayed
   - Action buttons shown (Edit, Close)

### 3.2 Update Post Flow

1. **User Clicks Edit Button**
   - `handleEditProgram()` called
   - Navigates to:
     `/institution/dashboard/programs?action=edit&type=Program&id={id}`
   - Edit form loaded with post data

2. **User Makes Changes**
   - Form fields updated
   - Changes saved in form state

3. **User Submits Form**
   - `PUT /api/posts/programs` request sent
   - Post data updated in database
   - Related records updated

4. **Response Handling**
   - Success: Post detail refreshed
   - Error: Error message displayed

### 3.3 Close Post Flow

1. **User Clicks Close Button**
   - `handleCloseProgram()` called
   - Confirmation (if needed)

2. **API Request**
   - `PUT /api/posts/programs` request sent
   - Body: `{ postId: id, status: "CLOSED" }`

3. **API Processing**
   - Authentication validated
   - Post ownership verified
   - Status updated to CLOSED

4. **Response Handling**
   - Success: Post detail refreshed, status updated
   - Error: Error message displayed

### 3.4 Delete Post Flow

**Note:** Posts are not deleted. They are closed (status changed to CLOSED).
There is no DELETE endpoint. If deletion is needed, it would be a soft delete by
setting status to CLOSED or a hard delete by removing the record (not currently
implemented).

---

## 4. DATABASE OPERATIONS

### 4.1 Fetch Post Detail

```typescript
const post = await prismaClient.opportunityPost.findUnique({
	where: { post_id: postId },
	include: {
		programPost: {
			include: {
				certificates: true,
			},
		},
		subdisciplines: {
			include: {
				subdiscipline: true,
			},
		},
		documents: {
			include: {
				documentType: true,
			},
		},
	},
});
```

### 4.2 Fetch Applications

```typescript
const applications = await prismaClient.application.findMany({
	where: {
		post_id: postId,
	},
	include: {
		applicant: {
			include: {
				user: true,
				subdiscipline: true,
			},
		},
		snapshot: true,
	},
	orderBy: { applied_date: 'desc' },
});
```

### 4.3 Update Post Status (Close)

```typescript
await prismaClient.opportunityPost.update({
	where: { post_id: postId },
	data: {
		status: 'CLOSED',
	},
});
```

### 4.4 Update Post (Full Update)

```typescript
// Update OpportunityPost
await prismaClient.opportunityPost.update({
  where: { post_id: postId },
  data: {
    title: updateData.programTitle,
    start_date: startDate,
    end_date: applicationDeadline,
    location: updateData.location,
    other_info: updateData.otherInformation.content,
    degree_level: updateData.degreeLevel,
    description: updateData.description,
    status: updateData.status // If provided
  }
})

// Update ProgramPost
await prismaClient.programPost.update({
  where: { post_id: postId },
  data: {
    duration: updateData.duration,
    attendance: updateData.attendance,
    course_include: updateData.courseInclude,
    gpa: updateData.academicRequirements.gpa ? parseFloat(...) : null,
    // ... other fields
  }
})

// Delete and recreate certificates
await prismaClient.postCertificate.deleteMany({
  where: { post_id: postId }
})
// ... recreate certificates

// Delete and recreate documents
await prismaClient.postDocument.deleteMany({
  where: { post_id: postId }
})
// ... recreate documents

// Delete and recreate subdisciplines
await prismaClient.postSubdiscipline.deleteMany({
  where: { post_id: postId }
})
// ... recreate subdisciplines
```

---

## 5. DATABASE MODELS

### 5.1 OpportunityPost

```typescript
{
	post_id: string(PK);
	institution_id: string(FK);
	title: string;
	start_date: DateTime;
	end_date: DateTime;
	location: string;
	other_info: string | null;
	status: PostStatus(PUBLISHED, DRAFT, CLOSED, SUBMITTED, REQUIRE_UPDATE);
	create_at: DateTime;
	degree_level: string;
	description: string | null;
}
```

### 5.2 Application

```typescript
{
	application_id: string(PK);
	post_id: string(FK);
	applicant_id: string(FK);
	status: ApplicationStatus;
	applied_date: DateTime;
	snapshot_id: string(FK) | null;
}
```

### 5.3 ApplicationProfileSnapshot

```typescript
{
	snapshot_id: string(PK);
	application_id: string(FK);
	gpa: number | null;
	// ... other snapshot fields
}
```

---

## 6. INTERFACES

### 6.1 Applicant (Frontend)

```typescript
interface Applicant {
	id: string;
	postId: string;
	name: string;
	appliedDate: string;
	degreeLevel: string;
	subDiscipline: string;
	status:
		| 'submitted'
		| 'under_review'
		| 'accepted'
		| 'rejected'
		| 'new_request';
	matchingScore: number;
	userId: string;
	gpa?: number;
}
```

### 6.2 Program Detail

```typescript
interface ProgramDetail {
	post_id: string;
	title: string;
	description: string;
	startDate: string;
	endDate: string;
	location: string;
	status: string;
	program: {
		duration: string;
		attendance: string;
		courseInclude: string;
		gpa: number | null;
		gre: number | null;
		gmat: number | null;
		tuitionFee: number | null;
		feeDescription: string | null;
		scholarshipInfo: string | null;
		certificates: Array<{
			language: string;
			name: string;
			score: string;
		}>;
	};
	subdiscipline: Array<{
		name: string;
	}>;
	documents: Array<{
		name: string;
		description: string;
	}>;
}
```

---

## 7. FEATURES

### 7.1 Post Information Display

- Post title
- Description
- Start/End dates
- Location
- Status badge
- Institution information

### 7.2 Tabbed Interface

**Program:**

- Overview
- Programme Structure
- Admission Requirements
- Fee and Funding
- Scholarship
- Other Information

**Scholarship:**

- Detail
- Eligibility
- Requirements

**Research Lab:**

- Job Description
- Requirements
- Offer Information
- Lab Information

### 7.3 Applications Management

- Applications list table
- Suggested applicants (matching score >= 80)
- Application status display
- Navigate to applicant detail
- View applications button

### 7.4 Actions

- **Edit:** Navigate to edit form
- **Close:** Change status to CLOSED
- **View Applications:** Navigate to applications page

---

## 8. VALIDATION

### 8.1 Post Ownership

- Post must belong to authenticated institution
- Verified before update/close operations

### 8.2 Status Validation

- Valid status values: PUBLISHED, DRAFT, CLOSED, SUBMITTED, REQUIRE_UPDATE
- Status change validated

---

## 9. SEQUENCE DIAGRAM ACTORS

1. **User** - Views/updates/closes post
2. **InstitutionPostDetail** - Detail component
3. **API Route Handlers** - Server endpoints
4. **requireAuth** - Authentication
5. **Prisma Client** - Database
6. **Database** - PostgreSQL

---

## 10. CLASS DIAGRAM ENTITIES

### 10.1 Frontend Classes

- `InstitutionProgramDetail` (Component)
- `InstitutionScholarshipDetail` (Component)
- `InstitutionResearchLabDetail` (Component)
- `ApplicantsTable` (Component)
- `SuggestedApplicantsTable` (Component)

### 10.2 Backend Classes

- API Route Handlers (GET, PUT)
- `requireAuth` (Utility)
- Prisma Models (OpportunityPost, ProgramPost, ScholarshipPost, JobPost,
  Application, ApplicationProfileSnapshot)

---

## 11. KEY METHODS

### 11.1 Component Methods

- `fetchProgramDetail()` - Fetch post details
- `fetchApplications()` - Fetch applications
- `handleEditProgram()` - Navigate to edit
- `handleCloseProgram()` - Close post
- `handleApplicantDetail()` - Navigate to applicant detail
- `transformApplications()` - Transform application data

### 11.2 API Methods

- `GET()` - Fetch post detail
- `PUT()` - Update post or change status

---

## 12. FILE STRUCTURE

```
src/
├── app/(institution)/institution/dashboard/
│   ├── programmes/[id]/
│   │   └── InstitutionProgramDetail.tsx
│   ├── scholarships/[id]/
│   │   └── InstitutionScholarshipDetail.tsx
│   └── reseach-labs/[id]/
│       └── InstitutionResearchLabDetail.tsx
├── components/profile/institution/components/
│   ├── ApplicantsTable.tsx
│   └── SuggestedApplicantsTable.tsx
└── app/api/
    ├── explore/programs/program-detail/route.ts (GET)
    ├── explore/scholarships/scholarship-detail/route.ts (GET)
    ├── explore/research/research-detail/route.ts (GET)
    ├── applications/institution/route.ts (GET)
    ├── posts/programs/route.ts (PUT)
    ├── posts/scholarships/route.ts (PUT)
    └── posts/research/route.ts (PUT)
```

---

## 13. DIAGRAM REQUIREMENTS

### Sequence Diagram:

- View detail → Fetch post → Fetch applications → Display
- Update post → Edit form → Submit → API → Database → Refresh
- Close post → API → Update status → Refresh
- Navigate to applicant detail

### Class Diagram:

- Detail component classes
- API route handlers
- Database models and relationships
- Data transformation logic

---

## 14. NOTES

### 14.1 Delete Functionality

- **Posts are NOT deleted.** They are closed by changing status to CLOSED.
- There is no DELETE endpoint for posts.
- If hard deletion is needed, it would require:
  - Deleting related records (certificates, documents, subdisciplines,
    applications)
  - Deleting the post-specific record (ProgramPost, ScholarshipPost, or JobPost)
  - Deleting the OpportunityPost record
  - This is not currently implemented.

### 14.2 Status Management

- Posts can be in states: DRAFT, SUBMITTED, PUBLISHED, CLOSED, REQUIRE_UPDATE
- Closing a post sets status to CLOSED
- Closed posts are still visible but not accepting new applications

---

## END OF DOCUMENT
