# EduMatch Project Architecture Refactoring Plan

## Executive Summary

This document outlines a comprehensive refactoring plan to improve code
organization, maintainability, and consistency across the EduMatch project. The
current architecture has several organizational issues that make it difficult to
navigate and maintain.

---

## 🔍 Current Architecture Issues

### 1. **Component Organization Inconsistencies**

**Issues:**

- Mixed folder naming: `menu/` vs `sections/` (some folders renamed, some not)
- Inconsistent index.ts exports (some folders have them, some don't)
- Duplicate lib directories: `src/app/lib/` and `src/lib/`
- Mixed import paths: `@/components/profile/...` vs
  `@/components/profile/institution/menu/...`
- Profile components partially refactored (applicant uses `sections/`,
  institution still uses `menu/`)

**Examples:**

- ✅ `src/components/profile/applicant/sections/` (good naming)
- ❌ `src/components/profile/institution/menu/` (inconsistent)
- ❌ `src/app/lib/auth.ts` vs `src/lib/auth-utils.ts` (duplicate concerns)

### 2. **Service Layer Disorganization**

**Issues:**

- Service files scattered in `src/lib/` with inconsistent naming
- No clear separation between:
  - API wrappers (`api-wrapper.ts`, `axios-config.ts`)
  - Business logic services (`applicant-profile-service.ts`,
    `institution-profile-service.ts`)
  - Utility functions (`utils.ts`, `date-utils.ts`, `file-utils.ts`)
- Some services mix concerns (e.g., `profile-service.ts` vs
  `applicant-profile-service.ts`)

**Files Affected:**

```
src/lib/
├── admin-user-service.ts
├── admin-utils.ts
├── api-wrapper.ts                    # Should be in services/api/
├── applicant-profile-service.ts
├── application-service.ts
├── appsync-client.ts                  # Should be in services/messaging/
├── auth-utils.ts
├── axios-config.ts                     # Should be in config/
├── cache.ts                            # Should be in utils/cache/
├── date-utils.ts                       # Should be in utils/
├── document-service.ts
├── email-service.ts                    # Should be in services/email/
├── email-template.ts                  # Should be with email-service.ts
├── explore-api.ts                      # Should be in services/api/
├── explore-utils.ts                    # Should be in utils/
├── file-utils.ts                       # Should be in utils/
├── institution-admin-service.ts
├── institution-profile-service.ts
├── profile-service.ts                  # Overlaps with applicant/institution services
├── sqs-config.ts                       # Should be in config/
├── sqs-handlers.ts                     # Should be in services/messaging/
├── utils.ts                            # Too generic
└── wishlist-service.ts
```

### 3. **API Route Organization**

**Issues:**

- Nested route structures are inconsistent
- Some routes are too deeply nested (e.g.,
  `explore/programs/program-detail/route.ts`)
- Route naming inconsistencies (`users` vs `user` routes)
- Some routes handle multiple concerns

**Examples:**

- ❌ `/api/explore/programs/program-detail/route.ts` (too nested)
- ❌ `/api/users/route.ts` AND `/api/user/route.ts` (duplicate concern)
- ❌ `/api/posts/institution/route.ts` vs `/api/posts/programs/route.ts`
  (inconsistent structure)

### 4. **Types Organization**

**Issues:**

- Types scattered across multiple files
- Some types in component files, some in dedicated type files
- No clear pattern for API types vs domain types
- Missing type exports in index files

**Current Structure:**

```
src/types/
├── application-api.ts        # API response types
├── explore-api.ts             # API response types
├── explore.ts                 # Domain types
├── institution-details.ts    # Domain types
├── profile.ts                 # Domain types
├── user-details.ts            # Domain types
└── wishlist-api.ts            # API response types
```

### 5. **Hooks Organization**

**Issues:**

- All hooks in flat `src/hooks/` directory
- No grouping by concern or domain
- Mixed naming conventions (`useAdminAuth.ts` vs `useAdminUserManagement.tsx`)

**Current Files:**

```
src/hooks/
├── useAdminAuth.ts
├── useAdminUserManagement.tsx    # .tsx extension inconsistency
├── useApplications.ts
├── useAppSyncMessaging.ts
├── useAuthCheck.ts
├── useFileUpload.ts
├── useInvoices.ts
├── useNotifications.ts
├── usePresignedUpload.ts
├── useResearchLabDetail.ts
├── useSimpleWarning.ts
├── useSubscription.ts
├── useUnreadMessageCount.ts
├── useUserProfile.ts
└── useWishlist.ts
```

### 6. **Context/Provider Organization**

**Issues:**

- Contexts in `src/contexts/` but providers in `src/providers/`
- Inconsistent naming and organization

### 7. **Duplicate Utilities**

**Issues:**

- `src/lib/utils.ts` (generic)
- `src/lib/date-utils.ts`
- `src/lib/file-utils.ts`
- `src/lib/explore-utils.ts`
- `src/app/lib/` directory (duplicate concern with `src/lib/`)

### 8. **Missing Barrel Exports**

**Issues:**

- Some folders have `index.ts`, others don't
- Inconsistent export patterns
- Missing central exports for easier imports

---

## 📋 Refactoring Plan

### Phase 1: Organize Service Layer (High Priority)

#### Step 1.1: Create Service Structure

```
src/
├── services/
│   ├── api/                          # API wrapper services
│   │   ├── api-client.ts             # Rename from axios-config.ts
│   │   ├── api-wrapper.ts
│   │   └── index.ts
│   │
│   ├── profile/                      # Profile services
│   │   ├── applicant-profile-service.ts
│   │   ├── institution-profile-service.ts
│   │   └── index.ts
│   │
│   ├── application/                  # Application services
│   │   ├── application-service.ts
│   │   └── index.ts
│   │
│   ├── admin/                        # Admin services
│   │   ├── admin-user-service.ts
│   │   ├── institution-admin-service.ts
│   │   └── index.ts
│   │
│   ├── messaging/                    # Messaging services
│   │   ├── appsync-client.ts
│   │   ├── sqs-handlers.ts
│   │   └── index.ts
│   │
│   ├── email/                        # Email services
│   │   ├── email-service.ts
│   │   ├── email-template.ts
│   │   └── index.ts
│   │
│   ├── document/                     # Document services
│   │   ├── document-service.ts
│   │   └── index.ts
│   │
│   ├── wishlist/                     # Wishlist services
│   │   ├── wishlist-service.ts
│   │   └── index.ts
│   │
│   └── explore/                      # Explore services
│       ├── explore-api.ts
│       └── index.ts
```

**Migration Steps:**

1. Create new `src/services/` directory structure
2. Move files from `src/lib/` to appropriate service folders
3. Update all imports in codebase
4. Remove empty `src/lib/` directory (after moving remaining files)

#### Step 1.2: Organize Utilities

```
src/
├── utils/
│   ├── cache/
│   │   ├── cache.ts
│   │   └── index.ts
│   │
│   ├── date/
│   │   ├── date-utils.ts
│   │   └── index.ts
│   │
│   ├── file/
│   │   ├── file-utils.ts
│   │   └── index.ts
│   │
│   ├── explore/
│   │   ├── explore-utils.ts
│   │   └── index.ts
│   │
│   ├── admin/
│   │   ├── admin-utils.ts
│   │   └── index.ts
│   │
│   └── index.ts                      # Re-export all utils
```

#### Step 1.3: Organize Config

```
src/
├── config/
│   ├── auth.ts                        # From src/app/lib/auth.ts
│   ├── auth-client.ts                 # From src/app/lib/auth-client.ts
│   ├── redis.ts                        # From src/app/lib/redis.ts
│   ├── stripe.ts                      # From src/app/lib/stripe.ts
│   ├── sqs.ts                         # Rename from sqs-config.ts
│   ├── subscription-utils.ts          # From src/app/lib/subscription-utils.ts
│   └── index.ts
```

---

### Phase 2: Standardize Profile Components (High Priority)

#### Step 2.1: Complete Profile Component Refactoring

```
src/components/profile/
├── index.ts                           # Export all profile components
│
├── layouts/                           # Layout components
│   ├── ProfileLayoutBase.tsx
│   ├── ProfileSidebar.tsx
│   ├── ApplicantProfileLayout.tsx
│   ├── InstitutionProfileLayout.tsx
│   └── index.ts
│
├── shared/                            # Shared UI components
│   ├── ProfileCard.tsx
│   ├── InfoSection.tsx
│   ├── DocumentPanel.tsx
│   ├── TwoPanelLayout.tsx
│   └── index.ts
│
├── applicant/
│   └── sections/                     # ✅ Already renamed
│       ├── AcademicSection.tsx
│       ├── ProfileInfoSection.tsx
│       ├── ApplicationSection.tsx
│       ├── WishlistSection.tsx
│       ├── PaymentSection.tsx
│       ├── SettingsSection.tsx
│       ├── ApplicantProfileLayout.tsx
│       ├── ApplicationUpdateResponseModal.tsx
│       └── index.ts
│
├── institution/
│   ├── sections/                     # ⚠️ Rename from "menu/"
│   │   ├── InstitutionOverviewSection.tsx
│   │   ├── InstitutionProfileSection.tsx
│   │   ├── InstitutionInformationSection.tsx
│   │   ├── ProgramsSection.tsx
│   │   ├── InstitutionApplicationSection.tsx
│   │   ├── InstitutionPaymentSection.tsx
│   │   ├── InstitutionSettingsSection.tsx
│   │   └── index.ts
│   │
│   ├── components/                   # Shared components for institution
│   │   ├── ApplicantDetailView.tsx
│   │   ├── ApplicantsTable.tsx
│   │   ├── PostsTable.tsx
│   │   ├── SearchAndFilter.tsx
│   │   ├── PostsSearchAndFilter.tsx
│   │   ├── StatisticsCards.tsx
│   │   ├── PostsStatisticsCards.tsx
│   │   ├── Pagination.tsx
│   │   ├── UpdateApplicationModal.tsx
│   │   └── index.ts
│   │
│   └── create/                       # Institution creation pages
│       ├── CreateProgramPage.tsx
│       ├── CreateScholarshipPage.tsx
│       ├── CreateResearchLabPage.tsx
│       └── index.ts
│
└── create/                            # Profile creation flow
    └── steps/
        ├── RoleSelectionStep.tsx
        ├── BasicInfoStep.tsx
        ├── AcademicInfoStep.tsx
        ├── InstitutionInfoStep.tsx
        ├── InstitutionDetailsStep.tsx
        ├── CompletionStep.tsx
        ├── ProgressBar.tsx
        └── index.ts
```

**Migration Steps:**

1. Rename `institution/menu/` → `institution/sections/`
2. Move layout files to `layouts/` folder
3. Update `src/components/profile/index.ts` to export everything
4. Update all import paths across codebase

---

### Phase 3: Organize Hooks (Medium Priority)

#### Step 3.1: Group Hooks by Domain

```
src/hooks/
├── auth/
│   ├── useAuthCheck.ts
│   ├── useAdminAuth.ts
│   └── index.ts
│
├── profile/
│   ├── useUserProfile.ts
│   └── index.ts
│
├── admin/
│   ├── useAdminUserManagement.tsx
│   └── index.ts
│
├── application/
│   ├── useApplications.ts
│   └── index.ts
│
├── messaging/
│   ├── useAppSyncMessaging.ts
│   ├── useUnreadMessageCount.ts
│   └── index.ts
│
├── files/
│   ├── useFileUpload.ts
│   ├── usePresignedUpload.ts
│   └── index.ts
│
├── subscription/
│   ├── useSubscription.ts
│   ├── useInvoices.ts
│   └── index.ts
│
├── notifications/
│   ├── useNotifications.ts
│   └── index.ts
│
├── wishlist/
│   ├── useWishlist.ts
│   └── index.ts
│
├── explore/
│   ├── useResearchLabDetail.ts
│   └── index.ts
│
├── ui/
│   ├── useSimpleWarning.ts
│   └── index.ts
│
└── index.ts                           # Re-export all hooks
```

**Migration Steps:**

1. Create domain-based folders
2. Move hooks to appropriate folders
3. Rename `useAdminUserManagement.tsx` → `useAdminUserManagement.ts` (consistent
   extension)
4. Update all imports
5. Create index.ts files for barrel exports

---

### Phase 4: Organize Types (Medium Priority)

#### Step 4.1: Restructure Types

```
src/types/
├── domain/                            # Domain/business types
│   ├── profile.ts
│   ├── user.ts                        # Rename from user-details.ts
│   ├── institution.ts                 # Rename from institution-details.ts
│   ├── application.ts
│   ├── explore.ts
│   └── wishlist.ts
│
├── api/                               # API request/response types
│   ├── application-api.ts
│   ├── explore-api.ts
│   ├── wishlist-api.ts
│   └── index.ts
│
└── index.ts                           # Re-export all types
```

**Migration Steps:**

1. Separate domain types from API types
2. Rename files for clarity
3. Update all imports
4. Create barrel exports

---

### Phase 5: Consolidate API Routes (Low Priority)

#### Step 5.1: Standardize Route Structure

```
src/app/api/
├── admin/
│   ├── institutions/
│   │   ├── [id]/
│   │   │   ├── route.ts
│   │   │   ├── actions/
│   │   │   │   └── route.ts
│   │   │   └── documents/
│   │   │       ├── [documentId]/
│   │   │       │   └── route.ts
│   │   │       └── download-all/
│   │   │           └── route.ts
│   │   └── route.ts
│   ├── users/
│   │   └── ... (similar structure)
│   └── ...
│
├── applications/
│   ├── [applicationId]/
│   │   ├── route.ts
│   │   └── update-request/
│   │       └── route.ts
│   ├── institution/
│   │   ├── [applicationId]/
│   │   │   └── route.ts
│   │   └── route.ts
│   └── route.ts
│
├── explore/
│   ├── programs/
│   │   ├── route.ts
│   │   └── [id]/
│   │       └── route.ts              # Simplify from program-detail/route.ts
│   ├── research/
│   │   └── ...
│   └── scholarships/
│       └── ...
│
└── users/                             # Consolidate user/user routes
    ├── [userId]/
    │   ├── route.ts
    │   └── ...
    └── route.ts
```

**Migration Steps:**

1. Consolidate `users` and `user` routes into single `users` structure
2. Simplify overly nested routes (e.g., `explore/programs/[id]/route.ts` instead
   of `program-detail/route.ts`)
3. Ensure consistent parameter naming (`[id]` vs `[userId]` vs
   `[applicationId]`)

---

### Phase 6: Organize Contexts and Providers (Low Priority)

#### Step 6.1: Consolidate Contexts and Providers

```
src/
├── contexts/                          # Keep contexts here
│   ├── AuthContext.tsx
│   ├── NotificationContext.tsx
│   └── index.ts
│
└── providers/                         # Keep providers here (for React Query, etc.)
    ├── query-provider.tsx
    └── index.ts
```

**Note:** Current structure is acceptable, just ensure consistent naming.

---

## 🎯 Refactoring Steps Summary

### Immediate Actions (Do First)

1. **Create services structure** and move files from `src/lib/`
2. **Rename `institution/menu/` → `institution/sections/`** to match applicant
   structure
3. **Consolidate `src/app/lib/` into `src/config/`**

### Short-term Actions (Week 1-2)

4. **Organize hooks by domain**
5. **Restructure types** (domain vs API)
6. **Update all imports** across codebase
7. **Add missing index.ts files** for barrel exports

### Long-term Actions (Week 3-4)

8. **Standardize API route structure**
9. **Document new structure** in README
10. **Update team on new import patterns**

---

## 📝 Migration Checklist

### Before Starting

- [ ] Create feature branch: `refactor/architecture-cleanup`
- [ ] Backup current structure
- [ ] Review with team

### Phase 1: Services & Utils

- [ ] Create `src/services/` structure
- [ ] Move service files
- [ ] Create `src/utils/` structure
- [ ] Move utility files
- [ ] Create `src/config/` structure
- [ ] Move config files
- [ ] Update all imports
- [ ] Test all functionality

### Phase 2: Profile Components

- [ ] Rename `menu/` → `sections/`
- [ ] Move layout files to `layouts/`
- [ ] Update `index.ts` exports
- [ ] Update all imports
- [ ] Test profile functionality

### Phase 3: Hooks

- [ ] Create domain folders
- [ ] Move hooks to appropriate folders
- [ ] Fix file extensions (.tsx → .ts where appropriate)
- [ ] Create index.ts files
- [ ] Update all imports
- [ ] Test hooks functionality

### Phase 4: Types

- [ ] Create domain/ and api/ folders
- [ ] Move and rename type files
- [ ] Update all imports
- [ ] Create barrel exports

### Phase 5: API Routes

- [ ] Consolidate user/user routes
- [ ] Simplify nested routes
- [ ] Standardize parameter naming
- [ ] Test all API endpoints

### After Refactoring

- [ ] Update documentation
- [ ] Run full test suite
- [ ] Code review
- [ ] Merge to main

---

## 🚨 Important Notes

1. **Do NOT refactor everything at once** - Complete one phase before starting
   the next
2. **Update imports incrementally** - Use find/replace carefully
3. **Test after each phase** - Ensure nothing breaks
4. **Keep old structure until migration complete** - Use git to track changes
5. **Document breaking changes** - Update team on new import paths

---

## 🔄 Import Path Updates

### Before → After Examples

**Services:**

```typescript
// Before
import { applicantProfileService } from '@/lib/applicant-profile-service';

// After
import { applicantProfileService } from '@/services/profile/applicant-profile-service';
```

**Utils:**

```typescript
// Before
import { formatDate } from '@/lib/date-utils';

// After
import { formatDate } from '@/utils/date';
```

**Config:**

```typescript
// Before
import { authClient } from '@/app/lib/auth-client';

// After
import { authClient } from '@/config/auth-client';
```

**Profile Components:**

```typescript
// Before
import { InstitutionApplicationSection } from '@/components/profile/institution/menu/InstitutionApplicationSection';

// After
import { InstitutionApplicationSection } from '@/components/profile/institution/sections';
```

**Hooks:**

```typescript
// Before
import { useAuthCheck } from '@/hooks/useAuthCheck';

// After
import { useAuthCheck } from '@/hooks/auth';
```

---

## 📊 Estimated Time

- **Phase 1 (Services)**: 2-3 days
- **Phase 2 (Profile)**: 1 day
- **Phase 3 (Hooks)**: 1-2 days
- **Phase 4 (Types)**: 1 day
- **Phase 5 (API Routes)**: 2-3 days
- **Testing & Documentation**: 2-3 days

**Total Estimated Time: 9-13 days**

---

## ✅ Success Criteria

1. All imports use consistent paths
2. Related files are grouped together
3. No duplicate utilities or services
4. Clear separation of concerns
5. Easy to find and maintain code
6. All tests pass
7. Documentation updated
