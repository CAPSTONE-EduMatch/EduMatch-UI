import { generateClient } from "aws-amplify/api";
import { Amplify } from "aws-amplify";
import { authClient } from "@/config/auth-client";

// Configure Amplify
if (process.env.NEXT_PUBLIC_APPSYNC_ENDPOINT) {
	Amplify.configure({
		API: {
			GraphQL: {
				endpoint: process.env.NEXT_PUBLIC_APPSYNC_ENDPOINT,
				region: process.env.NEXT_PUBLIC_AWS_REGION || "ap-northeast-1",
				defaultAuthMode: "apiKey",
				apiKey: process.env.NEXT_PUBLIC_APPSYNC_API_KEY,
			},
		},
		Auth: {
			Cognito: {
				userPoolId: process.env.NEXT_PUBLIC_COGNITO_USER_POOL_ID || "",
				userPoolClientId:
					process.env.NEXT_PUBLIC_COGNITO_USER_POOL_CLIENT_ID || "",
				identityPoolId:
					process.env.NEXT_PUBLIC_COGNITO_IDENTITY_POOL_ID || "",
			},
		},
	});
}

// GraphQL Operations
const CREATE_MESSAGE = `
	mutation CreateMessage($input: CreateMessageInput!) {
		createMessage(input: $input) {
			id
			threadId
			content
			senderId
			senderName
			senderImage
			createdAt
			fileUrl
			fileName
			mimeType
			isRead
			readAt
		}
	}
`;

const CREATE_THREAD = `
	mutation CreateThread($input: CreateThreadInput!) {
		createThread(input: $input) {
			id
			user1Id
			user2Id
			lastMessage
			lastMessageAt
			lastMessageSenderId
			lastMessageSenderName
			lastMessageSenderImage
			lastMessageFileUrl
			lastMessageFileName
			lastMessageMimeType
			createdAt
			updatedAt
			unreadCount
		}
	}
`;

const GET_MESSAGES = `
	query GetMessages($threadId: ID!) {
		getMessages(threadId: $threadId) {
			id
			threadId
			content
			senderId
			senderName
			senderImage
			createdAt
			fileUrl
			fileName
			mimeType
			isRead
			readAt
		}
	}
`;

const GET_THREADS = `
	query GetThreads($userId: ID) {
		getThreads(userId: $userId) {
			id
			user1Id
			user2Id
			lastMessage
			lastMessageAt
			lastMessageSenderId
			lastMessageSenderName
			lastMessageSenderImage
			lastMessageFileUrl
			lastMessageFileName
			lastMessageMimeType
			createdAt
			updatedAt
			unreadCount
		}
	}
`;

const GET_THREADS_OLD = `
	query GetThreads {
		getThreads {
			id
			user1Id
			user2Id
			lastMessage
			lastMessageAt
			lastMessageSenderId
			lastMessageSenderName
			lastMessageSenderImage
			lastMessageFileUrl
			lastMessageFileName
			lastMessageMimeType
			createdAt
			updatedAt
			unreadCount
		}
	}
`;

const MARK_MESSAGE_READ = `
	mutation MarkMessageRead($input: MarkMessageReadInput!) {
		markMessageRead(input: $input) {
			id
			messageId
			userId
			readAt
		}
	}
`;

const CLEAR_THREAD_UNREAD_COUNT = `
	mutation ClearThreadUnreadCount($input: ClearThreadUnreadCountInput!) {
		clearThreadUnreadCount(input: $input) {
			id
			unreadCount
		}
	}
`;

// Simplified messaging functions
export const createMessage = async (input: {
	threadId: string;
	content: string;
	fileUrl?: string;
	fileName?: string;
	mimeType?: string;
}) => {
	if (!process.env.NEXT_PUBLIC_APPSYNC_ENDPOINT) {
		throw new Error("AppSync not configured");
	}

	try {
		const client = generateClient();
		const userContext = await getUserContext();

		const result = await client.graphql({
			query: CREATE_MESSAGE,
			variables: {
				input: {
					...input,
					senderId: userContext?.userId,
					senderName: userContext?.userName,
					senderImage: userContext?.userImage,
				},
			},
		});

		const message = (result as any).data.createMessage;

		return message;
	} catch (error) {
		throw error;
	}
};

export const createThread = async (participantId: string) => {
	if (!process.env.NEXT_PUBLIC_APPSYNC_ENDPOINT) {
		throw new Error("AppSync not configured");
	}

	try {
		const client = generateClient();
		const userContext = await getUserContext();

		if (!userContext?.userId) {
			throw new Error("User authentication required");
		}

		// Check if a thread already exists between these users (with timeout)
		try {
			const existingThreads = (await Promise.race([
				getThreads(),
				new Promise((_, reject) =>
					setTimeout(
						() => reject(new Error("getThreads timeout")),
						5000
					)
				),
			])) as any[];

			const existingThread = existingThreads.find(
				(thread) =>
					(thread.user1Id === userContext.userId &&
						thread.user2Id === participantId) ||
					(thread.user1Id === participantId &&
						thread.user2Id === userContext.userId)
			);

			if (existingThread) {
				return existingThread;
			}
		} catch (error) {
			// If getThreads fails or times out, continue with creating new thread
			console.warn(
				"Failed to check existing threads, creating new thread:",
				error
			);
		}

		// Create a new thread
		const result = await client.graphql({
			query: CREATE_THREAD,
			variables: {
				input: {
					participantId,
					userId: userContext.userId,
					userName: userContext.userName,
					userEmail: userContext.userEmail,
					userImage: userContext.userImage,
				},
			},
		});

		const thread = (result as any).data.createThread;
		return thread;
	} catch (error) {
		throw error;
	}
};

export const getMessages = async (threadId: string) => {
	if (!process.env.NEXT_PUBLIC_APPSYNC_ENDPOINT) {
		return [];
	}

	try {
		const client = generateClient();

		const result = await client.graphql({
			query: GET_MESSAGES,
			variables: { threadId },
		});

		const messages = (result as any).data.getMessages || [];

		return messages;
	} catch (error) {
		throw error;
	}
};

export const getThreads = async (retryCount = 0): Promise<any[]> => {
	if (!process.env.NEXT_PUBLIC_APPSYNC_ENDPOINT) {
		return [];
	}

	try {
		const client = generateClient();
		const userContext = await getUserContext();

		if (!userContext?.userId) {
			// Retry up to 2 times with increasing delay
			if (retryCount < 2) {
				await new Promise((resolve) =>
					setTimeout(resolve, (retryCount + 1) * 1000)
				);
				return getThreads(retryCount + 1);
			}

			return [];
		}

		const result = await client.graphql({
			query: GET_THREADS,
			variables: {
				userId: userContext.userId,
			},
		});

		const threads = (result as any).data.getThreads || [];
		return threads;
	} catch (error) {
		throw error;
	}
};

export const markMessageAsRead = async (messageId: string) => {
	if (!process.env.NEXT_PUBLIC_APPSYNC_ENDPOINT) {
		throw new Error("AppSync not configured");
	}

	try {
		const client = generateClient();
		const userContext = await getUserContext();

		if (!userContext?.userId) {
			throw new Error("User authentication required");
		}

		const result = await client.graphql({
			query: MARK_MESSAGE_READ,
			variables: {
				input: {
					messageId,
					userId: userContext.userId,
				},
			},
		});

		const messageRead = (result as any).data.markMessageRead;

		return messageRead;
	} catch (error) {
		throw error;
	}
};

export const clearThreadUnreadCount = async (threadId: string) => {
	if (!process.env.NEXT_PUBLIC_APPSYNC_ENDPOINT) {
		throw new Error("AppSync not configured");
	}

	try {
		const client = generateClient();
		const userContext = await getUserContext();

		if (!userContext?.userId) {
			throw new Error("User authentication required");
		}

		const result = await client.graphql({
			query: CLEAR_THREAD_UNREAD_COUNT,
			variables: {
				input: {
					threadId,
					userId: userContext.userId,
				},
			},
		});

		const thread = (result as any).data.clearThreadUnreadCount;

		return thread;
	} catch (error) {
		throw error;
	}
};

// Session cache to prevent excessive API calls
let sessionCache: { user: any; timestamp: number } | null = null;
const SESSION_CACHE_DURATION = 30000; // 30 seconds

// Helper function to get user context for AppSync requests
const getUserContext = async (retryCount = 0): Promise<any> => {
	try {
		// Check cache first
		if (
			sessionCache &&
			Date.now() - sessionCache.timestamp < SESSION_CACHE_DURATION
		) {
			const user = sessionCache.user;
			if (user) {
				return {
					userId: user.id,
					userName: user.name,
					userImage: user.image,
				};
			}
		}

		// Add a small delay to ensure Better Auth is fully initialized
		if (retryCount === 0) {
			await new Promise((resolve) => setTimeout(resolve, 200));
		}

		// Get user session for AppSync operations
		const session = await authClient.getSession();
		const user = session?.data?.user;
		// Update cache
		sessionCache = {
			user: user,
			timestamp: Date.now(),
		};

		if (!user) {
			// Retry up to 2 times with increasing delay
			if (retryCount < 2) {
				await new Promise((resolve) =>
					setTimeout(resolve, (retryCount + 1) * 1000)
				);
				return getUserContext(retryCount + 1);
			}
			return null;
		}

		return {
			userId: user.id,
			userName: user.name,
			userImage: user.image,
		};
	} catch (error) {
		// Error getting session
	}
	return null;
};

// Function to clear session cache (useful for logout)
export const clearSessionCache = () => {
	sessionCache = null;
};

// Subscription helpers
export const subscribeToMessages = (
	threadId: string,
	callback: (message: any) => void
) => {
	if (!process.env.NEXT_PUBLIC_APPSYNC_ENDPOINT) {
		return () => {};
	}

	try {
		const client = generateClient();

		const subscription = (
			client.graphql({
				query: `
				subscription OnMessageAdded($threadId: ID!) {
					onMessageAdded(threadId: $threadId) {
						id
						threadId
						content
						senderId
						senderName
						senderImage
						createdAt
						fileUrl
						fileName
						mimeType
						isRead
						readAt
					}
				}
			`,
				variables: { threadId },
			}) as any
		).subscribe({
			next: (data: any) => {
				const newMessage = data.data?.onMessageAdded;
				if (newMessage) {
					callback(newMessage);
				}
			},
			error: () => {
				// Handle subscription error silently
			},
		});

		return () => subscription.unsubscribe();
	} catch {
		return () => {};
	}
};

export const subscribeToThreadUpdates = (callback: (thread: any) => void) => {
	if (!process.env.NEXT_PUBLIC_APPSYNC_ENDPOINT) {
		return () => {};
	}

	try {
		const client = generateClient();

		const subscription = (
			client.graphql({
				query: `
				subscription OnThreadCreated {
					onThreadCreated {
						id
						user1Id
						user2Id
						lastMessage
						lastMessageAt
						lastMessageSenderId
						lastMessageSenderName
						lastMessageSenderImage
						lastMessageFileUrl
						lastMessageFileName
						lastMessageMimeType
						createdAt
						updatedAt
						unreadCount
					}
				}
			`,
			}) as any
		).subscribe({
			next: (data: any) => {
				const newThread = data.data?.onThreadCreated;
				if (newThread) {
					callback(newThread);
				}
			},
			error: () => {
				// Handle subscription error silently
			},
		});

		return () => subscription.unsubscribe();
	} catch {
		return () => {};
	}
};

// Subscribe to all message updates (for refreshing thread list)
// Since we can't listen to all messages directly, we'll use a polling approach
export const subscribeToAllMessages = (callback: () => void) => {
	if (!process.env.NEXT_PUBLIC_APPSYNC_ENDPOINT) {
		return () => {};
	}

	// Use a simple polling mechanism to refresh threads periodically
	// This ensures thread updates are reflected even when user is on different thread
	const interval = setInterval(() => {
		callback();
	}, 3000); // Refresh every 3 seconds

	return () => {
		clearInterval(interval);
	};
};
