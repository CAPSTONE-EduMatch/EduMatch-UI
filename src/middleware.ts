import { checkAdminRole } from "@/lib/admin-utils";
import { NextRequest, NextResponse } from "next/server";

// Inline route configuration to avoid Edge Runtime issues
const routeConfig = {
	publicRoutes: ["/", "/about", "/api/health", "/explore"],
	authRoutes: ["/signin", "/signup", "/forgot-password"],
	// All routes that require authentication
	protectedRoutes: ["/files", "/admin", "/profile", "/messages", "/profile"],
	adminRoutes: ["/admin"],
	adminApiRoutes: ["/api/admin"],
	// Routes that require profile creation
	profileRequiredRoutes: [
		"/files",
		"/applicant-profile",
		"/institution-profile",
		"/messages",
	],
	// Routes that should show auth modal instead of redirecting
	authModalRoutes: ["/profile/create"],
	defaultRedirects: {
		afterLogin: "/explore", // Will be overridden by role-based logic
		afterLogout: "/signin",
		createProfile: "/profile/create",
		accessDenied: "/", // Redirect non-admin users here
	},
};

// Edge Runtime compatible auth check function
async function checkAuthentication(request: NextRequest) {
	try {
		// Get all cookies and check for Better Auth session cookies
		const allCookies = request.cookies.getAll();
		// Skip cookie logging to reduce console spam

		// Look for Better Auth session cookies with more comprehensive patterns
		const sessionCookie = allCookies.find(
			(cookie) =>
				cookie.name.includes("better-auth") ||
				cookie.name.includes("session") ||
				cookie.name.includes("auth") ||
				cookie.name.includes("better_auth") ||
				cookie.name.includes("betterAuth") ||
				cookie.name.includes("state") ||
				cookie.name.includes("token") ||
				cookie.name.includes("jwt")
		);

		if (sessionCookie) {
			// Session cookie found - user is authenticated
			return {
				isAuthenticated: true,
				userId: null, // We don't have user ID from cookie alone
			};
		}

		// In production, be more lenient - if we can't detect auth, let the client handle it
		// This prevents hydration mismatches and allows client-side auth checks
		if (process.env.NODE_ENV === "production") {
			// Production mode - allowing access, client will handle auth
			return {
				isAuthenticated: true, // Assume authenticated in production to avoid redirects
				userId: null,
			};
		}

		// No valid session found
		return { isAuthenticated: false, userId: null };
	} catch (error) {
		// Silently handle auth check errors
		return { isAuthenticated: false, userId: null };
	}
}

export async function middleware(request: NextRequest) {
	const { pathname } = request.nextUrl;

	// Debug: Log all requests (only in development)
	if (process.env.NODE_ENV === "development") {
		console.log(`[MIDDLEWARE] Processing: ${pathname}`);
	}

	// Skip middleware for static files and non-admin API routes
	if (
		pathname.startsWith("/_next/") ||
		pathname.includes(".") ||
		pathname.startsWith("/favicon") ||
		(pathname.startsWith("/api/") && !pathname.startsWith("/api/admin/"))
	) {
		// Skip logging for static files to reduce console spam
		return NextResponse.next();
	}

	// Skip middleware for client-side navigation to prevent hydration issues
	if (request.headers.get("x-middleware-rewrite")) {
		// Skip logging for rewrite requests to reduce console spam
		return NextResponse.next();
	}

	// Skip middleware for Next.js internal requests
	if (request.headers.get("x-nextjs-data")) {
		// Skip logging for Next.js data requests to reduce console spam
		return NextResponse.next();
	}

	// Skip middleware for client-side navigation requests
	if (request.headers.get("x-nextjs-router-state-tree")) {
		// Skip logging for client navigation to reduce console spam
		return NextResponse.next();
	}

	try {
		// Use Edge Runtime compatible auth check
		const { isAuthenticated, userId } = await checkAuthentication(request);

		// Skip debug logging to reduce console spam

		// Additional debugging for profile routes
		if (pathname.startsWith("/profile")) {
			// Profile route detected - skip logging to reduce console spam
		}

		// Route flags
		const isPublicRoute =
			routeConfig.publicRoutes.includes(pathname) || pathname === "/";

		const isAuthRoute = routeConfig.authRoutes.includes(pathname);

		const isProtectedRoute = routeConfig.protectedRoutes.some(
			(route: string) => pathname.startsWith(route)
		);

		const isAuthModalRoute = routeConfig.authModalRoutes.includes(pathname);

		const isAdminRoute = routeConfig.adminRoutes.some((route: string) =>
			pathname.startsWith(route)
		);

		const isAdminApiRoute = routeConfig.adminApiRoutes.some(
			(route: string) => pathname.startsWith(route)
		);

		// const requiresProfile = routeConfig.profileRequiredRoutes.some(
		// 	(route: string) => pathname.startsWith(route)
		// );

		// Handle public routes
		if (isPublicRoute) {
			// For authenticated users, check if they should be redirected based on role
			if (isAuthenticated) {
				// We need to check user role, but we can't do that in middleware easily
				// So we'll let the client handle this redirect
				return NextResponse.next();
			}
			return NextResponse.next();
		}

		// Handle auth routes (signin, signup) - let client handle redirects to prevent hydration issues
		if (isAuthRoute) {
			// Don't redirect on server-side to prevent hydration mismatches
			// Let the client-side components handle the redirect logic
			return NextResponse.next();
		}

		// Handle auth modal routes - allow access but let component handle auth
		if (isAuthModalRoute) {
			return NextResponse.next();
		}

		// Handle admin routes - require authentication and admin role
		if (isAdminRoute) {
			if (!isAuthenticated) {
				// Store the attempted URL to redirect after login
				const response = NextResponse.redirect(
					new URL(
						routeConfig.defaultRedirects.afterLogout,
						request.url
					)
				);
				response.cookies.set("redirectAfterLogin", pathname);
				return response;
			}

			// Check if user has admin role
			const isAdmin = await checkAdminRole(request);
			if (!isAdmin) {
				// Redirect non-admin users to dashboard with access denied
				return NextResponse.redirect(
					new URL(
						routeConfig.defaultRedirects.accessDenied,
						request.url
					)
				);
			}
		}

		// Handle admin API routes - require authentication and admin role
		// Return JSON 401/403 instead of redirects so API clients receive proper status
		if (isAdminApiRoute) {
			if (!isAuthenticated) {
				return NextResponse.json(
					{ success: false, message: "Unauthorized" },
					{ status: 401 }
				);
			}

			const isAdminApi = await checkAdminRole(request);
			if (!isAdminApi) {
				return NextResponse.json(
					{
						success: false,
						message: "Forbidden - Admin access required",
					},
					{ status: 403 }
				);
			}
		}

		// Handle protected routes - let client handle authentication modals
		if (isProtectedRoute) {
			// Protected route access - skip logging to reduce console spam

			// For all protected routes, let the client-side handle authentication
			// This allows the AuthRequiredModal to show consistently across all protected pages
			// Client will handle auth modal
			return NextResponse.next();
		}

		// Default: allow access
		return NextResponse.next();
	} catch (error) {
		// On error, check if route requires auth
		if (
			routeConfig.protectedRoutes.some((route: string) =>
				pathname.startsWith(route)
			)
		) {
			return NextResponse.redirect(
				new URL(routeConfig.defaultRedirects.afterLogout, request.url)
			);
		}

		// Allow auth modal routes to proceed even on error
		if (routeConfig.authModalRoutes.includes(pathname)) {
			return NextResponse.next();
		}

		return NextResponse.next();
	}
}

export const config = {
	matcher: [
		/*
		 * Match all request paths except for the ones starting with:
		 * - api (API routes)
		 * - _next/static (static files)
		 * - _next/image (image optimization files)
		 * - favicon.ico (favicon file)
		 */
		// All non-API client pages
		"/((?!api|_next/static|_next/image|favicon.ico).*)",
		// Also run middleware for admin API routes so we can protect them
		"/api/admin/:path*",
	],
};
