# Edit Profile Feature - Components & Requirements for Sequence & Class Diagrams

## Overview

The Edit Profile feature allows authenticated users (applicants/students) to
modify their profile information through an inline editing interface with
validation, unsaved changes detection, and file upload capabilities.

---

## 1. FRONTEND COMPONENTS

### 1.1 Section Components (Editable Sections)

#### 1.1.1 ProfileInfoSection

**Location:** `src/components/profile/applicant/sections/ProfileInfoSection.tsx`

**Purpose:** Handles editing of basic profile information

**Key Features:**

- Inline editing mode toggle
- Profile photo upload
- Basic information fields (name, gender, birthday, nationality, phone,
  interests, favorite countries)
- Unsaved changes detection
- Warning modal for unsaved changes
- Form validation

**State Management:**

- `isEditing` - Boolean flag for edit mode
- `editedProfile` - Local copy of profile being edited
- `isUploading` - File upload state
- `isSaving` - Save operation state
- `hasUnsavedChanges` - Tracks modifications
- `showSuccessModal` - Success notification state
- `showErrorModal` - Error notification state
- `errorMessage` - Error message text

**Key Methods:**

- `handleSave()` - Saves profile changes
- `handleCancel()` - Cancels editing with unsaved changes check
- `handleFieldChange(field, value)` - Updates field with validation
- `handleFileSelect(event)` - Handles profile photo upload
- `handleUploadClick()` - Triggers file input

**Editable Fields:**

- First Name (letters and spaces only)
- Last Name (letters and spaces only)
- Gender (male/female)
- Birthday (date picker)
- Nationality (country selector)
- Phone Number (with country code)
- Interests (multi-select subdisciplines)
- Favorite Countries (multi-select countries)
- Profile Photo (image upload to S3)

#### 1.1.2 AcademicSection

**Location:** `src/components/profile/applicant/sections/AcademicSection.tsx`

**Purpose:** Handles editing of academic information

**Key Features:**

- Academic credentials editing
- Research papers management
- Document uploads (CV, certificates, transcripts, degrees)
- Language proficiency management
- Research paper validation

**State Management:**

- Similar to ProfileInfoSection
- Additional validation for research papers

**Key Methods:**

- `handleSave()` - Validates and saves academic data
- `handleCancel()` - Cancels with unsaved changes check
- Research paper validation before save

**Editable Fields:**

- Graduation Status
- Degree Level
- Field of Study (subdiscipline)
- University
- Graduation Year
- GPA/Score
- Country of Study
- Score Type/Value
- Foreign Language Status
- Languages (array with certificates and scores)
- Research Papers (title, discipline, files)
- CV Files
- Language Certificate Files
- Degree Files
- Transcript Files

**Validation Rules:**

- Research papers must have both title and discipline if files are uploaded

#### 1.1.3 Other Sections (Read-only or Limited Edit)

- **WishlistSection** - View only
- **ApplicationSection** - View only
- **SettingsSection** - May have limited editing
- **PaymentSection** - View only

### 1.2 UI Components for Editing

#### 1.2.1 Form Input Components

- **`Input`** - Text input fields
- **`CustomSelect`** - Dropdown select (single/multi)
- **`DateInput`** - Date picker
- **`PhoneInput`** - Phone number with country code
- **`Label`** - Form labels

#### 1.2.2 Action Components

- **`Button`** - Edit, Save, Cancel buttons
- **`Upload`** (icon) - File upload trigger
- **`Edit3`** (icon) - Edit mode indicator
- **`Save`** (icon) - Save action
- **`X`** (icon) - Cancel action

#### 1.2.3 Modal Components

- **`SuccessModal`** - Success notification
- **`ErrorModal`** - Error notification
- **`WarningModal`** - Unsaved changes warning

#### 1.2.4 File Upload Components

- **`Avatar`** - Profile photo display
- **`AvatarImage`** - Profile photo image
- **`AvatarFallback`** - Default avatar
- Hidden file input element

### 1.3 Warning System Component

#### 1.3.1 useSimpleWarning Hook

**Location:** `src/hooks/ui/useSimpleWarning.ts`

**Purpose:** Manages unsaved changes warnings

**Features:**

- Detects navigation attempts with unsaved changes
- Shows warning modal
- Options: Save and Continue, Discard Changes, Cancel

**Returns:**

- `showWarningModal` - Modal visibility state
- `handleNavigationAttempt` - Navigation handler
- `handleSaveAndContinue` - Save then navigate
- `handleDiscardChanges` - Discard and navigate
- `handleCancelNavigation` - Cancel navigation
- `showWarning` - Show warning manually
- `isSaving` - Save operation state

---

## 2. HOOKS

### 2.1 useSimpleWarning

**Location:** `src/hooks/ui/useSimpleWarning.ts`

**Purpose:** Manages unsaved changes warning system

**Parameters:**

- `hasUnsavedChanges` - Boolean flag
- `onSave` - Save callback function
- `onCancel` - Cancel callback function

**Functionality:**

- Intercepts navigation attempts
- Shows warning modal when unsaved changes exist
- Provides save/discard/cancel options

### 2.2 useAuthCheck

**Location:** `src/hooks/auth/useAuthCheck.ts`

**Purpose:** Validates authentication before editing

**Returns:**

- `isAuthenticated` - Auth status
- `user` - User object
- `isLoading` - Loading state

---

## 3. SERVICES

### 3.1 API Service

**Location:** `src/services/api/axios-config.ts`

#### 3.1.1 Profile Update Method

```typescript
static async updateProfile(profileData: any)
```

- Makes PUT request to `/api/profile`
- Handles response and errors
- Returns updated profile data

#### 3.1.2 File Upload Method

```typescript
static async uploadFile(file: File, category: string = "uploads")
```

- Uploads file to S3 via `/api/files/s3-upload`
- Returns file URL
- Handles FormData creation
- Invalidates file-related cache

### 3.2 Profile Services

#### 3.2.1 ApplicantProfileService

**Location:** `src/services/profile/applicant-profile-service.ts`

**Key Method:**

```typescript
static async upsertProfile(
  userId: string,
  formData: ApplicantProfileFormData
): Promise<ApplicantProfile | null>
```

**Process:**

1. Finds or creates subdiscipline for field of study
2. Upserts applicant record
3. Updates user image if provided
4. Handles interests (subdisciplines)
5. Handles documents (CV, certificates, transcripts, degrees, research papers)
6. Returns updated profile

**Document Handling:**

- Soft deletes existing documents
- Creates new document entries
- Associates documents with document types
- Handles research papers with titles and disciplines

**Helper Methods:**

- `getOrCreateDocumentType(name)` - Gets or creates document type
- `handleDocuments(applicantId, formData)` - Processes all documents

#### 3.2.2 InstitutionProfileService

**Location:** `src/services/profile/institution-profile-service.ts`

**Similar structure to ApplicantProfileService but for institutions**

---

## 4. API ROUTES

### 4.1 PUT /api/profile

**Location:** `src/app/api/profile/route.ts`

**Method:** `PUT`

**Authentication:** Required via `requireAuth()`

**Request Body:**

```typescript
{
  role: "applicant" | "institution",
  // Profile fields based on role
  firstName?: string,
  lastName?: string,
  // ... other fields
}
```

**Process:**

1. Validates authentication
2. Extracts userId from session
3. Validates role in request
4. Maps verificationDocuments for institutions
5. Routes to appropriate service (ApplicantProfileService or
   InstitutionProfileService)
6. Returns success response with updated profile

**Response:**

```typescript
{
  success: true,
  message: "Profile updated successfully",
  profile: UpdatedProfile
}
```

**Error Responses:**

- `400` - Invalid role
- `401` - Unauthorized
- `500` - Server error

### 4.2 POST /api/files/s3-upload

**Location:** `src/app/api/files/s3-upload/route.ts`

**Method:** `POST`

**Content-Type:** `multipart/form-data`

**Request:**

- `file` - File to upload
- `category` - File category

**Response:**

```typescript
{
  url: string,  // S3 file URL
  name: string,
  size: number
}
```

---

## 5. VALIDATION & ERROR HANDLING

### 5.1 Client-Side Validation

#### 5.1.1 Field Validation

- **Name Fields:** Only letters and spaces allowed

  ```typescript
  value.replace(/[^a-zA-Z\s]/g, '');
  ```

- **File Upload Validation:**
  - File type: Must be image (starts with 'image/')
  - File size: Maximum 5MB
  - Error messages displayed via ErrorModal

- **Research Paper Validation:**
  - If files are uploaded, title and discipline are required
  - Validated before save operation

#### 5.1.2 Unsaved Changes Detection

```typescript
const hasChanges = JSON.stringify(editedProfile) !== JSON.stringify(profile);
```

- Compares edited profile with original
- Updates `hasUnsavedChanges` state
- Triggers warning on navigation attempt

### 5.2 Server-Side Validation

#### 5.2.1 Role Validation

- Must be "applicant" or "institution"
- Returns 400 if invalid

#### 5.2.2 Required Fields (Institution)

- Institution name
- Hotline
- Type
- Country
- Address
- Representative name
- Representative position
- Representative email
- Representative phone
- About

### 5.3 Error Handling

#### 5.3.1 Client-Side Error Handling

- Try-catch blocks around API calls
- Error messages displayed in ErrorModal
- Fallback error messages
- Loading states during operations

#### 5.3.2 Server-Side Error Handling

- Try-catch in API routes
- Returns appropriate HTTP status codes
- Error messages in response body
- Logs errors for debugging

---

## 6. STATE MANAGEMENT

### 6.1 Component State

#### 6.1.1 Edit Mode State

- `isEditing` - Boolean flag
- Toggled by Edit/Save/Cancel buttons
- Controls UI rendering (read-only vs editable)

#### 6.1.2 Profile State

- `profile` - Original profile data (props)
- `editedProfile` - Local copy being edited
- Updated on save or cancel

#### 6.1.3 Operation States

- `isSaving` - Save operation in progress
- `isUploading` - File upload in progress
- Disables buttons during operations

#### 6.1.4 Modal States

- `showSuccessModal` - Success notification
- `showErrorModal` - Error notification
- `showWarningModal` - Unsaved changes warning
- `errorMessage` - Error message text

#### 6.1.5 Change Tracking

- `hasUnsavedChanges` - Tracks modifications
- Updated via useEffect comparing profiles
- Used for warning system

### 6.2 Event System

#### 6.2.1 Custom Events

- `profileUpdated` - Dispatched after successful save
  ```typescript
  window.dispatchEvent(new CustomEvent('profileUpdated'));
  ```
- Used to update header/navigation components
- Listened to by other components

---

## 7. DATA FLOW & SEQUENCE

### 7.1 Edit Profile Flow (ProfileInfoSection)

1. **User clicks "Edit" button**
   - `setIsEditing(true)` called
   - UI switches to edit mode
   - Form fields become editable

2. **User modifies fields**
   - `handleFieldChange(field, value)` called
   - Validation applied (e.g., name fields)
   - `editedProfile` state updated
   - `hasUnsavedChanges` detected via useEffect

3. **User uploads profile photo (optional)**
   - `handleUploadClick()` triggers file input
   - `handleFileSelect(event)` called
   - File validation (type, size)
   - `ApiService.uploadFile(file)` called
   - File uploaded to S3
   - S3 URL received
   - `handleFieldChange('profilePhoto', url)` called
   - Photo preview updated

4. **User clicks "Save"**
   - `handleSave()` called
   - `setIsSaving(true)`
   - Basic profile data extracted
   - `PUT /api/profile` called with merged data
   - API validates authentication
   - `ApplicantProfileService.upsertProfile()` called
   - Database updated
   - Response received
   - Local state updated
   - `profileUpdated` event dispatched
   - Success modal shown
   - `setIsEditing(false)`
   - `setHasUnsavedChanges(false)`

5. **User clicks "Cancel"**
   - `handleCancel()` called
   - If `hasUnsavedChanges`:
     - `showWarning()` called
     - Warning modal displayed
   - If no changes:
     - `setEditedProfile(profile)` - Reset to original
     - `setIsEditing(false)`
     - `setHasUnsavedChanges(false)`

### 7.2 Edit Profile Flow (AcademicSection)

1. **User clicks "Edit" button**
   - Similar to ProfileInfoSection

2. **User modifies academic fields**
   - Fields updated in `editedProfile`
   - Research papers can be added/modified

3. **User clicks "Save"**
   - Research paper validation performed
   - If validation fails: Error modal shown
   - If validation passes:
     - Academic data extracted
     - `PUT /api/profile` called
     - Database updated
     - Success modal shown
     - Edit mode exited

### 7.3 Unsaved Changes Warning Flow

1. **User makes changes**
   - `hasUnsavedChanges` becomes `true`

2. **User attempts navigation (tab switch, page navigation)**
   - `handleNavigationAttempt()` called
   - Warning modal displayed

3. **User chooses option:**
   - **Save and Continue:**
     - `handleSaveAndContinue()` called
     - `handleSave()` executed
     - Navigation proceeds after save
   - **Discard Changes:**
     - `handleDiscardChanges()` called
     - `onCancel()` executed
     - Navigation proceeds
   - **Cancel:**
     - `handleCancelNavigation()` called
     - Modal closed
     - Stays on current page

### 7.4 File Upload Flow

1. **User clicks upload button**
   - Hidden file input triggered
   - File picker opens

2. **User selects file**
   - `handleFileSelect(event)` called
   - File validation:
     - Type check (must be image)
     - Size check (max 5MB)
   - If invalid: Error modal shown

3. **File upload to S3**
   - `setIsUploading(true)`
   - FormData created
   - `ApiService.uploadFile(file)` called
   - `POST /api/files/s3-upload` called
   - File uploaded to S3
   - S3 URL returned

4. **Update profile**
   - `handleFieldChange('profilePhoto', url)` called
   - Avatar preview updated
   - Success modal shown (optional)
   - `setIsUploading(false)`

---

## 8. DATABASE OPERATIONS

### 8.1 Profile Update Operations

#### 8.1.1 Applicant Profile Update

```typescript
prismaClient.applicant.upsert({
	where: { user_id: userId },
	update: {
		/* updated fields */
	},
	create: {
		/* new profile */
	},
});
```

**Fields Updated:**

- Basic info (name, birthday, gender, etc.)
- Academic info (degree, GPA, university, etc.)
- Contact info (phone, nationality, etc.)
- Preferences (favorite countries, interests)

#### 8.1.2 Document Operations

- **Soft Delete Existing:**

  ```typescript
  prismaClient.applicantDocument.updateMany({
  	where: { applicant_id, status: true },
  	data: { status: false, deleted_at: new Date() },
  });
  ```

- **Create New Documents:**
  ```typescript
  prismaClient.applicantDocument.create({
  	data: {
  		document_id,
  		applicant_id,
  		document_type_id,
  		name,
  		url,
  		size,
  		upload_at: new Date(),
  		status: true,
  	},
  });
  ```

#### 8.1.3 Interest Operations

- **Delete Existing:**

  ```typescript
  prismaClient.applicantInterest.deleteMany({
  	where: { applicant_id },
  });
  ```

- **Create New:**
  ```typescript
  prismaClient.applicantInterest.create({
  	data: {
  		applicant_id,
  		subdiscipline_id,
  		add_at: new Date(),
  	},
  });
  ```

#### 8.1.4 User Image Update

```typescript
prismaClient.user.update({
	where: { id: userId },
	data: { image: profilePhoto },
});
```

---

## 9. INTERFACES & TYPES

### 9.1 Profile Data Interfaces

#### 9.1.1 ProfileInfoSection Props

```typescript
interface ProfileInfoSectionProps {
	profile: ProfileData;
	subdisciplines: Array<{
		value: string;
		label: string;
		discipline: string;
	}>;
}
```

#### 9.1.2 AcademicSection Props

```typescript
interface AcademicSectionProps {
	profile: ProfileData;
	subdisciplines: Array<{
		value: string;
		label: string;
		discipline: string;
	}>;
	onProfileUpdate?: () => void;
}
```

#### 9.1.3 Form Data Interface

```typescript
interface ApplicantProfileFormData {
	// Basic info
	firstName: string;
	lastName: string;
	gender: string;
	birthday: string;
	email: string;
	nationality: string;
	phoneNumber: string;
	countryCode: string;
	profilePhoto: string;
	interests: string[];
	favoriteCountries: string[];

	// Academic fields
	graduationStatus: 'not-yet' | 'graduated' | '';
	degree: string;
	fieldOfStudy: string;
	university: string;
	graduationYear: string;
	gpa: string;
	countryOfStudy: string;
	scoreType: string;
	scoreValue: string;
	hasForeignLanguage: 'yes' | 'no' | '';
	languages: Array<{
		language: string;
		certificate: string;
		score: string;
	}>;
	researchPapers: Array<{
		title: string;
		discipline: string;
		files: any[];
	}>;

	// Documents
	cvFiles: any[];
	languageCertFiles: any[];
	degreeFiles: any[];
	transcriptFiles: any[];
}
```

---

## 10. CACHING & PERFORMANCE

### 10.1 Cache Invalidation

- Profile cache cleared after update
- File cache invalidated on upload
- User cache cleared on profile change

### 10.2 Optimistic Updates

- Local state updated immediately
- UI reflects changes before server confirmation
- Rollback on error

---

## 11. SECURITY CONSIDERATIONS

### 11.1 Authentication

- All edit operations require authentication
- `requireAuth()` validates session
- User ID extracted from session (not from request)

### 11.2 Authorization

- Users can only edit their own profile
- Profile ownership validated
- Role-based access control

### 11.3 Input Validation

- Client-side validation for UX
- Server-side validation for security
- SQL injection prevention via Prisma
- XSS prevention via React escaping

### 11.4 File Upload Security

- File type validation
- File size limits
- S3 upload with signed URLs
- File access control

---

## 12. ERROR SCENARIOS & HANDLING

### 12.1 Network Errors

- Connection timeout
- Server unavailable
- Error modal displayed
- Retry option provided

### 12.2 Validation Errors

- Field validation failures
- Required field missing
- Invalid data format
- Error messages displayed inline or in modal

### 12.3 Authentication Errors

- Session expired
- Unauthorized access
- Redirect to sign-in

### 12.4 File Upload Errors

- File too large
- Invalid file type
- Upload failure
- Error modal with specific message

### 12.5 Database Errors

- Constraint violations
- Connection errors
- Transaction failures
- Generic error message to user
- Detailed error logged server-side

---

## 13. USER EXPERIENCE FEATURES

### 13.1 Visual Feedback

- Loading spinners during operations
- Disabled buttons during save
- Success/error modals
- Inline field validation
- Unsaved changes indicator

### 13.2 Keyboard Support

- Enter key to save (if implemented)
- Escape key to cancel (if implemented)
- Tab navigation between fields

### 13.3 Accessibility

- Form labels
- ARIA attributes
- Keyboard navigation
- Screen reader support

---

## 14. SEQUENCE DIAGRAM ACTORS

1. **User** - Initiates edit actions
2. **ProfileInfoSection Component** - Main edit component
3. **useSimpleWarning Hook** - Warning system
4. **ApiService** - API client
5. **API Route Handler** - Server endpoint
6. **requireAuth Utility** - Authentication
7. **ApplicantProfileService** - Business logic
8. **Prisma Client** - Database access
9. **Database** - PostgreSQL
10. **S3 Service** - File storage
11. **WarningModal Component** - Unsaved changes warning
12. **SuccessModal/ErrorModal** - Notifications

---

## 15. CLASS DIAGRAM ENTITIES

### 15.1 Frontend Classes

- `ProfileInfoSection` (React Component)
- `AcademicSection` (React Component)
- `useSimpleWarning` (Custom Hook)
- `WarningModal` (React Component)
- `SuccessModal` (React Component)
- `ErrorModal` (React Component)

### 15.2 Service Classes

- `ApiService` (Static class)
  - `updateProfile()`
  - `uploadFile()`
- `ApplicantProfileService` (Static class)
  - `upsertProfile()`
  - `handleDocuments()`
  - `getOrCreateDocumentType()`

### 15.3 Utility Classes

- `requireAuth` (Function)
- File upload utilities

### 15.4 Database Models

- `Applicant` (Prisma Model)
- `ApplicantDocument` (Prisma Model)
- `ApplicantInterest` (Prisma Model)
- `User` (Prisma Model)
- `DocumentType` (Prisma Model)
- `Subdiscipline` (Prisma Model)

---

## 16. KEY METHODS FOR DIAGRAMS

### 16.1 ProfileInfoSection Methods

- `handleSave()` - Save profile changes
- `handleCancel()` - Cancel editing
- `handleFieldChange(field, value)` - Update field
- `handleFileSelect(event)` - Handle file upload
- `handleUploadClick()` - Trigger file input

### 16.2 AcademicSection Methods

- `handleSave()` - Save academic data with validation
- `handleCancel()` - Cancel with warning
- Research paper validation methods

### 16.3 useSimpleWarning Methods

- `handleNavigationAttempt()` - Intercept navigation
- `handleSaveAndContinue()` - Save then navigate
- `handleDiscardChanges()` - Discard and navigate
- `handleCancelNavigation()` - Cancel navigation
- `showWarning()` - Show warning manually

### 16.4 ApiService Methods

- `updateProfile(profileData)` - PUT request
- `uploadFile(file, category)` - POST file upload

### 16.5 ApplicantProfileService Methods

- `upsertProfile(userId, formData)` - Create/update profile
- `handleDocuments(applicantId, formData)` - Process documents
- `getOrCreateDocumentType(name)` - Document type management

### 16.6 API Route Methods

- `PUT()` - Handle update request
- Authentication validation
- Role validation
- Service routing

---

## 17. FILE STRUCTURE REFERENCE

```
src/
├── components/
│   ├── profile/
│   │   └── applicant/sections/
│   │       ├── ProfileInfoSection.tsx
│   │       └── AcademicSection.tsx
│   └── ui/
│       ├── SuccessModal.tsx
│       ├── ErrorModal.tsx
│       └── WarningModal.tsx
├── hooks/
│   └── ui/
│       └── useSimpleWarning.ts
├── services/
│   ├── api/
│   │   └── axios-config.ts
│   └── profile/
│       └── applicant-profile-service.ts
├── app/
│   └── api/
│       ├── profile/
│       │   └── route.ts (PUT handler)
│       └── files/
│           └── s3-upload/route.ts
└── utils/
    └── auth/
        └── auth-utils.ts
```

---

## 18. DIAGRAM REQUIREMENTS SUMMARY

### For Sequence Diagram:

- Show complete edit flow from user action to database
- Include authentication checks
- Show file upload flow to S3
- Include validation steps
- Show error handling paths
- Include unsaved changes warning flow
- Show state updates
- Include event dispatching

### For Class Diagram:

- Show component hierarchy
- Show service layer structure
- Show hook dependencies
- Include modal components
- Show database model relationships
- Include interfaces and types
- Show method signatures
- Include dependencies between classes
- Show validation classes
- Include error handling classes

---

## 19. ADDITIONAL FEATURES

### 19.1 Real-time Validation

- Field-level validation on change
- Immediate feedback
- Error messages displayed inline

### 19.2 Auto-save (Future Enhancement)

- Periodic auto-save
- Draft saving
- Recovery of unsaved changes

### 19.3 Change History (Future Enhancement)

- Track profile changes
- View change history
- Revert to previous versions

### 19.4 Bulk Edit (Future Enhancement)

- Edit multiple fields at once
- Batch validation
- Batch save operation

---

## 20. TESTING CONSIDERATIONS

### 20.1 Unit Tests

- Component rendering
- State management
- Validation logic
- Event handlers

### 20.2 Integration Tests

- API calls
- Database operations
- File uploads
- Error handling

### 20.3 E2E Tests

- Complete edit flow
- Unsaved changes warning
- File upload
- Error scenarios

---

## END OF DOCUMENT
