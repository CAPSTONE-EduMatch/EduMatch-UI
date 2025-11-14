# Create Post - Components & Requirements for Sequence & Class Diagrams

## Overview

The Create Post feature allows authenticated institutions to create new posts
(Programs, Scholarships, Research Labs) with comprehensive details, validation,
and status management.

---

## 1. KEY COMPONENTS

### 1.1 CreateProgramPage Component

**Location:** `src/components/profile/institution/create/CreateProgramPage.tsx`

**Purpose:** Form component for creating/editing program posts

**Key Features:**

- Multi-section form (Overview, Structure, Requirements, Fees, etc.)
- Rich text editor for descriptions
- Date picker for dates
- Subdiscipline selector
- Language requirements management
- File requirements input
- Form validation
- Save as Draft or Publish

**State Management:**

- `formData` - Form data object
- `subdisciplines` - Available subdisciplines
- `showSuccessModal` - Success modal visibility
- `showErrorModal` - Error modal visibility
- `errorMessage` - Error message

**Key Methods:**

- `handleInputChange()` - Updates form field
- `handleSubmit()` - Submits form
- `handleAddLanguageRequirement()` - Adds language requirement
- `handleRemoveLanguageRequirement()` - Removes language requirement

### 1.2 CreateScholarshipPage Component

**Location:**
`src/components/profile/institution/create/CreateScholarshipPage.tsx`

**Purpose:** Form component for creating/editing scholarship posts

**Key Features:**

- Scholarship-specific fields
- Eligibility requirements
- Award amount input
- Essay requirement toggle

### 1.3 CreateResearchLabPage Component

**Location:**
`src/components/profile/institution/create/CreateResearchLabPage.tsx`

**Purpose:** Form component for creating/editing research lab posts

**Key Features:**

- Job-specific fields
- Salary range input
- Contract type selection
- Lab information

---

## 2. API ROUTES

### 2.1 POST /api/posts/programs

**Location:** `src/app/api/posts/programs/route.ts`

**Purpose:** Create a new program post

**Authentication:** Required via `requireAuth()`

**Request Body:**

```typescript
{
  programTitle: string
  startDate: string // ISO date string
  applicationDeadline: string // ISO date string
  subdiscipline: string
  duration: string
  degreeLevel: string
  attendance: string
  location: string
  courseInclude: string
  description: string
  academicRequirements: {
    gpa: string
    gre: string
    gmat: string
  }
  languageRequirements: Array<{
    language: string
    certificate: string
    score: string
  }>
  fileRequirements: {
    fileName: string
    fileDescription: string
  }
  tuitionFee: {
    international: string
    description: string
  }
  scholarship: {
    information: string
  }
  otherInformation: {
    content: string
  }
  status?: PostStatus // DRAFT, PUBLISHED, etc.
}
```

**Process:**

1. Validates authentication
2. Fetches institution for user
3. Validates dates (must be today or future)
4. Creates OpportunityPost record
5. Creates ProgramPost record
6. Creates PostCertificate records for language requirements
7. Creates PostDocument record for file requirements
8. Creates PostSubdiscipline link
9. Returns created post

**Response:**

```typescript
{
  success: true,
  post: {
    id: string,
    title: string,
    status: PostStatus
  }
}
```

### 2.2 POST /api/posts/scholarships

**Location:** `src/app/api/posts/scholarships/route.ts`

**Purpose:** Create a new scholarship post

**Request Body:**

```typescript
{
  scholarshipName: string
  startDate: string
  applicationDeadline: string
  country: string
  degree_level: string
  subdiscipline: string
  scholarshipType: string | string[]
  awardAmount: string
  number: string
  eligibilityRequirements: string | {
    academicMerit: string
    financialNeed: string
    otherCriteria: string
  }
  additionalInformation?: {
    content: string
  }
  status?: PostStatus
}
```

**Process:**

- Similar to program post creation
- Creates ScholarshipPost record
- Handles eligibility requirements (string or object format)
- Handles scholarship type (string or array)

### 2.3 POST /api/posts/research

**Location:** `src/app/api/posts/research/route.ts`

**Purpose:** Create a new research lab post

**Request Body:**

```typescript
{
  jobName: string
  startDate: string
  applicationDeadline: string
  country: string
  degree_level: string
  subdiscipline: string
  contractType: string
  attendance: string
  jobType: string
  salary: {
    min: string
    max: string
  }
  jobDescription: string
  requirements: string
  offerInfo: string
  labInfo: string
  additionalInformation?: {
    content: string
  }
  status?: PostStatus
}
```

**Process:**

- Similar to program post creation
- Creates JobPost record
- Validates salary min/max values
- Ensures min <= max

---

## 3. DATA FLOW

### 3.1 Create Post Flow

1. **User Clicks Add New**
   - Post type selected (Program, Scholarship, Research Lab)
   - Create form displayed
   - Form initialized with default values

2. **User Fills Form**
   - Form fields updated via `handleInputChange()`
   - Rich text editor for descriptions
   - Date pickers for dates
   - Subdiscipline selector
   - Language requirements added/removed

3. **User Submits Form**
   - `handleSubmit()` called
   - Form validation performed
   - Form data prepared
   - API request sent:
     - `POST /api/posts/programs` (for programs)
     - `POST /api/posts/scholarships` (for scholarships)
     - `POST /api/posts/research` (for research labs)

4. **API Processing**
   - Authentication validated
   - Institution fetched
   - Dates validated (must be today or future)
   - OpportunityPost created
   - Post-specific record created (ProgramPost, ScholarshipPost, or JobPost)
   - Related records created:
     - PostCertificate (language requirements)
     - PostDocument (file requirements)
     - PostSubdiscipline (subdiscipline link)

5. **Response Handling**
   - Success: Success modal shown, form closed, post list refreshed
   - Error: Error modal shown with message

### 3.2 Validation Flow

1. **Date Validation**
   - Start date must be today or future
   - Application deadline must be today or future
   - Dates parsed and validated

2. **Required Fields**
   - Title required
   - Dates required
   - Subdiscipline required
   - Other required fields validated

3. **Salary Validation (Research Labs)**
   - Min and max must be positive numbers
   - Min must be <= max

---

## 4. DATABASE OPERATIONS

### 4.1 Create OpportunityPost

```typescript
const opportunityPost = await prismaClient.opportunityPost.create({
	data: {
		post_id: uuidv4(),
		title: body.programTitle,
		start_date: startDate,
		end_date: applicationDeadline,
		location: body.location,
		other_info: body.otherInformation.content,
		status: body.status || 'DRAFT',
		create_at: new Date(),
		institution_id: institution.institution_id,
		degree_level: body.degreeLevel,
		description: body.description,
	},
});
```

### 4.2 Create ProgramPost

```typescript
await prismaClient.programPost.create({
	data: {
		post_id: opportunityPost.post_id,
		duration: body.duration,
		attendance: body.attendance,
		course_include: body.courseInclude,
		gpa: body.academicRequirements.gpa
			? parseFloat(body.academicRequirements.gpa)
			: null,
		gre: body.academicRequirements.gre
			? parseInt(body.academicRequirements.gre)
			: null,
		gmat: body.academicRequirements.gmat
			? parseInt(body.academicRequirements.gmat)
			: null,
		tuition_fee: body.tuitionFee.international
			? parseFloat(body.tuitionFee.international)
			: null,
		fee_description: body.tuitionFee.description,
		scholarship_info: body.scholarship.information,
		language_requirement: body.languageRequirements[0]?.language || null,
	},
});
```

### 4.3 Create PostCertificates

```typescript
for (const langReq of body.languageRequirements) {
	if (langReq.language && langReq.certificate && langReq.score) {
		await prismaClient.postCertificate.create({
			data: {
				certificate_id: generateId(),
				post_id: opportunityPost.post_id,
				name: langReq.certificate,
				score: langReq.score,
			},
		});
	}
}
```

### 4.4 Create PostDocument

```typescript
// Get or create document type
let documentType = await prismaClient.documentType.findFirst({
	where: { name: 'Required Documents' },
});

if (!documentType) {
	documentType = await prismaClient.documentType.create({
		data: {
			document_type_id: generateId(),
			name: 'Required Documents',
			description: 'Documents required for application',
		},
	});
}

await prismaClient.postDocument.create({
	data: {
		document_id: generateId(),
		post_id: opportunityPost.post_id,
		document_type_id: documentType.document_type_id,
		name: body.fileRequirements.fileName,
		description: body.fileRequirements.fileDescription,
	},
});
```

### 4.5 Create PostSubdiscipline Link

```typescript
const subdiscipline = await prismaClient.subdiscipline.findFirst({
	where: { name: body.subdiscipline },
});

if (subdiscipline) {
	await prismaClient.postSubdiscipline.create({
		data: {
			subdiscipline_id: subdiscipline.subdiscipline_id,
			post_id: opportunityPost.post_id,
			add_at: new Date(),
		},
	});
}
```

---

## 5. DATABASE MODELS

### 5.1 OpportunityPost

```typescript
{
	post_id: string(PK);
	institution_id: string(FK);
	title: string;
	start_date: DateTime;
	end_date: DateTime;
	location: string;
	other_info: string | null;
	status: PostStatus;
	create_at: DateTime;
	degree_level: string;
	description: string | null;
}
```

### 5.2 ProgramPost

```typescript
{
	post_id: string(PK, FK);
	duration: string;
	attendance: string;
	course_include: string | null;
	gpa: number | null;
	gre: number | null;
	gmat: number | null;
	tuition_fee: number | null;
	fee_description: string | null;
	scholarship_info: string | null;
	language_requirement: string | null;
}
```

### 5.3 ScholarshipPost

```typescript
{
	post_id: string(PK, FK);
	description: string | null;
	type: string;
	number: number | null;
	award_amount: number | null;
	eligibility_requirements: string | null;
	essay_required: boolean;
}
```

### 5.4 JobPost

```typescript
{
	post_id: string(PK, FK);
	contract_type: string;
	attendance: string;
	job_type: string;
	min_salary: number | null;
	max_salary: number | null;
	job_description: string | null;
	requirements: string | null;
	offer_info: string | null;
	lab_info: string | null;
}
```

### 5.5 PostCertificate

```typescript
{
	certificate_id: string(PK);
	post_id: string(FK);
	name: string;
	score: string;
}
```

### 5.6 PostDocument

```typescript
{
	document_id: string(PK);
	post_id: string(FK);
	document_type_id: string(FK);
	name: string;
	description: string | null;
}
```

### 5.7 PostSubdiscipline

```typescript
{
	post_id: string(FK);
	subdiscipline_id: string(FK);
	add_at: DateTime;
}
```

---

## 6. VALIDATION

### 6.1 Date Validation

- Start date must be today or in the future
- Application deadline must be today or in the future
- Dates must be valid ISO date strings

### 6.2 Required Fields

**Program:**

- programTitle
- startDate
- applicationDeadline
- subdiscipline
- duration
- degreeLevel
- attendance
- location

**Scholarship:**

- scholarshipName
- startDate
- applicationDeadline
- country
- degree_level
- subdiscipline
- scholarshipType
- awardAmount

**Research Lab:**

- jobName
- startDate
- applicationDeadline
- country
- degree_level
- subdiscipline
- contractType
- attendance
- jobType

### 6.3 Salary Validation (Research Labs)

- Min salary must be positive number
- Max salary must be positive number
- Min must be <= max

---

## 7. INTERFACES

### 7.1 CreateProgramRequest

```typescript
interface CreateProgramRequest {
	programTitle: string;
	startDate: string;
	applicationDeadline: string;
	subdiscipline: string;
	duration: string;
	degreeLevel: string;
	attendance: string;
	location: string;
	courseInclude: string;
	description: string;
	academicRequirements: {
		gpa: string;
		gre: string;
		gmat: string;
	};
	languageRequirements: Array<{
		language: string;
		certificate: string;
		score: string;
	}>;
	fileRequirements: {
		fileName: string;
		fileDescription: string;
	};
	tuitionFee: {
		international: string;
		description: string;
	};
	scholarship: {
		information: string;
	};
	otherInformation: {
		content: string;
	};
	status?: PostStatus;
}
```

---

## 8. FEATURES

### 8.1 Form Sections

**Program:**

- Overview (title, dates, subdiscipline, duration, degree level, attendance,
  location)
- Programme Structure (courses, description)
- Admission Requirements (academic, language, files)
- Tuition Fee
- Scholarship
- Other Information

**Scholarship:**

- Basic Information
- Eligibility Requirements
- Award Details
- Additional Information

**Research Lab:**

- Job Information
- Requirements
- Offer Information
- Lab Information

### 8.2 Form Controls

- Text inputs
- Rich text editor
- Date picker
- Select dropdowns
- Multi-select (subdisciplines)
- Dynamic language requirements list
- File requirements input

### 8.3 Status Options

- DRAFT (default)
- PUBLISHED
- SUBMITTED

---

## 9. SEQUENCE DIAGRAM ACTORS

1. **User** - Creates post
2. **CreatePostPage** - Form component
3. **API Route Handler** - Server endpoint
4. **requireAuth** - Authentication
5. **Prisma Client** - Database
6. **Database** - PostgreSQL

---

## 10. CLASS DIAGRAM ENTITIES

### 10.1 Frontend Classes

- `CreateProgramPage` (Component)
- `CreateScholarshipPage` (Component)
- `CreateResearchLabPage` (Component)

### 10.2 Backend Classes

- API Route Handlers (POST)
- `requireAuth` (Utility)
- Prisma Models (OpportunityPost, ProgramPost, ScholarshipPost, JobPost,
  PostCertificate, PostDocument, PostSubdiscipline)

---

## 11. KEY METHODS

### 11.1 Component Methods

- `handleInputChange()` - Update form field
- `handleSubmit()` - Submit form
- `handleAddLanguageRequirement()` - Add language requirement
- `handleRemoveLanguageRequirement()` - Remove language requirement

### 11.2 API Methods

- `POST()` - Create post

---

## 12. FILE STRUCTURE

```
src/
├── components/profile/institution/create/
│   ├── CreateProgramPage.tsx
│   ├── CreateScholarshipPage.tsx
│   └── CreateResearchLabPage.tsx
└── app/api/posts/
    ├── programs/route.ts (POST)
    ├── scholarships/route.ts (POST)
    └── research/route.ts (POST)
```

---

## 13. DIAGRAM REQUIREMENTS

### Sequence Diagram:

- User fills form → Submit → API → Validation → Database → Response
- Include all database operations (OpportunityPost, specific post type,
  certificates, documents, subdisciplines)
- Include error handling paths

### Class Diagram:

- Form component classes
- API route handlers
- Database models and relationships
- Validation logic

---

## END OF DOCUMENT
