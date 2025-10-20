"use client";

import { useState, useEffect, useRef } from "react";
import { authClient } from "@/app/lib/auth-client";

// Global cache to prevent multiple simultaneous auth checks
let authCheckPromise: Promise<any> | null = null;
let lastAuthCheck = 0;
const AUTH_CHECK_COOLDOWN = 5000; // 5 seconds

export function useAuthCheck() {
	const [isAuthenticated, setIsAuthenticated] = useState(false);
	const [showAuthModal, setShowAuthModal] = useState(false);
	const [isLoading, setIsLoading] = useState(true);
	const [user, setUser] = useState<any>(null);
	const hasChecked = useRef(false);

	useEffect(() => {
		const checkAuth = async () => {
			// Use global cache to prevent multiple simultaneous calls
			const now = Date.now();
			if (authCheckPromise && now - lastAuthCheck < AUTH_CHECK_COOLDOWN) {
				try {
					await authCheckPromise;
					return;
				} catch (error) {
					// Continue with new check if cached one failed
				}
			}

			authCheckPromise = (async () => {
				try {
					console.log("🔐 useAuthCheck: Checking authentication...");
					const session = await authClient.getSession();
					const hasUser = session?.data?.user;

					console.log("🔐 useAuthCheck: Session result:", {
						hasSession: !!session,
						hasUser: !!hasUser,
						userId: hasUser?.id,
						userName: hasUser?.name,
					});

					setIsAuthenticated(!!hasUser);
					setUser(hasUser);

					// Set modal visibility based on authentication status
					if (hasUser) {
						setShowAuthModal(false); // Hide modal if authenticated
					} else {
						setShowAuthModal(true); // Show modal if not authenticated
					}

					lastAuthCheck = now;
					hasChecked.current = true;
				} catch (error) {
					console.error("❌ useAuthCheck: Auth check error:", error);
					setIsAuthenticated(false);
					setShowAuthModal(true);
					setUser(null);
					hasChecked.current = true;
				} finally {
					setIsLoading(false);
				}
			})();

			await authCheckPromise;
		};

		checkAuth();
	}, []); // Empty dependency array - only run once

	const handleCloseModal = () => {
		setShowAuthModal(false);
	};

	// Manual auth check function
	const refreshAuth = async () => {
		setIsLoading(true);
		hasChecked.current = false; // Reset check flag to force re-check

		try {
			console.log("🔄 useAuthCheck: Refreshing authentication...");
			const session = await authClient.getSession();
			const hasUser = session?.data?.user;

			console.log("🔄 useAuthCheck: Refresh result:", {
				hasSession: !!session,
				hasUser: !!hasUser,
				userId: hasUser?.id,
				userName: hasUser?.name,
			});

			setIsAuthenticated(!!hasUser);
			setUser(hasUser);

			// Set modal visibility based on authentication status
			if (hasUser) {
				setShowAuthModal(false);
			} else {
				setShowAuthModal(true);
			}
		} catch (error) {
			console.error("❌ useAuthCheck: Refresh auth error:", error);
			setIsAuthenticated(false);
			setShowAuthModal(true);
			setUser(null);
		} finally {
			setIsLoading(false);
		}
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
		refreshAuth,
		user,
	};
}
