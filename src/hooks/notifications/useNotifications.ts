"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuthCheck } from "../auth/useAuthCheck";

export interface Notification {
	id: string;
	userId: string;
	type: string;
	title: string;
	bodyText: string;
	url: string;
	payload: Record<string, any>;
	createAt: string;
	queuedAt: string;
	read_at: string | null;
	status: string;
}

export interface NotificationPagination {
	total: number;
	unread: number;
	limit: number;
	offset: number;
	hasMore: boolean;
}

export interface NotificationResponse {
	success: boolean;
	notifications: Notification[];
	pagination: NotificationPagination;
}

export function useNotifications() {
	const { isAuthenticated } = useAuthCheck();
	const [notifications, setNotifications] = useState<Notification[]>([]);
	const [unreadCount, setUnreadCount] = useState(0);
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	// Fetch notifications from API
	const fetchNotifications = useCallback(
		async (limit = 10, offset = 0, unreadOnly = false) => {
			if (!isAuthenticated) {
				setNotifications([]);
				setUnreadCount(0);
				return;
			}

			setIsLoading(true);
			setError(null);

			try {
				const params = new URLSearchParams({
					limit: limit.toString(),
					offset: offset.toString(),
					...(unreadOnly && { unreadOnly: "true" }),
				});

				const response = await fetch(`/api/notifications?${params}`, {
					method: "GET",
					headers: {
						"Content-Type": "application/json",
					},
				});

				if (!response.ok) {
					throw new Error(
						`Failed to fetch notifications: ${response.statusText}`
					);
				}

				const data: NotificationResponse = await response.json();

				if (data.success) {
					setNotifications(data.notifications);
					setUnreadCount(data.pagination.unread);
				} else {
					throw new Error("Failed to fetch notifications");
				}
			} catch (err) {
				console.error("Error fetching notifications:", err);
				setError(
					err instanceof Error
						? err.message
						: "Failed to fetch notifications"
				);
			} finally {
				setIsLoading(false);
			}
		},
		[isAuthenticated]
	);

	// Mark notifications as read
	const markAsRead = useCallback(
		async (notificationIds?: string[], markAllAsRead = false) => {
			if (!isAuthenticated) return;

			try {
				const response = await fetch("/api/notifications", {
					method: "PUT",
					headers: {
						"Content-Type": "application/json",
					},
					body: JSON.stringify({
						notificationIds,
						markAllAsRead,
					}),
				});

				if (!response.ok) {
					throw new Error(
						`Failed to mark notifications as read: ${response.statusText}`
					);
				}

				const data = await response.json();

				if (data.success) {
					// Update local state
					if (markAllAsRead) {
						setNotifications((prev) =>
							prev.map((notification) => ({
								...notification,
								read_at: new Date().toISOString(),
							}))
						);
						setUnreadCount(0);
					} else if (notificationIds) {
						setNotifications((prev) =>
							prev.map((notification) =>
								notificationIds.includes(notification.id)
									? {
											...notification,
											read_at: new Date().toISOString(),
										}
									: notification
							)
						);
						setUnreadCount((prev) =>
							Math.max(0, prev - notificationIds.length)
						);
					}
				}
			} catch (err) {
				console.error("Error marking notifications as read:", err);
				setError(
					err instanceof Error
						? err.message
						: "Failed to mark notifications as read"
				);
			}
		},
		[isAuthenticated]
	);

	// Refresh notifications
	const refreshNotifications = useCallback(() => {
		fetchNotifications();
	}, [fetchNotifications]);

	// Load notifications on mount and when authentication changes
	useEffect(() => {
		if (isAuthenticated) {
			fetchNotifications();
		} else {
			setNotifications([]);
			setUnreadCount(0);
		}
	}, [isAuthenticated, fetchNotifications]);

	// Set up polling for new notifications (every 15 seconds for faster alerts)
	// Notifications are important, so we check more frequently than messages
	useEffect(() => {
		if (!isAuthenticated) return;

		const interval = setInterval(() => {
			// Only poll if tab is visible to save resources
			if (typeof document !== "undefined" && !document.hidden) {
				fetchNotifications(10, 0, false);
			}
		}, 15000); // 15 seconds - faster for important alerts

		return () => clearInterval(interval);
	}, [isAuthenticated, fetchNotifications]);

	return {
		notifications,
		unreadCount,
		isLoading,
		error,
		fetchNotifications,
		markAsRead,
		refreshNotifications,
	};
}
