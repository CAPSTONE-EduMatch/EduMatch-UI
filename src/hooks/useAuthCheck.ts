"use client";

import { useState, useEffect } from "react";
import { authClient } from "@/app/lib/auth-client";

export function useAuthCheck() {
	const [isAuthenticated, setIsAuthenticated] = useState(false);
	const [showAuthModal, setShowAuthModal] = useState(false);
	const [isLoading, setIsLoading] = useState(true);

	useEffect(() => {
		const checkAuth = async () => {
			try {
				const session = await authClient.getSession();
				console.log("Auth session:", session); // Debug log
				const hasUser = session?.data?.user;
				console.log("Has user:", hasUser); // Debug log
				setIsAuthenticated(!!hasUser);

				// Set modal visibility based on authentication status
				if (hasUser) {
					setShowAuthModal(false); // Hide modal if authenticated
				} else {
					setShowAuthModal(true); // Show modal if not authenticated
				}
			} catch (error) {
				console.error("Auth check failed:", error); // Debug log
				setIsAuthenticated(false);
				setShowAuthModal(true);
			} finally {
				setIsLoading(false);
			}
		};

		checkAuth();
	}, []);

	const handleCloseModal = () => {
		setShowAuthModal(false);
	};

	// Manual cache clear function
	const clearAuthCache = async () => {
		try {
			// Clear browser storage
			localStorage.clear();
			sessionStorage.clear();

			// Clear cookies (if any)
			document.cookie.split(";").forEach((c) => {
				const eqPos = c.indexOf("=");
				const name = eqPos > -1 ? c.substr(0, eqPos) : c;
				document.cookie =
					name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/";
			});

			// Force re-check auth
			window.location.reload();
		} catch (error) {
			console.error("Cache clear failed:", error);
		}
	};

	return {
		isAuthenticated,
		showAuthModal,
		handleCloseModal,
		isLoading,
		clearAuthCache,
	};
}
