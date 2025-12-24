# EduMatch Messaging & Cron Job Analysis

## 📨 AppSync and Message Creation Flow

### Architecture Overview

EduMatch uses a **hybrid messaging system** with both:

- **AWS AppSync + DynamoDB** (primary, real-time messaging)
- **PostgreSQL** (legacy/fallback support via `Box` and `Message` tables)

### AppSync Message Creation Flow

#### 1. Client-Side Flow (`src/services/messaging/appsync-client.ts`)

```typescript
createMessage() Flow:
1. User sends message → createMessage() called
2. Message content encrypted client-side (encryptMessageClient)
3. GraphQL mutation sent to AppSync:
   - Mutation: CREATE_MESSAGE
   - Variables: { threadId, content (encrypted), senderId, senderName, senderImage, fileUrl, fileName, mimeType }
4. AppSync resolver processes request
5. Response decrypted client-side (decryptMessageClient)
6. Message added to local state immediately (optimistic update)
```

#### 2. AppSync Resolver Flow (`infrastructure/lib/edumatch-notification-stack.ts`)

**Request Mapping Template** (lines 976-1012):

- Extracts sender info from Cognito identity (`$ctx.identity.sub`)
- Generates messageId and createdAt timestamp
- Passes data to Lambda resolver

**Lambda Function: MessageManager** (lines 548-683):

```javascript
1. Receives: { threadId, content, senderId, senderName, senderImage, fileUrl, fileName, mimeType }
2. Creates message object:
   - id: messageId (UUID)
   - threadId: threadId
   - createdAt: ISO 8601 timestamp
   - content: encrypted content
   - senderId, senderName, senderImage
   - fileUrl, fileName, mimeType (optional)
   - isRead: false
   - readAt: null

3. Stores message in DynamoDB:
   - Table: edumatch-messages-v2
   - Partition Key: threadId
   - Sort Key: createdAt

4. Updates thread for BOTH users:
   - Scans threads table to find both user entries
   - For SENDER: unreadCount = 0, updates lastMessage fields
   - For RECIPIENT: unreadCount += 1, updates lastMessage fields
   - Updates: lastMessage, lastMessageAt, lastMessageSenderId, etc.
```

#### 3. Real-time Subscription

**GraphQL Subscription** (`onMessageAdded`):

- Automatically triggers when `createMessage` mutation completes
- Clients subscribed to `threadId` receive new message instantly
- Message decrypted on client-side before display

### Key Features

- **Client-Side Encryption**: Messages encrypted before sending to AppSync
- **Optimistic Updates**: UI updates immediately, syncs with server
- **Dual Thread Updates**: Both sender and recipient thread entries updated
- **Unread Count Management**: Automatically incremented for recipient, reset
  for sender
- **File Support**: Supports file attachments (fileUrl, fileName, mimeType)

---

## 🧵 Thread Flow

### Thread Creation Flow

#### 1. Client-Side (`src/services/messaging/appsync-client.ts`)

```typescript
createThread() Flow:
1. Check if thread already exists (5-second timeout)
   - Queries existing threads
   - Searches for thread between current user and participant
   - Returns existing thread if found

2. If no existing thread:
   - GraphQL mutation: CREATE_THREAD
   - Variables: { participantId, userId, userName, userEmail, userImage }

3. AppSync resolver processes request
4. Returns new thread object
```

#### 2. Lambda Resolver: ThreadManager (lines 451-542)

```javascript
1. Receives: { currentUserId, participantId, threadId, createdAt, userName, userEmail, userImage }

2. Creates TWO thread entries (one for each user):

   Current User Thread:
   - userId: currentUserId (partition key)
   - threadId: threadId (sort key)
   - user1Id: currentUserId
   - user2Id: participantId
   - unreadCount: 0
   - lastMessage: ""
   - createdAt, updatedAt: timestamp

   Participant Thread:
   - userId: participantId (partition key)
   - threadId: threadId (sort key)
   - user1Id: participantId
   - user2Id: currentUserId
   - unreadCount: 0
   - lastMessage: ""
   - createdAt, updatedAt: timestamp

3. Stores both entries in parallel (Promise.all)
   - Table: edumatch-threads-v2
   - Partition Key: userId
   - Sort Key: threadId

4. Returns current user's thread entry
```

### Thread Query Flow

**Get Threads for User**:

```typescript
Query: getThreads(userId: ID)
DynamoDB Query:
- Table: edumatch-threads-v2
- KeyConditionExpression: userId = :userId
- Returns: All threads where user is participant
- Sorted by threadId (can be sorted by lastMessageAt on client)
```

### Thread Update Flow (When Message Sent)

When a message is created, the MessageManager Lambda:

1. Scans threads table to find both user entries for the threadId
2. Updates both entries with:
   - `lastMessage`: message content
   - `lastMessageAt`: message timestamp
   - `lastMessageSenderId`, `lastMessageSenderName`, `lastMessageSenderImage`
   - `lastMessageFileUrl`, `lastMessageFileName`, `lastMessageMimeType` (if file
     attached)
   - `updatedAt`: current timestamp
   - `unreadCount`: 0 for sender, +1 for recipient

### Thread Structure

**DynamoDB Schema**:

- **Partition Key**: `userId` (String)
- **Sort Key**: `threadId` (String)
- **Attributes**:
  - `id`: threadId (duplicate for GraphQL)
  - `user1Id`, `user2Id`: participant IDs
  - `lastMessage`: String (last message content)
  - `lastMessageAt`: String (ISO 8601)
  - `lastMessageSenderId`, `lastMessageSenderName`, `lastMessageSenderImage`:
    Sender info
  - `lastMessageFileUrl`, `lastMessageFileName`, `lastMessageMimeType`: File
    info
  - `createdAt`, `updatedAt`: Timestamps
  - `unreadCount`: Number (0 for sender, incremented for recipient)

**Note**: Each thread has TWO entries (one per user) for efficient querying by
userId.

---

## 🗄️ DynamoDB vs PostgreSQL Comparison

### DynamoDB (AppSync - Primary System)

#### Tables Structure

**1. Messages Table** (`edumatch-messages-v2`):

- **Partition Key**: `threadId` (String)
- **Sort Key**: `createdAt` (String, ISO 8601)
- **Query Pattern**: Get all messages for a thread, sorted by time
- **Attributes**:
  - `id`: messageId (UUID)
  - `threadId`: thread identifier
  - `content`: encrypted message content
  - `senderId`, `senderName`, `senderImage`: sender info
  - `fileUrl`, `fileName`, `mimeType`: file attachments
  - `isRead`: Boolean
  - `readAt`: String (ISO 8601)

**2. Threads Table** (`edumatch-threads-v2`):

- **Partition Key**: `userId` (String)
- **Sort Key**: `threadId` (String)
- **Query Pattern**: Get all threads for a user
- **Attributes**: See Thread Structure above
- **Note**: Duplicate entries per thread (one per user)

**3. Message Reads Table** (`edumatch-message-reads-v2`):

- **Partition Key**: `messageId` (String)
- **Sort Key**: `userId` (String)
- **Purpose**: Track read receipts
- **Attributes**:
  - `id`: readId (UUID)
  - `messageId`: message identifier
  - `userId`: user who read the message
  - `readAt`: timestamp (ISO 8601)

#### Advantages

✅ **Real-time Subscriptions**: Built-in GraphQL subscriptions for instant
updates ✅ **Scalability**: Handles millions of concurrent connections ✅
**Serverless**: No infrastructure management ✅ **Fast Queries**: Optimized
partition keys for common query patterns ✅ **Pay-per-request**: No idle costs
✅ **Low Latency**: Single-digit millisecond response times

#### Disadvantages

❌ **No Joins**: Cannot join with user data (must fetch separately) ❌ **Limited
Query Flexibility**: Only queries by partition key ❌ **Scan Operations**:
Thread updates require scanning (inefficient for large datasets) ❌ **No
Transactions**: Cannot atomically update multiple items ❌ **Duplicate Data**:
Thread entries duplicated per user

### PostgreSQL (Legacy/Fallback System)

#### Tables Structure

**1. Box Table** (Thread equivalent):

```sql
box_id (PK)
user_one_id (FK → User)
user_two_id (FK → User)
last_message_at (Timestamp)
created_at (Timestamp)
updated_at (Timestamp)
last_message_id (FK → Message, unique)
user_one_last_read_message_id (FK → Message)
user_two_last_read_message_id (FK → Message)
```

**2. Message Table**:

```sql
message_id (PK)
box_id (FK → Box)
sender_id (FK → User)
body (Text, encrypted)
send_at (Timestamp)
```

#### Advantages

✅ **Relational Integrity**: Foreign keys ensure data consistency ✅ **Join
Queries**: Can join with User, Applicant, Institution tables ✅ **Complex
Queries**: Supports complex WHERE clauses, aggregations ✅ **Transactions**:
ACID transactions for multi-table updates ✅ **Single Source of Truth**: One
thread entry (Box) instead of duplicates ✅ **Read Tracking**: Built-in
last_read_message_id per user ✅ **Indexes**: Can create indexes on any column

#### Disadvantages

❌ **No Real-time**: Requires polling or separate WebSocket implementation ❌
**Connection Limits**: PostgreSQL connection pool limits ❌ **Scaling**:
Vertical scaling required for high load ❌ **Cost**: Always-on database costs
(even when idle) ❌ **Latency**: Higher latency than DynamoDB for simple queries

### Hybrid Approach

The system currently supports both:

- **AppSync/DynamoDB**: Primary system for real-time messaging
- **PostgreSQL**: Legacy system (Box/Message tables) for backward compatibility

**File Access Validation** (`src/utils/files/validateMessageFileAccess.ts`):

- First checks PostgreSQL Box table
- Falls back to AppSync if Box not found
- Validates file access through both systems

**Message Sending** (`src/app/api/messages/send/route.ts`):

- Checks PostgreSQL Box table first
- Returns error if Box not found (even if exists in AppSync)
- Stores messages in PostgreSQL with encryption

### Recommendation

**For Real-time Messaging**: Use **DynamoDB + AppSync**

- Better for high-frequency, real-time communication
- Built-in subscriptions
- Better scalability

**For Complex Queries**: Use **PostgreSQL**

- Better for analytics, reporting
- Join with user profiles
- Complex filtering and aggregations

**Current State**: System is in transition, supporting both systems for
compatibility.

---

## ⏰ Cron Job Working Flow & Schedule

### Cron Jobs Overview

EduMatch has **2 scheduled cron jobs** managed by AWS EventBridge:

### 1. Wishlist Deadline Notifications

**Schedule**: Daily at **9:00 AM UTC**

- **EventBridge Rule**: `WishlistDeadlineRule` (lines 1396-1416)
- **Cron Expression**: `0 9 * * *` (minute: 0, hour: 9, every day)

**Lambda Function**: `WishlistDeadlineCron` (lines 1176-1393)

- **Runtime**: Node.js 18.x
- **Timeout**: 5 minutes
- **Memory**: 256 MB
- **Handler**: Makes HTTP POST request to `/api/cron/wishlist-deadlines`

**API Endpoint**: `src/app/api/cron/wishlist-deadlines/route.ts`

**Workflow**:

```
1. EventBridge triggers Lambda at 9 AM UTC
2. Lambda makes HTTP POST to /api/cron/wishlist-deadlines
3. API endpoint:
   a. Validates CRON_SECRET (if in production)
   b. Finds wishlist items where:
      - post.end_date is in the future
      - post.end_date is within next 7 days
      - post.status = "PUBLISHED"
   c. For each wishlist item:
      - Checks user notification settings
      - Sends notification via SQS
      - Creates notification record in PostgreSQL
4. Returns summary of notifications sent
```

**Purpose**: Notify users about wishlist items expiring within 7 days

### 2. Close Expired Posts

**Schedule**: Daily at **Midnight UTC (00:00)**

- **EventBridge Rule**: `CloseExpiredPostsRule` (lines 1567-1587)
- **Cron Expression**: `0 0 * * *` (minute: 0, hour: 0, every day)

**Lambda Function**: `CloseExpiredPostsCron` (lines 1419-1564)

- **Runtime**: Node.js 18.x
- **Timeout**: 5 minutes (300 seconds)
- **Memory**: 256 MB
- **Handler**: Makes HTTP POST request to `/api/cron/close-expired-posts`

**API Endpoint**: `src/app/api/cron/close-expired-posts/route.ts`

**Workflow**:

```
1. EventBridge triggers Lambda at midnight UTC
2. Lambda makes HTTP POST to /api/cron/close-expired-posts
3. API endpoint:
   a. Validates CRON_SECRET (if in production)
   b. Gets current UTC date (start of day)
   c. Finds posts where:
      - end_date is not null
      - end_date < today (expired)
      - status is not "CLOSED" or "DELETED"
   d. Updates all expired posts:
      - status = "CLOSED"
      - update_at = current timestamp
   e. Returns summary:
      - Total posts closed
      - Breakdown by type (programs, scholarships, research labs)
      - Details of each closed post
```

**Purpose**: Automatically close expired opportunity posts (programs,
scholarships, research labs)

### Cron Job Configuration

**Environment Variables**:

- `API_BASE_URL`: Next.js API base URL (default: dev URL)
- `CRON_SECRET`: Secret token for authentication (optional, required in
  production)

**Authentication**:

- Development: Auth check skipped
- Production: Requires `Authorization: Bearer {CRON_SECRET}` header

**Error Handling**:

- Lambda functions log errors to CloudWatch
- API endpoints return error responses with details
- Lambda timeout: 5 minutes (prevents hanging requests)

### Schedule Summary

| Cron Job            | Schedule (UTC)            | Purpose                                    | Lambda Function       |
| ------------------- | ------------------------- | ------------------------------------------ | --------------------- |
| Wishlist Deadlines  | 9:00 AM daily             | Notify users about expiring wishlist items | WishlistDeadlineCron  |
| Close Expired Posts | 12:00 AM (midnight) daily | Close expired opportunity posts            | CloseExpiredPostsCron |

### Timezone Notes

- All cron jobs run in **UTC timezone**
- 9:00 AM UTC = Various local times:
  - 5:00 AM EST (UTC-4)
  - 10:00 AM CET (UTC+1)
  - 6:00 PM JST (UTC+9)
- 12:00 AM UTC = Midnight UTC:
  - 8:00 PM EST (previous day)
  - 1:00 AM CET
  - 9:00 AM JST

### Monitoring

**CloudWatch Logs**:

- `WishlistDeadlineCronLogGroup`: 1 week retention
- `CloseExpiredPostsCronLogGroup`: 1 week retention

**Logging**:

- Lambda functions log start/completion
- API endpoints log processing details
- Errors logged with stack traces

---

## 🔄 Complete Message Flow Diagram

```
User sends message
    ↓
Client encrypts content
    ↓
GraphQL mutation: createMessage
    ↓
AppSync Request Mapping Template
    ↓
Lambda: MessageManager
    ├─→ Create message in DynamoDB (edumatch-messages-v2)
    └─→ Update threads for both users (edumatch-threads-v2)
        ├─→ Sender: unreadCount = 0
        └─→ Recipient: unreadCount += 1
    ↓
AppSync Subscription: onMessageAdded
    ↓
All subscribed clients receive message
    ↓
Client decrypts content
    ↓
Message displayed in UI
```

---

## 📊 Thread Flow Diagram

```
User creates thread
    ↓
Check existing threads (5s timeout)
    ├─→ Found: Return existing thread
    └─→ Not found: Continue
    ↓
GraphQL mutation: createThread
    ↓
AppSync Request Mapping Template
    ↓
Lambda: ThreadManager
    ├─→ Create thread entry for user1 (userId=user1, threadId=threadId)
    └─→ Create thread entry for user2 (userId=user2, threadId=threadId)
    ↓
AppSync Subscription: onThreadCreated
    ↓
Thread appears in both users' thread lists
```

---

## 🔍 Key Differences: DynamoDB vs PostgreSQL

| Feature            | DynamoDB (AppSync)                   | PostgreSQL                      |
| ------------------ | ------------------------------------ | ------------------------------- |
| **Thread Storage** | 2 entries per thread (one per user)  | 1 entry per thread (Box)        |
| **Query Pattern**  | Query by userId to get all threads   | Query with JOIN to get threads  |
| **Real-time**      | Built-in GraphQL subscriptions       | Requires polling/WebSocket      |
| **Scalability**    | Auto-scales, handles millions        | Requires vertical scaling       |
| **Cost Model**     | Pay-per-request                      | Always-on database costs        |
| **Read Tracking**  | Separate table (message-reads-v2)    | Built-in (last_read_message_id) |
| **File Support**   | Native (fileUrl, fileName, mimeType) | Not in schema (legacy)          |
| **Encryption**     | Client-side encryption               | Server-side encryption          |

---

_Last Updated: Based on codebase analysis of infrastructure and API routes_
