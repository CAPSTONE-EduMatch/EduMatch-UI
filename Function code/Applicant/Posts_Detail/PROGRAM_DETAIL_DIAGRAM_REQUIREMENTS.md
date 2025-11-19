# Program Detail Feature - Components & Requirements for Sequence & Class Diagrams

## Overview

The Program Detail feature allows users to view comprehensive information about
a specific educational program, apply to it, manage application documents, and
view related opportunities. It includes institution information, application
management, wishlist functionality, and detailed program information across
multiple tabs.

---

## 1. FRONTEND COMPONENTS

### 1.1 Main Component

#### 1.1.1 ProgramDetail

**Location:** `src/app/(applicant)/explore/programmes/[id]/ProgramDetail.tsx`

**Purpose:** Main component for displaying program details and handling
applications

**Key Features:**

- Tabbed interface (Overview, Course curriculum, Scholarships, Other
  information)
- Application submission with document management
- Institution information display with status badges
- Wishlist integration
- Contact institution functionality
- Application status tracking
- Update request handling
- Recommended programs display
- Dynamic breadcrumb navigation

**State Management:**

- `currentProgram` - Current program data
- `activeTab` - Active tab ('overview', 'curriculum', 'scholarships', 'other')
- `isLoadingProgram` - Program data loading state
- `breadcrumbItems` - Dynamic breadcrumb items
- `scholarships` - Related scholarships data
- `isLoadingScholarships` - Scholarships loading state
- `scholarshipPagination` - Scholarships pagination data
- `recommendedPrograms` - Recommended programs array
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
- `currentPage` - Scholarships pagination page

**Key Methods:**

- `fetchProgramDetail()` - Fetches program details by ID
- `fetchScholarshipsByInstitution()` - Fetches related scholarships
- `fetchRecommendedPrograms()` - Fetches recommended programs
- `checkExistingApplication()` - Checks if user has applied
- `handleApply()` - Handles application submission
- `handleWishlistToggle()` - Toggles wishlist status
- `handleDocumentsSelected()` - Handles document selection
- `fetchUpdateRequests()` - Fetches application update requests
- `handleProgramClick()` - Navigates to program detail
- `handleScholarshipClick()` - Navigates to scholarship detail
- `renderTabContent()` - Renders active tab content
- `getInstitutionStatus()` - Gets institution status badge info

**Props:**

```typescript
// No props - uses URL params
interface ProgramDetailParams {
	id: string; // Program ID from URL
}
```

### 1.2 Sub Components

#### 1.2.1 InstitutionStatusBadge

**Purpose:** Displays institution account status

**Features:**

- Shows "Account Deactivated" badge for inactive institutions
- Conditional rendering based on institution status
- Styled with appropriate colors and icons

#### 1.2.2 DocumentSelector

**Location:** `src/components/ui/DocumentSelector.tsx`

**Purpose:** Modal for selecting application documents

**Features:**

- Browse user's existing documents
- Upload new documents
- Document categorization
- File type validation
- Size validation

#### 1.2.3 ApplicationUpdateResponseModal

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

- **ProgramCard** - Program display cards
- **ScholarshipCard** - Scholarship display cards
- **Modal** - Various modal dialogs
- **Badge** - Status badges
- **Avatar** - Institution logos
- **Loading Spinner** - Loading indicators

#### 1.3.3 Input Components

- **DocumentSelector** - Document selection interface
- **File Upload** - File upload controls

---

## 2. HOOKS

### 2.1 useWishlist Hook

**Location:** `src/hooks/wishlist/useWishlist.ts`

**Purpose:** Manages wishlist operations

**Usage in ProgramDetail:**

- Check if program is in wishlist
- Toggle wishlist status
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

#### 3.1.1 getProgramDetail

```typescript
async getProgramDetail(programId: string): Promise<ProgramDetailResponse>
```

- Fetches program details by ID
- Includes institution information
- Returns formatted program data

#### 3.1.2 getPrograms

```typescript
async getPrograms(params?: ExploreQueryParams): Promise<ProgramsResponse>
```

- Fetches programs for recommendations
- Supports filtering and pagination

#### 3.1.3 getScholarships

```typescript
async getScholarships(params?: ExploreQueryParams): Promise<ScholarshipsResponse>
```

- Fetches scholarships by institution
- Used for related scholarships tab

### 3.2 ApplicationService

**Location:** `src/services/application/application-service.ts`

**Purpose:** API client for application operations

**Key Methods:**

#### 3.2.1 submitApplication

```typescript
async submitApplication(data: ApplicationSubmissionData): Promise<ApplicationResponse>
```

- Submits new application
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

- Toggles program in/out of wishlist
- Returns updated wishlist status

---

## 4. API ROUTES

### 4.1 GET /api/explore/programs/program-detail

**Location:** `src/app/api/explore/programs/program-detail/route.ts`

**Method:** `GET`

**Authentication:** Optional

**Query Parameters:**

```typescript
{
	programId: string; // Required program ID
}
```

**Process:**

1. Validates program ID parameter
2. Fetches program data from database
3. Includes related institution information
4. Includes subdisciplines and disciplines
5. Includes document requirements
6. Formats and returns program details

**Response:**

```typescript
{
  success: true,
  program: {
    id: string,
    title: string,
    description: string,
    tuitionFee: number,
    duration: string,
    applicationDeadline: string,
    startDate: string,
    location: string,
    degreeLevel: string,
    attendance: string,
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
    // ... other program fields
  }
}
```

### 4.2 GET /api/explore/scholarships/by-institution

**Location:** `src/app/api/explore/scholarships/by-institution/route.ts`

**Method:** `GET`

**Purpose:** Get scholarships by institution

**Query Parameters:**

```typescript
{
  institutionId: string,
  page?: number,
  limit?: number
}
```

### 4.3 POST /api/applications

**Location:** `src/app/api/applications/route.ts`

**Method:** `POST`

**Authentication:** Required

**Request Body:**

```typescript
{
  postId: string,
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

**Purpose:** Get update requests for application

---

## 5. DATA FLOW & SEQUENCE

### 5.1 Program Detail View Flow

1. **Component Initialization**
   - `ProgramDetail` component mounts
   - Extract program ID from URL params
   - Initialize state and hooks

2. **Fetch Program Data**
   - Call `fetchProgramDetail()` with program ID
   - `GET /api/explore/programs/program-detail?programId=${id}`
   - Update `currentProgram` state
   - Update breadcrumb with program title

3. **Check Authentication & Application Status**
   - If authenticated, call `checkExistingApplication()`
   - `GET /api/applications` to check existing applications
   - Update `hasApplied` and `applicationStatus` states

4. **Fetch Related Data**
   - If institution ID available, call `fetchScholarshipsByInstitution()`
   - Call `fetchRecommendedPrograms()` for similar programs
   - Update respective states

5. **Render Program Details**
   - Display program information
   - Show institution details with status badge
   - Render action buttons (Apply, Institution, Contact, Wishlist)

### 5.2 Application Submission Flow

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
   - `POST /api/applications` with program ID and documents
   - Update application status
   - Show success notification

4. **Post-Application State**
   - Update `hasApplied` to true
   - Change button to show "Applied" status
   - Fetch update requests if any

### 5.3 Wishlist Toggle Flow

1. **User Clicks Wishlist Button**
   - Check authentication status
   - Call `handleWishlistToggle()`

2. **Toggle Wishlist Status**
   - Call `toggleWishlistItem()` from wishlist service
   - `POST/DELETE /api/wishlist` with program ID
   - Update wishlist state in hook
   - Update heart icon state

### 5.4 Tab Navigation Flow

1. **User Clicks Tab**
   - Update `activeTab` state
   - Call `renderTabContent()` to switch view

2. **Tab Content Rendering**
   - Overview: Program description, disciplines
   - Curriculum: Course curriculum details
   - Scholarships: Related scholarships from institution
   - Other: Contact information, additional details

3. **Dynamic Content Loading**
   - Scholarships tab triggers scholarship data fetch
   - Pagination handled for scholarship results

### 5.5 Institution Navigation Flow

1. **User Clicks Institution Button**
   - Extract institution ID from program data
   - Navigate to `/institution/${institutionId}`
   - Preserve current context in URL params

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

### 6.1 ProgramPost Model

```prisma
model ProgramPost {
  program_id          String   @id @default(cuid())
  title               String
  description         String?
  tuition_fee         Decimal?
  duration            String?
  application_deadline DateTime?
  start_date          DateTime?
  location            String?
  degree_level        String?
  attendance          String?
  field               String?
  country             String?
  institution_id      String

  institution         Institution @relation(fields: [institution_id], references: [institution_id])
  opportunity_post    OpportunityPost?
  subdisciplines      ProgramSubdiscipline[]
  documents           ProgramDocumentRequirement[]
  applications        Application[]

  @@map("ProgramPost")
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

## 7. ERROR HANDLING

### 7.1 Program Not Found

- Display 404 error page
- Provide navigation back to explore
- Log error for monitoring

### 7.2 Authentication Errors

- Redirect to sign-in page
- Show authentication modal
- Preserve current page context

### 7.3 Application Errors

- Show error notification
- Provide retry option
- Validate documents before submission

### 7.4 Network Errors

- Show error message with retry
- Graceful degradation for optional features
- Loading state management

---

## 8. PERFORMANCE CONSIDERATIONS

### 8.1 Data Fetching

- Lazy load scholarships tab content
- Debounce search inputs
- Cache program details
- Pagination for large result sets

### 8.2 Component Optimization

- Memo wrapper for expensive computations
- Callback optimization for handlers
- Conditional rendering for tabs

### 8.3 Image Optimization

- Next.js Image component for institution logos
- Lazy loading for non-critical images
- Proper image sizing and formats
