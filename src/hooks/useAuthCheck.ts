"use client";

import { useState, useEffect, useRef } from "react";
import { authClient } from "@/app/lib/auth-client";
import { ApiService } from "@/lib/axios-config";
import { useRouter } from "next/navigation";

// Global cache to prevent multiple simultaneous auth checks
let authCheckPromise: Promise<any> | null = null;
let lastAuthCheck = 0;
const AUTH_CHECK_COOLDOWN = 5000; // 5 seconds

export function useAuthCheck() {
	const [isAuthenticated, setIsAuthenticated] = useState(false);
	const [showAuthModal, setShowAuthModal] = useState(false);
	const [isLoading, setIsLoading] = useState(true);
	const [user, setUser] = useState<any>(null);
	const router = useRouter();
	const hasChecked = useRef(false);

	useEffect(() => {
		// Prevent multiple simultaneous auth checks
		if (hasChecked.current) return;

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
					const session = await authClient.getSession();
					const hasUser = session?.data?.user;
					setIsAuthenticated(!!hasUser);
					setUser(hasUser);

					// Set modal visibility based on authentication status
					if (hasUser) {
						setShowAuthModal(false); // Hide modal if authenticated

						// Only check profile if we're on a page that needs it
						// This prevents unnecessary API calls on every page
						const currentPath = window.location.pathname;
						const needsProfileCheck =
							currentPath.includes("/profile/") ||
							currentPath.includes("/applicant-profile/") ||
							currentPath.includes("/institution-profile/");

						if (needsProfileCheck) {
							try {
								await ApiService.getProfile();
								// Profile exists, user is good to go
							} catch (profileError: any) {
								// Check if it's specifically a 404 (profile not found) vs other errors
								if (profileError?.response?.status === 404) {
									// No profile found, redirect to unified profile creation
									console.log(
										"No profile found, redirecting to profile creation"
									);
									router.push("/profile/create");
								} else {
									// Other error (server issue, auth issue, etc.)
									console.error(
										"Profile check failed with error:",
										profileError
									);
									// Don't redirect on server errors, let user continue
								}
							}
						}
					} else {
						setShowAuthModal(true); // Show modal if not authenticated
					}

					lastAuthCheck = now;
					hasChecked.current = true;
				} catch (error) {
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
		try {
			const session = await authClient.getSession();
			const hasUser = session?.data?.user;
			setIsAuthenticated(!!hasUser);
			setUser(hasUser);

			// Set modal visibility based on authentication status
			if (hasUser) {
				setShowAuthModal(false);
			} else {
				setShowAuthModal(true);
			}
		} catch (error) {
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
