# Disciplines & Subdisciplines Caching Solution

## Overview

Implemented a centralized caching solution for disciplines and subdisciplines
using React Query and Context API. This eliminates redundant API calls and
ensures data is loaded once and shared across all components.

## Architecture

### 1. **React Query Hook** (`src/hooks/data/useDisciplines.ts`)

- `useSubdisciplines()` - Fetches and caches subdisciplines
- `useDisciplines()` - Fetches and caches full disciplines data
- Automatic caching with 10-minute stale time
- Built-in retry logic with exponential backoff
- Shared cache across all components using the same query key

### 2. **Context Provider** (`src/contexts/DisciplinesContext.tsx`)

- Wraps the React Query hooks
- Provides easy access via `useDisciplinesContext()` hook
- Exposes loading states and error handling
- Pre-fetches data when app loads

### 3. **Layout Integration** (`src/app/layout.tsx`)

- `DisciplinesProvider` added to root layout
- Data loads once when app initializes
- Available to all components throughout the app

## Benefits

✅ **Single API Call** - Data fetched once, cached for 10 minutes ✅ **Automatic
Sharing** - All components use the same cached data ✅ **Better Performance** -
No redundant network requests ✅ **Production Ready** - Handles errors, retries,
and loading states ✅ **Easy to Use** - Simple hook interface

## Usage

### Option 1: Use Context (Recommended for most cases)

```tsx
import { useDisciplinesContext } from '@/contexts/DisciplinesContext';

function MyComponent() {
	const { subdisciplines, isLoadingSubdisciplines, subdisciplinesError } =
		useDisciplinesContext();

	// Use subdisciplines directly
	return <CustomSelect options={subdisciplines} />;
}
```

### Option 2: Use Hook Directly (For advanced use cases)

```tsx
import { useSubdisciplines } from '@/hooks/data/useDisciplines';

function MyComponent() {
	const { data, isLoading, error } = useSubdisciplines();

	// Full control over query state
}
```

## Updated Components

The following components have been updated to use the shared cache:

1. ✅ `BasicInfoStep.tsx` - Applicant profile creation
2. ✅ `AcademicInfoStep.tsx` - Applicant academic info
3. ⏳ `InstitutionDetailsStep.tsx` - Institution profile (can be updated)
4. ⏳ Other components using disciplines (can be updated)

## Migration Guide

### Before (Old Pattern)

```tsx
const [subdisciplines, setSubdisciplines] = useState([]);

useEffect(() => {
	const loadSubdisciplines = async () => {
		try {
			const response = await ApiService.getSubdisciplines();
			if (response.success) {
				setSubdisciplines(response.subdisciplines);
			}
		} catch (error) {
			console.error('Failed to load:', error);
		}
	};
	loadSubdisciplines();
}, []);
```

### After (New Pattern)

```tsx
import { useDisciplinesContext } from '@/contexts/DisciplinesContext';

const { subdisciplines = [] } = useDisciplinesContext();
// That's it! Data is already loaded and cached
```

## Cache Configuration

- **Stale Time**: 10 minutes (data considered fresh)
- **Garbage Collection Time**: 30 minutes (kept in memory)
- **Retry**: 3 attempts with exponential backoff
- **Cache Key**: `['subdisciplines']` and `['disciplines']`

## Production Benefits

1. **Reduced API Load** - Single request per user session (instead of multiple)
2. **Faster Page Loads** - Data already cached when components mount
3. **Better UX** - No loading spinners on subsequent component mounts
4. **Error Resilience** - Automatic retries handle temporary failures

## Next Steps

To update remaining components:

1. Remove local `useState` and `useEffect` for disciplines
2. Import `useDisciplinesContext`
3. Use the context values directly

Components that can be updated:

- `InstitutionDetailsStep.tsx`
- `FilterSidebar.tsx`
- `InstitutionProfileSection.tsx`
- `CreateProgramPage.tsx`
- `CreateScholarshipPage.tsx`
- `CreateResearchLabPage.tsx`
- `ProfileView` page
