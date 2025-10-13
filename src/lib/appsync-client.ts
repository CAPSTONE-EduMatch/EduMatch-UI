import { generateClient } from "aws-amplify/api";
import { Amplify } from "aws-amplify";
import { authClient } from "@/app/lib/auth-client";

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

		// First, check if a thread already exists between these users
		const existingThreads = await getThreads();
		const existingThread = existingThreads.find(
			(thread) =>
				(thread.user1Id === userContext.userId &&
					thread.user2Id === participantId) ||
				(thread.user1Id === participantId &&
					thread.user2Id === userContext.userId)
		);

		if (existingThread) {
			console.log(
				"AppSync createThread - Found existing thread:",
				existingThread.id
			);
			// Return the existing thread - this will be the thread entry for the current user
			return existingThread;
		}

		console.log(
			"AppSync createThread - Creating new thread with participant:",
			participantId
		);

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

		console.log(
			"AppSync createThread - Created thread for both users:",
			thread.id
		);

		return thread;
	} catch (error) {
		console.error("AppSync createThread - Error:", error);
		throw error;
	}
};

export const getMessages = async (threadId: string) => {
	if (!process.env.NEXT_PUBLIC_APPSYNC_ENDPOINT) {
		throw new Error("AppSync not configured");
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
		throw new Error("AppSync not configured");
	}

	try {
		const client = generateClient();
		const userContext = await getUserContext();

		console.log("AppSync getThreads - User context:", userContext);

		if (!userContext?.userId) {
			console.error(
				"AppSync getThreads - No user ID available, retry count:",
				retryCount
			);

			// Retry up to 3 times with increasing delay
			if (retryCount < 3) {
				console.log(
					"AppSync getThreads - Retrying in",
					(retryCount + 1) * 1000,
					"ms"
				);
				await new Promise((resolve) =>
					setTimeout(resolve, (retryCount + 1) * 1000)
				);
				return getThreads(retryCount + 1);
			}

			throw new Error("User authentication required");
		}

		console.log(
			"AppSync getThreads - Making request with userId:",
			userContext.userId
		);

		const result = await client.graphql({
			query: GET_THREADS,
			variables: {
				userId: userContext.userId,
			},
		});

		console.log("AppSync getThreads - Result:", result);

		const threads = (result as any).data.getThreads || [];

		return threads;
	} catch (error) {
		console.error(
			"AppSync getThreads - Full error object:",
			JSON.stringify(error, null, 2)
		);
		console.error(
			"AppSync getThreads - Error message:",
			(error as Error).message
		);
		console.error(
			"AppSync getThreads - Error stack:",
			(error as Error).stack
		);
		throw error;
	}
};

export const markMessageAsRead = async (messageId: string) => {
	if (!process.env.NEXT_PUBLIC_APPSYNC_ENDPOINT) {
		throw new Error("AppSync not configured");
	}

	try {
		console.log(
			"AppSync markMessageAsRead - Starting with messageId:",
			messageId
		);
		const client = generateClient();
		const userContext = await getUserContext();

		if (!userContext?.userId) {
			throw new Error("User authentication required");
		}

		console.log("AppSync markMessageAsRead - User context:", userContext);

		const result = await client.graphql({
			query: MARK_MESSAGE_READ,
			variables: {
				input: {
					messageId,
					userId: userContext.userId,
				},
			},
		});

		console.log("AppSync markMessageAsRead - GraphQL result:", result);

		const messageRead = (result as any).data.markMessageRead;

		return messageRead;
	} catch (error) {
		console.error("AppSync markMessageAsRead - Error:", error);
		throw error;
	}
};

export const clearThreadUnreadCount = async (threadId: string) => {
	if (!process.env.NEXT_PUBLIC_APPSYNC_ENDPOINT) {
		throw new Error("AppSync not configured");
	}

	try {
		console.log(
			"AppSync clearThreadUnreadCount - Starting with threadId:",
			threadId
		);
		const client = generateClient();
		const userContext = await getUserContext();

		if (!userContext?.userId) {
			throw new Error("User authentication required");
		}

		console.log(
			"AppSync clearThreadUnreadCount - User context:",
			userContext
		);

		const result = await client.graphql({
			query: CLEAR_THREAD_UNREAD_COUNT,
			variables: {
				input: {
					threadId,
					userId: userContext.userId,
				},
			},
		});

		console.log("AppSync clearThreadUnreadCount - GraphQL result:", result);

		const thread = (result as any).data.clearThreadUnreadCount;

		return thread;
	} catch (error) {
		console.error("AppSync clearThreadUnreadCount - Error:", error);
		throw error;
	}
};

// Helper function to get user context for AppSync requests
const getUserContext = async () => {
	try {
		const session = await authClient.getSession();
		console.log(
			"AppSync getUserContext - Full session object:",
			JSON.stringify(session, null, 2)
		);

		if (session?.data?.user) {
			const user = session.data.user;
			console.log(
				"AppSync getUserContext - User object:",
				JSON.stringify(user, null, 2)
			);

			const userContext = {
				userId: user.id,
				userName: user.name,
				userEmail: user.email,
				userImage: user.image,
			};
			console.log("AppSync getUserContext - User context:", userContext);
			return userContext;
		}

		console.log(
			"AppSync getUserContext - No user in session, session structure:",
			{
				hasSession: !!session,
				hasData: !!session?.data,
				hasUser: !!session?.data?.user,
				sessionKeys: session ? Object.keys(session) : [],
				dataKeys: session?.data ? Object.keys(session.data) : [],
			}
		);
	} catch (error) {
		console.error("AppSync getUserContext - Error getting session:", error);
	}
	return null;
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
