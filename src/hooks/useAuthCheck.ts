"use client";

import { useAuth } from "@/contexts/AuthContext";

export function useAuthCheck() {
	const auth = useAuth();

	return {
		isAuthenticated: auth.isAuthenticated,
		showAuthModal: auth.showAuthModal,
		handleCloseModal: auth.handleCloseModal,
		isLoading: auth.isLoading,
		clearAuthCache: auth.clearAuthCache,
		refreshAuth: auth.refreshAuth,
		user: auth.user,
	};
}
