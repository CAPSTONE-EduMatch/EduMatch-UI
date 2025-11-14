# View Post List - Components & Requirements for Sequence & Class Diagrams

## Overview

The View Post List feature allows authenticated institutions to view, search,
filter, and sort all their posts (Programs, Scholarships, Research Labs) with
pagination and statistics.

---

## 1. KEY COMPONENTS

### 1.1 ProgramsSection Component

**Location:** `src/components/profile/institution/sections/ProgramsSection.tsx`

**Purpose:** Main component for displaying and managing institution posts

**Key Features:**

- Post list display with statistics
- Search functionality
- Multi-filter support (type, status)
- Sorting options
- Pagination
- Create/Edit mode handling
- Navigation to detail pages

**State Management:**

- `posts` - Array of posts
- `stats` - Statistics object (total, published, closed, draft, submitted)
- `paginationMeta` - Pagination metadata
- `searchQuery` - Search input
- `typeFilter` - Post type filter array
- `statusFilter` - Status filter array
- `sortBy` - Sort option
- `currentPage` - Current page number
- `loading` - Loading state
- `error` - Error message
- `showCreateForm` - Create form visibility
- `createFormType` - Type of form to show
- `editData` - Data for edit mode

**Key Methods:**

- `fetchPosts()` - Fetches posts from API
- `handleTypeFilterChange()` - Updates type filter
- `handleStatusFilterChange()` - Updates status filter
- `handleSearchChange()` - Updates search query
- `handleSortChange()` - Updates sort option
- `handleMoreDetail()` - Navigates to post detail page
- `handleAddNew()` - Opens create form
- `handleBackToList()` - Returns to list view

### 1.2 PostsStatisticsCards Component

**Location:**
`src/components/profile/institution/components/PostsStatisticsCards.tsx`

**Purpose:** Displays post statistics

**Features:**

- Total posts count
- Published posts count
- Closed posts count
- Draft posts count (if applicable)

### 1.3 PostsSearchAndFilter Component

**Location:**
`src/components/profile/institution/components/PostsSearchAndFilter.tsx`

**Purpose:** Search and filter interface

**Features:**

- Search input
- Type filter (Program, Scholarship, Research Lab)
- Status filter (Published, Draft, Closed, Submitted)
- Sort dropdown
- Add new post button

### 1.4 PostsTable Component

**Location:** `src/components/profile/institution/components/PostsTable.tsx`

**Purpose:** Displays posts in table format

**Features:**

- Post title
- Post type
- Status badge
- Posted date
- Application count
- Start/End dates
- Location
- More detail button

### 1.5 Pagination Component

**Location:** `src/components/profile/institution/components/Pagination.tsx`

**Purpose:** Pagination controls

**Features:**

- Page navigation
- Items per page display
- Total items count

---

## 2. API ROUTES

### 2.1 GET /api/posts/institution

**Location:** `src/app/api/posts/institution/route.ts`

**Purpose:** Fetch institution's posts with filtering, sorting, and pagination

**Authentication:** Required via `requireAuth()`

**Query Parameters:**

- `search` - Search query (optional)
- `status` - Status filter, comma-separated (optional, default: "all")
- `type` - Post type filter, comma-separated (optional, default: "all")
- `sortBy` - Sort option: "newest" | "oldest" (optional, default: "newest")
- `page` - Page number (optional, default: 1)
- `limit` - Items per page (optional, default: 10, max: 50)

**Process:**

1. Validates authentication
2. Fetches institution for authenticated user
3. Builds where clause with filters:
   - Institution ID filter
   - Status filter (supports multiple statuses)
   - Post type filter (Program, Scholarship, Research Lab)
4. Queries all posts (without pagination) with relations:
   - `programPost` data
   - `scholarshipPost` data
   - `jobPost` data
   - `subdisciplines` data
5. Gets application counts for each post
6. Transforms data to frontend format
7. Applies search filter (client-side)
8. Applies pagination
9. Calculates statistics
10. Returns paginated results

**Response:**

```typescript
{
  success: true,
  data: Array<{
    id: string,
    title: string,
    status: string, // lowercase
    postedDate: string, // dd/mm/yyyy
    applicationCount: number,
    startDate: string, // dd/mm/yyyy
    endDate: string, // dd/mm/yyyy
    location: string,
    type: "Program" | "Scholarship" | "Research Lab",
    data: any, // Post-specific data
    subdisciplines: string[]
  }>,
  meta: {
    total: number,
    page: number,
    limit: number,
    totalPages: number
  },
  stats: {
    total: number,
    published: number,
    draft: number,
    submitted: number,
    closed: number
  }
}
```

---

## 3. DATA FLOW

### 3.1 View Post List Flow

1. **Component Mount**
   - ProgramsSection component mounts
   - Initial state set (empty posts, default filters)

2. **Fetch Posts**
   - `fetchPosts()` called on mount
   - URLSearchParams built with current filters
   - `GET /api/posts/institution` request sent

3. **API Processing**
   - Authentication validated
   - Institution fetched for user
   - Where clause built with filters
   - Posts queried from database with relations
   - Application counts fetched
   - Data transformed to frontend format
   - Search filter applied (if provided)
   - Pagination applied
   - Statistics calculated

4. **Response Handling**
   - Posts set in state
   - Statistics set in state
   - Pagination metadata set
   - Loading state cleared

5. **Render**
   - Statistics cards displayed
   - Search and filter bar displayed
   - Posts table rendered
   - Pagination controls displayed

### 3.2 Filter/Search Flow

1. **User Changes Filter**
   - Filter state updated
   - Current page reset to 1
   - `fetchPosts()` called automatically (via useEffect)

2. **User Searches**
   - Search query updated
   - Current page reset to 1
   - `fetchPosts()` called automatically

3. **User Sorts**
   - Sort option updated
   - Current page reset to 1
   - `fetchPosts()` called automatically

### 3.3 Navigation Flow

1. **View Detail**
   - User clicks "More Detail" button
   - `handleMoreDetail()` called
   - Navigates to appropriate detail page:
     - Programs: `/institution/dashboard/programmes/{id}`
     - Scholarships: `/institution/dashboard/scholarships/{id}`
     - Research Labs: `/institution/dashboard/reseach-labs/{id}`

2. **Create Post**
   - User clicks "Add New" button
   - Post type selected
   - URL updated with query params (`?action=create&type={type}`)
   - Create form displayed

---

## 4. DATABASE OPERATIONS

### 4.1 Fetch Posts

```typescript
const allPosts = await prismaClient.opportunityPost.findMany({
	where: {
		institution_id: institution.institution_id,
		status: { in: statusArray }, // If multiple statuses
		// OR conditions for post types
		OR: [
			{ programPost: { isNot: null } },
			{ scholarshipPost: { isNot: null } },
			{ jobPost: { isNot: null } },
		],
	},
	include: {
		programPost: { select: { duration, attendance, tuition_fee } },
		scholarshipPost: { select: { description, type, number, award_amount } },
		jobPost: {
			select: { contract_type, attendance, job_type, min_salary, max_salary },
		},
		subdisciplines: {
			include: {
				subdiscipline: { select: { name: true } },
			},
		},
	},
	orderBy: { create_at: 'desc' }, // or "asc"
});
```

### 4.2 Get Application Counts

```typescript
const applicationCounts = await Promise.all(
	allPosts.map(async (post) => {
		const count = await prismaClient.application.count({
			where: { post_id: post.post_id },
		});
		return { post_id: post.post_id, applicationCount: count };
	})
);
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

**Relations:**

- `programPost` - ProgramPost (optional)
- `scholarshipPost` - ScholarshipPost (optional)
- `jobPost` - JobPost (optional)
- `subdisciplines` - PostSubdiscipline[]
- `applications` - Application[]

### 5.2 ProgramPost

```typescript
{
	post_id: string(PK, FK);
	duration: string;
	attendance: string;
	course_include: string | null;
	gpa: number | null;
	gre: number | null;
	gmat: number | null;
	tuition_fee: number | null;
	fee_description: string | null;
	scholarship_info: string | null;
	language_requirement: string | null;
}
```

### 5.3 ScholarshipPost

```typescript
{
	post_id: string(PK, FK);
	description: string | null;
	type: string;
	number: number | null;
	award_amount: number | null;
	eligibility_requirements: string | null;
	essay_required: boolean;
}
```

### 5.4 JobPost

```typescript
{
	post_id: string(PK, FK);
	contract_type: string;
	attendance: string;
	job_type: string;
	min_salary: number | null;
	max_salary: number | null;
	job_description: string | null;
	requirements: string | null;
	offer_info: string | null;
	lab_info: string | null;
}
```

---

## 6. INTERFACES

### 6.1 Post (Frontend)

```typescript
interface Post {
	id: string;
	title: string;
	status: 'published' | 'draft' | 'closed' | 'submitted';
	postedDate: string; // dd/mm/yyyy
	applicationCount: number;
	startDate: string; // dd/mm/yyyy
	endDate: string; // dd/mm/yyyy
	location: string;
	type: 'Program' | 'Scholarship' | 'Research Lab';
	data: any; // Post-specific data
	subdisciplines: string[];
}
```

### 6.2 Statistics

```typescript
interface Stats {
	total: number;
	published: number;
	closed: number;
	draft: number;
	submitted: number;
}
```

---

## 7. FEATURES

### 7.1 Post Display

- Post title
- Post type badge
- Status badge with color coding
- Posted date
- Application count
- Start/End dates
- Location
- Subdisciplines

### 7.2 Filtering

- **Type Filter:** Program, Scholarship, Research Lab (multi-select)
- **Status Filter:** Published, Draft, Closed, Submitted (multi-select)
- **Search:** Title, location, subdisciplines

### 7.3 Sorting

- Newest first (default)
- Oldest first

### 7.4 Pagination

- Configurable items per page (default: 10, max: 50)
- Page navigation
- Total count display

### 7.5 Statistics

- Total posts
- Published posts
- Closed posts
- Draft posts
- Submitted posts

---

## 8. SEQUENCE DIAGRAM ACTORS

1. **User** - Views post list
2. **ProgramsSection** - Main component
3. **PostsStatisticsCards** - Statistics display
4. **PostsSearchAndFilter** - Filter interface
5. **PostsTable** - Table display
6. **Pagination** - Pagination controls
7. **API Route Handler** - Server endpoint
8. **requireAuth** - Authentication
9. **Prisma Client** - Database
10. **Database** - PostgreSQL

---

## 9. CLASS DIAGRAM ENTITIES

### 9.1 Frontend Classes

- `ProgramsSection` (Component)
- `PostsStatisticsCards` (Component)
- `PostsSearchAndFilter` (Component)
- `PostsTable` (Component)
- `Pagination` (Component)

### 9.2 Backend Classes

- API Route Handler (GET)
- `requireAuth` (Utility)
- Prisma Models (OpportunityPost, ProgramPost, ScholarshipPost, JobPost,
  Application)

---

## 10. KEY METHODS

### 10.1 Component Methods

- `fetchPosts()` - Fetch posts from API
- `handleTypeFilterChange()` - Update type filter
- `handleStatusFilterChange()` - Update status filter
- `handleSearchChange()` - Update search query
- `handleSortChange()` - Update sort option
- `handleMoreDetail()` - Navigate to detail
- `handleAddNew()` - Open create form

### 10.2 API Methods

- `GET()` - Fetch posts with filters

---

## 11. FILE STRUCTURE

```
src/
├── components/profile/institution/
│   ├── sections/
│   │   └── ProgramsSection.tsx
│   └── components/
│       ├── PostsStatisticsCards.tsx
│       ├── PostsSearchAndFilter.tsx
│       ├── PostsTable.tsx
│       └── Pagination.tsx
└── app/api/posts/institution/
    └── route.ts (GET handler)
```

---

## 12. DIAGRAM REQUIREMENTS

### Sequence Diagram:

- Component mount → Fetch posts → API → Database → Transform → Display
- Filter/Search change → Re-fetch → Update display
- Navigation to detail page

### Class Diagram:

- Component classes with methods
- API route handler
- Database models and relationships
- Data transformation logic

---

## END OF DOCUMENT
