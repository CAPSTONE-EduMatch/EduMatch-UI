import { useState, useEffect, useCallback, useRef } from "react";
import {
	getMessages,
	getMessagesFromAppSync,
	createMessage,
	getThreads,
	createThread,
	updateThread,
	updateThreadUnreadCount,
	subscribeToMessages,
	subscribeToThreads,
} from "@/lib/appsync-client";

export interface Message {
	id: string;
	threadId: string;
	content?: string;
	senderId: string;
	senderName: string;
	senderImage?: string;
	fileUrl?: string;
	fileName?: string;
	fileSize?: number;
	mimeType?: string;
	createdAt: string;
	isRead: boolean;
}

export interface Thread {
	id: string;
	participants: string[];
	lastMessage?: string;
	lastMessageAt?: string;
	createdAt: string;
	updatedAt: string;
	// File message fields (from API fallback)
	lastMessageFileUrl?: string;
	lastMessageFileName?: string;
	lastMessageMimeType?: string;
	// AppSync thread fields
	unreadCount?: number;
	otherParticipant?: {
		id: string;
		name: string;
		email?: string;
		image?: string;
	};
	lastMessageSender?: {
		id: string;
		name: string;
		email?: string;
		image?: string;
	};
}

export const useAppSyncMessaging = (user?: any) => {
	const [messages, setMessages] = useState<Message[]>([]);
	const [threads, setThreads] = useState<Thread[]>([]);
	const [selectedThreadId, setSelectedThreadId] = useState<string | null>(
		null
	);
	const [isConnected, setIsConnected] = useState(false);
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const subscriptionRef = useRef<any>(null);

	// Initialize connection
	useEffect(() => {
		setIsConnected(true);
		loadThreads();

		return () => {
			if (subscriptionRef.current) {
				subscriptionRef.current.unsubscribe();
			}
		};
	}, []);

	// Subscribe to messages when thread is selected
	useEffect(() => {
		if (selectedThreadId) {
			// Unsubscribe from previous subscription
			if (subscriptionRef.current) {
				subscriptionRef.current.unsubscribe();
			}

			// Load existing messages
			loadMessages(selectedThreadId);

			// Subscribe to new messages using AppSync
			if (process.env.NEXT_PUBLIC_APPSYNC_ENDPOINT) {
				console.log(
					"Setting up AppSync subscription for thread:",
					selectedThreadId
				);
				subscriptionRef.current = subscribeToMessages(
					selectedThreadId,
					(newMessage) => {
						console.log(
							"AppSync message received for current thread:",
							newMessage
						);
						setMessages((prev) => {
							// Check if message already exists to avoid duplicates
							const exists = prev.some(
								(msg) => msg && msg.id === newMessage.id
							);
							if (exists) {
								console.log(
									"Message already exists, not adding"
								);
								return prev;
							}

							// Ensure the new message has proper structure
							if (newMessage && newMessage.id) {
								console.log(
									"Adding new AppSync message to chat"
								);
								return [...prev, newMessage];
							}
							return prev;
						});
					}
				);
			} else {
				console.warn("AppSync not configured, using fallback polling");
				// Fallback: minimal polling only if AppSync is not available
				const pollInterval = setInterval(() => {
					loadMessages(selectedThreadId);
				}, 5000); // Much slower polling as fallback

				subscriptionRef.current = {
					unsubscribe: () => clearInterval(pollInterval),
				};
			}

			// Also set up cross-tab communication for immediate updates
			const handleStorageChange = (e: StorageEvent) => {
				if (e.key === `message_${selectedThreadId}` && e.newValue) {
					try {
						const message = JSON.parse(e.newValue);
						console.log(
							"Cross-tab message received in hook:",
							message
						);
						setMessages((prev) => {
							// Check if message already exists to avoid duplicates
							const exists = prev.some(
								(msg) => msg && msg.id === message.id
							);
							if (exists) return prev;

							// Ensure the new message has proper structure
							if (message && message.id) {
								console.log("Adding cross-tab message to chat");
								return [...prev, message];
							}
							return prev;
						});
					} catch (error) {
						console.error(
							"Error parsing cross-tab message in hook:",
							error
						);
					}
				}
			};

			window.addEventListener("storage", handleStorageChange);

			// Clean up storage listener
			return () => {
				window.removeEventListener("storage", handleStorageChange);
			};
		}
	}, [selectedThreadId]);

	const loadMessages = useCallback(async (threadId: string) => {
		try {
			setIsLoading(true);
			setError(null);

			// Use AppSync for loading messages if available
			if (process.env.NEXT_PUBLIC_APPSYNC_ENDPOINT) {
				console.log(
					"Loading messages from AppSync for thread:",
					threadId
				);
				const fetchedMessages = await getMessagesFromAppSync(threadId);

				// Ensure messages have proper structure and unique IDs
				const validMessages = (fetchedMessages || []).filter(
					(msg: any, index: number, arr: any[]) =>
						msg &&
						msg.id &&
						arr.findIndex((m: any) => m.id === msg.id) === index
				);

				console.log(
					"Loaded messages from AppSync:",
					validMessages.length
				);
				setMessages(validMessages);
			} else {
				// Fallback to API only if AppSync is not available
				console.log(
					"Loading messages from API (fallback) for thread:",
					threadId
				);
				const fetchedMessages = await getMessages(threadId);

				const validMessages = (fetchedMessages || []).filter(
					(msg: any, index: number, arr: any[]) =>
						msg &&
						msg.id &&
						arr.findIndex((m: any) => m.id === msg.id) === index
				);

				console.log("Loaded messages from API:", validMessages.length);
				setMessages(validMessages);
			}
		} catch (err) {
			setError("Failed to load messages");
			console.error("Error loading messages:", err);
		} finally {
			setIsLoading(false);
		}
	}, []);

	// No need for heartbeat polling when using AppSync subscriptions

	const loadThreads = useCallback(async () => {
		try {
			setIsLoading(true);
			setError(null);
			const fetchedThreads = await getThreads();
			setThreads(fetchedThreads || []);
		} catch (err) {
			setError("Failed to load threads");
			console.error("Error loading threads:", err);
		} finally {
			setIsLoading(false);
		}
	}, []);

	// Subscribe to thread updates
	useEffect(() => {
		if (process.env.NEXT_PUBLIC_APPSYNC_ENDPOINT) {
			console.log("Setting up thread subscription");
			const threadSubscription = subscribeToThreads((updatedThread) => {
				console.log("Thread updated via subscription:", updatedThread);
				// Refresh threads when a thread is updated
				loadThreads();
			});

			return () => {
				threadSubscription.unsubscribe();
			};
		}
	}, [loadThreads]);

	// Global thread polling for unread counts (works for both AppSync and non-AppSync)
	useEffect(() => {
		console.log("Setting up global thread polling for unread counts");

		// Poll threads every 1 second to update unread counts for all threads
		// This ensures cross-thread unread counts work even when using AppSync
		const pollInterval = setInterval(() => {
			loadThreads(); // This will update unread counts for all threads
		}, 1000);

		return () => {
			clearInterval(pollInterval);
		};
	}, [loadThreads]);

	// Cross-tab communication for immediate thread updates
	useEffect(() => {
		console.log("Setting up cross-tab communication for thread updates");

		const handleStorageChange = (e: StorageEvent) => {
			// Listen for thread updates from other tabs
			if (e.key && e.key.startsWith("thread_update_") && e.newValue) {
				try {
					const threadUpdate = JSON.parse(e.newValue);
					console.log(
						"Cross-tab thread update received:",
						threadUpdate
					);

					// Update the specific thread immediately
					setThreads((prev) => {
						return prev.map((thread) => {
							if (thread.id === threadUpdate.threadId) {
								return {
									...thread,
									lastMessage: threadUpdate.lastMessage,
									lastMessageAt: threadUpdate.lastMessageAt,
									lastMessageSender:
										threadUpdate.lastMessageSender,
									// Only increment unread count if this is from another user and not the current thread
									unreadCount:
										threadUpdate.lastMessageSender.id !==
											user?.id &&
										selectedThreadId !==
											threadUpdate.threadId
											? (thread.unreadCount || 0) + 1
											: thread.unreadCount,
									updatedAt: new Date().toISOString(),
								};
							}
							return thread;
						});
					});
				} catch (error) {
					console.error(
						"Error parsing cross-tab thread update:",
						error
					);
				}
			}
		};

		window.addEventListener("storage", handleStorageChange);

		return () => {
			window.removeEventListener("storage", handleStorageChange);
		};
	}, [user, selectedThreadId]);

	const sendMessage = useCallback(
		async (content: string, threadId: string) => {
			try {
				setError(null);
				const newMessage = await createMessage({
					threadId,
					content,
					user,
				});

				console.log("Message sent, adding optimistically:", newMessage);

				// The message will be added via subscription, but we can add it optimistically
				setMessages((prev) => {
					const exists = prev.some(
						(msg) => msg && msg.id === newMessage.id
					);
					if (exists) {
						console.log("Message already exists, not adding");
						return prev;
					}

					// Ensure the new message has proper structure
					if (newMessage && newMessage.id) {
						console.log(
							"Adding new message to array, total messages:",
							prev.length + 1
						);
						return [...prev, newMessage];
					}
					console.log("Message structure invalid, not adding");
					return prev;
				});

				// Update thread immediately for instant UI update
				setThreads((prev) => {
					return prev.map((thread) => {
						if (thread.id === threadId) {
							return {
								...thread,
								lastMessage: newMessage.content || "[File]",
								lastMessageAt: newMessage.createdAt,
								lastMessageSender: {
									id: user?.id || "",
									name: user?.name || "",
									email: user?.email || "",
									image: user?.image || null,
								},
								updatedAt: new Date().toISOString(),
							};
						}
						return thread;
					});
				});

				return newMessage;
			} catch (err) {
				setError("Failed to send message");
				console.error("Error sending message:", err);
				throw err;
			}
		},
		[user]
	);

	const sendFileMessage = useCallback(
		async (
			threadId: string,
			fileUrl: string,
			fileName: string,
			fileSize: number,
			mimeType: string
		) => {
			try {
				setError(null);
				const newMessage = await createMessage({
					threadId,
					fileUrl,
					fileName,
					fileSize,
					mimeType,
					user,
				});

				// The message will be added via subscription, but we can add it optimistically
				setMessages((prev) => {
					const exists = prev.some(
						(msg) => msg && msg.id === newMessage.id
					);
					if (exists) return prev;

					// Ensure the new message has proper structure
					if (newMessage && newMessage.id) {
						return [...prev, newMessage];
					}
					return prev;
				});

				// Update thread immediately for instant UI feedback
				setThreads((prev) => {
					return prev.map((thread) => {
						if (thread.id === threadId) {
							return {
								...thread,
								lastMessage: newMessage.content || "[File]",
								lastMessageAt: newMessage.createdAt,
								lastMessageSender: {
									id: user.id,
									name: user.name,
									email: user.email,
									image: user.image,
								},
								unreadCount: 0, // Sender's unread count is always 0
								updatedAt: new Date().toISOString(),
							};
						}
						return thread;
					});
				});

				// Also refresh threads from server to ensure consistency
				setTimeout(() => {
					loadThreads();
				}, 100);

				return newMessage;
			} catch (err) {
				setError("Failed to send file message");
				console.error("Error sending file message:", err);
				throw err;
			}
		},
		[user]
	);

	const createNewThread = useCallback(
		async (participants: string[], otherParticipant?: any) => {
			try {
				setError(null);
				const newThread = await createThread(
					participants,
					otherParticipant
				);
				setThreads((prev) => [...prev, newThread]);
				return newThread;
			} catch (err) {
				setError("Failed to create thread");
				console.error("Error creating thread:", err);
				throw err;
			}
		},
		[]
	);

	const selectThread = useCallback((threadId: string) => {
		setSelectedThreadId(threadId);
	}, []);

	// Removed markAsRead functionality - using simple unread count from threads API instead

	const clearMessages = useCallback(() => {
		setMessages([]);
		setSelectedThreadId(null);
	}, []);

	// Mark messages as read for a thread
	const markThreadAsRead = useCallback(
		async (threadId: string) => {
			try {
				console.log(
					"Attempting to mark messages as read for thread:",
					threadId
				);
				console.log("Current messages:", messages);
				console.log(
					"Message IDs to mark as read:",
					messages.map((msg) => msg.id)
				);

				// Call the API to mark messages as read
				const response = await fetch("/api/socket/read", {
					method: "POST",
					headers: {
						"Content-Type": "application/json",
					},
					body: JSON.stringify({
						threadId: threadId,
						markAllUnread: true, // Mark all unread messages in the thread as read
					}),
				});

				console.log("Mark as read response status:", response.status);

				if (response.ok) {
					const result = await response.json();
					console.log(
						"Messages marked as read successfully:",
						result
					);

					// Update thread unread count immediately in local state
					setThreads((prev) => {
						return prev.map((thread) => {
							if (thread.id === threadId) {
								return {
									...thread,
									unreadCount: 0,
									updatedAt: new Date().toISOString(),
								};
							}
							return thread;
						});
					});

					// Update thread unread count in AppSync for real-time updates
					try {
						await updateThreadUnreadCount(threadId, 0);
					} catch (error) {
						console.error(
							"Error updating thread unread count in AppSync:",
							error
						);
					}
				} else {
					const errorText = await response.text();
					console.error(
						"Failed to mark messages as read:",
						response.status,
						errorText
					);
				}
			} catch (error) {
				console.error("Error marking messages as read:", error);
			}
		},
		[messages, loadThreads]
	);

	// Update thread immediately when a new message is received
	const updateThreadFromMessage = useCallback(
		async (threadId: string, message: any) => {
			try {
				console.log(
					"Updating thread from new message:",
					threadId,
					message
				);

				// Get current user info for sender
				const sender = {
					id: message.senderId,
					name: message.senderName,
					email: "", // We don't have email in message
					image: message.senderImage,
				};

				// Update local threads state immediately for instant UI update
				setThreads((prev) => {
					return prev.map((thread) => {
						if (thread.id === threadId) {
							// Only increment unread count if this is a new message from another user
							// and we're not currently viewing this specific thread
							const shouldIncrementUnread =
								message.senderId !== user?.id &&
								selectedThreadId !== threadId;

							return {
								...thread,
								lastMessage: message.content || "[File]",
								lastMessageAt: message.createdAt,
								lastMessageSender: sender,
								unreadCount: shouldIncrementUnread
									? (thread.unreadCount || 0) + 1
									: thread.unreadCount,
								updatedAt: new Date().toISOString(),
							};
						}
						return thread;
					});
				});

				// Update thread in AppSync for real-time sync (but don't duplicate local updates)
				try {
					await updateThread(threadId, message, sender);
				} catch (error) {
					console.error("Error updating thread in AppSync:", error);
				}
			} catch (error) {
				console.error("Error updating thread from message:", error);
			}
		},
		[user, selectedThreadId]
	);

	return {
		// State
		messages,
		threads,
		selectedThreadId,
		isConnected,
		isLoading,
		error,

		// Actions
		sendMessage,
		sendFileMessage,
		createNewThread,
		selectThread,
		loadMessages,
		loadThreads,
		markThreadAsRead,
		clearMessages,
	};
};
