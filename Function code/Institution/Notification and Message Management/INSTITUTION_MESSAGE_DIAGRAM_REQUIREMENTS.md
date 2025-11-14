# Institution Message - Components & Requirements for Sequence & Class Diagrams

## Overview

The Institution Message feature allows authenticated institutions to send and
receive real-time messages with applicants and other users. The system uses AWS
AppSync for real-time messaging with a PostgreSQL backup/hybrid approach.
Institutions can view message threads, send messages, upload files, and initiate
conversations with applicants.

---

## 1. KEY COMPONENTS

### 1.1 InstitutionMessagesPage Component

**Location:** `src/app/(institution)/institution/dashboard/messages/page.tsx`

**Purpose:** Page wrapper for institution messages

**Key Features:**

- Uses ProfileContext for profile data
- Wraps MessageDialog component
- Full-screen layout

**Key Code:**

```typescript
export default function InstitutionMessagesPage() {
  const { profile } = useProfileContext()
  return (
    <div className="h-screen">
      <MessageDialog />
    </div>
  )
}
```

### 1.2 InstitutionMessagesThreadPage Component

**Location:**
`src/app/(institution)/institution/dashboard/messages/[threadId]/page.tsx`

**Purpose:** Page for specific message thread

**Key Features:**

- Displays specific thread by ID
- Passes threadId to MessageDialog

### 1.3 MessageDialog Component

**Location:** `src/components/message/MessageDialog.tsx`

**Purpose:** Main messaging UI component (shared with applicants)

**Key Features:**

- Thread list sidebar
- Message display area
- Message input and sending
- File upload support
- Real-time updates via AppSync
- User search and selection
- Contact applicant functionality
- Unread count display

**State Management:**

- `user` - Current user
- `selectedThread` - Selected thread
- `selectedUser` - Selected user
- `users` - Available users list
- `threads` - Thread list (from AppSync)
- `messages` - Messages for selected thread
- `searchQuery` - Search input
- `newMessage` - New message input
- `showFileUpload` - File upload visibility
- `isTyping` - Typing indicator
- `isUploading` - Upload state
- `contactApplicant` - Contact applicant data
- `showContactPreview` - Contact preview visibility

**Key Methods:**

- `handleSendMessage()` - Sends message
- `handleFileUpload()` - Handles file upload
- `handleContactApplicant()` - Initiates contact with applicant
- `handleThreadSelection()` - Selects thread
- `fetchUserData()` - Fetches user data

### 1.4 useAppSyncMessaging Hook

**Location:** `src/hooks/messaging/useAppSyncMessaging.ts`

**Purpose:** Custom hook for AppSync messaging functionality

**Key Features:**

- Manages messages and threads state
- Real-time subscriptions
- Message sending
- Thread creation
- Unread count management

**Key Methods:**

- `loadThreads()` - Loads all threads
- `loadMessages(threadId)` - Loads messages for thread
- `sendMessage()` - Sends message
- `startNewThread()` - Creates new thread
- `selectThread()` - Selects thread
- `clearUnreadCount()` - Clears unread count

### 1.5 InstitutionProfileLayout Integration

**Location:** `src/components/profile/layouts/InstitutionProfileLayout.tsx`

**Purpose:** Layout with message icon

**Features:**

- Message icon in header
- Unread count badge
- Navigation to messages page
- Hidden on messages page

---

## 2. API ROUTES

### 2.1 POST /api/messages/send

**Location:** `src/app/api/messages/send/route.ts`

**Purpose:** Send message (PostgreSQL backup/hybrid)

**Authentication:** Required via `requireAuth()`

**Request Body:**

```typescript
{
  threadId: string,
  content: string,
  fileUrl?: string,
  fileName?: string,
  fileSize?: number,
  mimeType?: string
}
```

**Process:**

1. Validates authentication
2. Verifies user has access to Box (thread)
3. Creates Message record in PostgreSQL
4. Updates Box last message
5. Returns success

**Response:**

```typescript
{
  success: true,
  message: {
    message_id: string,
    box_id: string,
    sender_id: string,
    body: string,
    send_at: DateTime
  }
}
```

### 2.2 GET /api/messages/[threadId]

**Location:** `src/app/api/messages/[threadId]/route.ts`

**Purpose:** Fetch messages for thread (PostgreSQL backup)

**Query Parameters:**

- `threadId` - Box ID (required)

**Response:**

```typescript
{
  success: true,
  messages: Array<{
    id: string,
    threadId: string,
    senderId: string,
    content: string,
    sender: {
      id: string,
      name: string,
      image: string
    },
    fileUrl?: string,
    fileName?: string,
    fileSize?: number,
    mimeType?: string,
    isRead: boolean,
    createdAt: Date
  }>
}
```

### 2.3 POST /api/threads

**Location:** `src/app/api/threads/route.ts`

**Purpose:** Create new thread (PostgreSQL backup)

**Request Body:**

```typescript
{
	participantId: string;
}
```

**Response:**

```typescript
{
  success: true,
  thread: {
    box_id: string,
    user_one_id: string,
    user_two_id: string,
    created_at: DateTime
  }
}
```

### 2.4 GET /api/users/[userId]

**Location:** `src/app/api/users/[userId]/route.ts`

**Purpose:** Fetch user data for messaging

**Response:**

```typescript
{
  success: true,
  user: {
    id: string,
    name: string,
    email: string,
    image: string,
    status: string
  }
}
```

---

## 3. DATA FLOW

### 3.1 View Messages Flow

1. **User Navigates to Messages**
   - Accesses `/institution/dashboard/messages`
   - InstitutionMessagesPage component mounts
   - MessageDialog component renders

2. **Initialize Messaging**
   - `useAppSyncMessaging` hook initializes
   - Authentication checked via `useAuthCheck`
   - User data loaded
   - Threads loaded from AppSync

3. **Load Threads**
   - `loadThreads()` called
   - AppSync GraphQL query executed
   - Threads fetched from DynamoDB (via AppSync)
   - Threads set in state

4. **Display Thread List**
   - Thread list displayed in sidebar
   - Unread counts shown
   - Last message preview shown

5. **Select Thread**
   - User clicks thread
   - `selectThread(threadId)` called
   - Messages loaded for thread
   - Unread count cleared

### 3.2 Send Message Flow

1. **User Types Message**
   - Message input updated
   - `newMessage` state updated

2. **User Sends Message**
   - `handleSendMessage()` called
   - Message validated (not empty or has file)
   - `sendAppSyncMessage()` called
   - AppSync mutation executed
   - Message added to local state immediately (optimistic update)

3. **AppSync Processing**
   - Message created in DynamoDB
   - Thread updated in DynamoDB
   - GraphQL subscription triggers
   - Real-time update sent to all subscribers

4. **PostgreSQL Backup (Optional)**
   - If AppSync fails, falls back to PostgreSQL
   - `POST /api/messages/send` called
   - Message stored in PostgreSQL
   - Box updated

5. **UI Update**
   - Message appears in chat
   - Thread list updated
   - Auto-scroll to bottom

### 3.3 Start New Conversation Flow

1. **User Initiates Contact**
   - User clicks "Contact" or searches for user
   - `handleContactApplicant()` or user selection
   - User data fetched

2. **Check Existing Thread**
   - Checks if thread exists with user
   - Searches AppSync threads

3. **Create Thread (if needed)**
   - If no thread exists, `startNewThread()` called
   - AppSync mutation creates thread
   - Thread added to local state

4. **Navigate to Thread**
   - Thread selected
   - Messages loaded
   - Conversation started

### 3.4 File Upload Flow

1. **User Selects File**
   - File input triggered
   - File selected

2. **File Validation**
   - File type checked
   - File size checked (max 10MB)
   - Error shown if invalid

3. **Upload to S3**
   - `ApiService.uploadFile()` called
   - `POST /api/files/s3-upload` request sent
   - File uploaded to S3
   - Public URL returned

4. **Send Message with File**
   - Message sent with file URL
   - File metadata included
   - Message displayed with file attachment

---

## 4. DATABASE OPERATIONS

### 4.1 Fetch Threads (AppSync/DynamoDB)

```typescript
// Via AppSync GraphQL
query ListThreads($userId: ID!) {
  listThreads(userId: $userId) {
    id
    user1Id
    user2Id
    lastMessage
    lastMessageAt
    unreadCount
    updatedAt
  }
}
```

### 4.2 Fetch Messages (AppSync/DynamoDB)

```typescript
// Via AppSync GraphQL
query ListMessages($threadId: ID!) {
  listMessages(threadId: $threadId) {
    id
    threadId
    content
    senderId
    senderName
    senderImage
    fileUrl
    fileName
    createdAt
    isRead
  }
}
```

### 4.3 Create Message (AppSync/DynamoDB)

```typescript
// Via AppSync GraphQL mutation
mutation CreateMessage($input: CreateMessageInput!) {
  createMessage(input: $input) {
    id
    threadId
    content
    senderId
    createdAt
  }
}
```

### 4.4 Create Message (PostgreSQL Backup)

```typescript
const message = await prismaClient.message.create({
	data: {
		message_id: crypto.randomUUID(),
		box_id: threadId,
		sender_id: user.id,
		body: content || '',
		send_at: new Date(),
	},
});

await prismaClient.box.update({
	where: { box_id: threadId },
	data: {
		last_message_id: message.message_id,
		last_message_at: message.send_at,
	},
});
```

### 4.5 Get or Create Box (PostgreSQL)

```typescript
let box = await prismaClient.box.findFirst({
	where: {
		OR: [
			{ user_one_id: user.id, user_two_id: participantId },
			{ user_one_id: participantId, user_two_id: user.id },
		],
	},
});

if (!box) {
	box = await prismaClient.box.create({
		data: {
			box_id: randomUUID(),
			user_one_id: user.id,
			user_two_id: participantId,
			created_at: new Date(),
			updated_at: new Date(),
		},
	});
}
```

---

## 5. DATABASE MODELS

### 5.1 Box (PostgreSQL)

```typescript
{
	box_id: string(PK);
	user_one_id: string(FK);
	user_two_id: string(FK);
	created_at: DateTime;
	updated_at: DateTime;
	last_message_id: string(FK) | null;
	last_message_at: DateTime | null;
	last_message: string | null;
}
```

**Relations:**

- `user_one` - User
- `user_two` - User
- `messages` - Message[]

### 5.2 Message (PostgreSQL)

```typescript
{
	message_id: string(PK);
	box_id: string(FK);
	sender_id: string(FK);
	body: string;
	send_at: DateTime;
	is_read: boolean;
	read_at: DateTime | null;
}
```

**Relations:**

- `box` - Box
- `sender` - User

### 5.3 Thread (AppSync/DynamoDB)

```typescript
{
	userId: string(PK);
	threadId: string(SK);
	id: string;
	user1Id: string;
	user2Id: string;
	lastMessage: string;
	lastMessageAt: string;
	lastMessageSenderId: string;
	lastMessageSenderName: string;
	lastMessageSenderImage: string;
	lastMessageFileUrl: string;
	lastMessageFileName: string;
	lastMessageMimeType: string;
	createdAt: string;
	updatedAt: string;
	unreadCount: number;
}
```

### 5.4 Message (AppSync/DynamoDB)

```typescript
{
	threadId: string(PK);
	createdAt: string(SK);
	id: string;
	content: string;
	senderId: string;
	senderName: string;
	senderImage: string;
	fileUrl: string;
	fileName: string;
	fileSize: number;
	mimeType: string;
	isRead: boolean;
	readAt: string;
}
```

---

## 6. INTERFACES

### 6.1 Thread (Frontend)

```typescript
interface Thread {
	id: string;
	title: string;
	participants: Array<{
		id: string;
		name: string;
		image?: string;
		status?: string;
	}>;
	unreadCount: number;
	updatedAt: Date;
	lastMessage?: string;
	lastMessageAt?: Date;
}
```

### 6.2 Message (Frontend)

```typescript
interface Message {
	id: string;
	threadId: string;
	senderId: string;
	content: string;
	sender: {
		id: string;
		name: string;
		image?: string;
	};
	fileUrl?: string;
	fileName?: string;
	fileSize?: number;
	mimeType?: string;
	isRead: boolean;
	readAt?: Date;
	createdAt: Date;
}
```

---

## 7. FEATURES

### 7.1 Thread Management

- View all message threads
- Unread count display
- Last message preview
- Thread search
- Sort by recent activity

### 7.2 Messaging

- Send text messages
- Send file attachments
- Real-time message delivery
- Message read status
- Typing indicators
- Auto-scroll to latest message

### 7.3 Contact Management

- Contact applicant from application detail
- Search for users
- Start new conversations
- View user profiles

### 7.4 File Upload

- Support for various file types
- File size validation (max 10MB)
- File preview
- Download files

### 7.5 Real-time Updates

- GraphQL subscriptions for new messages
- Thread list updates
- Unread count updates
- Online/offline status

---

## 8. SEQUENCE DIAGRAM ACTORS

1. **User** - Sends/receives messages
2. **InstitutionMessagesPage** - Page component
3. **MessageDialog** - Main component
4. **useAppSyncMessaging** - Messaging hook
5. **AppSync Client** - GraphQL client
6. **AppSync API** - AWS AppSync service
7. **DynamoDB** - Real-time data storage
8. **PostgreSQL API** - Backup API routes
9. **Prisma Client** - Database
10. **Database** - PostgreSQL
11. **S3 Service** - File storage

---

## 9. CLASS DIAGRAM ENTITIES

### 9.1 Frontend Classes

- `InstitutionMessagesPage` (Page component)
- `InstitutionMessagesThreadPage` (Page component)
- `MessageDialog` (Component)
- `useAppSyncMessaging` (Hook)
- `AppSyncClient` (Service)

### 9.2 Backend Classes

- API Route Handlers (POST, GET)
- `requireAuth` (Utility)
- Prisma Models (Box, Message, User)

### 9.3 AWS Services

- AppSync GraphQL API
- DynamoDB Tables (Threads, Messages)
- S3 Bucket (File storage)

---

## 10. KEY METHODS

### 10.1 Component Methods

- `handleSendMessage()` - Send message
- `handleFileUpload()` - Upload file
- `handleContactApplicant()` - Contact applicant
- `handleThreadSelection()` - Select thread
- `fetchUserData()` - Fetch user data

### 10.2 Hook Methods

- `loadThreads()` - Load threads
- `loadMessages()` - Load messages
- `sendMessage()` - Send message
- `startNewThread()` - Create thread
- `selectThread()` - Select thread
- `clearUnreadCount()` - Clear unread

### 10.3 API Methods

- `POST()` - Send message
- `GET()` - Fetch messages
- `POST()` - Create thread

---

## 11. FILE STRUCTURE

```
src/
├── app/(institution)/institution/dashboard/messages/
│   ├── page.tsx
│   └── [threadId]/page.tsx
├── components/message/
│   ├── MessageDialog.tsx
│   └── FileUpload.tsx
├── hooks/messaging/
│   └── useAppSyncMessaging.ts
├── services/messaging/
│   └── appsync-client.ts
└── app/api/
    ├── messages/send/route.ts (POST)
    ├── messages/[threadId]/route.ts (GET)
    └── threads/route.ts (POST)
```

---

## 12. DIAGRAM REQUIREMENTS

### Sequence Diagram:

- View messages → Load threads → Display → Select thread → Load messages
- Send message → AppSync → DynamoDB → Subscription → Real-time update
- File upload → S3 → Send message with file
- Start conversation → Check thread → Create thread → Load messages
- Include PostgreSQL backup flow

### Class Diagram:

- Page components
- MessageDialog component
- Messaging hook
- AppSync client
- API route handlers
- Database models (both DynamoDB and PostgreSQL)
- AWS services integration

---

## 13. NOTES

### 13.1 Hybrid Messaging System

- **Primary:** AWS AppSync with DynamoDB for real-time messaging
- **Backup:** PostgreSQL API routes for persistence and fallback
- Messages can be sent via either system
- Threads stored in both systems

### 13.2 Real-time Subscriptions

- GraphQL subscriptions for thread updates
- GraphQL subscriptions for message updates
- Automatic UI updates when messages arrive
- Unread count updates in real-time

### 13.3 Contact Applicant

- Institutions can contact applicants from application detail view
- URL parameter: `?contact={userId}`
- Automatically creates thread if doesn't exist
- Navigates to messages with thread selected

### 13.4 File Upload

- Files uploaded to S3
- Public URLs stored with messages
- File metadata (name, size, type) included
- File preview and download supported

### 13.5 Institution-Specific Features

- Message icon in InstitutionProfileLayout header
- Unread count badge
- Navigation from application detail to messages
- Full-screen layout on messages page

---

## END OF DOCUMENT
