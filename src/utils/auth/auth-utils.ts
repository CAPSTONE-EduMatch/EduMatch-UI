/**
 * Optimized authentication utilities leveraging Better Auth's built-in caching
 * This replaces the custom auth-cache.ts with Better Auth's native caching
 */

import { auth } from "@/config/auth";
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
 * Fetches user with role information from database
 */
export async function requireAuth(): Promise<{
	session: any;
	user: any & { role?: string };
}> {
	const sessionData = await getSessionWithCache();

	if (!sessionData?.user) {
		throw new Error("Authentication required");
	}

	// Fetch user role from database
	// Better Auth's session doesn't include custom fields like 'role'
	try {
		const { prismaClient } = await import("../../../prisma");
		const userWithRole = await prismaClient.user.findUnique({
			where: { id: sessionData.user.id },
			select: {
				id: true,
				email: true,
				role: true,
				name: true,
				image: true,
			},
		});

		if (userWithRole) {
			// Merge role into user object
			return {
				session: sessionData.session,
				user: {
					...sessionData.user,
					role: userWithRole.role,
				},
			};
		}
	} catch (dbError) {
		// eslint-disable-next-line no-console
		console.error("[AUTH] Failed to fetch user role:", dbError);
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
