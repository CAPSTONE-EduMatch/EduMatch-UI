# Scholarship Detail Feature - Components & Requirements for Sequence & Class Diagrams

## Overview

The Scholarship Detail feature allows users to view comprehensive information
about a specific scholarship, apply to it, manage application documents, view
eligibility requirements, and explore related programs. It includes institution
information, application management, wishlist functionality, and detailed
scholarship information across multiple tabs.

---

## 1. FRONTEND COMPONENTS

### 1.1 Main Component

#### 1.1.1 ScholarshipDetail

**Location:**
`src/app/(applicant)/explore/scholarships/[id]/ScholarshipDetail.tsx`

**Purpose:** Main component for displaying scholarship details and handling
applications

**Key Features:**

- Tabbed interface (Detail, Eligibility, Other information)
- Application submission with document management
- Institution information display with status badges
- Wishlist integration
- Eligibility programs display with filtering
- Application status tracking
- Update request handling
- Recommended scholarships display
- Dynamic breadcrumb navigation

**State Management:**

- `currentScholarship` - Current scholarship data
- `activeTab` - Active tab ('detail', 'eligibility', 'other')
- `loading` - Scholarship data loading state
- `error` - Error message state
- `breadcrumbItems` - Dynamic breadcrumb items
- `eligibilityPrograms` - Eligible programs data
- `eligibilityProgramsLoading` - Programs loading state
- `eligibilityProgramsPage` - Programs pagination page
- `eligibilityProgramsTotalPages` - Total pages for programs
- `eligibilityFilters` - Applied filters for programs
- `recommendedScholarships` - Recommended scholarships array
- `isLoadingRecommendations` - Recommendations loading state
- `hasApplied` - Application status boolean
- `isApplying` - Application submission state
- `isCheckingApplication` - Application check state
- `applicationStatus` - Current application status
- `applicationId` - Application ID if exists
- `uploadedFiles` - Selected application documents
- `selectedDocuments` - Document selector state
- `showManageModal` - Document management modal state
- `showDocumentSelector` - Document selector modal state
- `showUpdateModal` - Update request modal state
- `selectedUpdateRequestId` - Selected update request ID
- `updateRequests` - Array of update requests
- `loadingUpdateRequests` - Update requests loading state
- `showDeleteConfirmModal` - Delete confirmation modal state
- `isClosing` - Modal closing animation state
- `showAuthModal` - Authentication modal state

**Key Methods:**

- `fetchScholarshipDetail()` - Fetches scholarship details by ID
- `fetchEligibilityPrograms()` - Fetches eligible programs
- `fetchRecommendedScholarships()` - Fetches recommended scholarships
- `checkExistingApplication()` - Checks if user has applied
- `handleApply()` - Handles application submission
- `handleScholarshipWishlistToggle()` - Toggles scholarship wishlist status
- `handleProgramWishlistToggle()` - Toggles program wishlist status
- `handleDocumentsSelected()` - Handles document selection
- `fetchUpdateRequests()` - Fetches application update requests
- `handleProgramClick()` - Navigates to program detail
- `handleScholarshipClick()` - Navigates to scholarship detail
- `handleEligibilityFiltersChange()` - Handles eligibility filter changes
- `renderTabContent()` - Renders active tab content
- `getInstitutionStatus()` - Gets institution status badge info

**Props:**

```typescript
// No props - uses URL params
interface ScholarshipDetailParams {
	id: string; // Scholarship ID from URL
}
```

### 1.2 Sub Components

#### 1.2.1 InstitutionStatusBadge

**Purpose:** Displays institution account status

**Features:**

- Shows "Account Deactivated" badge for inactive institutions
- Conditional rendering based on institution status
- Styled with appropriate colors and icons

#### 1.2.2 FilterSidebar

**Location:** `src/components/explore/FilterSidebar.tsx`

**Purpose:** Filter interface for eligibility programs

**Features:**

- Discipline filtering
- Country filtering
- Fee range filtering
- Duration filtering
- Degree level filtering
- Attendance mode filtering
- Clear all filters functionality

#### 1.2.3 DocumentSelector

**Location:** `src/components/ui/DocumentSelector.tsx`

**Purpose:** Modal for selecting application documents

**Features:**

- Browse user's existing documents
- Upload new documents
- Document categorization
- File type validation
- Size validation

#### 1.2.4 ApplicationUpdateResponseModal

**Location:**
`src/components/profile/applicant/sections/ApplicationUpdateResponseModal.tsx`

**Purpose:** Handle update requests from institutions

**Features:**

- View update request details
- Submit updated documents
- Track response status

### 1.3 UI Components

#### 1.3.1 Navigation Components

- **Breadcrumb** - Dynamic navigation path
- **Button** - Action buttons (Apply, Institution, Contact, etc.)
- **Tabs** - Content tab navigation

#### 1.3.2 Display Components

- **ProgramCard** - Program display cards for eligibility
- **ScholarshipCard** - Scholarship display cards for recommendations
- **Modal** - Various modal dialogs
- **Badge** - Status badges
- **Avatar** - Institution logos
- **Loading Spinner** - Loading indicators
- **Pagination** - Page navigation for programs

#### 1.3.3 Input Components

- **DocumentSelector** - Document selection interface
- **File Upload** - File upload controls
- **Search** - Search functionality for programs
- **Filters** - Filter controls

---

## 2. HOOKS

### 2.1 useWishlist Hook

**Location:** `src/hooks/wishlist/useWishlist.ts`

**Purpose:** Manages wishlist operations

**Usage in ScholarshipDetail:**

- Check if scholarship/programs are in wishlist
- Toggle wishlist status for multiple item types
- Update wishlist state

### 2.2 useFileUpload Hook

**Location:** `src/hooks/files/useFileUpload.ts`

**Purpose:** Handles file upload to S3

**Options:**

```typescript
interface UseFileUploadOptions {
	category: string; // 'application-documents'
	onProgress: (progress: number) => void;
}
```

**Returns:**

```typescript
interface UseFileUploadReturn {
	uploadFiles: (files: File[]) => Promise<UploadedFile[]>;
	isUploading: boolean;
	uploadProgress: number;
}
```

### 2.3 useNotification Hook

**Location:** `src/contexts/NotificationContext.tsx`

**Purpose:** Display success/error notifications

**Methods:**

- `showSuccess(title, message, options?)` - Show success notification
- `showError(title, message, options?)` - Show error notification

### 2.4 useAuthCheck Hook

**Location:** `src/hooks/auth/useAuthCheck.ts`

**Purpose:** Check authentication status

**Returns:**

- `isAuthenticated` - Boolean authentication status

---

## 3. SERVICES

### 3.1 ExploreApiService

**Location:** `src/services/explore/explore-api.ts`

**Purpose:** API client for explore operations

**Key Methods:**

#### 3.1.1 getScholarshipDetail

```typescript
async getScholarshipDetail(scholarshipId: string): Promise<ScholarshipDetailResponse>
```

- Fetches scholarship details by ID
- Includes institution information
- Returns formatted scholarship data

#### 3.1.2 getScholarships

```typescript
async getScholarships(params?: ExploreQueryParams): Promise<ScholarshipsResponse>
```

- Fetches scholarships for recommendations
- Supports filtering and pagination

#### 3.1.3 getPrograms

```typescript
async getPrograms(params?: ExploreQueryParams): Promise<ProgramsResponse>
```

- Fetches programs for eligibility display
- Used in eligibility tab

### 3.2 ApplicationService

**Location:** `src/services/application/application-service.ts`

**Purpose:** API client for application operations

**Key Methods:**

#### 3.2.1 submitApplication

```typescript
async submitApplication(data: ApplicationSubmissionData): Promise<ApplicationResponse>
```

- Submits new scholarship application
- Includes document attachments
- Returns application ID and status

#### 3.2.2 getApplications

```typescript
async getApplications(params?: ApplicationQueryParams): Promise<ApplicationsResponse>
```

- Fetches user's applications
- Used to check existing applications
- Supports pagination and filtering

### 3.3 WishlistService

**Location:** `src/services/wishlist/wishlist-service.ts`

**Purpose:** API client for wishlist operations

**Key Methods:**

#### 3.3.1 toggleWishlistItem

```typescript
async toggleWishlistItem(postId: string): Promise<WishlistItemResponse>
```

- Toggles scholarship/program in/out of wishlist
- Returns updated wishlist status

---

## 4. API ROUTES

### 4.1 GET /api/explore/scholarships/scholarship-detail

**Location:** `src/app/api/explore/scholarships/scholarship-detail/route.ts`

**Method:** `GET`

**Authentication:** Optional

**Query Parameters:**

```typescript
{
	scholarshipId: string; // Required scholarship ID
}
```

**Process:**

1. Validates scholarship ID parameter
2. Fetches scholarship data from database
3. Includes related institution information
4. Includes subdisciplines and disciplines
5. Includes document requirements
6. Includes eligibility criteria
7. Formats and returns scholarship details

**Response:**

```typescript
{
  success: true,
  scholarship: {
    id: string,
    title: string,
    description: string,
    amount: number,
    duration: string,
    applicationDeadline: string,
    eligibilityCriteria: string,
    degreeLevel: string,
    field: string,
    country: string,
    institution: {
      id: string,
      name: string,
      logo: string,
      status: boolean,
      // ... other institution fields
    },
    documents: DocumentRequirement[],
    // ... other scholarship fields
  }
}
```

### 4.2 GET /api/explore/scholarships/eligibility-programs

**Location:** `src/app/api/explore/scholarships/eligibility-programs/route.ts`

**Method:** `GET`

**Purpose:** Get programs eligible for scholarship

**Query Parameters:**

```typescript
{
  scholarshipId: string,
  page?: number,
  limit?: number,
  discipline?: string,
  country?: string,
  feeRange?: string,
  duration?: string,
  degreeLevel?: string,
  attendance?: string
}
```

**Process:**

1. Fetches scholarship details
2. Matches programs based on eligibility criteria
3. Applies additional filters
4. Returns paginated eligible programs

### 4.3 POST /api/applications

**Location:** `src/app/api/applications/route.ts`

**Method:** `POST`

**Authentication:** Required

**Request Body:**

```typescript
{
  postId: string, // Scholarship ID
  documents: Array<{
    documentTypeId: string,
    name: string,
    url: string,
    size: number
  }>
}
```

**Process:**

1. Validates authentication
2. Checks for existing applications
3. Creates new application record
4. Stores document references
5. Returns application details

### 4.4 GET /api/applications

**Location:** `src/app/api/applications/route.ts`

**Method:** `GET`

**Authentication:** Required

**Purpose:** Get user's applications

**Query Parameters:**

```typescript
{
  page?: number,
  limit?: number,
  status?: string,
  postType?: string
}
```

### 4.5 GET /api/applications/[applicationId]/update-request

**Location:** `src/app/api/applications/[applicationId]/update-request/route.ts`

**Method:** `GET`

**Authentication:** Required

**Purpose:** Get update requests for scholarship application

---

## 5. DATA FLOW & SEQUENCE

### 5.1 Scholarship Detail View Flow

1. **Component Initialization**
   - `ScholarshipDetail` component mounts
   - Extract scholarship ID from URL params
   - Initialize state and hooks

2. **Fetch Scholarship Data**
   - Call `fetchScholarshipDetail()` with scholarship ID
   - `GET /api/explore/scholarships/scholarship-detail?scholarshipId=${id}`
   - Update `currentScholarship` state
   - Update breadcrumb with scholarship title

3. **Check Authentication & Application Status**
   - If authenticated, call `checkExistingApplication()`
   - `GET /api/applications` to check existing applications
   - Update `hasApplied` and `applicationStatus` states

4. **Fetch Related Data**
   - Call `fetchRecommendedScholarships()` for similar scholarships
   - Load eligibility programs when eligibility tab is accessed
   - Update respective states

5. **Render Scholarship Details**
   - Display scholarship information
   - Show institution details with status badge
   - Render action buttons (Apply, Institution, Contact, Wishlist)

### 5.2 Eligibility Tab Flow

1. **User Clicks Eligibility Tab**
   - Set `activeTab` to 'eligibility'
   - Trigger `fetchEligibilityPrograms()` if not loaded

2. **Fetch Eligible Programs**
   - `GET /api/explore/scholarships/eligibility-programs`
   - Include scholarship ID and current filters
   - Update `eligibilityPrograms` state
   - Display programs with FilterSidebar

3. **Filter Application**
   - User applies filters through FilterSidebar
   - Call `handleEligibilityFiltersChange()`
   - Re-fetch programs with new filters
   - Update displayed results

4. **Program Interaction**
   - Users can wishlist programs
   - Users can click to view program details
   - Navigate to program detail page

### 5.3 Application Submission Flow

1. **User Clicks Apply**
   - Check authentication status
   - Show document selector if no documents selected

2. **Document Selection**
   - User selects existing documents or uploads new ones
   - Documents stored in `selectedDocuments` state
   - Convert to `uploadedFiles` format

3. **Submit Application**
   - Call `handleApply()` method
   - Validate required documents
   - `POST /api/applications` with scholarship ID and documents
   - Update application status
   - Show success notification

4. **Post-Application State**
   - Update `hasApplied` to true
   - Change button to show "Applied" status
   - Fetch update requests if any

### 5.4 Wishlist Toggle Flow

1. **User Clicks Wishlist Button**
   - Check authentication status
   - Call `handleScholarshipWishlistToggle()` or `handleProgramWishlistToggle()`

2. **Toggle Wishlist Status**
   - Call `toggleWishlistItem()` from wishlist service
   - `POST/DELETE /api/wishlist` with post ID
   - Update wishlist state in hook
   - Update heart icon state

### 5.5 Tab Navigation Flow

1. **User Clicks Tab**
   - Update `activeTab` state
   - Call `renderTabContent()` to switch view

2. **Tab Content Rendering**
   - Detail: Scholarship description, eligibility criteria
   - Eligibility: Eligible programs with filtering
   - Other: Contact information, additional details

3. **Dynamic Content Loading**
   - Eligibility tab triggers program data fetch
   - Pagination handled for program results
   - Filters applied dynamically

### 5.6 Update Request Handling Flow

1. **Check for Update Requests**
   - When application loaded, call `fetchUpdateRequests()`
   - `GET /api/applications/${applicationId}/update-request`
   - Display update notification if pending

2. **Handle Update Request**
   - User clicks "View Update Request"
   - Open `ApplicationUpdateResponseModal`
   - Submit updated documents
   - Refresh application status

---

## 6. DATABASE MODELS

### 6.1 ScholarshipPost Model

```prisma
model ScholarshipPost {
  scholarship_id       String   @id @default(cuid())
  title               String
  description         String?
  amount              Decimal?
  duration            String?
  application_deadline DateTime?
  eligibility_criteria String?
  degree_level        String?
  field               String?
  country             String?
  institution_id      String

  institution         Institution @relation(fields: [institution_id], references: [institution_id])
  opportunity_post    OpportunityPost?
  subdisciplines      ScholarshipSubdiscipline[]
  documents           ScholarshipDocumentRequirement[]
  applications        Application[]

  @@map("ScholarshipPost")
}
```

### 6.2 Application Model

```prisma
model Application {
  application_id    String   @id @default(cuid())
  applicant_id      String
  post_id          String
  status           String   @default("PENDING")
  applied_at       DateTime @default(now())

  applicant        Applicant @relation(fields: [applicant_id], references: [applicant_id])
  post             OpportunityPost @relation(fields: [post_id], references: [post_id])
  documents        ApplicationDocument[]
  update_requests  ApplicationUpdateRequest[]

  @@map("Application")
}
```

### 6.3 Institution Model

```prisma
model Institution {
  institution_id    String   @id @default(cuid())
  name              String
  abbreviation      String?
  logo              String?
  status            Boolean  @default(true)
  deleted_at        DateTime?

  programs          ProgramPost[]
  scholarships      ScholarshipPost[]
  research_labs     JobPost[]

  @@map("Institution")
}
```

---

## 7. FILTERING & SEARCH

### 7.1 Eligibility Program Filters

**Available Filters:**

- **Discipline** - Based on scholarship field matching
- **Country** - Program location filtering
- **Fee Range** - Tuition fee brackets
- **Duration** - Program duration options
- **Degree Level** - Academic level matching
- **Attendance** - On-campus, online, hybrid options

### 7.2 Filter Application Logic

```typescript
const applyFilters = (programs: Program[], filters: FilterState) => {
	return programs.filter((program) => {
		// Discipline matching
		if (filters.disciplines.length > 0) {
			const programDisciplines =
				program.subdisciplines?.map((s) => s.discipline?.name) || [];
			if (!programDisciplines.some((d) => filters.disciplines.includes(d))) {
				return false;
			}
		}

		// Country matching
		if (filters.countries.length > 0) {
			if (!filters.countries.includes(program.country)) {
				return false;
			}
		}

		// Additional filter logic...

		return true;
	});
};
```

### 7.3 Search Functionality

- Search in scholarship title and description
- Search in institution names
- Search in field/discipline information
- Case-insensitive matching
- Real-time results update

---

## 8. ERROR HANDLING

### 8.1 Scholarship Not Found

- Display 404 error page
- Provide navigation back to explore
- Log error for monitoring

### 8.2 Authentication Errors

- Show authentication modal
- Redirect to sign-in after action
- Preserve current page context

### 8.3 Application Errors

- Show error notification with details
- Provide retry option
- Validate documents before submission
- Handle duplicate application errors

### 8.4 Network Errors

- Show error message with retry
- Graceful degradation for optional features
- Loading state management
- Offline state handling

---

## 9. PERFORMANCE CONSIDERATIONS

### 9.1 Data Fetching

- Lazy load eligibility programs
- Debounce search and filter inputs
- Cache scholarship details
- Pagination for large program lists

### 9.2 Component Optimization

- Memo wrapper for filter computations
- Callback optimization for handlers
- Conditional rendering for tabs
- Virtual scrolling for large lists

### 9.3 Image Optimization

- Next.js Image component for institution logos
- Lazy loading for non-critical images
- Proper image sizing and formats
- Placeholder images during loading
