# Profile Folder Architecture Recommendations

## Current Structure Analysis

### ✅ What's Working Well:

1. **Clear separation** between `applicant/` and `institution/` roles
2. **Shared components** are properly grouped in `shared/`
3. **Component subfolders** (like `institution/menu/components/`) for reusable
   parts
4. **Type safety** with proper TypeScript interfaces

### ⚠️ Issues Found:

1. **Mixed naming conventions**:
   - `menu/` folder contains sections (not just menus)
   - Layout files mixed at root level

2. **Inconsistent exports**:
   - `index.ts` only exports some components
   - Import paths are inconsistent (`@/components/profile/...` vs
     `@/components/profile/applicant/menu/...`)

3. **Root level clutter**:
   - `ProfileLayoutBase.tsx`, `ProfileSidebar.tsx`,
     `InstitutionProfileLayout.tsx` at root
   - Should be organized by concern

4. **Unclear hierarchy**:
   - `create/` folder is at same level as `applicant/` and `institution/`
   - Could be better organized

## Recommended Structure

```
src/components/profile/
├── index.ts                          # Main exports (all components)
│
├── layouts/                          # Layout components
│   ├── ProfileLayoutBase.tsx
│   ├── ProfileSidebar.tsx
│   ├── ApplicantProfileLayout.tsx
│   └── InstitutionProfileLayout.tsx
│
├── shared/                           # Shared UI components
│   ├── ProfileCard.tsx
│   ├── InfoSection.tsx
│   ├── DocumentPanel.tsx
│   ├── TwoPanelLayout.tsx
│   └── index.ts
│
├── applicant/                        # Applicant-specific components
│   └── sections/                    # Renamed from "menu" for clarity
│       ├── AcademicSection.tsx
│       ├── ProfileInfoSection.tsx
│       ├── ApplicationSection.tsx
│       ├── WishlistSection.tsx
│       ├── PaymentSection.tsx
│       ├── SettingsSection.tsx
│       ├── ApplicationUpdateResponseModal.tsx
│       ├── ApplicantProfileLayout.tsx
│       └── index.ts
│
├── institution/                      # Institution-specific components
│   ├── sections/                    # Renamed from "menu" for clarity
│   │   ├── InstitutionOverviewSection.tsx
│   │   ├── InstitutionProfileSection.tsx
│   │   ├── InstitutionInformationSection.tsx
│   │   ├── ProgramsSection.tsx
│   │   ├── InstitutionApplicationSection.tsx
│   │   ├── InstitutionPaymentSection.tsx
│   │   ├── InstitutionSettingsSection.tsx
│   │   └── index.ts
│   │
│   ├── components/                  # Shared components for institution sections
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
│   └── create/                      # Institution creation pages
│       ├── CreateProgramPage.tsx
│       ├── CreateScholarshipPage.tsx
│       ├── CreateResearchLabPage.tsx
│       └── index.ts
│
└── create/                          # Profile creation flow
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

## Benefits of This Structure:

1. **Clear separation of concerns**:
   - Layouts in one place
   - Sections organized by role
   - Shared components clearly visible

2. **Better naming**:
   - `sections/` instead of `menu/` (more accurate)
   - `layouts/` folder makes purpose clear

3. **Improved imports**:
   - `@/components/profile/layouts/ProfileLayoutBase`
   - `@/components/profile/applicant/sections/AcademicSection`
   - `@/components/profile/institution/components/ApplicantsTable`

4. **Easier maintenance**:
   - Related files grouped together
   - Clear hierarchy
   - Consistent patterns

## Migration Steps:

1. **Rename folders**: `menu/` → `sections/`
2. **Move layout files** to `layouts/` folder
3. **Update all imports** across the codebase
4. **Update `index.ts`** to export everything consistently
5. **Update component imports** in pages/routes

## Alternative: Keep Current Structure (Minimal Changes)

If you prefer minimal disruption, just:

1. Rename `menu/` → `sections/` for clarity
2. Move layout files to `layouts/` subfolder
3. Update `index.ts` exports

This keeps most of your current structure while fixing the main issues.
