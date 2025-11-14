# View Wishlist Feature - Components & Requirements for Sequence & Class Diagrams

## Overview

The View Wishlist feature allows authenticated applicants to view, filter, and
manage their saved opportunities (programs, scholarships, and research labs) in
a tabbed interface with advanced filtering, sorting, and search capabilities.

---

## 1. FRONTEND COMPONENTS

### 1.1 Main Component

#### 1.1.1 WishlistSection

**Location:** `src/components/profile/applicant/sections/WishlistSection.tsx`

**Purpose:** Main component for displaying wishlist items

**Key Features:**

- Tabbed interface (Programmes, Scholarships, Research Labs)
- Search functionality
- Advanced filtering (discipline, country, fee range, duration, degree level,
  attendance)
- Sorting options (newest, oldest, title)
- Integration with explore tab components
- Empty state handling
- Loading states
- Error handling

**State Management:**

- `sortBy` - Current sort option
- `activeTab` - Active category tab
- `searchQuery` - Search input value
- `selectedDisciplines` - Selected discipline filters
- `selectedCountries` - Selected country filters
- `selectedFeeRange` - Selected fee range filter
- `selectedFunding` - Selected funding filters
- `selectedDuration` - Selected duration filters
- `selectedDegreeLevel` - Selected degree level filters
- `selectedAttendance` - Selected attendance filters
- `showExpired` - Show expired items toggle
- `programs` - Programs data
- `scholarships` - Scholarships data
- `researchLabs` - Research labs data
- `loading` - Loading state
- `error` - Error message
- `availableFilters` - Available filter options from API

**Key Methods:**

- `fetchWishlistData()` - Fetches wishlist items and filters by post IDs
- `handleSearchChange()` - Handles search input changes
- `handleTabChange()` - Handles tab switching
- `handleSortChange()` - Handles sort option changes
- `clearAllFilters()` - Clears all active filters
- `getCurrentTabData()` - Gets filtered data for current tab
- `renderTabContent()` - Renders appropriate tab component
- `filteredData` (useMemo) - Applies all filters to data

**Props:**

```typescript
interface WishlistSectionProps {
	profile: any;
}
```

### 1.2 Tab Components (Reused from Explore)

#### 1.2.1 ProgramsTab

**Location:** `src/components/explore-tab/ProgramsTab.tsx`

**Purpose:** Displays program cards in grid/list format

**Props:**

- `programs` - Array of Program objects
- `sortBy` - Sort option
- `isInWishlist` - Function to check if item is in wishlist
- `onWishlistToggle` - Function to toggle wishlist status
- `hasApplied` - Function to check if user has applied
- `isApplying` - Function to check if application is in progress
- `onApply` - Function to handle application

#### 1.2.2 ScholarshipsTab

**Location:** `src/components/explore-tab/ScholarshipsTab.tsx`

**Purpose:** Displays scholarship cards

**Props:** Similar to ProgramsTab

#### 1.2.3 ResearchLabsTab

**Location:** `src/components/explore-tab/ResearchLabsTab.tsx`

**Purpose:** Displays research lab cards

**Props:** Similar to ProgramsTab

### 1.3 UI Components

#### 1.3.1 Filter Components

- **`TabSelector`** - Category tab selector
- **`SortDropdown`** - Sort options dropdown
- **`CheckboxSelect`** - Multi-select filter dropdown
- **`Button`** - Action buttons (Clear Filters, Explore Opportunities)

#### 1.3.2 Input Components

- **Search Input** - Text input with search icon
- **Checkbox** - Show expired toggle

#### 1.3.3 Display Components

- **Loading Spinner** - Loading indicator
- **Empty State** - No items message
- **Error Message** - Error display with retry
- **Results Count** - Total filtered results count

---

## 2. HOOKS

### 2.1 useWishlist Hook

**Location:** `src/hooks/wishlist/useWishlist.ts`

**Purpose:** Manages wishlist state and operations

**Options:**

```typescript
interface UseWishlistOptions {
	autoFetch?: boolean;
	initialParams?: WishlistQueryParams;
}
```

**Returns:**

```typescript
interface UseWishlistReturn {
	// Data
	items: WishlistItem[];
	stats: WishlistStats | null;
	loading: boolean;
	error: string | null;

	// Pagination
	meta: {
		total: number;
		page: number;
		limit: number;
		totalPages: number;
	} | null;

	// Actions
	addToWishlist: (postId: string, status?: 0 | 1) => Promise<void>;
	removeFromWishlist: (postId: string) => Promise<void>;
	toggleWishlistItem: (postId: string) => Promise<void>;
	updateWishlistItem: (postId: string, status: 0 | 1) => Promise<void>;
	bulkAdd: (postIds: string[], status?: 0 | 1) => Promise<void>;
	bulkDelete: (postIds: string[]) => Promise<void>;
	bulkUpdate: (
		updates: Array<{ postId: string; status: 0 | 1 }>
	) => Promise<void>;

	// Utilities
	refresh: () => Promise<void>;
	refreshStats: () => Promise<void>;
	isInWishlist: (postId: string) => boolean;
	setParams: (params: WishlistQueryParams) => void;
}
```

**Key Methods:**

- `fetchWishlist()` - Fetches wishlist items
- `fetchStats()` - Fetches wishlist statistics
- `addToWishlist()` - Adds item to wishlist
- `removeFromWishlist()` - Removes item from wishlist
- `toggleWishlistItem()` - Toggles wishlist item status
- `isInWishlist()` - Checks if item is in wishlist
- `refresh()` - Refreshes wishlist data
- `refreshStats()` - Refreshes statistics

**State Management:**

- `items` - Wishlist items array
- `stats` - Wishlist statistics
- `loading` - Loading state
- `error` - Error message
- `meta` - Pagination metadata
- `params` - Query parameters

---

## 3. SERVICES

### 3.1 WishlistService

**Location:** `src/services/wishlist/wishlist-service.ts`

**Purpose:** API client for wishlist operations

**Base URL:** `/api/wishlist`

**Key Methods:**

#### 3.1.1 getWishlist

```typescript
async getWishlist(params?: WishlistQueryParams): Promise<WishlistResponse>
```

- Fetches user's wishlist items
- Supports pagination, filtering, sorting
- Returns wishlist items with metadata

#### 3.1.2 getWishlistItem

```typescript
async getWishlistItem(postId: string): Promise<WishlistItemResponse>
```

- Fetches specific wishlist item by post ID

#### 3.1.3 getWishlistStats

```typescript
async getWishlistStats(): Promise<WishlistStatsResponse>
```

- Fetches wishlist statistics
- Returns counts by type, country, discipline

#### 3.1.4 toggleWishlistItem

```typescript
async toggleWishlistItem(postId: string): Promise<WishlistItemResponse>
```

- Toggles wishlist item (add if not exists, remove if exists)

#### 3.1.5 isInWishlist

```typescript
async isInWishlist(postId: string): Promise<boolean>
```

- Checks if post is in wishlist

**Request Method:**

- Private `request<T>()` method handles all HTTP requests
- Includes authentication credentials
- Error handling and logging

### 3.2 ExploreApiService

**Location:** `src/services/explore/explore-api.ts`

**Purpose:** Fetches explore data (programs, scholarships, research labs)

**Methods Used:**

- `getPrograms(params)` - Fetches programs
- `getScholarships(params)` - Fetches scholarships
- `getResearchLabs(params)` - Fetches research labs

---

## 4. API ROUTES

### 4.1 GET /api/wishlist

**Location:** `src/app/api/wishlist/route.ts`

**Method:** `GET`

**Authentication:** Required via `requireAuth()`

**Query Parameters:**

```typescript
{
  page?: number          // Page number (default: 1)
  limit?: number         // Items per page (default: 10, max: 50)
  status?: 0 | 1         // Filter by status (0 = inactive, 1 = active)
  search?: string        // Search term
  sortBy?: "newest" | "oldest" | "title-asc" | "title-desc"
  postType?: "program" | "scholarship" | "job"
  country?: string       // Filter by country
  discipline?: string    // Filter by discipline
}
```

**Process:**

1. Validates authentication
2. Checks if user has applicant profile
3. Parses query parameters
4. Builds where clause for wishlist items
5. Fetches wishlist items with pagination
6. Fetches related post data (OpportunityPost)
7. Fetches post-specific data (ProgramPost, ScholarshipPost, JobPost)
8. Fetches institution data
9. Transforms data to include post and institution information
10. Applies filters (search, postType, country, discipline)
11. Returns filtered results with metadata

**Response:**

```typescript
{
  success: true,
  data: WishlistItem[],
  meta: {
    total: number,
    page: number,
    limit: number,
    totalPages: number
  }
}
```

**Error Responses:**

- `404` - Applicant profile not found
- `500` - Internal server error

### 4.2 GET /api/wishlist/[postId]

**Location:** `src/app/api/wishlist/[postId]/route.ts`

**Method:** `GET`

**Purpose:** Get specific wishlist item

**Process:**

1. Validates authentication
2. Checks applicant profile
3. Fetches wishlist item by post ID
4. Fetches related post data
5. Returns wishlist item with full post details

### 4.3 GET /api/wishlist/stats

**Location:** `src/app/api/wishlist/stats/route.ts`

**Method:** `GET`

**Purpose:** Get wishlist statistics

**Process:**

1. Validates authentication
2. Fetches all wishlist items for user
3. Fetches related post data
4. Calculates statistics:
   - Total items
   - Active/Inactive counts
   - Count by type (programs, scholarships, jobs)
   - Count by country
   - Count by discipline

**Response:**

```typescript
{
  success: true,
  data: {
    total: number,
    active: number,
    inactive: number,
    byType: {
      programs: number,
      scholarships: number,
      jobs: number
    },
    byCountry: Record<string, number>,
    byDiscipline: Record<string, number>
  }
}
```

---

## 5. DATA FLOW & SEQUENCE

### 5.1 View Wishlist Flow

1. **Component Mounts**
   - `WishlistSection` component renders
   - `useWishlist` hook initializes with `autoFetch: true`
   - Default params: `{ page: 1, limit: 1000, status: 1 }`

2. **Fetch Wishlist Items**
   - `useWishlist` calls `wishlistService.getWishlist()`
   - `GET /api/wishlist?page=1&limit=1000&status=1` called
   - API validates authentication
   - API checks applicant profile
   - API fetches wishlist items from database
   - API fetches related post data
   - API transforms and filters data
   - Response returned with wishlist items

3. **Fetch Explore Data**
   - `fetchWishlistData()` called when wishlist items loaded
   - Extracts post IDs from wishlist items
   - Calls `ExploreApiService` methods in parallel:
     - `getPrograms()`
     - `getScholarships()`
     - `getResearchLabs()`
   - Filters explore data by wishlist post IDs
   - Sets available filters from API responses
   - Updates component state with filtered data

4. **Render Content**
   - Active tab determines which data to display
   - Filters applied via `useMemo` (filteredData)
   - Appropriate tab component rendered:
     - `ProgramsTab` for programmes
     - `ScholarshipsTab` for scholarships
     - `ResearchLabsTab` for research labs

### 5.2 Filter Flow

1. **User Applies Filter**
   - User selects filter option (discipline, country, etc.)
   - Filter state updated
   - `filteredData` useMemo recalculates

2. **Filter Application**
   - Search filter applied first
   - Discipline filter applied
   - Country filter applied
   - Fee range filter (programmes only)
   - Duration filter (programmes only)
   - Degree level filter
   - Attendance filter
   - Expired filter (if not showing expired)

3. **UI Update**
   - Filtered data passed to tab component
   - Results count updated
   - Cards re-rendered with filtered data

### 5.3 Search Flow

1. **User Types in Search**
   - `handleSearchChange()` called
   - `searchQuery` state updated
   - `filteredData` useMemo recalculates

2. **Search Filtering**
   - Searches in title
   - Searches in description
   - Searches in institution/university/provider names
   - Searches in field/discipline/position
   - Searches in country
   - Case-insensitive matching

3. **Results Update**
   - Filtered results displayed
   - Results count updated

### 5.4 Sort Flow

1. **User Selects Sort Option**
   - `handleSortChange()` called
   - `sortBy` state updated
   - `fetchWishlistData()` called with new sort

2. **Data Re-fetch**
   - Wishlist items re-fetched with sort parameter
   - Explore data re-fetched with sort parameter
   - Data re-filtered and displayed

### 5.5 Tab Switch Flow

1. **User Clicks Tab**
   - `handleTabChange()` called
   - `activeTab` state updated
   - `renderTabContent()` switches component

2. **Component Render**
   - Appropriate tab component rendered
   - Filtered data for that tab passed
   - Filters remain active across tabs

---

## 6. DATABASE MODELS

### 6.1 Wishlist Model

**Location:** `prisma/schema.prisma`

```prisma
model Wishlist {
  applicant_id String
  post_id      String
  add_at       DateTime @default(now())

  applicant    Applicant @relation(...)
  post         OpportunityPost @relation(...)

  @@unique([applicant_id, post_id])
  @@map("Wishlist")
}
```

**Fields:**

- `applicant_id` - Foreign key to Applicant
- `post_id` - Foreign key to OpportunityPost
- `add_at` - Timestamp when added

### 6.2 Related Models

#### 6.2.1 OpportunityPost

- Main post model
- Contains title, description, dates, status
- Relations: ProgramPost, ScholarshipPost, JobPost
- Relation: Institution

#### 6.2.2 ProgramPost

- Program-specific data
- Duration, attendance, fees, GPA requirements

#### 6.2.3 ScholarshipPost

- Scholarship-specific data
- Type, grant amount, eligibility

#### 6.2.4 JobPost

- Job/research lab specific data
- Salary, requirements, responsibilities

#### 6.2.5 Institution

- Institution information
- Name, country, contact details

---

## 7. INTERFACES & TYPES

### 7.1 WishlistItem

```typescript
interface WishlistItem {
	id: string;
	postId: string;
	userId: string;
	createdAt: string;
	status: 0 | 1; // 0 = inactive, 1 = active
	post: {
		id: string;
		title: string;
		content: string | null;
		published: boolean;
		createdAt: string;
		updatedAt: string;
		authorId: string;
		program?: ProgramPostData;
		scholarship?: ScholarshipPostData;
		job?: JobPostData;
		institution?: InstitutionData;
	};
}
```

### 7.2 WishlistResponse

```typescript
interface WishlistResponse {
	success: boolean;
	data: WishlistItem[];
	meta: {
		total: number;
		page: number;
		limit: number;
		totalPages: number;
	};
}
```

### 7.3 WishlistQueryParams

```typescript
interface WishlistQueryParams {
	page?: number;
	limit?: number;
	status?: 0 | 1;
	search?: string;
	sortBy?: 'newest' | 'oldest' | 'title-asc' | 'title-desc';
	postType?: 'program' | 'scholarship' | 'job';
	country?: string;
	discipline?: string;
}
```

### 7.4 WishlistStats

```typescript
interface WishlistStats {
	total: number;
	active: number;
	inactive: number;
	byType: {
		programs: number;
		scholarships: number;
		jobs: number;
	};
	byCountry: Record<string, number>;
	byDiscipline: Record<string, number>;
}
```

### 7.5 Explore Data Types

```typescript
interface Program {
	id: string;
	title: string;
	description: string;
	university: string;
	field: string;
	country: string;
	price: string;
	attendance: string;
	daysLeft: number;
	// ... other fields
}

interface Scholarship {
	id: string;
	title: string;
	description: string;
	provider: string;
	country: string;
	daysLeft: number;
	// ... other fields
}

interface ResearchLab {
	id: string;
	title: string;
	description: string;
	institution: string;
	position: string;
	country: string;
	daysLeft: number;
	// ... other fields
}
```

---

## 8. FILTERING LOGIC

### 8.1 Search Filter

- Searches in multiple fields:
  - Title
  - Description
  - Institution/University/Provider name
  - Field/Discipline/Position
  - Country
- Case-insensitive
- Partial matching

### 8.2 Discipline Filter

- Filters by field (programs) or position (research labs)
- Case-insensitive partial matching
- Multi-select support

### 8.3 Country Filter

- Exact match on country field
- Multi-select support

### 8.4 Fee Range Filter (Programmes Only)

- Parses price string
- Removes non-numeric characters
- Checks if price falls within range
- Single select

### 8.5 Duration Filter (Programmes Only)

- Currently not implemented (data structure limitation)

### 8.6 Degree Level Filter

- Searches in field for keywords:
  - "master", "msc", "ma" for Master's
  - "phd", "doctorate" for PhD
  - "bachelor", "bsc", "ba" for Bachelor's
- Multi-select support

### 8.7 Attendance Filter

- Exact match on attendance field
- Multi-select support
- Only for programmes and research labs

### 8.8 Expired Filter

- Filters by `daysLeft` field
- If `showExpired` is false, only shows items with `daysLeft >= 0`
- Toggle checkbox

---

## 9. SORTING OPTIONS

### 9.1 Available Sort Options

- **newest** - Sort by date added (descending)
- **oldest** - Sort by date added (ascending)
- **title-asc** - Sort by title (A-Z)
- **title-desc** - Sort by title (Z-A)

### 9.2 Sort Implementation

- Sort applied at API level for wishlist items
- Sort applied at API level for explore data
- Sort dropdown component provides UI

---

## 10. STATE MANAGEMENT

### 10.1 Component State

- **UI State:**
  - Active tab
  - Sort option
  - Search query
  - Filter selections
  - Show expired toggle

- **Data State:**
  - Programs array
  - Scholarships array
  - Research labs array
  - Available filters
  - Loading state
  - Error state

### 10.2 Hook State (useWishlist)

- Wishlist items
- Statistics
- Loading state
- Error state
- Pagination metadata
- Query parameters

### 10.3 Derived State (useMemo)

- `filteredData` - All filters applied
- `availableOptions` - Filter options
- `hasActiveFilters` - Check if any filters active

---

## 11. ERROR HANDLING

### 11.1 Error Scenarios

- **Network Errors:**
  - Connection timeout
  - Server unavailable
  - Displayed with retry button

- **Authentication Errors:**
  - Session expired
  - Handled by AuthWrapper

- **Profile Errors:**
  - No applicant profile
  - Handled by ProfileWrapper

- **Data Errors:**
  - Failed to fetch wishlist
  - Failed to fetch explore data
  - Error message displayed

### 11.2 Error Display

- Error banner with message
- Retry button for network errors
- Loading states during operations
- Empty states when no data

---

## 12. LOADING STATES

### 12.1 Loading Indicators

- **Progress Bar:**
  - Shows during wishlist or explore data loading
  - Animated progress indicator

- **Spinner:**
  - Shows when no data and loading
  - Centered with message

- **Opacity:**
  - Content dimmed during loading
  - Pointer events disabled

### 12.2 Loading Scenarios

- Initial page load
- Tab switch
- Sort change
- Filter application
- Data refresh

---

## 13. EMPTY STATES

### 13.1 No Wishlist Items

- Large icon (📝)
- Heading: "No items in your wishlist"
- Description: Encouragement to explore
- CTA Button: "Explore Opportunities"
- Links to `/explore` page

### 13.2 No Filtered Results

- Results count shows 0
- Tab content shows empty state
- Filters can be cleared

---

## 14. PAGINATION

### 14.1 Pagination Support

- API supports pagination
- Default limit: 1000 items (to show all)
- Configurable page and limit
- Metadata includes total pages

### 14.2 Current Implementation

- Fetches large number of items (1000)
- Client-side filtering
- No pagination UI (shows all items)

---

## 15. PERFORMANCE OPTIMIZATIONS

### 15.1 Data Fetching

- Parallel API calls for explore data
- Efficient filtering with useMemo
- Debouncing for search (if implemented)

### 15.2 Rendering

- Memoized filtered data
- Conditional rendering
- Lazy loading of tab components

### 15.3 Caching

- Wishlist data cached in hook state
- Stats cached in hook state
- Filter options cached

---

## 16. SECURITY CONSIDERATIONS

### 16.1 Authentication

- All API calls require authentication
- `requireAuth()` validates session
- User ID extracted from session

### 16.2 Authorization

- Users can only view their own wishlist
- Applicant profile required
- Post ownership validated

### 16.3 Data Validation

- Query parameters validated
- Input sanitization
- SQL injection prevention via Prisma

---

## 17. SEQUENCE DIAGRAM ACTORS

1. **User** - Initiates view actions
2. **WishlistSection Component** - Main UI component
3. **useWishlist Hook** - State management
4. **WishlistService** - API client
5. **API Route Handler** - Server endpoint
6. **requireAuth Utility** - Authentication
7. **Prisma Client** - Database access
8. **Database** - PostgreSQL
9. **ExploreApiService** - Explore data client
10. **Explore API** - External explore endpoints
11. **ProgramsTab/ScholarshipsTab/ResearchLabsTab** - Display components

---

## 18. CLASS DIAGRAM ENTITIES

### 18.1 Frontend Classes

- `WishlistSection` (React Component)
- `ProgramsTab` (React Component)
- `ScholarshipsTab` (React Component)
- `ResearchLabsTab` (React Component)
- `useWishlist` (Custom Hook)

### 18.2 Service Classes

- `WishlistService` (Class)
  - `getWishlist()`
  - `getWishlistItem()`
  - `getWishlistStats()`
  - `toggleWishlistItem()`
  - `isInWishlist()`
- `ExploreApiService` (Class)
  - `getPrograms()`
  - `getScholarships()`
  - `getResearchLabs()`

### 18.3 Utility Classes

- `requireAuth` (Function)

### 18.4 Database Models

- `Wishlist` (Prisma Model)
- `OpportunityPost` (Prisma Model)
- `ProgramPost` (Prisma Model)
- `ScholarshipPost` (Prisma Model)
- `JobPost` (Prisma Model)
- `Institution` (Prisma Model)
- `Applicant` (Prisma Model)

---

## 19. KEY METHODS FOR DIAGRAMS

### 19.1 WishlistSection Methods

- `fetchWishlistData()` - Fetches and filters wishlist data
- `handleSearchChange()` - Handles search input
- `handleTabChange()` - Handles tab switching
- `handleSortChange()` - Handles sort changes
- `clearAllFilters()` - Clears all filters
- `getCurrentTabData()` - Gets filtered data
- `renderTabContent()` - Renders tab component

### 19.2 useWishlist Methods

- `fetchWishlist()` - Fetches wishlist items
- `fetchStats()` - Fetches statistics
- `isInWishlist()` - Checks if item in wishlist
- `refresh()` - Refreshes data
- `setParams()` - Updates query parameters

### 19.3 WishlistService Methods

- `getWishlist(params)` - GET wishlist items
- `getWishlistStats()` - GET statistics
- `toggleWishlistItem(postId)` - Toggle item
- `isInWishlist(postId)` - Check status

### 19.4 API Route Methods

- `GET()` - Handle GET request
- Authentication validation
- Applicant profile check
- Data fetching and transformation
- Filtering and pagination

---

## 20. FILE STRUCTURE REFERENCE

```
src/
├── components/
│   ├── profile/
│   │   └── applicant/sections/
│   │       └── WishlistSection.tsx
│   └── explore-tab/
│       ├── ProgramsTab.tsx
│       ├── ScholarshipsTab.tsx
│       └── ResearchLabsTab.tsx
├── hooks/
│   └── wishlist/
│       └── useWishlist.ts
├── services/
│   ├── wishlist/
│   │   └── wishlist-service.ts
│   └── explore/
│       └── explore-api.ts
├── app/
│   └── api/
│       └── wishlist/
│           ├── route.ts (GET handler)
│           ├── [postId]/route.ts
│           └── stats/route.ts
└── types/
    └── api/
        └── wishlist-api.ts
```

---

## 21. DIAGRAM REQUIREMENTS SUMMARY

### For Sequence Diagram:

- Show complete flow from component mount to data display
- Include authentication checks
- Show wishlist fetch flow
- Show explore data fetch flow
- Include filtering and sorting
- Show tab switching
- Include error handling paths
- Show state updates

### For Class Diagram:

- Show component hierarchy
- Show hook dependencies
- Show service layer structure
- Include tab components
- Show database model relationships
- Include interfaces and types
- Show method signatures
- Include dependencies between classes
- Show filter logic classes

---

## 22. ADDITIONAL FEATURES

### 22.1 Wishlist Toggle

- Items can be removed from wishlist
- Toggle functionality via `toggleWishlistItem`
- Updates UI immediately
- Refreshes stats

### 22.2 Filter Persistence

- Filters remain active across tab switches
- Clear all filters button
- Individual filter clearing

### 22.3 Responsive Design

- Mobile-friendly layout
- Responsive filter dropdowns
- Adaptive grid/list view

---

## END OF DOCUMENT
