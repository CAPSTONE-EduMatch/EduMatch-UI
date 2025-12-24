"use client";

import { useState, useEffect } from "react";
import { useAppSyncMessaging } from "./useAppSyncMessaging";

export const useUnreadMessageCount = () => {
	const { threads } = useAppSyncMessaging();
	const [unreadCount, setUnreadCount] = useState(0);

	useEffect(() => {
		// Calculate total unread messages across all threads
		const totalUnread = threads.reduce(
			(sum, thread) => sum + thread.unreadCount,
			0
		);
		setUnreadCount(totalUnread);
	}, [threads]);

	return unreadCount;
};
