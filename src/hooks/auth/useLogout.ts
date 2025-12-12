"use client";

import { useState } from "react";
import { authClient } from "@/config/auth-client";
import { clearSessionCache } from "@/services/messaging/appsync-client";

interface UseLogoutOptions {
	redirectTo?: string;
	onSuccess?: () => void;
	onError?: (error: Error) => void;
}

export const useLogout = (options: UseLogoutOptions = {}) => {
	const { redirectTo = "/", onSuccess, onError } = options;
	const [isLoggingOut, setIsLoggingOut] = useState(false);
	const [showConfirmModal, setShowConfirmModal] = useState(false);

	const performLogout = async () => {
		try {
			setIsLoggingOut(true);

			// Clear AppSync session cache
			clearSessionCache();

			// Clear Better Auth session
			await authClient.signOut();

			// Clear browser storage
			localStorage.clear();
			sessionStorage.clear();

			// Call success callback if provided
			if (onSuccess) {
				onSuccess();
			}

			// Force full page reload to ensure all state is cleared
			window.location.href = redirectTo;
		} catch (error) {
			// eslint-disable-next-line no-console
			console.error("Failed to logout:", error);

			// Call error callback if provided
			if (onError) {
				onError(
					error instanceof Error ? error : new Error("Logout failed")
				);
			}

			// Still redirect even if logout fails
			window.location.href = redirectTo;
		} finally {
			setIsLoggingOut(false);
		}
	};

	const handleLogoutClick = () => {
		setShowConfirmModal(true);
	};

	const handleConfirmLogout = () => {
		performLogout();
	};

	const handleCancelLogout = () => {
		setShowConfirmModal(false);
	};

	return {
		handleLogoutClick,
		handleConfirmLogout,
		handleCancelLogout,
		showConfirmModal,
		isLoggingOut,
		performLogout, // Direct logout without confirmation (for programmatic use)
	};
};
