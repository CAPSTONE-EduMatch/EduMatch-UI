# Applicant Message - Components & Requirements for Sequence & Class Diagrams

## Overview

The Applicant Message feature allows authenticated applicants to send and
receive messages with institutions and other users through a real-time messaging
system powered by AWS AppSync (GraphQL) with PostgreSQL as a hybrid backup. The
system supports text messages, file attachments, thread management, and
real-time updates via subscriptions.

---

## 1. KEY COMPONENTS

### 1.1 MessageDialog Component

**Location:** `src/components/message/MessageDialog.tsx`

**Purpose:** Main messaging interface component

**Key Features:**

- Thread list sidebar
- Message conversation view
- File upload support
- Real-time message updates
- Search functionality
- User search and selection
- Contact applicant preview
- Unread message counts
- Auto-scroll to latest message

**State Management:**

- `user` - Current authenticated user
- `selectedThread` - Currently selected thread
- `selectedUser` - Other participant in thread
- `users` - List of available users
- `searchQuery` - Search input value
- `newMessage` - Message input text
- `showFileUpload` - File upload modal visibility
- `isTyping` - Typing indicator state
- `isUploading` - File upload state
- `isInitialLoad` - Initial load flag
- `shouldAutoScroll` - Auto-scroll flag

**Key Methods:**

- `handleSendMessage()` - Sends message
- `handleFileUpload()` - Handles file upload
- `handleThreadSelect()` - Selects thread
- `handleSearch()` - Searches users/threads
- `fetchUserData()` - Fetches user information
- `handleContactParam()` - Handles contact URL parameter

### 1.2 useAppSyncMessaging Hook

**Location:** `src/hooks/messaging/useAppSyncMessaging.ts`

**Purpose:** Custom hook for messaging state and operations

**Returns:**

- `messages` - Messages array for selected thread
- `threads` - All threads/conversations
- `selectedThreadId` - Currently selected thread ID
- `loading` - Loading state
- `error` - Error message
- `user` - Authenticated user
- `loadThreads()` - Load all threads
- `loadMessages()` - Load messages for thread
- `sendMessage()` - Send message
- `startNewThread()` - Create new thread
- `markAsRead()` - Mark message as read
- `clearUnreadCount()` - Clear unread count
- `selectThread()` - Select thread

**Features:**

- Real-time subscriptions (messages, threads)
- Thread caching (30-second cache)
- Optimistic updates
- Auto-refresh threads every 3 seconds

### 1.3 AppSync Client Service

**Location:** `src/services/messaging/appsync-client.ts`

**Purpose:** GraphQL client for AWS AppSync operations

**Key Functions:**

- `createMessage()` - Create new message
- `createThread()` - Create new thread
- `getMessages()` - Fetch messages for thread
- `getThreads()` - Fetch all threads
- `markMessageAsRead()` - Mark message as read
- `clearThreadUnreadCount()` - Clear unread count
- `subscribeToMessages()` - Subscribe to thread messages
- `subscribeToThreadUpdates()` - Subscribe to thread updates
- `subscribeToAllMessages()` - Poll for all message updates

**GraphQL Operations:**

- `CREATE_MESSAGE` mutation
- `CREATE_THREAD` mutation
- `GET_MESSAGES` query
- `GET_THREADS` query
- `MARK_MESSAGE_READ` mutation
- `CLEAR_THREAD_UNREAD_COUNT` mutation
- `onMessageAdded` subscription
- `onThreadCreated` subscription

### 1.4 FileUpload Component

**Location:** `src/components/message/FileUpload.tsx`

**Purpose:** File upload interface

**Features:**

- Drag and drop support
- File type validation
- File size validation (10MB default)
- Image preview
- File category detection
- Accepted types: images, PDF, text, video, audio

---

## 2. API ROUTES

### 2.1 POST /api/messages/send

**Location:** `src/app/api/messages/send/route.ts`

**Purpose:** Send message (PostgreSQL backup/hybrid)

**Request Body:**

```typescript
{
  threadId: string
  content?: string
  fileUrl?: string
  fileName?: string
  fileSize?: number
  mimeType?: string
}
```

**Process:**

1. Validates authentication
2. Validates threadId and content/fileUrl
3. Verifies user has access to Box (thread)
4. Creates Message record in PostgreSQL
5. Updates Box last_message fields
6. Fetches sender information
7. Returns message data

**Response:**

```typescript
{
  success: true,
  message: {
    id: string
    threadId: string
    senderId: string
    content: string
    sender: { id, name, image }
    createdAt: string
    isRead: false
  }
}
```

### 2.2 GET /api/messages/[threadId]

**Location:** `src/app/api/messages/[threadId]/route.ts`

**Purpose:** Fetch messages for a thread (PostgreSQL)

**Process:**

1. Validates threadId
2. Fetches messages from database
3. Fetches sender user information
4. Transforms messages to client format
5. Returns messages array

**Response:**

```typescript
{
  success: true,
  messages: Array<{
    id: string
    threadId: string
    senderId: string
    content: string
    sender: { id, name, image }
    createdAt: string
    isRead: boolean
  }>
}
```

---

## 3. DATA FLOW

### 3.1 View Messages Flow

1. **User Navigates to Messages**
   - Accesses `/messages` page
   - `MessageDialog` component mounts

2. **Authentication Check**
   - `useAuthCheck` validates user
   - User data loaded

3. **Load Threads**
   - `useAppSyncMessaging` hook initializes
   - `loadThreads()` called automatically
   - `getThreads()` GraphQL query executed
   - Threads displayed in sidebar

4. **Select Thread**
   - User clicks on thread
   - `selectThread(threadId)` called
   - `loadMessages(threadId)` called
   - `getMessages(threadId)` GraphQL query executed
   - Messages displayed in conversation view

5. **Real-time Updates**
   - `subscribeToMessages()` subscription active
   - New messages appear automatically
   - Thread list updates via polling (3 seconds)

### 3.2 Send Message Flow

1. **User Types Message**
   - Types in message input
   - `newMessage` state updated

2. **User Clicks Send (or Enter)**
   - `handleSendMessage()` called
   - Validates message content

3. **File Upload (Optional)**
   - If file attached, uploads to S3 first
   - Gets presigned URL
   - Uploads file to S3
   - Gets file URL

4. **Send Message**
   - `sendMessage()` from hook called
   - `createMessage()` GraphQL mutation executed
   - Message added to AppSync
   - Optimistic update to local state

5. **Update Thread**
   - Thread list updated locally
   - Last message preview updated
   - Unread count updated

6. **Real-time Broadcast**
   - Subscription broadcasts to other participant
   - Message appears in their view

### 3.3 Create New Thread Flow

1. **User Searches for User**
   - Types in search input
   - User list filtered

2. **User Selects Participant**
   - Clicks on user
   - `startNewThread(participantId)` called

3. **Check Existing Thread**
   - `getThreads()` checks for existing thread
   - If exists, selects existing thread
   - If not, creates new thread

4. **Create Thread**
   - `createThread()` GraphQL mutation executed
   - New thread created in AppSync
   - Thread added to local state

5. **Load Messages**
   - Messages loaded for new thread
   - Conversation view displayed

### 3.4 File Upload Flow

1. **User Clicks Attach Button**
   - File upload modal opens
   - File input shown

2. **User Selects File**
   - File selected via input or drag-drop
   - File validated (type, size)

3. **Get Presigned URL**
   - `POST /api/files/presigned-url` called
   - Presigned URL returned

4. **Upload to S3**
   - PUT request to presigned URL
   - File uploaded directly to S3

5. **Get Public URL**
   - Public S3 URL constructed
   - URL ready for message attachment

6. **Attach to Message**
   - File URL included in message
   - Message sent with file reference

---

## 4. DATABASE MODELS

### 4.1 Box (Thread)

```typescript
{
  box_id: string (PK)
  user_one_id: string (FK)
  user_two_id: string (FK)
  last_message_at: DateTime?
  created_at: DateTime
  updated_at: DateTime
  last_message_id: string? (FK)
  user_one_last_read_message_id: string?
  user_two_last_read_message_id: string?
}
```

**Relations:**

- `userOne` - User (user_one_id)
- `userTwo` - User (user_two_id)
- `messages` - Message[]
- `lastMessage` - Message (last_message_id)

### 4.2 Message

```typescript
{
	message_id: string(PK);
	box_id: string(FK);
	sender_id: string(FK);
	body: string;
	send_at: DateTime;
}
```

**Relations:**

- `box` - Box (box_id)
- `boxLastMessage` - Box (last_message_id)

---

## 5. INTERFACES

### 5.1 Message

```typescript
interface Message {
	id: string;
	threadId: string;
	content: string;
	senderId: string;
	senderName: string;
	senderImage?: string;
	createdAt: string;
	fileUrl?: string;
	fileName?: string;
	mimeType?: string;
	isRead: boolean;
	readAt?: string;
}
```

### 5.2 Thread

```typescript
interface Thread {
	id: string;
	user1Id: string;
	user2Id: string;
	lastMessage?: string;
	lastMessageAt?: string;
	lastMessageSenderId?: string;
	lastMessageSenderName?: string;
	lastMessageSenderImage?: string;
	lastMessageFileUrl?: string;
	lastMessageFileName?: string;
	lastMessageMimeType?: string;
	createdAt: string;
	updatedAt: string;
	unreadCount: number;
}
```

### 5.3 User

```typescript
interface User {
	id: string;
	name: string;
	email: string;
	image?: string;
	status?: 'online' | 'offline';
}
```

---

## 6. REAL-TIME SUBSCRIPTIONS

### 6.1 Message Subscription

- **Subscription:** `onMessageAdded(threadId: ID!)`
- **Trigger:** New message added to thread
- **Action:** Updates messages array in real-time

### 6.2 Thread Subscription

- **Subscription:** `onThreadCreated`
- **Trigger:** New thread created
- **Action:** Adds thread to threads list

### 6.3 Polling (Fallback)

- **Interval:** 3 seconds
- **Purpose:** Refresh thread list for updates
- **Function:** `subscribeToAllMessages()`

---

## 7. FEATURES

### 7.1 Thread Management

- View all conversations
- Search threads
- Unread count badges
- Last message preview
- Thread sorting (by last message)

### 7.2 Message Features

- Send text messages
- Attach files (images, PDFs, documents)
- Real-time delivery
- Read receipts (isRead flag)
- Message timestamps
- Auto-scroll to latest

### 7.3 User Features

- Search users
- Start new conversation
- View user profile
- Contact applicant from application

### 7.4 File Support

- Image preview
- File type icons
- File size display
- Drag and drop
- Multiple file types

---

## 8. AUTHENTICATION & AUTHORIZATION

### 8.1 Authentication

- Uses `useAuthCheck` hook
- Requires authenticated user
- Session managed via Better Auth

### 8.2 Authorization

- User can only access their own threads
- Box access verified via user_one_id or user_two_id
- AppSync queries filtered by userId

---

## 9. ERROR HANDLING

### 9.1 Error Scenarios

- **AppSync Not Configured:** Falls back to PostgreSQL API
- **Thread Not Found:** Shows error, allows retry
- **Send Failed:** Shows error, message not sent
- **File Upload Failed:** Shows specific error
- **Subscription Error:** Silently handled, falls back to polling

### 9.2 Error Display

- Error messages in UI
- Loading states
- Retry functionality
- Graceful degradation

---

## 10. CACHING & OPTIMIZATION

### 10.1 Thread Caching

- 30-second cache for thread list
- Prevents excessive API calls
- Force refresh option available

### 10.2 Session Caching

- User context cached for 30 seconds
- Reduces authentication calls
- Improves performance

### 10.3 Optimistic Updates

- Messages added to UI immediately
- Thread list updated locally
- Server sync happens in background

---

## 11. SEQUENCE DIAGRAM ACTORS

1. **User** - Initiates actions
2. **MessageDialog Component** - UI interface
3. **useAppSyncMessaging Hook** - State management
4. **AppSync Client** - GraphQL client
5. **AWS AppSync** - GraphQL API
6. **PostgreSQL API** - Backup/hybrid API
7. **Database** - PostgreSQL
8. **S3 Service** - File storage
9. **Auth Service** - Authentication

---

## 12. CLASS DIAGRAM ENTITIES

### 12.1 Frontend Classes

- `MessageDialog` (Component)
- `FileUpload` (Component)
- `useAppSyncMessaging` (Hook)
- AppSync Client Functions

### 12.2 Backend Classes

- API Route Handlers (POST, GET)
- `requireAuth` (Utility)
- Prisma Models (Box, Message, User)

### 12.3 External Services

- AWS AppSync (GraphQL API)
- AWS S3 (File Storage)
- PostgreSQL (Database)

---

## 13. KEY METHODS

### 13.1 MessageDialog Methods

- `handleSendMessage()` - Send message
- `handleFileUpload()` - Upload file
- `handleThreadSelect()` - Select thread
- `handleSearch()` - Search users/threads
- `fetchUserData()` - Fetch user info

### 13.2 useAppSyncMessaging Methods

- `loadThreads()` - Load all threads
- `loadMessages()` - Load thread messages
- `sendMessage()` - Send message
- `startNewThread()` - Create thread
- `selectThread()` - Select thread
- `clearUnreadCount()` - Clear unread

### 13.3 AppSync Client Methods

- `createMessage()` - Create message mutation
- `createThread()` - Create thread mutation
- `getMessages()` - Get messages query
- `getThreads()` - Get threads query
- `subscribeToMessages()` - Message subscription
- `subscribeToThreadUpdates()` - Thread subscription

---

## 14. FILE STRUCTURE

```
src/
├── components/message/
│   ├── MessageDialog.tsx
│   └── FileUpload.tsx
├── hooks/messaging/
│   ├── useAppSyncMessaging.ts
│   └── useUnreadMessageCount.ts
├── services/messaging/
│   └── appsync-client.ts
├── app/(shared)/messages/
│   ├── page.tsx
│   └── [threadId]/page.tsx
└── app/api/messages/
    ├── send/route.ts
    └── [threadId]/route.ts
```

---

## 15. DIAGRAM REQUIREMENTS

### Sequence Diagrams:

- View Messages: User → Component → Hook → AppSync → Database
- Send Message: User → Component → Hook → AppSync → Subscription → Other User
- Create Thread: User → Component → Hook → AppSync → Database
- File Upload: User → Component → S3 → Message

### Class Diagrams:

- Component classes with methods
- Hook class with state and methods
- AppSync client functions
- API route handlers
- Database models and relationships
- Subscription handlers

---

## 16. HYBRID APPROACH

### 16.1 Primary: AWS AppSync

- Real-time messaging via GraphQL
- Subscriptions for live updates
- Primary data source

### 16.2 Backup: PostgreSQL

- API routes for fallback
- Hybrid support for AppSync-only threads
- Data persistence

### 16.3 Synchronization

- Both systems can coexist
- AppSync is primary
- PostgreSQL used when AppSync unavailable

---

## END OF DOCUMENT
