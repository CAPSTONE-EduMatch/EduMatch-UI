import { useState, useEffect, useCallback } from "react";
import {
	createMessage,
	createThread,
	getMessages,
	getThreads,
	markMessageAsRead,
	clearThreadUnreadCount,
	subscribeToMessages,
	subscribeToThreadUpdates,
	subscribeToAllMessages,
} from "@/lib/appsync-client";
import { authClient } from "@/app/lib/auth-client";

export interface Message {
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

export interface Thread {
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

export const useAppSyncMessaging = () => {
	const [messages, setMessages] = useState<Message[]>([]);
	const [threads, setThreads] = useState<Thread[]>([]);
	const [selectedThreadId, setSelectedThreadId] = useState<string | null>(
		null
	);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [user, setUser] = useState<any>(null);

	// Load all threads
	const loadThreads = useCallback(async () => {
		try {
			setLoading(true);
			setError(null);
			const threadsData = await getThreads();
			setThreads(threadsData);
		} catch (err) {
			console.error("Error loading threads:", err);
			setError("Failed to load threads");
		} finally {
			setLoading(false);
		}
	}, []);

	// Load messages for a specific thread
	const loadMessages = useCallback(async (threadId: string) => {
		try {
			setLoading(true);
			setError(null);
			const messagesData = await getMessages(threadId);
			setMessages(messagesData);
		} catch (err) {
			console.error("Error loading messages:", err);
			setError("Failed to load messages");
		} finally {
			setLoading(false);
		}
	}, []);

	// Send a message
	const sendMessage = useCallback(
		async (
			threadId: string,
			content: string,
			fileUrl?: string,
			fileName?: string,
			mimeType?: string
		) => {
			try {
				setError(null);
				const message = await createMessage({
					threadId,
					content,
					fileUrl,
					fileName,
					mimeType,
				});

				// Add message to local state immediately for better UX
				setMessages((prev) => [...prev, message]);

				// Refresh threads to update lastMessage and timestamp
				loadThreads();

				return message;
			} catch (err) {
				console.error("Error sending message:", err);
				setError("Failed to send message");
				throw err;
			}
		},
		[loadThreads]
	);

	// Create a new thread
	const startNewThread = useCallback(async (participantId: string) => {
		try {
			setError(null);
			const thread = await createThread(participantId);

			// Add thread to local state
			setThreads((prev) => [...prev, thread]);

			return thread;
		} catch (err) {
			console.error("Error creating thread:", err);
			setError("Failed to create thread");
			throw err;
		}
	}, []);

	// Mark message as read
	const markAsRead = useCallback(async (messageId: string) => {
		try {
			console.log(
				"useAppSyncMessaging - markAsRead called with messageId:",
				messageId
			);
			setError(null);
			await markMessageAsRead(messageId);
			console.log(
				"useAppSyncMessaging - markMessageAsRead completed successfully"
			);

			// Update local state
			setMessages((prev) =>
				prev.map((msg) =>
					msg.id === messageId
						? {
								...msg,
								isRead: true,
								readAt: new Date().toISOString(),
							}
						: msg
				)
			);
		} catch (err) {
			console.error("Error marking message as read:", err);
			setError("Failed to mark message as read");
		}
	}, []);

	// Clear thread unread count
	const clearUnreadCount = useCallback(
		async (threadId: string) => {
			try {
				console.log(
					"useAppSyncMessaging - clearUnreadCount called with threadId:",
					threadId
				);
				setError(null);
				await clearThreadUnreadCount(threadId);
				console.log(
					"useAppSyncMessaging - clearThreadUnreadCount completed successfully"
				);

				// Refresh threads to get updated unread counts
				loadThreads();
			} catch (err) {
				console.error("Error clearing unread count:", err);
				setError("Failed to clear unread count");
			}
		},
		[loadThreads]
	);

	// Select a thread
	const selectThread = useCallback(
		(threadId: string) => {
			setSelectedThreadId(threadId);
			loadMessages(threadId);
		},
		[loadMessages]
	);

	// Set up subscriptions
	useEffect(() => {
		if (!process.env.NEXT_PUBLIC_APPSYNC_ENDPOINT) {
			console.warn("AppSync not configured, skipping subscriptions");
			return;
		}

		// Subscribe to thread updates
		const unsubscribeThreads = subscribeToThreadUpdates((updatedThread) => {
			setThreads((prev) =>
				prev.map((thread) =>
					thread.id === updatedThread.id ? updatedThread : thread
				)
			);
		});

		// Subscribe to ALL message updates to refresh thread list when messages are sent to other threads
		// This ensures that when user is on a different thread, they still see updates to other threads
		const unsubscribeAllMessages = subscribeToAllMessages(() => {
			// Refresh threads whenever any message is sent to any thread
			loadThreads();
		});

		// Subscribe to messages for selected thread
		let unsubscribeMessages = () => {};
		if (selectedThreadId) {
			unsubscribeMessages = subscribeToMessages(
				selectedThreadId,
				(newMessage) => {
					setMessages((prev) => {
						// Check if message already exists to avoid duplicates
						const exists = prev.some(
							(msg) => msg.id === newMessage.id
						);
						if (exists) return prev;
						return [...prev, newMessage];
					});
				}
			);
		}

		return () => {
			unsubscribeThreads();
			unsubscribeAllMessages();
			unsubscribeMessages();
		};
	}, [selectedThreadId, user?.id, loadThreads]);

	// Initialize user and load threads when user is available
	useEffect(() => {
		const initUserAndLoadThreads = async () => {
			try {
				const session = await authClient.getSession();
				if (session?.data?.user) {
					setUser(session.data.user);
					// Load threads after user is available
					await loadThreads();
				}
			} catch (error) {
				console.error("Error initializing user:", error);
			}
		};

		initUserAndLoadThreads();
	}, [loadThreads]);

	return {
		messages,
		threads,
		selectedThreadId,
		loading,
		error,
		user,
		loadThreads,
		loadMessages,
		sendMessage,
		startNewThread,
		markAsRead,
		clearUnreadCount,
		selectThread,
	};
};
