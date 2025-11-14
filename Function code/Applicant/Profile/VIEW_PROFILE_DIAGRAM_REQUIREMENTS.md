# View Profile Feature - Components & Requirements for Sequence & Class Diagrams

## Overview

The View Profile feature allows authenticated users (applicants/students) to
view their profile information in a tabbed interface with multiple sections.

---

## 1. FRONTEND COMPONENTS

### 1.1 Page Components

- **`ProfileView`** (`src/app/(applicant)/profile/view/page.tsx`)
  - Main page component
  - Handles authentication check
  - Loads profile data
  - Manages active section state
  - Handles URL parameters for tab navigation

- **`ApplicantProfileView`** (internal component in same file)
  - Renders the profile layout
  - Manages section switching
  - Handles profile refresh

### 1.2 Layout Components

- **`ApplicantProfileLayout`**
  (`src/components/profile/layouts/ApplicantProfileLayout.tsx`)
  - Wraps profile sections
  - Provides navigation sidebar
  - Manages section state

- **`ProfileLayoutBase`**
  (`src/components/profile/layouts/ProfileLayoutBase.tsx`)
  - Base layout component
  - Provides common UI structure
  - Handles navigation rendering

### 1.3 Section Components

- **`ProfileInfoSection`**
  (`src/components/profile/applicant/sections/ProfileInfoSection.tsx`)
  - Displays basic profile information
  - Handles profile editing
  - Manages file uploads (profile photo)
  - Form validation

- **`AcademicSection`**
  (`src/components/profile/applicant/sections/AcademicSection.tsx`)
  - Displays academic information

- **`WishlistSection`**
  (`src/components/profile/applicant/sections/WishlistSection.tsx`)
  - Displays wishlist items

- **`ApplicationSection`**
  (`src/components/profile/applicant/sections/ApplicationSection.tsx`)
  - Displays application history

- **`SettingsSection`**
  (`src/components/profile/applicant/sections/SettingsSection.tsx`)
  - Displays settings options

### 1.4 Authentication & Authorization Components

- **`AuthWrapper`** (`src/components/auth/AuthWrapper.tsx`)
  - Checks if user is authenticated
  - Redirects to sign-in if not authenticated
  - Shows loading state

- **`ProfileWrapper`** (`src/components/auth/ProfileWrapper.tsx`)
  - Checks if user has a profile
  - Redirects to profile creation if no profile exists
  - Protects profile routes

### 1.5 UI Components (from `@/components/ui`)

- `Card`, `CardContent`
- `Button`
- `Input`
- `Label`
- `Avatar`, `AvatarImage`, `AvatarFallback`
- `PhoneInput`
- `CustomSelect`
- `DateInput`
- `SuccessModal`
- `ErrorModal`
- `WarningModal`

---

## 2. HOOKS

### 2.1 Authentication Hooks

- **`useAuthCheck`** (`src/hooks/auth/useAuthCheck.ts`)
  - Checks authentication status
  - Provides user information
  - Manages auth state

### 2.2 Profile Hooks

- **`useUserProfile`** (`src/hooks/profile/useUserProfile.ts`)
  - Fetches user profile data
  - Manages profile state
  - Provides refresh functionality
  - Implements caching (30-second throttle)

---

## 3. SERVICES

### 3.1 API Service

- **`ApiService`** (`src/services/api/axios-config.ts`)
  - `getProfile()` - Fetches profile data
  - `updateProfile(profileData)` - Updates profile
  - `uploadFile(file, category)` - Uploads files to S3
  - `getSubdisciplines()` - Fetches subdisciplines list
  - Axios instance with interceptors
  - Cache management utilities

### 3.2 Profile Services

- **`ApplicantProfileService`**
  (`src/services/profile/applicant-profile-service.ts`)
  - `hasProfile(userId)` - Checks if profile exists
  - `getProfile(userId)` - Retrieves applicant profile
  - `upsertProfile(userId, formData)` - Creates/updates profile
  - `deleteProfile(userId)` - Soft deletes profile
  - `isProfileComplete(profile)` - Validates profile completeness
  - `getProfileCompletionPercentage(profile)` - Calculates completion %

- **`InstitutionProfileService`**
  (`src/services/profile/institution-profile-service.ts`)
  - Similar methods for institution profiles

- **`ProfileService`** (`src/services/profile/profile-service.ts`)
  - Generic profile service
  - Routes to appropriate service based on role

---

## 4. API ROUTES

### 4.1 Profile API Routes

- **`GET /api/profile`** (`src/app/api/profile/route.ts`)
  - Fetches current user's profile
  - Determines profile type (applicant/institution)
  - Returns transformed profile data
  - Handles authentication via `requireAuth()`

- **`PUT /api/profile`** (`src/app/api/profile/route.ts`)
  - Updates profile data
  - Validates role
  - Routes to appropriate service
  - Sends notifications on update

- **`POST /api/profile`** (`src/app/api/profile/route.ts`)
  - Creates new profile
  - Checks for existing profile
  - Sends welcome notifications

- **`GET /api/profile/[userId]`** (`src/app/api/profile/[userId]/route.ts`)
  - Fetches profile by userId
  - Validates authorization

- **`PUT /api/profile/[userId]`** (`src/app/api/profile/[userId]/route.ts`)
  - Updates profile by userId
  - Validates ownership

### 4.2 File Upload API

- **`POST /api/files/s3-upload`** (`src/app/api/files/`)
  - Handles file uploads to S3
  - Returns file URL

### 4.3 Subdisciplines API

- **`GET /api/subdisciplines`** (`src/app/api/subdisciplines/route.ts`)
  - Returns list of subdisciplines

---

## 5. UTILITIES

### 5.1 Authentication Utilities

- **`requireAuth()`** (`src/utils/auth/auth-utils.ts`)
  - Validates user session
  - Fetches user with role from database
  - Throws error if not authenticated

- **`getSessionWithCache()`** (`src/utils/auth/auth-utils.ts`)
  - Gets session with Better Auth caching
  - Returns user and session data

### 5.2 Cache Utilities

- **`cacheUtils`** (`src/services/api/axios-config.ts`)
  - `clearProfileCache(userId)` - Clears profile cache
  - `clearUserCache(userId)` - Clears user-specific cache
  - `clearCacheByKey(key)` - Clears specific cache entry

### 5.3 Date Utilities

- **`formatDateForDisplay()`** (`src/utils/date/date-utils.ts`)
  - Formats dates for display

---

## 6. DATABASE MODELS (Prisma Schema)

### 6.1 Core Models

- **`User`**
  - id, name, email, image, role_id, status
  - Relations: applicant, institution, userRole

- **`Applicant`**
  - applicant_id, first_name, last_name, birthday, gender
  - nationality, phone_number, country_code
  - favorite_countries, graduated, level, gpa
  - university, country_of_study, languages
  - Relations: user, subdiscipline, documents, interests

- **`Institution`**
  - institution_id, name, abbreviation, hotline, type
  - country, address, rep_name, rep_position, rep_email
  - Relations: user, documents, subdisciplines

### 6.2 Related Models

- **`ApplicantDocument`** - Profile documents (CV, certificates, etc.)
- **`ApplicantInterest`** - User interests (subdisciplines)
- **`Subdiscipline`** - Academic fields
- **`Discipline`** - Academic disciplines
- **`DocumentType`** - Document categories
- **`Role`** - User roles (student, institution)

---

## 7. DATA FLOW & SEQUENCE

### 7.1 View Profile Flow

1. User navigates to `/profile/view`
2. `ProfileView` component mounts
3. `AuthWrapper` checks authentication
4. `ProfileWrapper` checks if profile exists
5. `useAuthCheck` hook validates session
6. `useEffect` triggers profile data fetch
7. `ApiService.getProfile()` called
8. API route `/api/profile` (GET) invoked
9. `requireAuth()` validates session
10. `ApplicantProfileService.getProfile()` fetches from DB
11. Profile data transformed and returned
12. Component state updated with profile data
13. `ApplicantProfileLayout` renders with sections
14. Active section determined from URL params
15. Section component renders profile data

### 7.2 Edit Profile Flow

1. User clicks "Edit" button in `ProfileInfoSection`
2. Component enters edit mode
3. User modifies fields
4. File upload handled via `ApiService.uploadFile()`
5. User clicks "Save"
6. `PUT /api/profile` called with updated data
7. `ApplicantProfileService.upsertProfile()` updates DB
8. Profile cache cleared
9. Success modal shown
10. Profile refreshed

### 7.3 Section Navigation Flow

1. User clicks navigation item
2. `handleSectionChange()` updates state
3. URL updated with `?tab=section`
4. `renderSectionContent()` switches component
5. New section component renders

---

## 8. INTERFACES & TYPES

### 8.1 Profile Data Interface

```typescript
interface ProfileData {
	id: string;
	role: string;
	firstName: string;
	lastName: string;
	gender: string;
	birthday: string;
	nationality: string;
	phoneNumber: string;
	countryCode: string;
	interests: string[];
	favoriteCountries: string[];
	profilePhoto?: string;
	// Academic fields
	graduationStatus?: string;
	degree?: string;
	fieldOfStudy?: string;
	university?: string;
	// Documents
	cvFiles?: Array<FileData>;
	languageCertFiles?: Array<FileData>;
	degreeFiles?: Array<FileData>;
	transcriptFiles?: Array<FileData>;
	// User relation
	user: {
		id: string;
		name: string;
		email: string;
		image?: string;
	};
}
```

### 8.2 Service Interfaces

- `ApplicantProfile` - Database model interface
- `InstitutionProfile` - Database model interface
- `ApplicantProfileFormData` - Form data interface
- `InstitutionProfileFormData` - Form data interface

---

## 9. AUTHENTICATION & AUTHORIZATION

### 9.1 Authentication Flow

- Better Auth session management
- Cookie-based authentication
- Session caching via Better Auth
- Role-based access control

### 9.2 Authorization Checks

- User must be authenticated
- User must have a profile
- Profile ownership validation
- Role-based profile type (applicant vs institution)

---

## 10. CACHING STRATEGY

### 10.1 Client-Side Caching

- Profile data cached in component state
- 30-second throttle in `useUserProfile` hook
- Cache invalidation on profile update

### 10.2 Server-Side Caching

- Better Auth session caching
- Redis cache for static data
- Profile endpoints NOT cached (always fresh)

---

## 11. ERROR HANDLING

### 11.1 Error States

- Authentication errors → Redirect to sign-in
- Profile not found → Redirect to profile creation
- API errors → Error modal displayed
- Network errors → Retry mechanism

### 11.2 Loading States

- Authentication loading
- Profile data loading
- File upload loading
- Save operation loading

---

## 12. VALIDATION

### 12.1 Form Validation

- Name fields: letters and spaces only
- File uploads: image type, max 5MB
- Required fields validation
- Date range validation

### 12.2 Profile Completeness

- `isProfileComplete()` - Checks required fields
- `getProfileCompletionPercentage()` - Calculates completion

---

## 13. NOTIFICATIONS

### 13.1 Profile Events

- Profile created notification
- Profile updated event (`profileUpdated` custom event)
- Welcome notification (on profile creation)

---

## 14. EXTERNAL DEPENDENCIES

### 14.1 Third-Party Services

- **Better Auth** - Authentication service
- **AWS S3** - File storage
- **Prisma** - Database ORM
- **PostgreSQL** - Database
- **Redis** - Caching (optional)

### 14.2 Libraries

- **Next.js** - Framework
- **React** - UI library
- **Axios** - HTTP client
- **Lucide React** - Icons

---

## 15. SEQUENCE DIAGRAM ACTORS

1. **User/Browser** - Initiates requests
2. **ProfileView Component** - Main page component
3. **AuthWrapper** - Authentication guard
4. **ProfileWrapper** - Profile existence guard
5. **useAuthCheck Hook** - Auth state management
6. **ApiService** - API client
7. **API Route Handler** - Server endpoint
8. **requireAuth Utility** - Auth validation
9. **ApplicantProfileService** - Business logic
10. **Prisma Client** - Database access
11. **Database** - PostgreSQL

---

## 16. CLASS DIAGRAM ENTITIES

### 16.1 Frontend Classes

- `ProfileView` (React Component)
- `ApplicantProfileView` (React Component)
- `ApplicantProfileLayout` (React Component)
- `ProfileInfoSection` (React Component)
- `AuthWrapper` (React Component)
- `ProfileWrapper` (React Component)

### 16.2 Service Classes

- `ApiService` (Static class)
- `ApplicantProfileService` (Static class)
- `InstitutionProfileService` (Static class)
- `ProfileService` (Static class)

### 16.3 Utility Classes

- `cacheUtils` (Object with methods)
- `requireAuth` (Function)
- `getSessionWithCache` (Function)

### 16.4 Database Models

- `User` (Prisma Model)
- `Applicant` (Prisma Model)
- `Institution` (Prisma Model)
- `ApplicantDocument` (Prisma Model)
- `Subdiscipline` (Prisma Model)
- `DocumentType` (Prisma Model)

---

## 17. KEY METHODS FOR DIAGRAMS

### 17.1 ProfileView Component

- `loadFullProfile()` - Fetches profile data
- `refreshProfile()` - Refreshes profile
- `handleSectionChange()` - Changes active section
- `renderSectionContent()` - Renders section component

### 17.2 ApiService

- `getProfile()` - GET profile
- `updateProfile()` - PUT profile
- `uploadFile()` - POST file

### 17.3 ApplicantProfileService

- `getProfile(userId)` - Fetch profile
- `hasProfile(userId)` - Check existence
- `upsertProfile(userId, formData)` - Create/update
- `isProfileComplete(profile)` - Validate

### 17.4 API Route Handler

- `GET()` - Handle GET request
- `PUT()` - Handle PUT request
- `POST()` - Handle POST request

---

## 18. STATE MANAGEMENT

### 18.1 Component State

- `profile` - Profile data state
- `loading` - Loading state
- `error` - Error state
- `activeSection` - Current section
- `isEditing` - Edit mode state
- `isAuthenticated` - Auth state

### 18.2 URL State

- `?tab=section` - Active section parameter
- Browser navigation support

---

## 19. FILE STRUCTURE REFERENCE

```
src/
├── app/
│   ├── (applicant)/profile/view/page.tsx
│   └── api/profile/route.ts
├── components/
│   ├── auth/
│   │   ├── AuthWrapper.tsx
│   │   └── ProfileWrapper.tsx
│   └── profile/
│       ├── layouts/
│       │   ├── ApplicantProfileLayout.tsx
│       │   └── ProfileLayoutBase.tsx
│       └── applicant/sections/
│           ├── ProfileInfoSection.tsx
│           ├── AcademicSection.tsx
│           ├── WishlistSection.tsx
│           ├── ApplicationSection.tsx
│           └── SettingsSection.tsx
├── hooks/
│   ├── auth/useAuthCheck.ts
│   └── profile/useUserProfile.ts
├── services/
│   ├── api/axios-config.ts
│   └── profile/
│       ├── applicant-profile-service.ts
│       ├── institution-profile-service.ts
│       └── profile-service.ts
└── utils/
    └── auth/auth-utils.ts
```

---

## 20. DIAGRAM REQUIREMENTS SUMMARY

### For Sequence Diagram:

- Show complete flow from user action to database
- Include all authentication checks
- Show error handling paths
- Include cache operations
- Show component lifecycle
- Include API request/response flow

### For Class Diagram:

- Show component hierarchy
- Show service layer structure
- Show database model relationships
- Include interfaces and types
- Show method signatures
- Include dependencies between classes

---

## END OF DOCUMENT
