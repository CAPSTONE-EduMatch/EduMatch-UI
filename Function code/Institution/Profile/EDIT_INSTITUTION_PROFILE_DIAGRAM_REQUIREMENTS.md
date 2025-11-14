# Edit Institution Profile - Components & Requirements for Sequence & Class Diagrams

## Overview

The Edit Institution Profile feature allows authenticated institutions to update
their profile information, including institution details, representative
information, overview, disciplines, cover image, and verification documents. The
system validates input, handles file uploads, and updates the database.

---

## 1. KEY COMPONENTS

### 1.1 InstitutionProfileSection Component

**Location:**
`src/components/profile/institution/sections/InstitutionProfileSection.tsx`

**Purpose:** Main component for editing institution profile

**Key Features:**

- Edit mode toggle
- Form validation
- File uploads (profile photo, cover image, documents)
- Phone number validation
- Real-time field updates
- Save/Cancel functionality

**State Management:**

- `isEditing` - Edit mode state
- `editedProfile` - Edited profile data
- `isSaving` - Saving state
- `verificationDocuments` - Documents array
- `isUploadingDocument` - Document upload state
- `isUploadingCoverImage` - Cover image upload state

**Key Methods:**

- `handleSave()` - Saves profile changes
- `handleCancel()` - Cancels editing
- `handleFieldChange()` - Updates field values
- `handleFileSelect()` - Profile photo upload
- `handleVerificationDocumentUpload()` - Document upload
- `handleCoverImageUpload()` - Cover image upload
- `handlePreviewDocument()` - Preview document
- `handleDownloadDocument()` - Download document

### 1.2 InstitutionProfileService

**Location:** `src/services/profile/institution-profile-service.ts`

**Purpose:** Business logic for institution profile operations

**Key Methods:**

- `upsertProfile()` - Create or update profile
- `handleDocuments()` - Handle document uploads
- `getOrCreateDocumentType()` - Document type management

---

## 2. API ROUTES

### 2.1 PUT /api/profile

**Location:** `src/app/api/profile/route.ts`

**Purpose:** Update user profile

**Authentication:** Required via `requireAuth()`

**Request Body:**

```typescript
{
  role: "institution",
  institutionName: string
  institutionAbbreviation?: string
  institutionType: string
  institutionWebsite?: string
  institutionHotline: string
  institutionHotlineCode?: string
  institutionAddress: string
  institutionCountry: string
  representativeName: string
  representativePosition: string
  representativeEmail: string
  representativePhone: string
  representativePhoneCode?: string
  aboutInstitution: string
  institutionDisciplines?: string[]
  institutionCoverImage?: string
  profilePhoto?: string
  verificationDocuments?: Array<{
    id: string
    name: string
    url: string
    size: number
  }>
}
```

**Process:**

1. Validates authentication
2. Validates role (must be "institution")
3. Maps `verificationDocuments` to `institutionVerificationDocuments`
4. Calls `InstitutionProfileService.upsertProfile()`
5. Returns updated profile

**Response:**

```typescript
{
  success: true,
  message: "Profile updated successfully",
  profile: InstitutionProfile
}
```

### 2.2 POST /api/institution/documents

**Location:** `src/app/api/institution/documents/route.ts`

**Purpose:** Upload verification documents

**Request Body:**

```typescript
{
	documents: Array<{
		id: string;
		name: string;
		url: string;
		size: number;
		fileType?: string;
	}>;
}
```

**Process:**

- Creates InstitutionDocument records
- Links to institution
- Returns success

### 2.3 POST /api/files/s3-upload

**Location:** `src/app/api/files/s3-upload/route.ts`

**Purpose:** Upload files to S3

**Request:** FormData with file

**Response:**

```typescript
{
	url: string;
	fileName: string;
	fileSize: number;
	id: string;
}
```

---

## 3. DATA FLOW

### 3.1 Edit Profile Flow

1. **User Clicks Edit Button**
   - `setIsEditing(true)` called
   - `editedProfile` initialized with current profile
   - Form fields become editable

2. **User Makes Changes**
   - Fields updated via `handleFieldChange()`
   - `editedProfile` state updated
   - Real-time validation (name fields: letters only)

3. **User Uploads Profile Photo (Optional)**
   - Clicks upload button
   - File selected
   - Validated (image type, 5MB max)
   - Uploaded to S3 via `ApiService.uploadFile()`
   - URL stored in `editedProfile.profilePhoto`

4. **User Uploads Cover Image (Optional)**
   - Clicks upload or drag-drop
   - File validated (image type, 5MB max)
   - Uploaded to S3
   - Saved immediately to profile
   - URL stored in `editedProfile.institutionCoverImage`

5. **User Uploads Verification Documents (Optional)**
   - Multiple files selected
   - Validated (PDF, DOC, DOCX, JPG, PNG, 10MB max)
   - All files uploaded to S3 in parallel
   - Documents saved via `/api/institution/documents`
   - Added to `verificationDocuments` state

6. **User Clicks Save**
   - `handleSave()` called
   - Phone number validation (institution hotline, representative phone)
   - Profile data prepared
   - `ApiService.updateProfile()` called
   - `PUT /api/profile` request sent

7. **API Processing**
   - Authentication validated
   - Role validated
   - `InstitutionProfileService.upsertProfile()` called
   - Required fields validated
   - Institution record upserted
   - User image updated (if profile photo provided)
   - Disciplines updated (if provided)
   - Documents handled
   - Profile refreshed

8. **Response Handling**
   - Success: Profile refreshed, edit mode exited, success modal shown
   - Error: Error modal shown, changes preserved

### 3.2 File Upload Flow

1. **File Selection**
   - User selects file(s)
   - File input triggered

2. **Validation**
   - File type checked
   - File size checked
   - Error shown if invalid

3. **S3 Upload**
   - `ApiService.uploadFile(file, category)` called
   - `POST /api/files/s3-upload` request sent
   - File uploaded to S3
   - Public URL returned

4. **URL Storage**
   - URL stored in component state
   - Ready for profile save

### 3.3 Document Upload Flow

1. **Multiple Files Selected**
   - Files array extracted
   - All files validated

2. **Parallel Upload**
   - All files uploaded to S3 simultaneously
   - `Promise.all()` used

3. **Document Creation**
   - Documents saved via `/api/institution/documents`
   - InstitutionDocument records created
   - Linked to institution

4. **State Update**
   - Documents added to `verificationDocuments`
   - UI updated

---

## 4. DATABASE OPERATIONS

### 4.1 Upsert Institution

```typescript
const institution = await prismaClient.institution.upsert({
	where: { user_id: userId },
	update: {
		name: requiredFields.name,
		abbreviation: getStringValue(formData.institutionAbbreviation) || null,
		hotline: requiredFields.hotline,
		hotline_code: getStringValue(formData.institutionHotlineCode) || null,
		type: requiredFields.type,
		website: getStringValue(formData.institutionWebsite) || null,
		email: getStringValue(formData.institutionEmail) || null,
		country: requiredFields.country,
		address: requiredFields.address,
		rep_name: requiredFields.rep_name,
		rep_position: requiredFields.rep_position,
		rep_email: requiredFields.rep_email,
		rep_phone: requiredFields.rep_phone,
		rep_phone_code: getStringValue(formData.representativePhoneCode) || null,
		about: requiredFields.about,
		logo: getStringValue(formData.institutionLogo) || null,
		cover_image: getStringValue(formData.institutionCoverImage) || null,
	},
	create: {
		institution_id: `institution_${userId}`,
		user_id: userId,
		// ... same fields as update
	},
});
```

### 4.2 Update User Image

```typescript
if (profilePhoto) {
	await prismaClient.user.update({
		where: { id: userId },
		data: { image: profilePhoto },
	});
}
```

### 4.3 Update Disciplines

```typescript
// Clear existing
await prismaClient.institutionSubdiscipline.deleteMany({
	where: { institution_id: institution.institution_id },
});

// Add new
for (const disciplineName of formData.institutionDisciplines) {
	const subdiscipline = await prismaClient.subdiscipline.findFirst({
		where: { name: disciplineName },
	});

	if (subdiscipline) {
		await prismaClient.institutionSubdiscipline.create({
			data: {
				institution_id: institution.institution_id,
				subdiscipline_id: subdiscipline.subdiscipline_id,
				add_at: new Date(),
				status: true,
			},
		});
	}
}
```

### 4.4 Create Documents

```typescript
for (const file of formData.institutionVerificationDocuments) {
	await prismaClient.institutionDocument.create({
		data: {
			document_id: file.id || generateId(),
			institution_id: institutionId,
			document_type_id: verificationDocType.document_type_id,
			name: file.name || file.originalName,
			url: file.url,
			size: file.size || file.fileSize,
			upload_at: new Date(),
			status: true,
		},
	});
}
```

---

## 5. VALIDATION

### 5.1 Required Fields

- `institutionName` (name)
- `institutionHotline` (hotline)
- `institutionType` (type)
- `institutionCountry` (country)
- `institutionAddress` (address)
- `representativeName` (rep_name)
- `representativePosition` (rep_position)
- `representativeEmail` (rep_email)
- `representativePhone` (rep_phone)
- `aboutInstitution` (about)

### 5.2 Field Validation

- **Name Fields:** Letters and spaces only (no numbers)
- **Phone Numbers:** Validated using libphonenumber-js
- **File Types:**
  - Profile photo: Images only
  - Cover image: Images only
  - Documents: PDF, DOC, DOCX, JPG, PNG
- **File Sizes:**
  - Images: Max 5MB
  - Documents: Max 10MB per file

### 5.3 Phone Validation

```typescript
const isValidPhoneNumber = isValidPhoneNumber(fullNumber, countryCode);
```

---

## 6. INTERFACES

### 6.1 InstitutionProfileFormData

```typescript
interface InstitutionProfileFormData {
	role: 'institution';
	institutionName: string;
	institutionAbbreviation?: string;
	institutionType: string;
	institutionWebsite?: string;
	institutionHotline: string;
	institutionHotlineCode?: string;
	institutionAddress: string;
	institutionCountry: string;
	representativeName: string;
	representativePosition: string;
	representativeEmail: string;
	representativePhone: string;
	representativePhoneCode?: string;
	aboutInstitution: string;
	institutionDisciplines?: string[];
	institutionCoverImage?: string;
	profilePhoto?: string;
	verificationDocuments?: Array<{
		id: string;
		name: string;
		url: string;
		size: number;
	}>;
}
```

---

## 7. FEATURES

### 7.1 Edit Mode

- Toggle between view and edit
- Editable form fields
- Save/Cancel buttons
- Real-time validation

### 7.2 File Uploads

- Profile photo upload
- Cover image upload (drag-drop support)
- Multiple document upload
- Progress indicators
- File validation

### 7.3 Field Updates

- Text inputs
- Phone inputs with country codes
- Country select with flags
- Multi-select disciplines
- Textarea for description

### 7.4 Document Management

- Upload multiple documents
- View documents
- Download documents
- Document list display

---

## 8. ERROR HANDLING

### 8.1 Error Scenarios

- **Missing Required Fields:** Validation error
- **Invalid Phone Number:** Phone validation error
- **Invalid File Type:** File type error
- **File Too Large:** File size error
- **Upload Failed:** Upload error
- **Save Failed:** Save error

### 8.2 Error Display

- Error modals with messages
- Field-level validation
- File validation alerts
- Loading states during operations

---

## 9. SEQUENCE DIAGRAM ACTORS

1. **User** - Edits profile
2. **InstitutionProfileSection** - Component
3. **ApiService** - API client
4. **API Route Handler** - Server endpoint
5. **requireAuth** - Authentication
6. **InstitutionProfileService** - Business logic
7. **Prisma Client** - Database
8. **Database** - PostgreSQL
9. **S3 Service** - File storage

---

## 10. CLASS DIAGRAM ENTITIES

### 10.1 Frontend Classes

- `InstitutionProfileSection` (Component)
- `ApiService` (Service)

### 10.2 Backend Classes

- API Route Handlers (PUT, POST)
- `requireAuth` (Utility)
- `InstitutionProfileService` (Service)
- Prisma Models (Institution, InstitutionDocument, InstitutionSubdiscipline,
  User)

---

## 11. KEY METHODS

### 11.1 Component Methods

- `handleSave()` - Save profile
- `handleCancel()` - Cancel editing
- `handleFieldChange()` - Update field
- `handleFileSelect()` - Upload profile photo
- `handleVerificationDocumentUpload()` - Upload documents
- `handleCoverImageUpload()` - Upload cover image

### 11.2 Service Methods

- `upsertProfile()` - Create/update profile
- `handleDocuments()` - Handle document uploads
- `getOrCreateDocumentType()` - Document type management

### 11.3 API Methods

- `PUT()` - Update profile
- `POST()` - Upload documents

---

## 12. FILE STRUCTURE

```
src/
├── components/profile/institution/sections/
│   └── InstitutionProfileSection.tsx
├── services/profile/
│   └── institution-profile-service.ts
├── services/api/
│   └── axios-config.ts
├── app/api/profile/
│   └── route.ts (PUT handler)
└── app/api/institution/documents/
    └── route.ts (POST handler)
```

---

## 13. DIAGRAM REQUIREMENTS

### Sequence Diagram:

- Edit action → Component → Validation → API → Service → Database
- File upload flow to S3
- Document upload flow
- Profile save flow
- Include error handling paths

### Class Diagram:

- Component class with methods
- Service class with methods
- API route handlers
- Database models and relationships
- File upload service

---

## END OF DOCUMENT
