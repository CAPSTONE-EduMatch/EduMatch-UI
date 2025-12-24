import { NextRequest } from "next/server";

/**
 * Edge Runtime compatible admin check function
 * Makes an internal API call to verify user role from the database
 * Returns: true if admin, false if not admin, null if check failed (timeout/error)
 */
export async function checkAdminRole(
	request: NextRequest
): Promise<boolean | null> {
	try {
		// Check if session cookie exists first
		const allCookies = request.cookies.getAll();
		const sessionCookie = allCookies.find(
			(cookie) =>
				cookie.name.includes("session") ||
				cookie.name.includes("auth") ||
				cookie.name.includes("better-auth")
		);

		if (!sessionCookie) {
			return false;
		}

		// Use Next.js rewrite to make internal API call without SSL issues
		// Create a URL for the API endpoint
		const apiUrl = new URL("/api/auth/admin-check", request.nextUrl.origin);

		// For Edge Runtime in middleware, we need to use http:// for localhost
		// This avoids SSL handshake issues
		if (
			request.nextUrl.hostname === "localhost" ||
			request.nextUrl.hostname === "127.0.0.1"
		) {
			apiUrl.protocol = "http:";
		}

		// Add timeout to prevent hanging requests
		const controller = new AbortController();
		const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

		let response: Response;
		try {
			response = await fetch(apiUrl.toString(), {
				method: "GET",
				headers: {
					Cookie: request.headers.get("cookie") || "",
					"x-forwarded-host": request.headers.get("host") || "",
				},
				cache: "no-store",
				signal: controller.signal,
			});
			clearTimeout(timeoutId);
		} catch (fetchError: any) {
			clearTimeout(timeoutId);
			// If it's an abort error (timeout), log it
			if (fetchError.name === "AbortError") {
				// eslint-disable-next-line no-console
				console.error(
					"[ADMIN CHECK] Request timeout - admin check took too long"
				);
			} else {
				// eslint-disable-next-line no-console
				console.error("[ADMIN CHECK] Fetch error:", fetchError);
			}
			// Return null on error/timeout to indicate check failed (not that user is not admin)
			// This allows middleware to let request through for client-side check
			return null;
		}

		if (response.ok) {
			const data = await response.json();
			const isAdmin = data.isAdmin === true;

			// eslint-disable-next-line no-console
			console.log(
				`[ADMIN CHECK] User ${data.userId} - Role: ${data.role} - IsAdmin: ${isAdmin}`
			);

			return isAdmin;
		}

		// eslint-disable-next-line no-console
		console.log(
			"[ADMIN CHECK] API call returned non-OK status:",
			response.status
		);
		// Non-OK status means we got a response but it's an error (401, 403, 500, etc.)
		// Return false only for 403 (Forbidden - definitely not admin)
		// Return null for other errors to allow client-side check
		if (response.status === 403) {
			return false; // Definitely not admin
		}
		// For 401, 500, or other errors, return null to allow client-side check
		return null;
	} catch (error) {
		// eslint-disable-next-line no-console
		console.error("[ADMIN CHECK] Error checking admin role:", error);

		// In development, allow admin access for testing
		if (process.env.NODE_ENV === "development") {
			// eslint-disable-next-line no-console
			console.log(
				"[ADMIN CHECK] Development mode - allowing access due to error"
			);
			return true;
		}

		// Return null on error to allow client-side check
		return null;
	}
}

/**
 * Check admin role using API call (for client-side or full runtime)
 * This is used when we can make API calls to verify admin status
 */
export async function checkAdminRoleAPI(
	request: NextRequest
): Promise<boolean> {
	try {
		// Make API call to check admin status
		const response = await fetch(
			`${request.nextUrl.origin}/api/auth/admin-check`,
			{
				headers: {
					Cookie: request.headers.get("cookie") || "",
				},
			}
		);

		if (response.ok) {
			const data = await response.json();
			return data.isAdmin === true;
		}

		return false;
	} catch (error) {
		// eslint-disable-next-line no-console
		console.error("[ADMIN CHECK API] Error checking admin role:", error);
		return false;
	}
}
