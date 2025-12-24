"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, useRef } from "react";

interface AdminAuthState {
	isAdmin: boolean | null;
	isLoading: boolean;
	error: string | null;
}

// Module-level cache to prevent duplicate API calls across components
let adminCheckCache: {
	result: boolean | null;
	timestamp: number;
	promise: Promise<boolean> | null;
} = {
	result: null,
	timestamp: 0,
	promise: null,
};

const CACHE_DURATION = 30 * 60 * 1000; // 30 minutes - longer cache for better UX
const STORAGE_KEY = "admin_auth_status";
const STORAGE_TIMESTAMP_KEY = "admin_auth_timestamp";

/**
 * Get admin status from localStorage (persists across page navigations)
 */
function getAdminStatusFromStorage(): boolean | null {
	if (typeof window === "undefined") return null;
	try {
		const stored = localStorage.getItem(STORAGE_KEY);
		const timestamp = localStorage.getItem(STORAGE_TIMESTAMP_KEY);
		if (stored && timestamp) {
			const age = Date.now() - parseInt(timestamp, 10);
			if (age < CACHE_DURATION) {
				return stored === "true";
			}
			// Cache expired, clear it
			localStorage.removeItem(STORAGE_KEY);
			localStorage.removeItem(STORAGE_TIMESTAMP_KEY);
		}
	} catch (error) {
		// Ignore storage errors
	}
	return null;
}

/**
 * Save admin status to localStorage (persists across page navigations)
 */
function saveAdminStatusToStorage(isAdmin: boolean) {
	if (typeof window === "undefined") return;
	try {
		localStorage.setItem(STORAGE_KEY, String(isAdmin));
		localStorage.setItem(STORAGE_TIMESTAMP_KEY, String(Date.now()));
	} catch (error) {
		// Ignore storage errors
	}
}

/**
 * Clear admin status from localStorage
 */
function clearAdminStatusFromStorage() {
	if (typeof window === "undefined") return;
	try {
		localStorage.removeItem(STORAGE_KEY);
		localStorage.removeItem(STORAGE_TIMESTAMP_KEY);
	} catch (error) {
		// Ignore storage errors
	}
}

/**
 * Clear the admin check cache
 * Useful when user logs out or role changes
 */
export function clearAdminCheckCache() {
	adminCheckCache = {
		result: null,
		timestamp: 0,
		promise: null,
	};
	clearAdminStatusFromStorage();
}

/**
 * Hook to check if the current user has admin privileges
 * Redirects to home page if user is not an admin
 * Uses caching to prevent unnecessary API calls on navigation
 */
export function useAdminAuth() {
	const [state, setState] = useState<AdminAuthState>({
		isAdmin: null,
		isLoading: true,
		error: null,
	});
	const router = useRouter();
	const hasCheckedRef = useRef(false);

	useEffect(() => {
		// Prevent multiple checks on the same mount
		if (hasCheckedRef.current) {
			return;
		}

		const checkAdminStatus = async () => {
			// Check localStorage first (persists across navigations)
			const storedAdminStatus = getAdminStatusFromStorage();
			if (storedAdminStatus !== null) {
				// Use stored status immediately - no API call needed
				setState({
					isAdmin: storedAdminStatus,
					isLoading: false,
					error: null,
				});
				hasCheckedRef.current = true;
				// Update module cache
				adminCheckCache.result = storedAdminStatus;
				adminCheckCache.timestamp = Date.now();

				// Still redirect if not admin (but use cached result)
				if (!storedAdminStatus) {
					router.push("/");
				}
				return;
			}

			// Check module-level cache second
			const now = Date.now();
			if (
				adminCheckCache.result !== null &&
				now - adminCheckCache.timestamp < CACHE_DURATION
			) {
				setState({
					isAdmin: adminCheckCache.result,
					isLoading: false,
					error: null,
				});
				hasCheckedRef.current = true;
				// Save to localStorage for persistence
				saveAdminStatusToStorage(adminCheckCache.result);

				// Still redirect if not admin (but use cached result)
				if (!adminCheckCache.result) {
					router.push("/");
				}
				return;
			}

			// If there's already a pending request, wait for it
			if (adminCheckCache.promise) {
				try {
					const result = await adminCheckCache.promise;
					setState({
						isAdmin: result,
						isLoading: false,
						error: null,
					});
					hasCheckedRef.current = true;
					if (!result) {
						router.push("/");
					}
				} catch (error) {
					// If the pending request fails, we'll handle it below
					adminCheckCache.promise = null;
				}
				return;
			}

			// Create new check promise
			const checkPromise = (async () => {
				try {
					const controller = new AbortController();
					const timeoutId = setTimeout(
						() => controller.abort(),
						10000
					); // 10 second timeout

					const response = await fetch("/api/auth/admin-check", {
						method: "GET",
						credentials: "include",
						headers: {
							"Cache-Control": "no-cache",
						},
						signal: controller.signal,
					});

					clearTimeout(timeoutId);

					if (!response.ok) {
						if (response.status === 401) {
							// Not authenticated - redirect to signin
							adminCheckCache.result = false;
							adminCheckCache.timestamp = Date.now();
							adminCheckCache.promise = null;
							clearAdminStatusFromStorage(); // Clear on auth failure
							router.push("/signin");
							return false;
						}
						// For 403 or other errors, don't redirect immediately
						// Let the component handle it gracefully
						if (response.status === 403) {
							adminCheckCache.result = false;
							adminCheckCache.timestamp = Date.now();
							adminCheckCache.promise = null;
							saveAdminStatusToStorage(false); // Cache negative result
							router.push("/");
							return false;
						}
						// For 500 or network errors, don't cache and don't redirect
						// This allows retry on next navigation
						throw new Error(
							`Admin check failed: ${response.status}`
						);
					}

					const data = await response.json();

					// Cache the result in both module cache and localStorage
					const isAdmin = data.isAdmin === true;
					adminCheckCache.result = isAdmin;
					adminCheckCache.timestamp = Date.now();
					adminCheckCache.promise = null;
					saveAdminStatusToStorage(isAdmin); // Persist across navigations

					if (!isAdmin) {
						// Not an admin - redirect to home page
						router.push("/");
						return false;
					}

					return true;
				} catch (error) {
					adminCheckCache.promise = null;

					// Only redirect on actual auth errors, not network errors
					if (error instanceof Error) {
						// AbortError means timeout - don't redirect, allow retry
						if (error.name === "AbortError") {
							throw new Error(
								"Request timeout - please try again"
							);
						}
						// Network errors - don't redirect, allow retry
						if (
							error.message.includes("fetch") ||
							error.message.includes("network")
						) {
							throw error;
						}
					}

					// For other errors, don't redirect immediately
					// This prevents redirects on transient network issues
					throw error;
				}
			})();

			adminCheckCache.promise = checkPromise;

			try {
				const result = await checkPromise;
				setState({
					isAdmin: result,
					isLoading: false,
					error: null,
				});
				hasCheckedRef.current = true;
			} catch (error) {
				const errorMessage =
					error instanceof Error ? error.message : "Unknown error";

				// On network/timeout errors, show error but don't redirect
				// This allows the user to retry or navigate
				setState({
					isAdmin: null, // Keep as null to allow retry
					isLoading: false,
					error: errorMessage,
				});
				hasCheckedRef.current = true;

				// Only redirect on confirmed auth failures, not network errors
				// The middleware will handle auth on the server side anyway
			}
		};

		checkAdminStatus();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []); // Empty deps - only run once on mount

	return state;
}
