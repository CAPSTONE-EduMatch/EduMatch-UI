# View Institution Profile - Components & Requirements for Sequence & Class Diagrams

## Overview

The View Institution Profile feature allows authenticated institutions to view
their complete profile information, including institution details,
representative information, overview, disciplines, cover image, and verification
documents.

---

## 1. KEY COMPONENTS

### 1.1 Profile Page

**Location:** `src/app/(institution)/institution/dashboard/profile/page.tsx`

**Purpose:** Main page wrapper for institution profile

**Features:**

- Uses ProfileContext for profile data
- Wraps InstitutionProfileSection component
- Provides refresh functionality

**Key Code:**

```typescript
export default function ProfilePage() {
  const { profile, refreshProfile } = useProfileContext()
  return (
    <InstitutionProfileSection
      profile={profile}
      onProfileUpdate={refreshProfile}
    />
  )
}
```

### 1.2 InstitutionProfileSection Component

**Location:**
`src/components/profile/institution/sections/InstitutionProfileSection.tsx`

**Purpose:** Main component for displaying institution profile

**Key Features:**

- Two-panel layout (left: profile info, right: tabs)
- Tabbed interface (Overview, Cover Image, Verification Documents)
- View and edit modes
- File upload support
- Document management

**State Management:**

- `profile` - Current profile data
- `isEditing` - Edit mode flag
- `editedProfile` - Edited profile data
- `loading` - Loading state
- `activeTab` - Active tab ('overview' | 'verification' | 'cover')
- `verificationDocuments` - Verification documents array
- `subdisciplines` - Available subdisciplines
- `showSuccessModal` - Success modal visibility
- `showErrorModal` - Error modal visibility

**Key Methods:**

- `loadProfile()` - Fetches profile data
- `loadVerificationDocuments()` - Loads verification documents
- `loadDisciplines()` - Loads available subdisciplines
- `handleFieldChange()` - Handles field updates
- `handleFileSelect()` - Handles profile photo upload
- `handleVerificationDocumentUpload()` - Handles document upload
- `handleCoverImageUpload()` - Handles cover image upload

### 1.3 ProfileContext

**Location:** `src/app/(institution)/institution/dashboard/ProfileContext.tsx`

**Purpose:** Provides profile data to dashboard components

**Features:**

- Profile data management
- Refresh functionality
- Context provider

### 1.4 InstitutionProfileLayout

**Location:** `src/components/profile/layouts/InstitutionProfileLayout.tsx`

**Purpose:** Layout wrapper with navigation

**Features:**

- Sidebar navigation
- Profile sections navigation
- Active section highlighting

---

## 2. API ROUTES

### 2.1 GET /api/profile

**Location:** `src/app/api/profile/route.ts`

**Purpose:** Fetch user profile (supports both applicant and institution)

**Authentication:** Required via `requireAuth()`

**Process:**

1. Validates authentication
2. Fetches user with role information
3. Determines profile type (applicant/institution)
4. Calls appropriate service:
   - `ApplicantProfileService.getProfile()` for applicants
   - `InstitutionProfileService.getProfile()` for institutions
5. Transforms profile data to frontend format
6. Returns profile with role field

**Response:**

```typescript
{
  profile: {
    role: "institution",
    institution_id: string,
    institutionName: string,
    institutionAbbreviation: string,
    institutionType: string,
    institutionWebsite: string,
    institutionHotline: string,
    institutionHotlineCode: string,
    institutionAddress: string,
    institutionCountry: string,
    representativeName: string,
    representativePosition: string,
    representativeEmail: string,
    representativePhone: string,
    representativePhoneCode: string,
    aboutInstitution: string,
    institutionDisciplines: string[],
    institutionCoverImage: string,
    profilePhoto: string,
    // ... other fields
  }
}
```

### 2.2 GET /api/institution/documents

**Location:** `src/app/api/institution/documents/route.ts`

**Purpose:** Fetch institution verification documents

**Authentication:** Required

**Response:**

```typescript
{
	documents: Array<{
		document_id: string;
		name: string;
		url: string;
		size: number;
		documentType: { name: string };
	}>;
}
```

---

## 3. DATA FLOW

### 3.1 View Profile Flow

1. **User Navigates to Profile**
   - Accesses `/institution/dashboard/profile`
   - ProfilePage component mounts

2. **ProfileContext Initialization**
   - ProfileContext provides profile data
   - If not loaded, fetches from API

3. **Component Mount**
   - InstitutionProfileSection receives profile prop
   - Component initializes state

4. **Load Profile Data**
   - If profile prop exists, uses it
   - Otherwise, calls `ApiService.getProfile()`
   - `GET /api/profile` request sent

5. **API Processing**
   - Authentication validated
   - User role determined
   - InstitutionProfileService.getProfile() called
   - Profile fetched from database with relations:
     - User data
     - Documents (active only)
     - Subdisciplines (with discipline info)

6. **Data Transformation**
   - Profile transformed to frontend format
   - Field names mapped (e.g., `name` → `institutionName`)
   - Arrays formatted (disciplines, documents)

7. **Load Additional Data**
   - Verification documents loaded via `/api/institution/documents`
   - Subdisciplines loaded via `/api/subdisciplines`

8. **Render Profile**
   - Left panel: Institution details, representative info
   - Right panel: Tabbed content (Overview, Cover, Verification)
   - Data displayed in view mode

---

## 4. DATABASE OPERATIONS

### 4.1 Fetch Institution Profile

```typescript
const institution = await prismaClient.institution.findFirst({
	where: {
		user_id: userId,
		status: true, // Only active profiles
	},
	include: {
		user: true,
		documents: {
			where: { status: true },
			include: { documentType: true },
		},
		subdisciplines: {
			include: {
				subdiscipline: {
					include: { discipline: true },
				},
			},
		},
	},
});
```

### 4.2 Fetch Verification Documents

```typescript
const documents = await prismaClient.institutionDocument.findMany({
	where: {
		institution_id: institutionId,
		status: true,
	},
	include: {
		documentType: true,
	},
});
```

---

## 5. DATABASE MODELS

### 5.1 Institution

```typescript
{
	institution_id: string(PK);
	user_id: string(FK, unique);
	name: string;
	abbreviation: string | null;
	hotline: string;
	hotline_code: string | null;
	type: string;
	website: string | null;
	email: string | null;
	country: string;
	address: string;
	rep_name: string;
	rep_appellation: string | null;
	rep_position: string;
	rep_email: string;
	rep_phone: string;
	rep_phone_code: string | null;
	about: string;
	logo: string | null;
	cover_image: string | null;
	status: boolean;
}
```

**Relations:**

- `user` - User (user_id)
- `documents` - InstitutionDocument[]
- `subdisciplines` - InstitutionSubdiscipline[]

### 5.2 InstitutionDocument

```typescript
{
	document_id: string(PK);
	institution_id: string(FK);
	document_type_id: string(FK);
	name: string;
	url: string;
	size: number;
	upload_at: DateTime;
	status: boolean;
}
```

### 5.3 InstitutionSubdiscipline

```typescript
{
	institution_id: string(FK);
	subdiscipline_id: string(FK);
	add_at: DateTime;
	status: boolean;
}
```

---

## 6. INTERFACES

### 6.1 InstitutionProfile (Frontend)

```typescript
interface InstitutionProfile {
	role: 'institution';
	institution_id: string;
	institutionName: string;
	institutionAbbreviation: string;
	institutionType: string;
	institutionWebsite: string;
	institutionHotline: string;
	institutionHotlineCode: string;
	institutionAddress: string;
	institutionCountry: string;
	representativeName: string;
	representativePosition: string;
	representativeEmail: string;
	representativePhone: string;
	representativePhoneCode: string;
	aboutInstitution: string;
	institutionDisciplines: string[];
	institutionCoverImage: string;
	profilePhoto: string;
	user: { id; name; email; image };
}
```

---

## 7. FEATURES

### 7.1 Profile Display

- Institution logo/avatar
- Institution name and abbreviation
- Institution details (email, website, hotline, address, country)
- Representative information (name, position, email, phone)
- Description/About section
- Disciplines (for universities/research labs)
- Cover image (for universities)
- Verification documents

### 7.2 Tabbed Interface

- **Overview Tab:**
  - Institution description
  - Disciplines (multi-select display)
- **Cover Image Tab:**
  - Cover image display
  - Upload functionality (edit mode)
- **Verification Documents Tab:**
  - Document list
  - Upload functionality
  - View/Download documents

### 7.3 View Mode

- Read-only display
- Formatted data presentation
- Country flags for phone numbers
- Document preview/download

---

## 8. SERVICES

### 8.1 InstitutionProfileService

**Location:** `src/services/profile/institution-profile-service.ts`

**Method:**

```typescript
static async getProfile(userId: string): Promise<InstitutionProfile | null>
```

**Process:**

- Fetches institution with relations
- Includes user, documents, subdisciplines
- Returns transformed profile

### 8.2 ApiService

**Location:** `src/services/api/axios-config.ts`

**Methods:**

- `getProfile()` - GET /api/profile
- `getSubdisciplines()` - GET /api/subdisciplines

---

## 9. SEQUENCE DIAGRAM ACTORS

1. **User** - Views profile
2. **ProfilePage** - Page component
3. **ProfileContext** - Context provider
4. **InstitutionProfileSection** - Main component
5. **ApiService** - API client
6. **API Route Handler** - Server endpoint
7. **requireAuth** - Authentication
8. **InstitutionProfileService** - Business logic
9. **Prisma Client** - Database
10. **Database** - PostgreSQL

---

## 10. CLASS DIAGRAM ENTITIES

### 10.1 Frontend Classes

- `ProfilePage` (Page component)
- `InstitutionProfileSection` (Component)
- `ProfileContext` (Context)
- `InstitutionProfileLayout` (Layout)
- `ApiService` (Service)

### 10.2 Backend Classes

- API Route Handler (GET)
- `requireAuth` (Utility)
- `InstitutionProfileService` (Service)
- Prisma Models (Institution, InstitutionDocument, InstitutionSubdiscipline)

---

## 11. KEY METHODS

### 11.1 Component Methods

- `loadProfile()` - Fetch profile
- `loadVerificationDocuments()` - Load documents
- `loadDisciplines()` - Load subdisciplines

### 11.2 Service Methods

- `getProfile(userId)` - Fetch institution profile

### 11.3 API Methods

- `GET()` - Fetch profile with role detection

---

## 12. FILE STRUCTURE

```
src/
├── app/(institution)/institution/dashboard/
│   ├── profile/page.tsx
│   └── ProfileContext.tsx
├── components/profile/institution/sections/
│   └── InstitutionProfileSection.tsx
├── components/profile/layouts/
│   └── InstitutionProfileLayout.tsx
├── services/profile/
│   └── institution-profile-service.ts
└── app/api/profile/
    └── route.ts (GET handler)
```

---

## 13. DIAGRAM REQUIREMENTS

### Sequence Diagram:

- User navigation → Page → Context → Component → Service → API → Database
- Show profile data loading
- Show document loading
- Show discipline loading

### Class Diagram:

- Page component
- Context provider
- Main component class
- Service classes
- API handlers
- Database models and relationships

---

## END OF DOCUMENT
