# View Application List - Components & Requirements for Sequence & Class Diagrams

## Overview

The View Application List feature allows authenticated institutions to view,
search, filter, and sort all applications received for their posts with
pagination and statistics.

---

## 1. KEY COMPONENTS

### 1.1 InstitutionApplicationSection Component

**Location:**
`src/components/profile/institution/sections/InstitutionApplicationSection.tsx`

**Purpose:** Main component for displaying and managing institution applications

**Key Features:**

- Application list display with statistics
- Search functionality
- Status filter support
- Sorting options
- Pagination
- Navigation to detail pages

**State Management:**

- `applicants` - Array of applicants/applications
- `stats` - Statistics object (total, approved, rejected, pending)
- `paginationMeta` - Pagination metadata
- `searchQuery` - Search input
- `statusFilter` - Status filter array
- `sortBy` - Sort option
- `currentPage` - Current page number
- `loading` - Loading state
- `error` - Error message

**Key Methods:**

- `fetchApplications()` - Fetches applications from API
- `handleStatusFilterChange()` - Updates status filter
- `handleSearchChange()` - Updates search query
- `handleSortChange()` - Updates sort option
- `handleMoreDetail()` - Navigates to application detail page

### 1.2 StatisticsCards Component

**Location:**
`src/components/profile/institution/components/StatisticsCards.tsx`

**Purpose:** Displays application statistics

**Features:**

- Total applications count
- Approved applications count
- Rejected applications count
- Pending applications count

### 1.3 SearchAndFilter Component

**Location:**
`src/components/profile/institution/components/SearchAndFilter.tsx`

**Purpose:** Search and filter interface

**Features:**

- Search input
- Status filter (Submitted, Accepted, Rejected, Require Update, Updated)
- Sort dropdown

### 1.4 ApplicantsTable Component

**Location:**
`src/components/profile/institution/components/ApplicantsTable.tsx`

**Purpose:** Displays applications in table format

**Features:**

- Applicant name
- Post title
- Applied date
- Degree level
- Subdiscipline
- Status badge
- Matching score
- More detail button

### 1.5 Pagination Component

**Location:** `src/components/profile/institution/components/Pagination.tsx`

**Purpose:** Pagination controls

**Features:**

- Page navigation
- Items per page display
- Total items count

### 1.6 ApplicationsPage

**Location:**
`src/app/(institution)/institution/dashboard/applications/page.tsx`

**Purpose:** Page wrapper for application list

**Features:**

- Uses ProfileContext for profile data
- Wraps InstitutionApplicationSection component

---

## 2. API ROUTES

### 2.1 GET /api/applications/institution

**Location:** `src/app/api/applications/institution/route.ts`

**Purpose:** Fetch institution's applications with filtering, sorting, and
pagination

**Authentication:** Required via `requireAuth()`

**Query Parameters:**

- `search` - Search query (optional)
- `status` - Status filter, comma-separated (optional, default: "all")
- `sortBy` - Sort option: "newest" | "oldest" (optional, default: "newest")
- `postId` - Filter by specific post ID (optional)
- `page` - Page number (optional, default: 1)
- `limit` - Items per page (optional, default: 10, max: 50)

**Process:**

1. Validates authentication
2. Fetches institution for authenticated user
3. Builds where clause with filters:
   - Institution ID filter (via post)
   - Post ID filter (if provided)
   - Status filter (supports multiple statuses)
4. Queries all applications (without pagination) with relations:
   - `ApplicationProfileSnapshot` data
   - `applicant` with user and subdiscipline
   - `post` with title, dates, degree level
5. Fetches subdiscipline names for snapshots
6. Transforms data to frontend format using snapshot data
7. Applies search filter (client-side)
8. Applies pagination
9. Calculates statistics
10. Returns paginated results

**Response:**

```typescript
{
  success: true,
  data: Array<{
    id: string, // application_id
    postId: string,
    name: string,
    email: string,
    image: string,
    appliedDate: string, // dd/mm/yyyy
    degreeLevel: string,
    subDiscipline: string,
    status: string, // lowercase
    matchingScore: number,
    postTitle: string,
    applicantId: string,
    userId: string,
    snapshotData: {
      firstName: string,
      lastName: string,
      nationality: string,
      phoneNumber: string,
      countryCode: string,
      graduated: boolean,
      gpa: number,
      university: string,
      countryOfStudy: string,
      hasForeignLanguage: boolean,
      languages: string[],
      favoriteCountries: string[],
      subdisciplineIds: string[]
    } | null
  }>,
  meta: {
    total: number,
    page: number,
    limit: number,
    totalPages: number
  },
  stats: {
    total: number,
    approved: number,
    rejected: number,
    pending: number
  }
}
```

---

## 3. DATA FLOW

### 3.1 View Application List Flow

1. **User Navigates to Applications**
   - Accesses `/institution/dashboard/applications`
   - ApplicationsPage component mounts
   - InstitutionApplicationSection component renders

2. **Component Mount**
   - Initial state set (empty applicants, default filters)
   - `fetchApplications()` called on mount

3. **Fetch Applications**
   - URLSearchParams built with current filters
   - `GET /api/applications/institution` request sent

4. **API Processing**
   - Authentication validated
   - Institution fetched for user
   - Where clause built with filters
   - Applications queried from database with relations
   - Subdiscipline names fetched for snapshots
   - Data transformed to frontend format (using snapshot data)
   - Search filter applied (if provided)
   - Pagination applied
   - Statistics calculated

5. **Response Handling**
   - Applicants set in state
   - Statistics set in state
   - Pagination metadata set
   - Loading state cleared

6. **Render**
   - Statistics cards displayed
   - Search and filter bar displayed
   - Applicants table rendered
   - Pagination controls displayed

### 3.2 Filter/Search Flow

1. **User Changes Filter**
   - Filter state updated
   - Current page reset to 1
   - `fetchApplications()` called automatically (via useEffect)

2. **User Searches**
   - Search query updated
   - Current page reset to 1
   - `fetchApplications()` called automatically

3. **User Sorts**
   - Sort option updated
   - Current page reset to 1
   - `fetchApplications()` called automatically

### 3.3 Navigation Flow

1. **View Detail**
   - User clicks "More Detail" button
   - `handleMoreDetail()` called
   - Navigates to: `/institution/dashboard/applications/{applicationId}`

---

## 4. DATABASE OPERATIONS

### 4.1 Fetch Applications

```typescript
const allApplications = await prismaClient.application.findMany({
	where: {
		post: {
			institution_id: institution.institution_id,
			post_id: postId, // If provided
		},
		status: { in: statusArray }, // If multiple statuses
	},
	include: {
		ApplicationProfileSnapshot: true,
		applicant: {
			include: {
				user: {
					select: { id: true, name: true, email: true, image: true },
				},
				subdiscipline: {
					select: { name: true },
				},
			},
		},
		post: {
			select: {
				post_id: true,
				title: true,
				start_date: true,
				end_date: true,
				degree_level: true,
				scholarshipPost: { select: { type: true } },
				jobPost: { select: { job_type: true } },
			},
		},
	},
	orderBy: { apply_at: 'desc' }, // or "asc"
});
```

### 4.2 Fetch Subdisciplines for Snapshots

```typescript
const snapshotSubdisciplineIds = allApplications
	.map((app) => app.ApplicationProfileSnapshot?.subdiscipline_id)
	.filter((id) => id);

const subdisciplines = await prismaClient.subdiscipline.findMany({
	where: {
		subdiscipline_id: { in: uniqueIds },
	},
	select: {
		subdiscipline_id: true,
		name: true,
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

**Relations:**

- `ApplicationProfileSnapshot` - ApplicationProfileSnapshot (optional)
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

### 5.3 Applicant

```typescript
{
	applicant_id: string(PK);
	user_id: string(FK, unique);
	first_name: string;
	last_name: string;
	// ... other fields
}
```

**Relations:**

- `user` - User
- `subdiscipline` - Subdiscipline (optional)

---

## 6. INTERFACES

### 6.1 Applicant (Frontend)

```typescript
interface Applicant {
	id: string; // application_id
	postId: string;
	name: string;
	email: string;
	image: string | null;
	appliedDate: string; // dd/mm/yyyy
	degreeLevel: string;
	subDiscipline: string;
	status: 'submitted' | 'accepted' | 'rejected' | 'require_update' | 'updated';
	matchingScore: number;
	postTitle: string;
	applicantId: string;
	userId: string;
	snapshotData: {
		firstName: string;
		lastName: string;
		nationality: string;
		phoneNumber: string;
		countryCode: string;
		graduated: boolean;
		gpa: number;
		university: string;
		countryOfStudy: string;
		hasForeignLanguage: boolean;
		languages: string[];
		favoriteCountries: string[];
		subdisciplineIds: string[];
	} | null;
}
```

### 6.2 Statistics

```typescript
interface Stats {
	total: number;
	approved: number;
	rejected: number;
	pending: number;
}
```

---

## 7. FEATURES

### 7.1 Application Display

- Applicant name (from snapshot or live data)
- Post title
- Applied date
- Degree level
- Subdiscipline
- Status badge with color coding
- Matching score (mock)
- Email and image

### 7.2 Filtering

- **Status Filter:** Submitted, Accepted, Rejected, Require Update, Updated
  (multi-select)
- **Search:** Name, subdiscipline, degree level, post title

### 7.3 Sorting

- Newest first (default)
- Oldest first

### 7.4 Pagination

- Configurable items per page (default: 10, max: 50)
- Page navigation
- Total count display

### 7.5 Statistics

- Total applications
- Approved applications
- Rejected applications
- Pending applications

---

## 8. SEQUENCE DIAGRAM ACTORS

1. **User** - Views application list
2. **ApplicationsPage** - Page component
3. **InstitutionApplicationSection** - Main component
4. **StatisticsCards** - Statistics display
5. **SearchAndFilter** - Filter interface
6. **ApplicantsTable** - Table display
7. **Pagination** - Pagination controls
8. **API Route Handler** - Server endpoint
9. **requireAuth** - Authentication
10. **Prisma Client** - Database
11. **Database** - PostgreSQL

---

## 9. CLASS DIAGRAM ENTITIES

### 9.1 Frontend Classes

- `ApplicationsPage` (Page component)
- `InstitutionApplicationSection` (Component)
- `StatisticsCards` (Component)
- `SearchAndFilter` (Component)
- `ApplicantsTable` (Component)
- `Pagination` (Component)

### 9.2 Backend Classes

- API Route Handler (GET)
- `requireAuth` (Utility)
- Prisma Models (Application, ApplicationProfileSnapshot, Applicant, User,
  OpportunityPost)

---

## 10. KEY METHODS

### 10.1 Component Methods

- `fetchApplications()` - Fetch applications from API
- `handleStatusFilterChange()` - Update status filter
- `handleSearchChange()` - Update search query
- `handleSortChange()` - Update sort option
- `handleMoreDetail()` - Navigate to detail

### 10.2 API Methods

- `GET()` - Fetch applications with filters

---

## 11. FILE STRUCTURE

```
src/
├── app/(institution)/institution/dashboard/
│   └── applications/
│       └── page.tsx
├── components/profile/institution/
│   ├── sections/
│   │   └── InstitutionApplicationSection.tsx
│   └── components/
│       ├── StatisticsCards.tsx
│       ├── SearchAndFilter.tsx
│       ├── ApplicantsTable.tsx
│       └── Pagination.tsx
└── app/api/applications/institution/
    └── route.ts (GET handler)
```

---

## 12. DIAGRAM REQUIREMENTS

### Sequence Diagram:

- Component mount → Fetch applications → API → Database → Transform → Display
- Filter/Search change → Re-fetch → Update display
- Navigation to detail page

### Class Diagram:

- Component classes with methods
- API route handler
- Database models and relationships
- Data transformation logic (snapshot data)

---

## 13. NOTES

### 13.1 Snapshot Data

- Applications use `ApplicationProfileSnapshot` to preserve applicant data at
  application time
- Snapshot data takes priority over live applicant data for consistency
- Documents are fetched from snapshot `document_ids` to show state at
  application time

### 13.2 Matching Score

- Currently mocked (random 70-100)
- Should be calculated based on applicant profile match with post requirements

---

## END OF DOCUMENT
