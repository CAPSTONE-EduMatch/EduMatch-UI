/**
 * Optimized authentication utilities leveraging Better Auth's built-in caching
 * This replaces the custom auth-cache.ts with Better Auth's native caching
 */

import { auth } from "@/app/lib/auth";
import { headers } from "next/headers";

/**
 * Get session with Better Auth's built-in caching
 * This leverages Better Auth's cookie cache and Redis store
 */
export async function getSessionWithCache(): Promise<{
	session: any;
	user: any;
} | null> {
	try {
		const headersList = await headers();

		// Use Better Auth's built-in session management with caching
		const session = await auth.api.getSession({
			headers: headersList,
			// Let Better Auth handle caching automatically
		});

		if (!session?.user) {
			return null;
		}

		return {
			session: session,
			user: session.user,
		};
	} catch (error) {
		// Silently handle auth errors
		return null;
	}
}

/**
 * Get session with forced refresh (bypasses cookie cache)
 * Use this when you need fresh data
 */
export async function getSessionWithRefresh(): Promise<{
	session: any;
	user: any;
} | null> {
	try {
		const headersList = await headers();

		// Force fresh data by disabling cookie cache
		const session = await auth.api.getSession({
			headers: headersList,
			query: {
				disableCookieCache: true,
			},
		});

		if (!session?.user) {
			return null;
		}

		return {
			session: session,
			user: session.user,
		};
	} catch (error) {
		// Silently handle auth errors
		return null;
	}
}

/**
 * Check if user is authenticated (cached)
 */
export async function isAuthenticated(): Promise<boolean> {
	const sessionData = await getSessionWithCache();
	return !!sessionData?.user;
}

/**
 * Get current user (cached)
 */
export async function getCurrentUser(): Promise<any | null> {
	const sessionData = await getSessionWithCache();
	return sessionData?.user || null;
}

/**
 * Get current session (cached)
 */
export async function getCurrentSession(): Promise<any | null> {
	const sessionData = await getSessionWithCache();
	return sessionData?.session || null;
}

/**
 * Middleware helper for authentication checks
 */
export async function requireAuth(): Promise<{ session: any; user: any }> {
	const sessionData = await getSessionWithCache();

	if (!sessionData?.user) {
		throw new Error("Authentication required");
	}

	return sessionData;
}

/**
 * Middleware helper for fresh authentication checks
 */
export async function requireFreshAuth(): Promise<{ session: any; user: any }> {
	const sessionData = await getSessionWithRefresh();

	if (!sessionData?.user) {
		throw new Error("Authentication required");
	}

	return sessionData;
}
