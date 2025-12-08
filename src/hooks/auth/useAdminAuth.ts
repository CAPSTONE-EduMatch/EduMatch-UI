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

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

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
			// Check cache first
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
							router.push("/signin");
							return false;
						}
						// For 403 or other errors, don't redirect immediately
						// Let the component handle it gracefully
						if (response.status === 403) {
							adminCheckCache.result = false;
							adminCheckCache.timestamp = Date.now();
							adminCheckCache.promise = null;
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

					// Cache the result
					adminCheckCache.result = data.isAdmin === true;
					adminCheckCache.timestamp = Date.now();
					adminCheckCache.promise = null;

					if (!data.isAdmin) {
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
