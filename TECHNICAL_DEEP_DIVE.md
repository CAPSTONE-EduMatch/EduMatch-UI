# EduMatch Technical Deep Dive

## 🤖 AI & Machine Learning Implementation

### 1. OCR (Optical Character Recognition) with Mistral AI

#### Architecture Overview

The OCR system uses **Mistral AI's OCR API** (`mistral-ocr-latest` model) to
extract text from PDFs and images. The service is implemented as a singleton
pattern for efficient resource management.

#### Implementation Details

**Service Location**: `src/services/ocr/mistral-ocr-service.ts`

**Key Features**:

- **File Upload to Mistral Cloud**: Files are uploaded to Mistral's cloud
  storage before OCR processing
- **Signed URL Processing**: Uses signed URLs for secure document access
- **Automatic Cleanup**: Uploaded files are deleted after OCR processing to save
  storage
- **Multi-format Support**: Handles PDFs and images (JPEG, PNG, GIF, BMP, WebP)
- **File Size Limit**: 10MB maximum file size

**Processing Flow**:

```
1. User uploads file → FileUploadManagerWithOCR component
2. Check if file type is supported (PDF or image)
3. Upload file to Mistral Cloud → Get file ID and signed URL
4. Call Mistral OCR API with signed URL
5. Extract text from OCR response (handles multiple response formats)
6. Clean up uploaded file from Mistral Cloud
7. Return extracted text to frontend
```

**Code Example**:

```typescript
// PDF Processing
public async processPDF(file: File): Promise<OCRResult> {
  // 1. Upload PDF to Mistral Cloud
  const uploadResult = await this.uploadFile(file);

  // 2. Process OCR with signed URL
  const ocrResponse = await this.client!.ocr.process({
    model: "mistral-ocr-latest",
    document: {
      type: "document_url",
      documentUrl: uploadResult.signedUrl,
    },
    includeImageBase64: false,
  });

  // 3. Clean up uploaded file
  await this.client!.files.delete({ fileId: uploadResult.id });

  // 4. Extract text from response
  const extractedText = this.extractTextFromResponse(ocrResponse);

  return { success: true, extractedText, confidence: 0.9 };
}
```

**Response Parsing**: The service handles multiple response formats from
Mistral:

- `response.pages[].markdown` - Primary text extraction
- `response.pages[].content` - Fallback content
- `response.pages[].text` - Alternative text field
- `response.pages[].blocks[]` - Block-level extraction

**Error Handling**:

- Graceful degradation if OCR service is unavailable
- Detailed error messages for debugging
- Fallback to empty string if text extraction fails

---

### 2. File Validation with Mistral AI (Ollama Service)

#### Architecture Overview

The file validation service uses **Mistral AI's Chat API** (not Ollama, despite
the name) to validate uploaded documents against specific document types. It
uses structured prompts and JSON responses.

**Service Location**: `src/services/ai/ollama-file-validation-service.ts`

#### Document Types Supported

1. **CV/Resume**: Validates personal info, work experience, education, skills
2. **Language Certificates**: Validates test name, scores, dates, issuing
   authority
3. **Degree Certificates**: Validates degree type, field of study, institution,
   graduation date
4. **Academic Transcripts**: Validates course lists, grades, GPA, institution
5. **Institution Verification**: Validates official name, identifiers,
   letterhead, seals
6. **Research Papers**: Validates title, authors, abstract, sections, references
7. **Application Documents**: General validation for application supporting
   documents

#### Validation Flow

```
1. OCR extracts text from document
2. Text is sent to Mistral AI with category-specific prompt
3. Mistral analyzes document structure and content
4. Returns JSON validation result:
   {
     "isValid": boolean,
     "action": "accept" | "reupload",
     "confidence": 0.0-1.0,
     "reasoning": "string",
     "suggestions": ["string"]
   }
5. Frontend displays validation result and suggestions
```

#### Prompt Engineering

Each document type has a specialized system prompt that defines:

- **Required Elements**: What must be present for validation
- **Validation Criteria**: Strict rules for acceptance
- **Conservative Approach**: "When in doubt, reject" philosophy
- **Security Checks**: Detection of sensitive personal data

**Example Prompt (Language Certificates)**:

```
A valid language certificate should contain:
- Test name (e.g., IELTS, TOEFL, TOEIC, HSK, JLPT, TOPIK)
- Test scores or proficiency levels
- Test date or issue date
- Candidate name
- Official certification or issuing authority

Be conservative:
- If key elements are missing or unclear, treat as INVALID
- If document looks like instructions or article, it is INVALID
```

#### Security Features

- **Sensitive Data Detection**: Flags documents with full IDs, passport numbers,
  credit cards, bank accounts
- **Content Validation**: Ensures documents match expected type
- **Structured Output**: Enforces JSON schema compliance

---

### 3. Similarity Matching & Embeddings

#### Architecture Overview

EduMatch uses **vector embeddings** to calculate similarity between applicants
and educational opportunities (programs, scholarships, research labs). The
system uses **cosine similarity** to measure semantic similarity.

**Service Location**: `src/services/similarity/similarity-service.ts`

#### Embedding Generation

- **Applicant Embeddings**: Generated from applicant profiles (CV, education,
  skills, preferences)
- **Post Embeddings**: Generated from post descriptions (requirements,
  descriptions, details)
- **Model**: Uses dense embedding models (likely `embeddinggemma:300m` or
  `all-minilm`)

#### Similarity Calculation

**Cosine Similarity Formula**:

```typescript
cosineSimilarity = (A · B) / (||A|| × ||B||)
```

Where:

- `A · B` = dot product of vectors A and B
- `||A||` = magnitude (norm) of vector A
- `||B||` = magnitude (norm) of vector B

**Implementation**:

```typescript
static calculateCosineSimilarity(
  vectorA: number[],
  vectorB: number[]
): number {
  // Calculate dot product
  let dotProduct = 0;
  for (let i = 0; i < vectorA.length; i++) {
    dotProduct += vectorA[i] * vectorB[i];
  }

  // Calculate magnitudes
  const normA = Math.sqrt(vectorA.reduce((sum, val) => sum + val * val, 0));
  const normB = Math.sqrt(vectorB.reduce((sum, val) => sum + val * val, 0));

  // Return cosine similarity
  return dotProduct / (normA * normB);
}
```

#### Match Percentage Mapping

For dense embedding models, similarity scores typically range from **0.2 to
1.0**. The system maps this to a 0-100% scale:

| Cosine Similarity | Match Percentage | Interpretation              |
| ----------------- | ---------------- | --------------------------- |
| < 0.2             | 0%               | Very poor match / unrelated |
| 0.3               | ~13%             | Weak match                  |
| 0.4               | ~25%             | Moderate-low match          |
| 0.5               | ~38%             | Moderate match              |
| 0.6               | ~50%             | Fair match                  |
| 0.7               | ~63%             | Good match                  |
| 0.8               | ~75%             | Strong match                |
| 0.9               | ~88%             | Very strong match           |
| 1.0               | 100%             | Perfect match               |

**Formula**:

```typescript
// Map [0.2, 1.0] to [0, 100]
const percentage = ((similarity - 0.2) / 0.8) * 100;
return Math.max(0, Math.min(100, percentage));
```

#### Use Cases

1. **Recommendation Engine**: Suggests programs/scholarships/labs based on
   applicant profile
2. **Application Matching**: Shows match percentage for each application
3. **Institution Dashboard**: Displays match scores for all applicants
4. **Search Results**: Sorts results by relevance (match score)

**Example API Usage**:

```typescript
// Calculate match for a single application
const matchScore = await calculateApplicationMatchScore(applicantId, postId); // Returns "75%"

// Calculate matches for multiple posts
const matchScores = SimilarityService.calculateMatchScores(
	applicantEmbedding,
	posts
); // Returns { "post-1": "85%", "post-2": "62%", ... }
```

---

## 📦 AWS S3 Implementation

### 1. File Upload Architecture

#### Upload Flow

EduMatch uses a **two-step upload process** for security and efficiency:

**Step 1: Get Presigned URL**

```
Client → /api/files/presigned-url
  ↓
Server validates user authentication
  ↓
Server generates unique file path: uploads/{userId}/{timestamp}-{random}.{ext}
  ↓
Server creates S3 PutObjectCommand with private ACL
  ↓
Server generates presigned URL (expires in 1 hour)
  ↓
Returns: { presignedUrl, fileName }
```

**Step 2: Direct S3 Upload**

```
Client → Presigned URL (PUT request)
  ↓
S3 validates presigned URL signature
  ↓
File uploaded directly to S3 (bypasses Next.js server)
  ↓
Returns: 200 OK
```

**Benefits**:

- **Reduced Server Load**: Files bypass Next.js server
- **Faster Uploads**: Direct client-to-S3 connection
- **Security**: Presigned URLs expire after 1 hour
- **Scalability**: S3 handles large files efficiently

#### Implementation

**API Route**: `src/app/api/files/presigned-url/route.ts`

```typescript
// Generate unique file name
const uniqueFileName = `uploads/${user.id}/${timestamp}-${randomString}.${fileExtension}`;

// Create S3 command with private ACL
const command = new PutObjectCommand({
	Bucket: BUCKET_NAME,
	Key: uniqueFileName,
	ContentType: fileType,
	Metadata: {
		userId: user.id,
		originalName: fileName,
		uploadedAt: new Date().toISOString(),
	},
	ACL: 'private', // Prevents direct public access
});

// Generate presigned URL (expires in 1 hour)
const presignedUrl = await getSignedUrl(s3Client, command, {
	expiresIn: 3600,
});
```

**Client Hook**: `src/hooks/files/usePresignedUpload.ts`

```typescript
// Step 1: Get presigned URL
const presignedResponse = await fetch('/api/files/presigned-url', {
	method: 'POST',
	body: JSON.stringify({ fileName, fileType, fileSize }),
});

// Step 2: Upload directly to S3
const uploadResponse = await fetch(presignedUrl, {
	method: 'PUT',
	body: file,
	headers: { 'Content-Type': file.type },
});
```

---

### 2. Protected File Access

#### Security Model

All files in S3 are stored with **private ACL**, meaning direct S3 URLs return
**403 Forbidden**. Users must request a presigned URL through the protected
image API, which validates permissions before generating the URL.

**API Route**: `src/app/api/files/protected-image/route.ts`

#### Permission Validation Logic

**1. Institution Images (Public Access)**

- Institution logos and cover images are publicly accessible
- No authentication required
- Database lookup to verify institution ownership

**2. User-Owned Files**

- Users can access their own files
- File path: `users/{userId}/...`

**3. Application Documents**

- Applicants can access their own documents
- Institutions can access documents from their applications only
- Validates application relationship in database

**4. Message Files**

- Only sender and receiver can access files sent in messages
- Validates message thread relationship

**5. Admin Access**

- Admins can access all files
- Bypasses most permission checks

#### Permission Caching

To improve performance, permission checks are cached in memory:

```typescript
// In-memory cache with 5-minute TTL
const permissionCache = new Map<
	string,
	{ allowed: boolean; timestamp: number }
>();

function getCachedPermission(userId: string, s3Key: string): boolean | null {
	const cached = permissionCache.get(`${userId}:${s3Key}`);
	if (cached && Date.now() - cached.timestamp < 300000) {
		return cached.allowed; // 5 minutes TTL
	}
	return null;
}
```

#### Presigned URL Generation

```typescript
// Extract S3 key from URL
const s3Key = extractS3Key(imageUrl);

// Validate permissions (complex logic with caching)
const hasPermission = await validateFileAccess(user.id, s3Key);

if (!hasPermission) {
	return NextResponse.json({ error: 'Access denied' }, { status: 403 });
}

// Generate presigned URL (expires in 1 hour, max 7 days)
const command = new GetObjectCommand({
	Bucket: BUCKET_NAME,
	Key: s3Key,
});

const presignedUrl = await getSignedUrl(s3Client, command, {
	expiresIn: expiresIn || 3600, // Default 1 hour
});
```

#### Security Features

- **Private ACL**: All files are private by default
- **Presigned URLs**: Time-limited access (1 hour default, max 7 days)
- **Permission Validation**: Database-backed access control
- **Role-Based Access**: Different rules for applicants, institutions, admins
- **Message File Validation**: Ensures files are part of message threads
- **Application Relationship Check**: Institutions can only access their
  applicants' files
- **Caching**: Reduces database queries for permission checks

---

### 3. Multipart Upload for Large Files

For files larger than a chunk size, the system uses **S3 Multipart Upload**:

**Implementation**: `src/app/api/files/s3-upload/route.ts`

```typescript
const CHUNK_SIZE = 5 * 1024 * 1024; // 5MB chunks

if (file.size > CHUNK_SIZE) {
  // Use multipart upload
  await uploadLargeFile(buffer, fileName, file.type);
} else {
  // Use regular upload
  await s3Client.send(new PutObjectCommand({ ... }));
}
```

**Benefits**:

- Handles large files efficiently
- Resumable uploads (if implemented)
- Better error recovery

---

## 🔄 AWS AppSync Implementation

### 1. GraphQL API Architecture

#### Infrastructure Setup

AppSync is deployed using **AWS CDK** with the following components:

**Stack**: `infrastructure/lib/edumatch-notification-stack.ts`

**Components**:

- **GraphQL API**: AppSync API with API Key and Cognito User Pool authentication
- **DynamoDB Tables**:
  - `edumatch-messages-v2` (partition: threadId, sort: createdAt)
  - `edumatch-threads-v2` (partition: userId, sort: threadId)
  - `edumatch-message-reads-v2` (partition: messageId, sort: userId)
- **Lambda Resolvers**: For complex operations (thread creation, message
  creation, read tracking)
- **Direct DynamoDB Resolvers**: For simple queries (get messages, get threads)

#### GraphQL Schema

**Location**: `infrastructure/graphql/schema.graphql`

```graphql
type Message {
	id: ID!
	threadId: ID!
	content: String!
	senderId: ID!
	senderName: String!
	senderImage: String
	createdAt: String!
	fileUrl: String
	fileName: String
	mimeType: String
	isRead: Boolean!
	readAt: String
}

type Thread {
	id: ID!
	user1Id: ID!
	user2Id: ID!
	lastMessage: String
	lastMessageAt: String
	lastMessageSenderId: ID
	lastMessageSenderName: String
	lastMessageSenderImage: String
	lastMessageFileUrl: String
	lastMessageFileName: String
	lastMessageMimeType: String
	createdAt: String!
	updatedAt: String!
	unreadCount: Int!
}

type Query {
	getThreads(userId: ID): [Thread!]!
	getMessages(threadId: ID!): [Message!]!
	getUnreadCount(userId: ID): Int!
}

type Mutation {
	createMessage(input: CreateMessageInput!): Message!
	createThread(input: CreateThreadInput!): Thread!
	markMessageRead(input: MarkMessageReadInput!): MessageRead!
	clearThreadUnreadCount(input: ClearThreadUnreadCountInput!): Thread!
}

type Subscription {
	onMessageAdded(threadId: ID!): Message
		@aws_subscribe(mutations: ["createMessage"])
	onThreadCreated: Thread @aws_subscribe(mutations: ["createThread"])
}
```

---

### 2. Real-time Messaging with Subscriptions

#### Client Configuration

**Location**: `src/services/messaging/appsync-client.ts`

```typescript
// Configure Amplify
Amplify.configure({
	API: {
		GraphQL: {
			endpoint: process.env.NEXT_PUBLIC_APPSYNC_ENDPOINT,
			region: process.env.NEXT_PUBLIC_AWS_REGION,
			defaultAuthMode: 'apiKey',
			apiKey: process.env.NEXT_PUBLIC_APPSYNC_API_KEY,
		},
	},
	Auth: {
		Cognito: {
			userPoolId: process.env.NEXT_PUBLIC_COGNITO_USER_POOL_ID,
			userPoolClientId: process.env.NEXT_PUBLIC_COGNITO_USER_POOL_CLIENT_ID,
			identityPoolId: process.env.NEXT_PUBLIC_COGNITO_IDENTITY_POOL_ID,
		},
	},
});
```

#### Subscription Implementation

**Message Subscription**:

```typescript
export const subscribeToMessages = (
	threadId: string,
	callback: (message: any) => void
) => {
	const client = generateClient();

	const subscription = client
		.graphql({
			query: `
      subscription OnMessageAdded($threadId: ID!) {
        onMessageAdded(threadId: $threadId) {
          id
          threadId
          content
          senderId
          senderName
          createdAt
          fileUrl
          fileName
        }
      }
    `,
			variables: { threadId },
		})
		.subscribe({
			next: async (data: any) => {
				const newMessage = data.data?.onMessageAdded;
				if (newMessage) {
					// Decrypt message content
					newMessage.content = await decryptMessageClient(newMessage.content);
					callback(newMessage);
				}
			},
			error: () => {
				// Handle subscription error silently
			},
		});

	return () => subscription.unsubscribe();
};
```

**Thread Subscription**:

```typescript
export const subscribeToThreadUpdates = (callback: (thread: any) => void) => {
	const subscription = client
		.graphql({
			query: `
      subscription OnThreadCreated {
        onThreadCreated {
          id
          user1Id
          user2Id
          lastMessage
          lastMessageAt
          unreadCount
        }
      }
    `,
		})
		.subscribe({
			next: (data: any) => {
				const newThread = data.data?.onThreadCreated;
				if (newThread) {
					callback(newThread);
				}
			},
		});

	return () => subscription.unsubscribe();
};
```

#### React Hook Integration

**Location**: `src/hooks/messaging/useAppSyncMessaging.ts`

```typescript
useEffect(() => {
	// Subscribe to thread updates
	const unsubscribeThreads = subscribeToThreadUpdates((updatedThread) => {
		setThreads((prev) =>
			prev.map((thread) =>
				thread.id === updatedThread.id ? updatedThread : thread
			)
		);
	});

	// Subscribe to messages for selected thread
	if (selectedThreadId) {
		const unsubscribeMessages = subscribeToMessages(
			selectedThreadId,
			(newMessage) => {
				setMessages((prev) => {
					// Check for duplicates
					const exists = prev.some((msg) => msg.id === newMessage.id);
					if (exists) return prev;
					return [...prev, newMessage];
				});
			}
		);
	}

	return () => {
		unsubscribeThreads();
		unsubscribeMessages();
	};
}, [selectedThreadId, user?.id, isAuthenticated]);
```

---

### 3. Lambda Resolvers

#### Thread Creation Resolver

**Purpose**: Creates thread entries for both participants in DynamoDB

**Implementation**:

```typescript
// Lambda function creates entries for both users
const currentUserThread = {
	userId: currentUserId,
	threadId: threadId,
	user1Id: currentUserId,
	user2Id: participantId,
	unreadCount: 0,
	// ... other fields
};

const participantThread = {
	userId: participantId,
	threadId: threadId,
	user1Id: participantId,
	user2Id: currentUserId,
	unreadCount: 0,
	// ... other fields
};

// Store both entries in parallel
await Promise.all([
	dynamoClient.send(
		new PutItemCommand({
			TableName: THREADS_TABLE,
			Item: marshall(currentUserThread),
		})
	),
	dynamoClient.send(
		new PutItemCommand({
			TableName: THREADS_TABLE,
			Item: marshall(participantThread),
		})
	),
]);
```

#### Message Creation Resolver

**Purpose**: Creates message and updates thread information for both users

**Flow**:

1. Create message in `messages` table
2. Find both thread entries (for sender and recipient)
3. Update sender's thread: `unreadCount = 0`
4. Update recipient's thread: `unreadCount += 1`
5. Update `lastMessage`, `lastMessageAt`, etc. for both threads

**Implementation**:

```typescript
// 1. Create message
await dynamoClient.send(
	new PutItemCommand({
		TableName: MESSAGES_TABLE,
		Item: marshall(message),
	})
);

// 2. Update threads for both users
for (const threadItem of threadResult.Items) {
	const thread = unmarshall(threadItem);
	const isSender = thread.userId === senderId;

	if (isSender) {
		// Sender: unreadCount = 0
		await dynamoClient.send(
			new UpdateItemCommand({
				TableName: THREADS_TABLE,
				Key: { userId: { S: thread.userId }, threadId: { S: thread.threadId } },
				UpdateExpression:
					'SET unreadCount = :zero, lastMessage = :lastMessage, ...',
			})
		);
	} else {
		// Recipient: unreadCount += 1
		await dynamoClient.send(
			new UpdateItemCommand({
				TableName: THREADS_TABLE,
				Key: { userId: { S: thread.userId }, threadId: { S: thread.threadId } },
				UpdateExpression:
					'SET unreadCount = unreadCount + :one, lastMessage = :lastMessage, ...',
			})
		);
	}
}
```

#### Message Encryption

**Security**: All messages are encrypted before storage using client-side
encryption:

```typescript
// Before sending
const encryptedContent = await encryptMessageClient(content);

// After receiving
const decryptedContent = await decryptMessageClient(encryptedContent);
```

**Location**: `src/utils/encryption/client-message-encryption.ts`

---

### 4. DynamoDB Data Model

#### Table Structure

**Messages Table** (`edumatch-messages-v2`):

- **Partition Key**: `threadId` (String)
- **Sort Key**: `createdAt` (String, ISO 8601)
- **Query Pattern**: Get all messages for a thread, sorted by creation time

**Threads Table** (`edumatch-threads-v2`):

- **Partition Key**: `userId` (String)
- **Sort Key**: `threadId` (String)
- **Query Pattern**: Get all threads for a user
- **GSI**: None (uses partition key for user queries)

**Message Reads Table** (`edumatch-message-reads-v2`):

- **Partition Key**: `messageId` (String)
- **Sort Key**: `userId` (String)
- **Purpose**: Track which users have read which messages

#### Query Patterns

**Get Messages for Thread**:

```typescript
// DynamoDB Query
{
  TableName: "edumatch-messages-v2",
  KeyConditionExpression: "threadId = :threadId",
  ExpressionAttributeValues: {
    ":threadId": { S: threadId }
  }
}
```

**Get Threads for User**:

```typescript
// DynamoDB Query
{
  TableName: "edumatch-threads-v2",
  KeyConditionExpression: "userId = :userId",
  ExpressionAttributeValues: {
    ":userId": { S: userId }
  }
}
```

---

## 🚀 Deployment & Infrastructure

### 1. AWS CDK Infrastructure

#### Stack Overview

**Location**: `infrastructure/lib/edumatch-notification-stack.ts`

**Components Deployed**:

1. **SQS Queues** (FIFO):
   - `edumatch-notifications.fifo` - Notification queue
   - `edumatch-emails.fifo` - Email queue
   - Dead Letter Queues (DLQ) for both
   - Content-based deduplication enabled
   - 5-minute visibility timeout
   - 14-day retention period

2. **Lambda Functions**:
   - `NotificationProcessor` - Processes notifications, stores in DB, forwards
     to email queue
   - `EmailProcessor` - Sends emails via Next.js API
   - `ThreadManager` - Creates thread entries in DynamoDB
   - `MessageManager` - Creates messages and updates threads
   - `MarkReadManager` - Marks messages as read
   - `ClearUnreadManager` - Clears thread unread count
   - `WishlistDeadlineCron` - Daily cron job for deadline reminders
   - `CloseExpiredPostsCron` - Daily cron job to close expired posts

3. **DynamoDB Tables**:
   - `edumatch-messages-v2` - Messages storage
   - `edumatch-threads-v2` - Threads storage
   - `edumatch-message-reads-v2` - Read tracking
   - Pay-per-request billing mode
   - Destroy on stack deletion

4. **AppSync API**:
   - GraphQL endpoint for real-time messaging
   - API Key authentication (default)
   - Cognito User Pool authentication (additional)
   - X-Ray tracing enabled

5. **EventBridge Rules**:
   - `WishlistDeadlineRule` - Triggers daily at 9 AM UTC
   - `CloseExpiredPostsRule` - Triggers daily at midnight UTC

#### CDK Deployment

**Entry Point**: `infrastructure/app.ts`

```typescript
const app = new cdk.App();

const env = {
	account: process.env.CDK_DEFAULT_ACCOUNT,
	region: process.env.CDK_DEFAULT_REGION || 'ap-northeast-1',
};

new EduMatchNotificationStack(app, 'EduMatchNotificationStack', {
	env,
	description: 'EduMatch SQS and Lambda infrastructure for notifications',
});

app.synth();
```

**Deployment Commands**:

```bash
# Install dependencies
npm ci

# Install AWS CDK globally
npm install -g aws-cdk

# Bootstrap CDK (first time only)
cdk bootstrap aws://ACCOUNT_ID/REGION

# Deploy infrastructure
cdk deploy --app "npx ts-node --prefer-ts-exts infrastructure/app.ts"

# View changes before deploying
cdk diff --app "npx ts-node --prefer-ts-exts infrastructure/app.ts"
```

---

### 2. AWS Amplify Deployment

#### Build Configuration

**Location**: `amplify.yml`

**Build Phases**:

1. **PreBuild**:
   - Install dependencies (`npm ci --legacy-peer-deps`)
   - Create `.env` file from environment variables
   - Generate Prisma client (`npx prisma generate`)

2. **Build**:
   - Run Next.js build (`npm run build`)

3. **Artifacts**:
   - Base directory: `.next`
   - Files: `**/*` (all files)

4. **Cache**:
   - `node_modules/**/*`
   - `.next/cache/**/*`

**Environment Variables**: The build process creates a `.env` file with all
required variables:

- Database connection (`DATABASE_URL`)
- Authentication secrets (`BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`)
- AWS credentials (`ACCESS_KEY_ID`, `SECRET_ACCESS_KEY`, `S3_BUCKET_NAME`)
- Third-party API keys (`MISTRAL_OCR_API_KEY`, `STRIPE_SECRET_KEY`)
- AppSync configuration (`NEXT_PUBLIC_APPSYNC_ENDPOINT`,
  `NEXT_PUBLIC_APPSYNC_API_KEY`)
- And many more...

**Runtime**:

- Node.js version: 20
- Platform: AWS Amplify

---

### 3. CI/CD Pipeline

#### GitHub Actions

**Location**: `.github/workflows/deploy-infrastructure.yml`

**Triggers**:

- Push to `main` or `dev` branches (infrastructure changes)
- Pull requests to `main` (infrastructure changes)

**Workflow Steps**:

1. **Checkout Code**
2. **Setup Node.js** (version 18, with npm cache)
3. **Install Dependencies** (`npm ci`)
4. **Install AWS CDK** (`npm install -g aws-cdk`)
5. **Configure AWS Credentials** (from GitHub Secrets)
6. **Bootstrap CDK** (if needed, continues on error)
7. **CDK Diff** (for pull requests, shows changes)
8. **CDK Deploy** (for main/dev branches, auto-approves)

**Secrets Required**:

- `AWS_ACCESS_KEY_ID`
- `AWS_SECRET_ACCESS_KEY`
- `AWS_ACCOUNT_ID`

**Environment Variables**:

- `AWS_REGION`: `us-east-1`
- `CDK_DEFAULT_REGION`: `us-east-1`

---

### 4. Infrastructure as Code Benefits

#### Version Control

- All infrastructure changes are tracked in Git
- Easy rollback to previous configurations
- Code review for infrastructure changes

#### Reproducibility

- Same infrastructure can be deployed to multiple environments
- No manual configuration drift
- Consistent deployments

#### Scalability

- Easy to add new Lambda functions
- Simple to scale DynamoDB tables
- Add new SQS queues as needed

#### Cost Management

- Pay-per-request DynamoDB (no idle costs)
- Serverless Lambda (pay only for execution)
- FIFO queues with content-based deduplication (reduces duplicate processing)

---

## 🔐 Security Considerations

### 1. File Access Security

- **Private ACL**: All files are private by default
- **Presigned URLs**: Time-limited access (1 hour default)
- **Permission Validation**: Database-backed access control
- **Role-Based Access**: Different rules for different user roles
- **Message File Validation**: Ensures files are part of message threads

### 2. Message Encryption

- **Client-Side Encryption**: Messages encrypted before sending
- **Client-Side Decryption**: Messages decrypted after receiving
- **No Plaintext Storage**: Encrypted messages stored in DynamoDB

### 3. API Security

- **Authentication Required**: All protected endpoints require authentication
- **Role-Based Authorization**: Different permissions for applicants,
  institutions, admins
- **Rate Limiting**: OTP rate limiting with Redis
- **Input Validation**: Zod schema validation for all inputs

### 4. Infrastructure Security

- **IAM Roles**: Least privilege principle for Lambda functions
- **VPC Configuration**: (If applicable) Lambda functions in VPC
- **Secrets Management**: Environment variables for sensitive data
- **API Keys**: AppSync API keys with expiration (365 days)

---

## 📊 Performance Optimizations

### 1. Caching Strategies

- **Permission Cache**: 5-minute TTL for file access permissions
- **User Data Cache**: 5-minute TTL for message thread participants
- **Redis Cache**: For OTP rate limiting and session data

### 2. Database Optimizations

- **Indexed Queries**: DynamoDB partition keys optimized for query patterns
- **Batch Operations**: Parallel queries where possible
- **Connection Pooling**: Prisma connection pooling for PostgreSQL

### 3. File Upload Optimizations

- **Direct S3 Upload**: Bypasses Next.js server
- **Multipart Upload**: For large files (>5MB)
- **Presigned URLs**: Reduces server load

### 4. Real-time Optimizations

- **GraphQL Subscriptions**: Efficient real-time updates
- **Deduplication**: Prevents duplicate messages in UI
- **Selective Subscriptions**: Only subscribe to active threads

---

## 🎯 Key Technical Decisions

### Why Mistral AI for OCR?

- **High Accuracy**: Better than traditional OCR libraries
- **Multi-format Support**: Handles PDFs and images
- **Cloud-based**: No local processing required
- **API-based**: Easy integration, scalable

### Why AppSync for Messaging?

- **Real-time Subscriptions**: Built-in GraphQL subscriptions
- **Scalability**: Handles millions of concurrent connections
- **Serverless**: No infrastructure management
- **DynamoDB Integration**: Native DynamoDB resolvers

### Why S3 Presigned URLs?

- **Security**: Private files with time-limited access
- **Performance**: Direct client-to-S3 uploads
- **Scalability**: S3 handles large files efficiently
- **Cost**: No bandwidth costs through Next.js server

### Why CDK for Infrastructure?

- **TypeScript**: Type-safe infrastructure code
- **Version Control**: Infrastructure as code in Git
- **Reproducibility**: Same infrastructure across environments
- **AWS Native**: First-class support for AWS services

---

## 📚 Additional Resources

- **Mistral AI Documentation**: https://docs.mistral.ai
- **AWS AppSync Documentation**: https://docs.aws.amazon.com/appsync
- **AWS S3 Documentation**: https://docs.aws.amazon.com/s3
- **AWS CDK Documentation**: https://docs.aws.amazon.com/cdk
- **DynamoDB Best Practices**:
  https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/best-practices.html

---

_Last Updated: Based on codebase analysis and infrastructure review_
