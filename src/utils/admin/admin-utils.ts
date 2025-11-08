import { NextRequest } from "next/server";

/**
 * Edge Runtime compatible admin check function
 * Makes an internal API call to verify user role from the database
 */
export async function checkAdminRole(request: NextRequest): Promise<boolean> {
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

		const response = await fetch(apiUrl.toString(), {
			method: "GET",
			headers: {
				Cookie: request.headers.get("cookie") || "",
				"x-forwarded-host": request.headers.get("host") || "",
			},
			cache: "no-store",
		});

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
		return false;
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

		return false;
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
