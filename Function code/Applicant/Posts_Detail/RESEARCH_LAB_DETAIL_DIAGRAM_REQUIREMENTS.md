# Research Lab Detail Feature - Components & Requirements for Sequence & Class Diagrams

## Overview

The Research Lab Detail feature allows users to view comprehensive information
about a specific research lab opportunity, apply for positions, manage
application documents, and explore related opportunities. It includes
institution information, application management, wishlist functionality, and
detailed job information across multiple tabs.

---

## 1. FRONTEND COMPONENTS

### 1.1 Main Component

#### 1.1.1 ResearchLabDetail

**Location:**
`src/app/(applicant)/explore/research-labs/[id]/ResearchLabDetail.tsx`

**Purpose:** Main component for displaying research lab details and handling
applications

**Key Features:**

- Tabbed interface (Job description, Offer information, Job requirements, Other
  information)
- Application submission with document management
- Institution information display with status badges
- Wishlist integration
- Application status tracking
- Update request handling
- Recommended research labs display
- Dynamic breadcrumb navigation

**State Management:**

- `researchLab` - Current research lab data (from custom hook)
- `loading` - Research lab data loading state (from custom hook)
- `error` - Error message state (from custom hook)
- `activeTab` - Active tab ('job-description', 'offer-information',
  'job-requirements', 'other-information')
- `breadcrumbItems` - Dynamic breadcrumb items
- `recommendedResearchLabs` - Recommended research labs array
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

- `fetchRecommendedResearchLabs()` - Fetches recommended research labs
- `checkExistingApplication()` - Checks if user has applied
- `handleApply()` - Handles application submission
- `handleDocumentsSelected()` - Handles document selection
- `fetchUpdateRequests()` - Fetches application update requests
- `handleResearchLabClick()` - Navigates to research lab detail
- `renderTabContent()` - Renders active tab content
- `getInstitutionStatus()` - Gets institution status badge info
- `handleFileUpload()` - Handles file upload
- `removeFile()` - Removes selected file
- `removeAllFiles()` - Removes all selected files

**Props:**

```typescript
// No props - uses URL params and custom hook
interface ResearchLabDetailParams {
	id: string; // Research lab ID from URL
}
```

### 1.2 Custom Hooks

#### 1.2.1 useResearchLabDetail

**Location:** `src/hooks/explore/useResearchLabDetail.ts`

**Purpose:** Fetches and manages research lab detail data

**Returns:**

```typescript
interface UseResearchLabDetailReturn {
	researchLab: ResearchLab | null;
	loading: boolean;
	error: string | null;
}
```

**Usage:**

```typescript
const { researchLab, loading, error } = useResearchLabDetail(labId);
```

### 1.3 Sub Components

#### 1.3.1 InstitutionStatusBadge

**Purpose:** Displays institution account status

**Features:**

- Shows "Account Deactivated" badge for inactive institutions
- Conditional rendering based on institution status
- Styled with appropriate colors and icons

#### 1.3.2 DocumentSelector

**Location:** `src/components/ui/DocumentSelector.tsx`

**Purpose:** Modal for selecting application documents

**Features:**

- Browse user's existing documents
- Upload new documents
- Document categorization
- File type validation
- Size validation

#### 1.3.3 ApplicationUpdateResponseModal

**Location:**
`src/components/profile/applicant/sections/ApplicationUpdateResponseModal.tsx`

**Purpose:** Handle update requests from institutions

**Features:**

- View update request details
- Submit updated documents
- Track response status

### 1.4 UI Components

#### 1.4.1 Navigation Components

- **Breadcrumb** - Dynamic navigation path
- **Button** - Action buttons (Apply, Institution, Contact, etc.)
- **Tabs** - Content tab navigation

#### 1.4.2 Display Components

- **ResearchLabCard** - Research lab display cards for recommendations
- **Modal** - Various modal dialogs
- **Badge** - Status badges
- **Avatar** - Institution logos
- **Loading Spinner** - Loading indicators

#### 1.4.3 Input Components

- **DocumentSelector** - Document selection interface
- **File Upload** - File upload controls

---

## 2. HOOKS

### 2.1 useResearchLabDetail Hook

**Location:** `src/hooks/explore/useResearchLabDetail.ts`

**Purpose:** Fetches research lab details

**Parameters:**

- `labId: string` - Research lab ID

**Returns:**

```typescript
{
	researchLab: ResearchLab | null;
	loading: boolean;
	error: string | null;
}
```

### 2.2 useWishlist Hook

**Location:** `src/hooks/wishlist/useWishlist.ts`

**Purpose:** Manages wishlist operations

**Usage in ResearchLabDetail:**

- Check if research lab is in wishlist
- Toggle wishlist status
- Update wishlist state

### 2.3 useFileUpload Hook

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

### 2.4 useNotification Hook

**Location:** `src/contexts/NotificationContext.tsx`

**Purpose:** Display success/error notifications

**Methods:**

- `showSuccess(title, message, options?)` - Show success notification
- `showError(title, message, options?)` - Show error notification

### 2.5 useAuthCheck Hook

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

#### 3.1.1 getResearchLabDetail

```typescript
async getResearchLabDetail(labId: string): Promise<ResearchLabDetailResponse>
```

- Fetches research lab details by ID
- Includes institution information
- Returns formatted research lab data

#### 3.1.2 getResearchLabs

```typescript
async getResearchLabs(params?: ExploreQueryParams): Promise<ResearchLabsResponse>
```

- Fetches research labs for recommendations
- Supports filtering and pagination

### 3.2 ApplicationService

**Location:** `src/services/application/application-service.ts`

**Purpose:** API client for application operations

**Key Methods:**

#### 3.2.1 submitApplication

```typescript
async submitApplication(data: ApplicationSubmissionData): Promise<ApplicationResponse>
```

- Submits new research lab application
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

- Toggles research lab in/out of wishlist
- Returns updated wishlist status

---

## 4. API ROUTES

### 4.1 GET /api/explore/research-labs/research-lab-detail

**Location:** `src/app/api/explore/research-labs/research-lab-detail/route.ts`

**Method:** `GET`

**Authentication:** Optional

**Query Parameters:**

```typescript
{
	researchLabId: string; // Required research lab ID
}
```

**Process:**

1. Validates research lab ID parameter
2. Fetches research lab data from database (JobPost)
3. Includes related institution information
4. Includes subdisciplines and disciplines
5. Includes document requirements
6. Includes job requirements and offer information
7. Formats and returns research lab details

**Response:**

```typescript
{
  success: true,
  researchLab: {
    id: string,
    title: string,
    description: string,
    salary: string,
    duration: string,
    applicationDeadline: string,
    jobType: string,
    requirements: string,
    offerInformation: string,
    country: string,
    institution: {
      id: string,
      name: string,
      logo: string,
      status: boolean,
      // ... other institution fields
    },
    documents: DocumentRequirement[],
    // ... other research lab fields
  }
}
```

### 4.2 GET /api/explore/research

**Location:** `src/app/api/explore/research/route.ts`

**Method:** `GET`

**Purpose:** Get research labs with filtering

**Query Parameters:**

```typescript
{
  page?: number,
  limit?: number,
  discipline?: string,
  country?: string,
  degreeLevel?: string,
  sortBy?: string,
  search?: string
}
```

**Process:**

1. Fetches research lab data from JobPost table
2. Applies filtering criteria
3. Includes institution information
4. Returns paginated results

### 4.3 POST /api/applications

**Location:** `src/app/api/applications/route.ts`

**Method:** `POST`

**Authentication:** Required

**Request Body:**

```typescript
{
  postId: string, // Research lab ID
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

**Purpose:** Get update requests for research lab application

---

## 5. DATA FLOW & SEQUENCE

### 5.1 Research Lab Detail View Flow

1. **Component Initialization**
   - `ResearchLabDetail` component mounts
   - Extract research lab ID from URL params
   - Initialize `useResearchLabDetail` hook with ID

2. **Fetch Research Lab Data**
   - `useResearchLabDetail` hook calls API
   - `GET /api/explore/research-labs/research-lab-detail?researchLabId=${id}`
   - Update hook state with research lab data
   - Update breadcrumb with research lab title

3. **Check Authentication & Application Status**
   - If authenticated, call `checkExistingApplication()`
   - `GET /api/applications` to check existing applications
   - Update `hasApplied` and `applicationStatus` states

4. **Fetch Related Data**
   - Call `fetchRecommendedResearchLabs()` for similar opportunities
   - Update recommendations state

5. **Render Research Lab Details**
   - Display research lab information
   - Show institution details with status badge
   - Render action buttons (Apply, Institution, Contact, Wishlist)

### 5.2 Tab Navigation Flow

1. **User Clicks Tab**
   - Update `activeTab` state
   - Call `renderTabContent()` to switch view

2. **Tab Content Rendering**
   - Job description: Research lab description, position details
   - Offer information: Salary, benefits, working conditions
   - Job requirements: Required qualifications, skills
   - Other information: Contact details, additional information

3. **Dynamic Content Display**
   - Each tab displays specific research lab data
   - Conditional rendering based on available data
   - Loading states for async content

### 5.3 Application Submission Flow

1. **User Clicks Apply**
   - Check authentication status
   - Show authentication modal if not authenticated
   - Show document selector if no documents selected

2. **Document Selection**
   - User selects existing documents or uploads new ones
   - Documents stored in `selectedDocuments` state
   - Convert to `uploadedFiles` format
   - Validate document types and sizes

3. **Submit Application**
   - Call `handleApply()` method
   - Validate required documents exist
   - `POST /api/applications` with research lab ID and documents
   - Update application status
   - Show success notification

4. **Post-Application State**
   - Update `hasApplied` to true
   - Change button to show "Applied" status
   - Fetch update requests if any
   - Disable further applications

### 5.4 Wishlist Toggle Flow

1. **User Clicks Wishlist Button**
   - Check authentication status
   - Show authentication modal if not authenticated
   - Call wishlist toggle function

2. **Toggle Wishlist Status**
   - Call `toggleWishlistItem()` from wishlist service
   - `POST/DELETE /api/wishlist` with research lab ID
   - Update wishlist state in hook
   - Update heart icon visual state
   - Show success notification

### 5.5 File Management Flow

1. **File Upload**
   - User selects files through file input
   - Validate file types (PDF, DOC, DOCX, etc.)
   - Validate file sizes (max limits)
   - Upload files to S3 via `useFileUpload` hook

2. **File Management**
   - Display uploaded files in list
   - Allow file removal individually
   - Allow bulk file removal
   - Show file metadata (name, size, type)

3. **Document Type Assignment**
   - Auto-detect document type from filename
   - Allow manual document type selection
   - Validate required document types

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
   - Update UI to reflect changes

### 5.7 Recommendation Flow

1. **Fetch Recommendations**
   - Extract research lab characteristics (discipline, degree level, country)
   - Use **MATCH ALL Logic** - require all 3 criteria
   - Call `getResearchLabs()` with matching criteria
   - Filter out current research lab from results

2. **Display Recommendations**
   - Show recommended research labs in cards
   - Allow wishlist toggle on recommendations
   - Enable navigation to recommendation details
   - Handle empty state if no recommendations

---

## 6. DATABASE MODELS

### 6.1 JobPost Model (Research Lab)

```prisma
model JobPost {
  job_id              String   @id @default(cuid())
  title               String
  description         String?
  salary              String?
  duration            String?
  application_deadline DateTime?
  job_type            String?
  requirements        String?
  offer_information   String?
  degree_level        String?
  field               String?
  country             String?
  institution_id      String

  institution         Institution @relation(fields: [institution_id], references: [institution_id])
  opportunity_post    OpportunityPost?
  subdisciplines      JobSubdiscipline[]
  documents           JobDocumentRequirement[]
  applications        Application[]

  @@map("JobPost")
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

## 7. DOCUMENT MANAGEMENT

### 7.1 Document Types

**Supported Document Categories:**

- **CV/Resume** - Professional background
- **Academic Transcript** - Educational records
- **Certificate** - Qualifications and certifications
- **Research Proposal** - Research project proposals
- **Portfolio** - Work samples and projects
- **Recommendation Letter** - Reference letters
- **Personal Statement** - Motivation and goals
- **Application Document** - General documents

### 7.2 Document Validation

**File Type Validation:**

- PDF, DOC, DOCX formats supported
- Image formats for certificates
- Maximum file size limits
- Virus scanning integration

**Document Requirements:**

- Institution-specific requirements
- Position-specific requirements
- Optional vs required documents
- Document expiration dates

### 7.3 Document Storage

**S3 Integration:**

- Secure file upload to AWS S3
- Unique file naming conventions
- Access control and permissions
- CDN integration for fast access

---

## 8. ERROR HANDLING

### 8.1 Research Lab Not Found

- Display 404 error page with helpful message
- Provide navigation back to explore page
- Log error for monitoring and analytics
- Suggest alternative research opportunities

### 8.2 Authentication Errors

- Show authentication modal for required actions
- Redirect to sign-in page after authentication
- Preserve current page context and state
- Handle session expiration gracefully

### 8.3 Application Errors

- Show detailed error notifications
- Provide retry options for transient errors
- Validate documents before submission
- Handle duplicate application attempts
- Network timeout handling

### 8.4 File Upload Errors

- Validate file types and sizes before upload
- Show progress indicators for large files
- Handle upload failures with retry
- Clear error states on successful retry

---

## 9. PERFORMANCE CONSIDERATIONS

### 9.1 Data Fetching Optimization

- Use custom hooks for data management
- Implement proper loading states
- Cache research lab details locally
- Debounce search and filter inputs
- Pagination for recommendation lists

### 9.2 Component Optimization

- React.memo for expensive component renders
- useMemo for computed values
- useCallback for stable function references
- Conditional rendering for large content
- Code splitting for tab components

### 9.3 File Handling Optimization

- Compress images before upload
- Progressive file upload with chunking
- Client-side file validation
- Lazy loading for file previews
- Efficient file metadata storage

### 9.4 Image and Asset Optimization

- Next.js Image component for optimized loading
- Responsive image sizing
- WebP format for modern browsers
- Lazy loading for non-critical images
- Proper alt text and accessibility

---

## 10. ACCESSIBILITY CONSIDERATIONS

### 10.1 Keyboard Navigation

- Tab order for all interactive elements
- Focus management in modals
- Keyboard shortcuts for common actions
- Skip links for main content areas

### 10.2 Screen Reader Support

- Proper ARIA labels and roles
- Descriptive heading structure
- Alternative text for images
- Form field labeling and validation messages

### 10.3 Visual Accessibility

- High contrast ratios for text
- Color-blind friendly color schemes
- Scalable text and UI elements
- Focus indicators for interactive elements
