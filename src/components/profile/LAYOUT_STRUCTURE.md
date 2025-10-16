# Profile Layout Structure

## Overview

Cấu trúc layout profile đã được tách riêng cho **Institution** và **Applicant**
để dễ quản lý và customize.

## Structure

```
src/components/profile/
├── ProfileLayoutBase.tsx          # Base layout (shared UI logic)
├── InstitutionProfileLayout.tsx   # Layout cho Institution
├── ApplicantProfileLayout.tsx     # Layout cho Applicant
├── ProfileLayout.tsx              # Legacy layout (deprecated)
└── index.ts                       # Export tất cả components
```

## Components

### 1. ProfileLayoutBase

**File:** `ProfileLayoutBase.tsx`

Component base chứa:

- UI chung: sidebar, navigation, profile header
- Logic navigation với unsaved changes check
- Event listeners cho warning modals

**Props:**

```typescript
{
  activeSection: string
  onSectionChange: (section: string) => void
  children: React.ReactNode
  profile: any
  onEditProfile?: () => void
  navItems: NavItem[]
  roleLabel: string
  roleIcon?: React.ReactNode
}
```

### 2. InstitutionProfileLayout

**File:** `InstitutionProfileLayout.tsx`

Layout cho Institution với navigation items:

- 🏫 Institution Info
- 📚 Programs
- 📝 Applications
- 👥 Students
- 📊 Analytics
- 💳 Payment
- ⚙️ Settings

**Section Types:**

```typescript
type InstitutionProfileSection =
	| 'profile'
	| 'programs'
	| 'application'
	| 'students'
	| 'analytics'
	| 'payment'
	| 'settings';
```

**Usage:**

```tsx
import { InstitutionProfileLayout } from '@/components/profile';

<InstitutionProfileLayout
	activeSection={activeSection}
	onSectionChange={setActiveSection}
	profile={profile}
	onEditProfile={handleEditProfile}
>
	{children}
</InstitutionProfileLayout>;
```

### 3. ApplicantProfileLayout

**File:** `ApplicantProfileLayout.tsx`

Layout cho Applicant với navigation items:

- 👤 Profile Info
- 🎓 Academic
- ❤️ Wishlist
- 📄 Applications
- 💰 Payment
- ⚙️ Settings

**Section Types:**

```typescript
type ApplicantProfileSection =
	| 'profile'
	| 'academic'
	| 'wishlist'
	| 'application'
	| 'payment'
	| 'settings';
```

**Usage:**

```tsx
import { ApplicantProfileLayout } from '@/components/profile';

<ApplicantProfileLayout
	activeSection={activeSection}
	onSectionChange={setActiveSection}
	profile={profile}
	onEditProfile={handleEditProfile}
>
	{children}
</ApplicantProfileLayout>;
```

## Migration Guide

### Trước (Old):

```tsx
import { ProfileLayout } from '@/components/profile/ProfileLayout'

type ProfileSection = 'profile' | 'academic' | 'wishlist' | ...

<ProfileLayout
  activeSection={activeSection}
  onSectionChange={setActiveSection}
  profile={profile}
>
  {children}
</ProfileLayout>
```

### Sau (New):

**For Institution:**

```tsx
import {
  InstitutionProfileLayout,
  InstitutionProfileSection
} from '@/components/profile'

const [activeSection, setActiveSection] =
  useState<InstitutionProfileSection>('profile')

<InstitutionProfileLayout
  activeSection={activeSection}
  onSectionChange={setActiveSection}
  profile={profile}
  onEditProfile={handleEditProfile}
>
  {children}
</InstitutionProfileLayout>
```

**For Applicant:**

```tsx
import {
  ApplicantProfileLayout,
  ApplicantProfileSection
} from '@/components/profile'

const [activeSection, setActiveSection] =
  useState<ApplicantProfileSection>('profile')

<ApplicantProfileLayout
  activeSection={activeSection}
  onSectionChange={setActiveSection}
  profile={profile}
  onEditProfile={handleEditProfile}
>
  {children}
</ApplicantProfileLayout>
```

## Features

### ✅ Type Safety

- Mỗi role có type riêng cho sections
- TypeScript sẽ báo lỗi nếu dùng sai section

### ✅ Separation of Concerns

- UI logic ở `ProfileLayoutBase`
- Navigation items riêng biệt cho từng role
- Dễ customize mỗi layout độc lập

### ✅ Maintainability

- Thêm/sửa nav items chỉ cần sửa 1 file
- Không ảnh hưởng đến role khác
- Clear structure, dễ onboard dev mới

### ✅ Scalability

- Thêm role mới: tạo `XxxProfileLayout.tsx`
- Reuse `ProfileLayoutBase`
- Không cần thay đổi existing code

## File Locations

### Institution Profile View

```
src/app/(institution)/profile/view/page.tsx
```

### Applicant Profile View (to be created)

```
src/app/(applicant)/profile/view/page.tsx
```

## Next Steps

1. ✅ Created `ProfileLayoutBase.tsx` - Base layout
2. ✅ Created `InstitutionProfileLayout.tsx` - Institution-specific
3. ✅ Created `ApplicantProfileLayout.tsx` - Applicant-specific
4. ✅ Updated `src/app/(institution)/profile/view/page.tsx`
5. ⏳ Create `src/app/(applicant)/profile/view/page.tsx` (when needed)
6. ⏳ Deprecate old `ProfileLayout.tsx` (after all migrations)

## Benefits

| Aspect          | Before                     | After                                |
| --------------- | -------------------------- | ------------------------------------ |
| **Sidebar**     | Shared, hard to customize  | Separate for each role               |
| **Nav Items**   | Conditional rendering      | Explicit per role                    |
| **Type Safety** | Generic `ProfileSection`   | Specific types per role              |
| **Maintenance** | One file, many conditions  | Separate files, clear responsibility |
| **Testing**     | Hard to test role-specific | Easy to test each layout             |
| **Scalability** | Hard to add new roles      | Easy - just create new wrapper       |

## Notes

- `ProfileLayout.tsx` vẫn giữ lại cho backward compatibility
- Migrate dần sang layout mới
- Sau khi migrate hết, có thể xóa `ProfileLayout.tsx`
