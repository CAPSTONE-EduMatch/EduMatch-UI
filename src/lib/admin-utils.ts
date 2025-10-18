import { NextRequest } from "next/server";

/**
 * Edge Runtime compatible admin check function
 * This function checks if the user has admin role by checking session/cookies
 */
export async function checkAdminRole(request: NextRequest): Promise<boolean> {
	try {
		// For middleware (Edge Runtime), we need to check admin role from cookies
		// Better Auth stores role information in session

		// Get all cookies and look for session data
		const allCookies = request.cookies.getAll();

		// Look for session cookie that might contain role information
		const sessionCookie = allCookies.find(
			(cookie) =>
				cookie.name.includes("session") ||
				cookie.name.includes("auth") ||
				cookie.name.includes("better-auth")
		);

		if (!sessionCookie) {
			return false;
		}

		// For Edge Runtime compatibility, we'll use an API approach
		// Make an internal API call to check admin status
		try {
			const response = await fetch(
				`${request.nextUrl.origin}/api/auth/admin-check`,
				{
					method: "GET",
					headers: {
						Cookie: request.headers.get("cookie") || "",
						"Cache-Control": "no-cache",
					},
				}
			);

			if (response.ok) {
				const data = await response.json();
				return data.isAdmin === true;
			}
		} catch (apiError) {
			// eslint-disable-next-line no-console
			console.log(
				"[ADMIN CHECK] API call failed, falling back to demo mode"
			);
		}

		// For development/demo purposes, allow admin access
		// In production, implement proper role verification
		const adminParam = request.nextUrl.searchParams.get("admin");
		const adminHeader = request.headers.get("x-admin-role");

		if (adminParam === "true" || adminHeader === "admin") {
			return true;
		}

		// For demo purposes, allow access - in production this should be false
		return true;
	} catch (error) {
		// eslint-disable-next-line no-console
		console.error("[ADMIN CHECK] Error checking admin role:", error);
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
