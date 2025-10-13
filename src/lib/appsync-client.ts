import { Amplify } from "aws-amplify";
import { generateClient } from "aws-amplify/api";

// AppSync configuration
const appsyncConfig = {
	API: {
		GraphQL: {
			endpoint: process.env.NEXT_PUBLIC_APPSYNC_ENDPOINT || "",
			region: process.env.NEXT_PUBLIC_AWS_REGION || "ap-northeast-1",
			defaultAuthMode: "apiKey" as const,
			apiKey: process.env.NEXT_PUBLIC_APPSYNC_API_KEY || "",
		},
	},
};

// Initialize Amplify with AppSync config
if (typeof window !== "undefined" && process.env.NEXT_PUBLIC_APPSYNC_ENDPOINT) {
	Amplify.configure(appsyncConfig);
} else if (typeof window !== "undefined") {
	console.warn("AppSync not configured. Using fallback API routes.");
}

// GraphQL operations
export const GET_MESSAGES = `
  query GetMessages($threadId: ID!) {
    getMessages(threadId: $threadId) {
      id
      threadId
      content
      senderId
      senderName
      senderImage
      fileUrl
      fileName
      fileSize
      mimeType
      createdAt
      isRead
    }
  }
`;

export const CREATE_MESSAGE = `
  mutation CreateMessage($input: CreateMessageInput!) {
    createMessage(input: $input) {
      id
      threadId
      content
      senderId
      senderName
      senderImage
      fileUrl
      fileName
      fileSize
      mimeType
      createdAt
      isRead
    }
  }
`;

export const GET_THREADS = `
	query GetThreads {
		getThreads {
			id
			participants
			lastMessage
			lastMessageAt
			createdAt
			updatedAt
			otherParticipant {
				id
				name
				email
				image
			}
			lastMessageSender {
				id
				name
				email
				image
			}
			unreadCount
			lastMessageFileUrl
			lastMessageFileName
			lastMessageMimeType
		}
	}
`;

export const CREATE_THREAD = `
  mutation CreateThread($input: CreateThreadInput!) {
    createThread(input: $input) {
      id
      participants
      lastMessage
      lastMessageAt
      createdAt
      updatedAt
      otherParticipant {
        id
        name
        email
        image
      }
      lastMessageSender {
        id
        name
        email
        image
      }
      unreadCount
      lastMessageFileUrl
      lastMessageFileName
      lastMessageMimeType
    }
  }
`;

export const UPDATE_THREAD = `
  mutation UpdateThread($input: UpdateThreadInput!) {
    updateThread(input: $input) {
      id
      participants
      lastMessage
      lastMessageAt
      createdAt
      updatedAt
      otherParticipant {
        id
        name
        email
        image
      }
      lastMessageSender {
        id
        name
        email
        image
      }
      unreadCount
      lastMessageFileUrl
      lastMessageFileName
      lastMessageMimeType
    }
  }
`;

export const ON_MESSAGE_ADDED = `
	subscription OnMessageAdded($threadId: ID!) {
		onMessageAdded(threadId: $threadId) {
			id
			threadId
			content
			senderId
			senderName
			senderImage
			fileUrl
			fileName
			fileSize
			mimeType
			createdAt
			isRead
		}
	}
`;

const ON_THREAD_UPDATED = `
	subscription OnThreadUpdated {
		onThreadUpdated {
			id
			participants
			lastMessage
			lastMessageAt
			createdAt
			updatedAt
			otherParticipant {
				id
				name
				email
				image
			}
			lastMessageSender {
				id
				name
				email
				image
			}
			unreadCount
			lastMessageFileUrl
			lastMessageFileName
			lastMessageMimeType
		}
	}
`;

// AppSync client
export const client = generateClient();

// Helper functions
export const getMessages = async (threadId: string) => {
	// Use AppSync for messages if available, fallback to API
	if (process.env.NEXT_PUBLIC_APPSYNC_ENDPOINT) {
		try {
			const client = generateClient();
			const result = await client.graphql({
				query: GET_MESSAGES,
				variables: { threadId },
			});
			return (result as any).data.getMessages || [];
		} catch (error) {
			console.error("Error fetching messages from AppSync:", error);
			// Fallback to API
		}
	}

	// Fallback to PostgreSQL API
	const response = await fetch(`/api/messages/${threadId}`);
	if (!response.ok) {
		throw new Error("Failed to fetch messages via API");
	}
	const data = await response.json();
	return data.messages || [];
};

// Get messages from AppSync only (no fallback)
export const getMessagesFromAppSync = async (threadId: string) => {
	if (!process.env.NEXT_PUBLIC_APPSYNC_ENDPOINT) {
		throw new Error("AppSync not configured");
	}

	const client = generateClient();
	const result = await client.graphql({
		query: GET_MESSAGES,
		variables: { threadId },
	});

	return (result as any).data.getMessages || [];
};

export const createMessage = async (input: {
	threadId: string;
	content?: string;
	fileUrl?: string;
	fileName?: string;
	fileSize?: number;
	mimeType?: string;
	user?: any; // Pass user from the component
}) => {
	// Use AppSync for creating messages if available
	if (process.env.NEXT_PUBLIC_APPSYNC_ENDPOINT) {
		try {
			console.log("Creating message via AppSync");
			const client = generateClient();
			const messageId = `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

			const result = await client.graphql({
				query: CREATE_MESSAGE,
				variables: {
					input: {
						id: messageId,
						threadId: input.threadId,
						content: input.content,
						senderId: input.user?.id || "unknown-user",
						senderName: input.user?.name || "Unknown User",
						senderImage: input.user?.image || null,
						fileUrl: input.fileUrl,
						fileName: input.fileName,
						fileSize: input.fileSize,
						mimeType: input.mimeType,
						isRead: false,
						createdAt: new Date().toISOString(),
					},
				},
			});

			const message = (result as any).data.createMessage;
			console.log("Message created via AppSync:", message);

			// Note: Thread will be updated when message is received via subscription
			// This prevents duplicate updates

			// Also save to PostgreSQL for persistence (background sync)
			try {
				await fetch("/api/messages/send", {
					method: "POST",
					headers: {
						"Content-Type": "application/json",
					},
					body: JSON.stringify({
						threadId: input.threadId,
						content: input.content,
						fileUrl: input.fileUrl,
						fileName: input.fileName,
						fileSize: input.fileSize,
						mimeType: input.mimeType,
					}),
				});
			} catch (error) {
				console.error("Error syncing to PostgreSQL:", error);
			}

			// Notify other tabs about the new message for immediate updates
			try {
				localStorage.setItem(
					`message_${input.threadId}`,
					JSON.stringify(message)
				);
				localStorage.removeItem(`message_${input.threadId}`);

				// Also notify about thread update for unread counts
				localStorage.setItem(
					`thread_update_${input.threadId}`,
					JSON.stringify({
						threadId: input.threadId,
						lastMessage: message.content || "[File]",
						lastMessageAt: message.createdAt,
						lastMessageSender: {
							id: input.user?.id,
							name: input.user?.name,
							email: input.user?.email,
							image: input.user?.image,
						},
						timestamp: Date.now(),
					})
				);
				localStorage.removeItem(`thread_update_${input.threadId}`);
			} catch (error) {
				console.error("Error notifying other tabs:", error);
			}

			return message;
		} catch (error) {
			console.error("Error creating message via AppSync:", error);
			// Fallback to API
		}
	}

	// Fallback to PostgreSQL API
	console.log("Creating message via API (fallback)");
	const response = await fetch("/api/messages/send", {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
		},
		body: JSON.stringify({
			threadId: input.threadId,
			content: input.content,
			fileUrl: input.fileUrl,
			fileName: input.fileName,
			fileSize: input.fileSize,
			mimeType: input.mimeType,
		}),
	});

	if (!response.ok) {
		throw new Error("Failed to send message via API");
	}

	const responseData = await response.json();
	const message = responseData.message || responseData;

	// Notify other tabs about the new message for immediate updates
	try {
		localStorage.setItem(
			`message_${input.threadId}`,
			JSON.stringify(message)
		);
		localStorage.removeItem(`message_${input.threadId}`);

		// Also notify about thread update for unread counts
		localStorage.setItem(
			`thread_update_${input.threadId}`,
			JSON.stringify({
				threadId: input.threadId,
				lastMessage: message.content || "[File]",
				lastMessageAt: message.createdAt,
				lastMessageSender: {
					id: input.user?.id,
					name: input.user?.name,
					email: input.user?.email,
					image: input.user?.image,
				},
				timestamp: Date.now(),
			})
		);
		localStorage.removeItem(`thread_update_${input.threadId}`);
	} catch (error) {
		console.error("Error notifying other tabs:", error);
	}

	return message;
};

export const getThreads = async () => {
	// Use AppSync for threads completely
	if (process.env.NEXT_PUBLIC_APPSYNC_ENDPOINT) {
		try {
			console.log("Loading threads from AppSync");
			const client = generateClient();
			const result = await client.graphql({
				query: GET_THREADS,
			});
			const threads = (result as any).data.getThreads || [];
			console.log("Loaded threads from AppSync:", threads.length);
			return threads;
		} catch (error) {
			console.error("Error fetching threads from AppSync:", error);
			// Fallback to API
		}
	}

	// Fallback to PostgreSQL API
	console.log("Loading threads from API (fallback)");
	const response = await fetch("/api/threads");
	if (!response.ok) {
		throw new Error("Failed to fetch threads via API");
	}
	const data = await response.json();
	// Transform the API response to match AppSync format
	return data.threads.map((thread: any) => ({
		id: thread.id,
		participants: [thread.otherParticipant.id],
		lastMessage: thread.lastMessage,
		lastMessageAt: thread.lastMessageAt,
		createdAt: thread.createdAt,
		updatedAt: thread.lastMessageAt || thread.createdAt,
		// Include file information for file messages
		lastMessageFileUrl: thread.lastMessageFileUrl,
		lastMessageFileName: thread.lastMessageFileName,
		lastMessageMimeType: thread.lastMessageMimeType,
		// Include the other participant info directly
		otherParticipant: thread.otherParticipant,
		// Include the last message sender info
		lastMessageSender: thread.lastMessageSender,
		// Include unread count from API
		unreadCount: thread.unreadCount || 0,
	}));
};

export const createThread = async (
	participants: string[],
	otherParticipant?: any
) => {
	// Use AppSync for creating threads if available
	if (process.env.NEXT_PUBLIC_APPSYNC_ENDPOINT) {
		try {
			console.log("Creating thread via AppSync");
			const client = generateClient();
			const threadId = `thread_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

			const result = await client.graphql({
				query: CREATE_THREAD,
				variables: {
					input: {
						id: threadId,
						participants,
						createdAt: new Date().toISOString(),
						updatedAt: new Date().toISOString(),
						// Include additional fields for complete thread data
						otherParticipant: otherParticipant
							? {
									id: otherParticipant.id,
									name: otherParticipant.name,
									email: otherParticipant.email || "",
									image: otherParticipant.image || null,
								}
							: null,
						lastMessageSender: null, // Will be set when first message is sent
						unreadCount: 0,
						lastMessageFileUrl: null,
						lastMessageFileName: null,
						lastMessageMimeType: null,
					},
				},
			});

			const thread = (result as any).data.createThread;
			console.log("Thread created via AppSync:", thread);

			// Also save to PostgreSQL for persistence (background sync)
			try {
				await fetch("/api/threads", {
					method: "POST",
					headers: {
						"Content-Type": "application/json",
					},
					body: JSON.stringify({ participantId: participants[0] }),
				});
			} catch (error) {
				console.error("Error syncing thread to PostgreSQL:", error);
			}

			return thread;
		} catch (error) {
			console.error("Error creating thread via AppSync:", error);
			// Fallback to API
		}
	}

	// Fallback to PostgreSQL API
	console.log("Creating thread via API (fallback)");
	const response = await fetch("/api/threads", {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
		},
		body: JSON.stringify({ participantId: participants[0] }),
	});

	if (!response.ok) {
		throw new Error("Failed to create thread via API");
	}

	const thread = await response.json();
	return thread;
};

// Update thread with new message info
export const updateThread = async (
	threadId: string,
	message: any,
	sender: any
) => {
	if (process.env.NEXT_PUBLIC_APPSYNC_ENDPOINT) {
		try {
			console.log("Updating thread via AppSync:", threadId);
			const client = generateClient();

			const result = await client.graphql({
				query: UPDATE_THREAD,
				variables: {
					input: {
						id: threadId,
						lastMessage: message.content || "[File]",
						lastMessageAt: message.createdAt,
						updatedAt: new Date().toISOString(),
						lastMessageSender: {
							id: sender.id,
							name: sender.name,
							email: sender.email || "",
							image: sender.image || null,
						},
						unreadCount: 1, // Will be calculated properly by the backend
						lastMessageFileUrl: message.fileUrl || null,
						lastMessageFileName: message.fileName || null,
						lastMessageMimeType: message.mimeType || null,
					},
				},
			});

			const updatedThread = (result as any).data.updateThread;
			console.log("Thread updated via AppSync:", updatedThread);
			return updatedThread;
		} catch (error) {
			console.error("Error updating thread via AppSync:", error);
		}
	}
};

// Update thread unread count when messages are marked as read
export const updateThreadUnreadCount = async (
	threadId: string,
	unreadCount: number
) => {
	if (process.env.NEXT_PUBLIC_APPSYNC_ENDPOINT) {
		try {
			console.log(
				"Updating thread unread count via AppSync:",
				threadId,
				unreadCount
			);
			const client = generateClient();

			const result = await client.graphql({
				query: UPDATE_THREAD,
				variables: {
					input: {
						id: threadId,
						updatedAt: new Date().toISOString(),
						unreadCount: unreadCount,
					},
				},
			});

			const updatedThread = (result as any).data.updateThread;
			console.log(
				"Thread unread count updated via AppSync:",
				updatedThread
			);
			return updatedThread;
		} catch (error) {
			console.error(
				"Error updating thread unread count via AppSync:",
				error
			);
		}
	}
};

// Subscription helper
export const subscribeToMessages = (
	threadId: string,
	callback: (message: any) => void
) => {
	if (process.env.NEXT_PUBLIC_APPSYNC_ENDPOINT) {
		// Use AppSync real-time subscriptions
		console.log("Setting up AppSync subscription for thread:", threadId);
		const client = generateClient();

		const subscription = (
			client.graphql({
				query: ON_MESSAGE_ADDED,
				variables: { threadId },
			}) as any
		).subscribe({
			next: (data: any) => {
				console.log("AppSync subscription received:", data);
				if (data.data?.onMessageAdded) {
					callback(data.data.onMessageAdded);
				}
			},
			error: (error: any) => {
				console.error("AppSync subscription error:", error);
			},
		});

		return {
			unsubscribe: () => {
				console.log("Unsubscribing from AppSync");
				subscription.unsubscribe();
			},
		};
	} else {
		// Fallback to polling if AppSync is not available
		console.log("Using polling fallback for thread:", threadId);
		let lastMessageCount = 0;
		const pollInterval = setInterval(async () => {
			try {
				const messages = await getMessages(threadId);
				// Only call callback if there are new messages
				if (messages.length > lastMessageCount) {
					console.log(
						"New messages detected via polling:",
						messages.length - lastMessageCount
					);
					// Get the latest message and call callback
					if (messages.length > 0) {
						const latestMessage = messages[0]; // Assuming messages are sorted by newest first
						callback(latestMessage);
					}
					lastMessageCount = messages.length;
				}
			} catch (error) {
				console.error("Polling error:", error);
			}
		}, 5000); // Much slower polling as fallback

		return {
			unsubscribe: () => {
				clearInterval(pollInterval);
			},
		};
	}
};

// Thread subscription helper
export const subscribeToThreads = (callback: (thread: any) => void) => {
	if (process.env.NEXT_PUBLIC_APPSYNC_ENDPOINT) {
		// Use AppSync real-time subscriptions for threads
		console.log("Setting up AppSync thread subscription");
		const client = generateClient();

		const subscription = (
			client.graphql({
				query: ON_THREAD_UPDATED,
			}) as any
		).subscribe({
			next: (data: any) => {
				console.log("AppSync thread subscription received:", data);
				if (data.data?.onThreadUpdated) {
					callback(data.data.onThreadUpdated);
				}
			},
			error: (error: any) => {
				console.error("AppSync thread subscription error:", error);
			},
		});

		return {
			unsubscribe: () => {
				console.log("Unsubscribing from AppSync thread subscription");
				subscription.unsubscribe();
			},
		};
	} else {
		// Fallback: no thread subscription if AppSync is not available
		console.log("AppSync not configured, no thread subscription available");
		return {
			unsubscribe: () => {},
		};
	}
};
