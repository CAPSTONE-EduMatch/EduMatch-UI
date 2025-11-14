# View Application List - Components & Requirements for Sequence & Class Diagrams

## Overview

The View Application List feature allows applicants to view all their submitted
applications in a tabbed interface (Programmes, Scholarships, Research Labs)
with filtering, sorting, and search capabilities.

---

## 1. KEY COMPONENTS

### 1.1 ApplicationSection Component

**Location:** `src/components/profile/applicant/sections/ApplicationSection.tsx`

**Purpose:** Main component for displaying application list

**Key Features:**

- Tabbed interface (Programmes, Scholarships, Research Labs)
- Status filtering (Submitted, Update Required, Accepted, Rejected)
- Search functionality
- Sort options (newest, oldest)
- Application status badges on cards
- Update modal trigger for REQUIRE_UPDATE status

**State Management:**

- `sortBy` - Current sort option
- `activeTab` - Active category tab
- `selectedFilters` - Selected status filters (Set)
- `searchQuery` - Search input value
- `programs` - Programs with application status
- `scholarships` - Scholarships with application status
- `researchLabs` - Research labs with application status
- `loading` - Loading state
- `error` - Error message
- `selectedApplicationForUpdate` - Application ID for update modal
- `showUpdateModal` - Update modal visibility

**Key Methods:**

- `fetchApplicationData()` - Fetches explore data and filters by applications
- `handleSearchChange()` - Handles search input
- `handleTabChange()` - Handles tab switching
- `handleSortChange()` - Handles sort changes
- `getCurrentTabData()` - Gets filtered data for current tab
- `renderTabContent()` - Renders appropriate tab component

### 1.2 Tab Components (Reused)

- **ProgramsTab** - Displays program cards with application status
- **ScholarshipsTab** - Displays scholarship cards
- **ResearchLabsTab** - Displays research lab cards

**Props:**

- `programs/scholarships/researchLabs` - Data with application status
- `isInWishlist` - Wishlist check function
- `onWishlistToggle` - Wishlist toggle function
- `hasApplied` - Check if applied (always true for applications)
- `isApplying` - Application in progress (always false)
- `onApply` - No-op function

### 1.3 Hook

**useApplications** (`src/hooks/application/useApplications.ts`)

**Returns:**

- `applications` - Applications array
- `loading` - Loading state
- `error` - Error message
- `stats` - Statistics
- `meta` - Pagination metadata

**Methods Used:**

- Auto-fetches applications on mount
- Provides applications data to component

### 1.4 Service

**ApplicationService** (`src/services/application/application-service.ts`)

**Method:**

```typescript
async getApplications(params?: {
  page?: number
  limit?: number
  status?: string
}): Promise<ApplicationListResponse>
```

---

## 2. API ROUTE

### 2.1 GET /api/applications

**Location:** `src/app/api/applications/route.ts`

**Query Parameters:**

- `page` - Page number (default: 1)
- `limit` - Items per page (default: 10)
- `status` - Filter by status (SUBMITTED, REQUIRE_UPDATE, ACCEPTED, REJECTED)
- `stats` - Get statistics (true/false)

**Process:**

1. **Authentication Check**
   - Validates user via `requireAuth()`
   - Extracts userId from session

2. **Applicant Profile Check**
   - Fetches applicant profile
   - Returns 404 if not found

3. **Statistics Request (Optional)**
   - If `stats=true`, returns statistics only
   - Groups applications by status
   - Returns counts (total, pending, reviewed, accepted, rejected)

4. **Application Fetching**
   - Builds where clause with applicant_id
   - Applies status filter if provided
   - Fetches applications with pagination
   - Includes post data (program/scholarship/job)
   - Includes institution data

5. **Data Transformation**
   - Transforms application data
   - Includes full post details
   - Includes institution information
   - Maps document data

6. **Response**
   - Returns applications array with metadata

**Response:**

```typescript
{
  success: true,
  applications: Application[],
  total: number,
  page: number,
  limit: number
}
```

**Statistics Response:**

```typescript
{
  success: true,
  stats: {
    total: number,
    pending: number,
    reviewed: number,
    accepted: number,
    rejected: number
  }
}
```

---

## 3. DATA FLOW

### 3.1 View Application List Flow

1. **Component Mounts**
   - `ApplicationSection` renders
   - `useApplications` hook initializes with `autoFetch: true`
   - Default params: `{ page: 1, limit: 1000 }`

2. **Fetch Applications**
   - `useApplications` calls `applicationService.getApplications()`
   - `GET /api/applications?page=1&limit=1000` called
   - API validates authentication
   - API checks applicant profile
   - API fetches applications from database
   - Response returned with applications

3. **Fetch Explore Data**
   - `fetchApplicationData()` called when applications loaded
   - Extracts post IDs from applications
   - Creates maps: `applicationStatusMap`, `applicationIdMap`
   - Calls `ExploreApiService` methods in parallel:
     - `getPrograms()`
     - `getScholarships()`
     - `getResearchLabs()`

4. **Filter and Map Data**
   - Filters explore data by application post IDs
   - Maps application status to each item
   - Maps application ID to each item
   - Updates component state

5. **Render Content**
   - Active tab determines which data to display
   - Filters applied (search, status)
   - Appropriate tab component rendered
   - Application status badges displayed

### 3.2 Filter Flow

1. **Status Filter**
   - User selects status filter
   - `selectedFilters` state updated
   - `useApplications` refetches with status filter
   - Data filtered and displayed

2. **Search Filter**
   - User types in search
   - `searchQuery` state updated
   - Client-side filtering applied
   - Results updated

3. **Sort**
   - User selects sort option
   - `sortBy` state updated
   - Explore data re-fetched with sort
   - Data re-filtered and displayed

### 3.3 Tab Switch Flow

1. **User Clicks Tab**
   - `handleTabChange()` called
   - `activeTab` state updated
   - `renderTabContent()` switches component
   - Filters remain active

---

## 4. DATABASE OPERATIONS

### 4.1 Fetch Applications

```typescript
const applications = await prismaClient.application.findMany({
	where: {
		applicant_id: applicant.applicant_id,
		...(status && { status }),
	},
	include: {
		post: {
			include: {
				institution: { select: { name, logo, country } },
				programPost: true,
				scholarshipPost: true,
				jobPost: true,
			},
		},
		details: true,
	},
	orderBy: { apply_at: 'desc' },
	skip: (page - 1) * limit,
	take: limit,
});
```

### 4.2 Statistics Query

```typescript
const statsData = await prismaClient.application.groupBy({
	by: ['status'],
	where: { applicant_id: applicant.applicant_id },
	_count: { application_id: true },
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
		institution: { name; logo; country };
		program?: ProgramData;
		scholarship?: ScholarshipData;
		job?: JobData;
	};
}
```

### 5.2 ApplicationListResponse

```typescript
interface ApplicationListResponse {
	success: boolean;
	applications?: Application[];
	total?: number;
	page?: number;
	limit?: number;
	error?: string;
}
```

### 5.3 ApplicationStatus

```typescript
'SUBMITTED' | 'REQUIRE_UPDATE' | 'ACCEPTED' | 'REJECTED' | 'UPDATED';
```

---

## 6. FEATURES

### 6.1 Status Filtering

- **Submitted** - Newly submitted applications
- **Update Required** - Applications requiring updates
- **Accepted** - Accepted applications
- **Rejected** - Rejected applications

### 6.2 Search Functionality

- Searches in post title
- Searches in institution name
- Client-side filtering

### 6.3 Sort Options

- **Newest** - Most recent first
- **Oldest** - Oldest first

### 6.4 Status Badges

- Visual indicators on cards
- Color-coded by status
- Click to view details or update

---

## 7. UPDATE MODAL INTEGRATION

### 7.1 Update Required Status

- Shows "Update Required" badge
- Provides "Update" button
- Opens `ApplicationUpdateResponseModal`
- Allows document submission

---

## 8. SEQUENCE DIAGRAM ACTORS

1. **User** - Views application list
2. **ApplicationSection Component** - Main UI
3. **useApplications Hook** - State management
4. **ApplicationService** - API client
5. **API Route Handler** - Server endpoint
6. **requireAuth** - Authentication
7. **Prisma Client** - Database
8. **Database** - PostgreSQL
9. **ExploreApiService** - Explore data client

---

## 9. CLASS DIAGRAM ENTITIES

### 9.1 Frontend Classes

- `ApplicationSection` (Component)
- `ProgramsTab` / `ScholarshipsTab` / `ResearchLabsTab` (Components)
- `useApplications` (Hook)
- `ApplicationService` (Service)

### 9.2 Backend Classes

- API Route Handler (GET method)
- `requireAuth` (Utility)
- Prisma Models (Application, OpportunityPost, Institution)

---

## 10. KEY METHODS

### 10.1 ApplicationSection Methods

- `fetchApplicationData()` - Fetch and filter data
- `handleSearchChange()` - Handle search
- `handleTabChange()` - Handle tab switch
- `handleSortChange()` - Handle sort
- `getCurrentTabData()` - Get filtered data
- `renderTabContent()` - Render tab component

### 10.2 useApplications Methods

- Auto-fetch on mount
- Provides applications data

### 10.3 ApplicationService Methods

- `getApplications(params)` - GET request

### 10.4 API Methods

- `GET()` - Fetch applications with filters

---

## 11. FILE STRUCTURE

```
src/
├── components/
│   └── profile/applicant/sections/
│       └── ApplicationSection.tsx
├── components/explore-tab/
│   ├── ProgramsTab.tsx
│   ├── ScholarshipsTab.tsx
│   └── ResearchLabsTab.tsx
├── hooks/application/
│   └── useApplications.ts
├── services/
│   ├── application/application-service.ts
│   └── explore/explore-api.ts
└── app/api/applications/
    └── route.ts (GET handler)
```

---

## 12. DIAGRAM REQUIREMENTS

### Sequence Diagram:

- Component mount → Hook → Service → API → Database
- Show explore data fetch flow
- Show filtering and mapping
- Include tab switching

### Class Diagram:

- Component hierarchy
- Hook dependencies
- Service layer
- Database models

---

## END OF DOCUMENT
