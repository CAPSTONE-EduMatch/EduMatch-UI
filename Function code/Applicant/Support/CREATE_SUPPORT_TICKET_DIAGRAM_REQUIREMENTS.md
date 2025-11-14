# Create Support Ticket - Components & Requirements for Sequence & Class Diagrams

## Overview

The Create Support Ticket feature allows both authenticated users and guests to
submit support requests with problem descriptions, file attachments, and receive
email confirmations. The system stores tickets in the database, assigns them to
managers, and sends notifications to support staff.

---

## 1. KEY COMPONENTS

### 1.1 Support Component

**Location:** `src/app/(applicant)/support/Support.tsx`

**Purpose:** Main support page component with FAQ and ticket creation form

**Key Features:**

- FAQ section with expandable questions
- Support ticket creation form
- File upload support
- Problem type selection
- Guest and authenticated user support
- File management modal

**State Management:**

- `activeTab` - Active FAQ category (account, application, subscription, other)
- `expandedFaqs` - Expanded FAQ items
- `problemType` - Selected problem type
- `question` - Support question text
- `email` - Guest email (if not authenticated)
- `uploadedFiles` - Array of uploaded files
- `showManageModal` - File management modal visibility
- `isClosing` - Modal closing animation state
- `submitting` - Form submission state
- `submitMessage` - Success message
- `submitError` - Error message

**Key Methods:**

- `handleSubmit()` - Submits support ticket
- `handleFileUpload()` - Handles file selection and validation
- `removeFile()` - Removes file from list
- `handleOpenModal()` - Opens file management modal
- `handleCloseModal()` - Closes file management modal
- `toggleFaq()` - Expands/collapses FAQ items
- `renderTabContent()` - Renders FAQ content

**File Validation:**

- Images (PNG, JPEG): Max 5MB
- Documents (PDF, DOC, DOCX): Max 10MB
- Unsupported types rejected

### 1.2 Support Page

**Location:** `src/app/(applicant)/support/page.tsx`

**Purpose:** Page wrapper for Support component

---

## 2. API ROUTE

### 2.1 POST /api/support

**Location:** `src/app/api/support/route.ts`

**Purpose:** Create support ticket

**Request Formats:**

1. **JSON** (no files):

```typescript
{
  problemType: string
  question: string
  email?: string  // Required for guests
}
```

2. **Multipart/Form-Data** (with files):

```typescript
FormData {
  problemType: string
  question: string
  email?: string
  files: File[]  // Multiple files
}
```

**Process:**

1. **Content Type Detection**
   - Checks `Content-Type` header
   - Handles `multipart/form-data` or `application/json`

2. **Data Extraction**
   - Extracts `problemType` (default: "other")
   - Extracts `question` (required)
   - Extracts `email` (for guests)
   - Extracts files (if multipart)

3. **Validation**
   - Validates question is not empty (400 if empty)
   - Validates email for guests (400 if missing)

4. **Authentication Check (Optional)**
   - Tries to get session via `requireAuth()`
   - Allows guests (no authentication required)
   - Extracts `userId` and `userEmail` if authenticated

5. **Email Resolution**
   - Uses `userEmail` if authenticated
   - Uses `guestEmail` if guest
   - Validates email exists (400 if missing)

6. **Profile Linking**
   - If authenticated, fetches applicant/institution profile
   - Links support ticket to profile (if exists)
   - Sets `applicantId` or `institutionId`

7. **Manager Resolution**
   - Calls `resolveManagerUserId()`
   - Priority:
     1. User with email from `ADMIN_EMAIL` env var
     2. User with role = "admin"
     3. Requester's userId (if authenticated)
   - If no manager found, sends email only (no DB storage)

8. **Support Ticket Creation**
   - Generates `support_id` (UUID)
   - Creates `SupportRequirement` record:
     - `support_id` (PK)
     - `applicant_id` (optional FK)
     - `institution_id` (optional FK)
     - `content` (JSON string with problemType, question, senderEmail,
       isAuthenticated, createdAt, attachments)
     - `create_at` (timestamp)
     - `status` (true = active)
     - `manager_id` (FK to User)

9. **Email Notifications**
   - **To Admin(s):**
     - Recipients from `SUPPORT_RECEIVER_EMAIL` env var (semicolon-separated)
     - Subject: `Support Request: {problemType}`
     - Includes: problem type, sender email, authentication status,
       applicant/institution IDs, support ID, question, attachments
   - **To Customer:**
     - Recipient: sender email
     - Subject: `Support Request Received - {problemType}`
     - Includes: confirmation, support ID, problem type, question, next steps,
       help center link

10. **Response**
    - Returns success with support ID

**Response:**

```typescript
{
  success: true,
  stored: true,  // false if no manager found
  id: string     // support_id
}
```

**Error Responses:**

- `400` - Question required / Email required for guests
- `500` - Server error

---

## 3. DATA FLOW

### 3.1 Create Support Ticket Flow

1. **User Navigates to Support Page**
   - Accesses `/support` route
   - `Support` component renders
   - FAQ section displayed

2. **User Fills Form**
   - Selects problem type (dropdown)
   - Types question (textarea)
   - Provides email (if guest)
   - Optionally uploads files

3. **File Upload (Optional)**
   - User clicks attach button
   - File input opens
   - User selects files
   - `handleFileUpload()` validates:
     - File type (PNG, JPEG, PDF, DOC, DOCX)
     - File size (images: 5MB, documents: 10MB)
   - Valid files added to `uploadedFiles` state
   - File management modal opens

4. **Form Submission**
   - User clicks send button
   - `handleSubmit()` called
   - Validates question not empty
   - Validates email (if guest)

5. **API Request**
   - If files exist: `FormData` with files
   - If no files: JSON body
   - `POST /api/support` called

6. **API Processing**
   - Content type detected
   - Data extracted
   - Validation performed
   - Authentication checked (optional)
   - Manager resolved
   - Support ticket created in database
   - Emails sent

7. **Response Handling**
   - Success: Success message displayed
   - Form cleared
   - Files cleared
   - Error: Error message displayed

---

## 4. DATABASE OPERATIONS

### 4.1 SupportRequirement Creation

```typescript
await prismaClient.supportRequirement.create({
	data: {
		support_id: crypto.randomUUID(),
		applicant_id: applicantId || undefined,
		institution_id: institutionId || undefined,
		content: JSON.stringify({
			problemType,
			question,
			senderEmail,
			isAuthenticated: !!userId,
			createdAt: now.toISOString(),
			attachments: emailAttachments.map((a) => a.filename),
		}),
		create_at: now,
		status: true,
		manager_id: managerId,
	},
});
```

### 4.2 Manager Resolution

```typescript
// Priority 1: Admin from env var
const adminByEnv = await prismaClient.user.findFirst({
	where: { email: process.env.ADMIN_EMAIL },
	select: { id: true },
});

// Priority 2: Admin role
const adminUser = await prismaClient.user.findFirst({
	where: { role: 'admin' },
	select: { id: true },
});
```

### 4.3 Profile Linking

```typescript
const [applicant, institution] = await Promise.all([
	prismaClient.applicant.findUnique({
		where: { user_id: userId },
		select: { applicant_id: true },
	}),
	prismaClient.institution.findUnique({
		where: { user_id: userId },
		select: { institution_id: true },
	}),
]);
```

---

## 5. DATABASE MODELS

### 5.1 SupportRequirement

```typescript
{
  support_id: string (PK, unique)
  applicant_id: string? (FK, optional)
  institution_id: string? (FK, optional)
  content: string (JSON)
  create_at: DateTime
  status: boolean (true = active)
  update_at: DateTime? (optional)
  manager_id: string (FK to User)
}
```

**Relations:**

- `applicant` - Applicant? (applicant_id)
- `institution` - Institution? (institution_id)
- `manager` - User (manager_id)

**Indexes:**

- `applicant_id`
- `institution_id`
- `manager_id`
- `status`

### 5.2 Content JSON Structure

```typescript
{
  problemType: string
  question: string
  senderEmail: string
  isAuthenticated: boolean
  createdAt: string (ISO)
  attachments: string[]  // Filenames only
}
```

---

## 6. INTERFACES

### 6.1 SupportBody

```typescript
interface SupportBody {
	problemType?: string;
	question?: string;
	email?: string; // For guests
}
```

### 6.2 SupportResponse

```typescript
interface SupportResponse {
	success: boolean;
	stored: boolean; // true if stored in DB, false if email only
	id?: string; // support_id (if stored)
}
```

### 6.3 Problem Types

```typescript
'application' | 'account' | 'subscription' | 'technical' | 'other';
```

---

## 7. FEATURES

### 7.1 FAQ Section

- Categorized FAQs (Account, Application, Subscription, Other)
- Expandable/collapsible items
- Tab navigation
- Smooth animations

### 7.2 Ticket Creation

- Problem type selection
- Question textarea
- Email input (guests only)
- File attachments
- Form validation
- Success/error messages

### 7.3 File Management

- Multiple file upload
- File type validation
- File size validation
- File preview modal
- Remove files
- File count display

### 7.4 Email Notifications

- Admin notification (with attachments)
- Customer confirmation
- Support ID reference
- Help center links

---

## 8. VALIDATION

### 8.1 Client-Side Validation

- Question required (non-empty)
- Email required for guests
- File type validation (PNG, JPEG, PDF, DOC, DOCX)
- File size validation:
  - Images: Max 5MB
  - Documents: Max 10MB

### 8.2 Server-Side Validation

- Question required (400 if empty)
- Email required for guests (400 if missing)
- Content type handling (multipart vs JSON)

---

## 9. ERROR HANDLING

### 9.1 Error Scenarios

- **Question Empty:** Shows error, prevents submission
- **Email Missing (Guest):** Shows error, prevents submission
- **File Too Large:** Alert shown, file rejected
- **Unsupported File Type:** Alert shown, file rejected
- **API Error:** Error message displayed
- **No Manager Found:** Email sent, ticket not stored

### 9.2 Error Display

- Inline error messages
- File validation alerts
- Submission error messages
- Loading states during submission

---

## 10. EMAIL NOTIFICATIONS

### 10.1 Admin Email

- **Recipients:** From `SUPPORT_RECEIVER_EMAIL` env var (semicolon-separated)
- **Subject:** `Support Request: {problemType}`
- **Content:**
  - Problem type
  - Sender email
  - Authentication status
  - Applicant/Institution IDs (if applicable)
  - Support ID
  - Question text
  - Attachments (if any)

### 10.2 Customer Email

- **Recipient:** Sender email
- **Subject:** `Support Request Received - {problemType}`
- **Content:**
  - Confirmation message
  - Support ID (if stored)
  - Problem type
  - Question text
  - Next steps
  - Help center link

---

## 11. MANAGER ASSIGNMENT

### 11.1 Assignment Priority

1. **Admin from Env Var:** User with email matching `ADMIN_EMAIL`
2. **Admin Role:** User with `role = "admin"`
3. **Requester:** User's own ID (if authenticated)
4. **No Manager:** Email only, no DB storage

### 11.2 Fallback Behavior

- If no manager found, ticket not stored in database
- Emails still sent to admin and customer
- Response includes `stored: false`

---

## 12. SEQUENCE DIAGRAM ACTORS

1. **User** - Submits support ticket
2. **Support Component** - UI form
3. **API Route Handler** - Server endpoint
4. **requireAuth** - Authentication (optional)
5. **Prisma Client** - Database operations
6. **Database** - PostgreSQL
7. **EmailService** - Email notifications
8. **Manager Resolution** - Admin lookup

---

## 13. CLASS DIAGRAM ENTITIES

### 13.1 Frontend Classes

- `Support` (Component)
- File upload handlers
- Form validation

### 13.2 Backend Classes

- API Route Handler (POST)
- `requireAuth` (Utility)
- `EmailService` (Service)
- `resolveManagerUserId` (Function)
- Prisma Models (SupportRequirement, User, Applicant, Institution)

---

## 14. KEY METHODS

### 14.1 Support Component Methods

- `handleSubmit()` - Submit form
- `handleFileUpload()` - Upload files
- `removeFile()` - Remove file
- `handleOpenModal()` - Open file modal
- `handleCloseModal()` - Close file modal

### 14.2 API Methods

- `POST()` - Create support ticket
- `resolveManagerUserId()` - Find manager
- `getSupportReceiverEmails()` - Get admin emails
- `escapeHtml()` - Escape HTML

---

## 15. FILE STRUCTURE

```
src/
├── app/(applicant)/support/
│   ├── page.tsx
│   └── Support.tsx
├── app/api/support/
│   └── route.ts (POST handler)
└── services/email/
    └── email-service.ts
```

---

## 16. DIAGRAM REQUIREMENTS

### Sequence Diagram:

- User action → Component → API → Database → Email
- Show file upload flow
- Show manager resolution
- Show email sending
- Include guest vs authenticated paths

### Class Diagram:

- Component class with methods
- API route handler
- Database models and relationships
- Email service
- Manager resolution logic

---

## 17. GUEST SUPPORT

### 17.1 Guest Features

- Can submit tickets without authentication
- Must provide email address
- No profile linking
- Same email notifications

### 17.2 Authenticated Features

- Email auto-filled from profile
- Profile linking (applicant/institution)
- Better tracking
- Support ID in confirmation

---

## END OF DOCUMENT
