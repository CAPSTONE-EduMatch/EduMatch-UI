# Add & Remove Post to Wishlist - Components & Requirements for Sequence & Class Diagrams

## Overview

The Add & Remove Post to Wishlist feature allows authenticated applicants to add
posts (programs, scholarships, research labs) to their wishlist or remove them,
with toggle functionality and real-time UI updates.

---

## 1. KEY COMPONENTS

### 1.1 Hook

**`useWishlist`** (`src/hooks/wishlist/useWishlist.ts`)

- `addToWishlist(postId, status)` - Adds post to wishlist
- `removeFromWishlist(postId)` - Removes post from wishlist
- `toggleWishlistItem(postId)` - Toggles wishlist status
- `isInWishlist(postId)` - Checks if post is in wishlist

### 1.2 Service

**`WishlistService`** (`src/services/wishlist/wishlist-service.ts`)

- `addToWishlist(data)` - POST request to add item
- `removeFromWishlist(postId)` - DELETE request to remove item
- `toggleWishlistItem(postId)` - Toggle operation
- `isInWishlist(postId)` - Check status

### 1.3 UI Components

- **Wishlist Button/Icon** - Toggle button in post cards
- **Heart Icon** - Visual indicator (filled = in wishlist, outline = not in
  wishlist)
- Used in: `ProgramsTab`, `ScholarshipsTab`, `ResearchLabsTab`

---

## 2. API ROUTES

### 2.1 POST /api/wishlist

**Location:** `src/app/api/wishlist/route.ts`

**Request Body:**

```typescript
{
  postId: string
  status?: 0 | 1  // Optional, default: 1 (active)
}
```

**Process:**

1. Validates authentication (`requireAuth()`)
2. Checks applicant profile exists
3. Validates postId provided
4. Verifies post exists
5. Checks if item already in wishlist
   - If exists: Updates timestamp
   - If not: Creates new wishlist entry
6. Fetches full post data with relations
7. Returns wishlist item with post details

**Response:**

```typescript
{
  success: true,
  data: WishlistItem
}
```

**Error Codes:**

- `APPLICANT_NOT_FOUND` (404)
- `MISSING_POST_ID` (400)
- `POST_NOT_FOUND` (404)

### 2.2 DELETE /api/wishlist/[postId]

**Location:** `src/app/api/wishlist/[postId]/route.ts`

**Process:**

1. Validates authentication
2. Checks applicant profile
3. Verifies wishlist item exists
4. Deletes wishlist entry
5. Returns success message

**Response:**

```typescript
{
  success: true,
  message: "Wishlist item removed successfully"
}
```

**Error Codes:**

- `APPLICANT_NOT_FOUND` (404)
- `WISHLIST_ITEM_NOT_FOUND` (404)

---

## 3. DATA FLOW

### 3.1 Add to Wishlist Flow

1. **User clicks wishlist button**
   - `toggleWishlistItem(postId)` or `addToWishlist(postId)` called

2. **Hook calls service**
   - `wishlistService.addToWishlist({ postId, status: 1 })`

3. **API request**
   - `POST /api/wishlist` with `{ postId }`
   - Authentication validated
   - Applicant profile checked
   - Post existence verified
   - Duplicate check performed

4. **Database operation**
   - If exists: Update `add_at` timestamp
   - If new: Create `Wishlist` record
   - Fetch related post data

5. **Response & update**
   - Wishlist item returned
   - Hook updates local state
   - UI updates (icon changes to filled)
   - Stats refreshed

### 3.2 Remove from Wishlist Flow

1. **User clicks wishlist button**
   - `toggleWishlistItem(postId)` or `removeFromWishlist(postId)` called

2. **Hook calls service**
   - `wishlistService.removeFromWishlist(postId)`

3. **API request**
   - `DELETE /api/wishlist/[postId]`
   - Authentication validated
   - Applicant profile checked
   - Wishlist item existence verified

4. **Database operation**
   - Delete `Wishlist` record using composite key

5. **Response & update**
   - Success message returned
   - Hook removes item from local state
   - UI updates (icon changes to outline)
   - Stats refreshed

### 3.3 Toggle Flow

1. **User clicks wishlist button**
   - `toggleWishlistItem(postId)` called

2. **Service checks status**
   - `isInWishlist(postId)` checks if exists
   - If exists: Calls `removeFromWishlist()`
   - If not: Calls `addToWishlist()`

3. **UI updates immediately**
   - Optimistic update based on response
   - Icon toggles state

---

## 4. DATABASE OPERATIONS

### 4.1 Add Operation

```typescript
// Check if exists
const existing = await prismaClient.wishlist.findFirst({
	where: {
		post_id: postId,
		applicant_id: applicantId,
	},
});

// Update or Create
if (existing) {
	await prismaClient.wishlist.update({
		where: {
			applicant_id_post_id: {
				applicant_id: applicantId,
				post_id: postId,
			},
		},
		data: { add_at: new Date() },
	});
} else {
	await prismaClient.wishlist.create({
		data: {
			applicant_id: applicantId,
			post_id: postId,
			add_at: new Date(),
		},
	});
}
```

### 4.2 Remove Operation

```typescript
await prismaClient.wishlist.delete({
	where: {
		applicant_id_post_id: {
			applicant_id: applicantId,
			post_id: postId,
		},
	},
});
```

---

## 5. INTERFACES

### 5.1 Request Types

```typescript
interface WishlistCreateRequest {
	postId: string;
	status?: 0 | 1;
}
```

### 5.2 Response Types

```typescript
interface WishlistItemResponse {
	success: boolean;
	data: WishlistItem;
}

interface WishlistItem {
	id: string;
	postId: string;
	userId: string;
	createdAt: string;
	status: 0 | 1;
	post: {
		id: string;
		title: string;
		// ... post details
	};
}
```

---

## 6. STATE MANAGEMENT

### 6.1 Hook State Updates

- **Add:** Adds item to `items` array, refreshes stats
- **Remove:** Filters item from `items` array, refreshes stats
- **Toggle:** Updates array based on response status

### 6.2 UI State

- **Icon state:** Filled (in wishlist) / Outline (not in wishlist)
- **Button state:** Loading during operation
- **Optimistic updates:** Immediate UI feedback

---

## 7. ERROR HANDLING

### 7.1 Error Scenarios

- **No applicant profile:** Redirect to profile creation
- **Post not found:** Show error message
- **Network error:** Show error, allow retry
- **Duplicate add:** Updates timestamp (no error)

### 7.2 Error Responses

```typescript
interface WishlistErrorResponse {
	success: false;
	error: string;
	code: string;
}
```

---

## 8. VALIDATION

### 8.1 Client-Side

- Post ID must be provided
- User must be authenticated
- Applicant profile must exist

### 8.2 Server-Side

- Authentication required
- Applicant profile required
- Post must exist
- Wishlist item must exist (for delete)

---

## 9. SEQUENCE DIAGRAM ACTORS

1. **User** - Clicks wishlist button
2. **UI Component** - Post card with wishlist button
3. **useWishlist Hook** - State management
4. **WishlistService** - API client
5. **API Route Handler** - Server endpoint
6. **requireAuth** - Authentication utility
7. **Prisma Client** - Database access
8. **Database** - PostgreSQL

---

## 10. CLASS DIAGRAM ENTITIES

### 10.1 Frontend

- `useWishlist` (Hook)
- `WishlistService` (Service Class)
- Post Card Components (UI)

### 10.2 Backend

- API Route Handlers (POST, DELETE)
- `requireAuth` (Utility)
- Prisma Models (`Wishlist`, `OpportunityPost`, `Applicant`)

---

## 11. KEY METHODS

### 11.1 Hook Methods

- `addToWishlist(postId, status)` - Add with refresh
- `removeFromWishlist(postId)` - Remove with state update
- `toggleWishlistItem(postId)` - Toggle with optimistic update
- `isInWishlist(postId)` - Check local state

### 11.2 Service Methods

- `addToWishlist(data)` - POST request
- `removeFromWishlist(postId)` - DELETE request
- `toggleWishlistItem(postId)` - Check then add/remove
- `isInWishlist(postId)` - Check via API

### 11.3 API Methods

- `POST()` - Add/update wishlist item
- `DELETE()` - Remove wishlist item
- Authentication validation
- Database operations

---

## 12. FILE STRUCTURE

```
src/
├── hooks/wishlist/
│   └── useWishlist.ts
├── services/wishlist/
│   └── wishlist-service.ts
├── app/api/wishlist/
│   ├── route.ts (POST handler)
│   └── [postId]/route.ts (DELETE handler)
└── types/api/
    └── wishlist-api.ts
```

---

## 13. DIAGRAM REQUIREMENTS

### Sequence Diagram:

- User action → Hook → Service → API → Database
- Show authentication checks
- Show duplicate handling
- Show state updates
- Show error paths

### Class Diagram:

- Hook class with methods
- Service class with methods
- API route handlers
- Database models
- Relationships between classes

---

## END OF DOCUMENT
