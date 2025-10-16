"use client";

import { useState, useEffect } from "react";
import { authClient } from "@/app/lib/auth-client";
import { ApiService } from "@/lib/axios-config";
import { useRouter } from "next/navigation";

export function useAuthCheck() {
	const [isAuthenticated, setIsAuthenticated] = useState(false);
	const [showAuthModal, setShowAuthModal] = useState(false);
	const [isLoading, setIsLoading] = useState(true);
	const [user, setUser] = useState<any>(null);
	const router = useRouter();

	useEffect(() => {
		const checkAuth = async () => {
			try {
				const session = await authClient.getSession();
				const hasUser = session?.data?.user;
				setIsAuthenticated(!!hasUser);
				setUser(hasUser);

				// Set modal visibility based on authentication status
				if (hasUser) {
					setShowAuthModal(false); // Hide modal if authenticated

					// Check if user has a profile
					try {
						await ApiService.getProfile();
						// Profile exists, user is good to go
					} catch (profileError: any) {
						// Check if it's specifically a 404 (profile not found) vs other errors
						if (profileError?.response?.status === 404) {
							// No profile found, redirect to create profile
							console.log(
								"No profile found, redirecting to create profile"
							);
							router.push("/applicant-profile/create");
						} else {
							// Other error (server issue, auth issue, etc.)
							console.error(
								"Profile check failed with error:",
								profileError
							);
							// Don't redirect on server errors, let user continue
						}
					}
				} else {
					setShowAuthModal(true); // Show modal if not authenticated
				}
			} catch (error) {
				setIsAuthenticated(false);
				setShowAuthModal(true);
				setUser(null);
			} finally {
				setIsLoading(false);
			}
		};

		checkAuth();
	}, [router]);

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
