import { checkAdminRole } from "@/lib/admin-utils";
import { NextRequest, NextResponse } from "next/server";

// Inline route configuration to avoid Edge Runtime issues
const routeConfig = {
	publicRoutes: ["/", "/about", "/api/health"],
	authRoutes: ["/signin", "/signup", "/forgot-password"],
	// All routes that require authentication
	protectedRoutes: [
		"/files",
		"/admin",
		"/applicant-profile",
		"/institution-profile",
		"/messages",
		"/profile",
	],
	adminRoutes: ["/admin"],
	// Routes that require profile creation
	profileRequiredRoutes: [
		"/files",
		"/applicant-profile",
		"/institution-profile",
		"/messages",
	],
	// Routes that should show auth modal instead of redirecting
	authModalRoutes: [
		"/applicant-profile/create",
		"/institution-profile/create",
	],
	// Routes that are exempt from profile check
	profileExemptRoutes: [
		"/profile/create",
		"/signin",
		"/signup",
		"/forgot-password",
		"/",
	],
	defaultRedirects: {
		afterLogin: "/explore", // Will be overridden by role-based logic
		afterLogout: "/signin",
		createProfile: "/profile/create",
		accessDenied: "/", // Redirect non-admin users here
	},
};

// Get user role for redirect logic - simplified for Edge Runtime
async function getUserRole(request: NextRequest): Promise<string | null> {
	try {
		// For Edge Runtime, we'll use a simpler approach
		// Check if user has profile by calling the profile API
		const profileResponse = await fetch(
			`${request.nextUrl.origin}/api/profile`,
			{
				headers: {
					Cookie: request.headers.get("cookie") || "",
				},
			}
		);

		if (profileResponse.ok) {
			const profileData = await profileResponse.json();
			return profileData.role || null;
		}

		return null;
	} catch (error) {
		console.error("[MIDDLEWARE] Error getting user role:", error);
		return null;
	}
}

// Get role-based redirect URL
function getRoleBasedRedirect(role: string | null): string {
	if (role === "institution") {
		return "/institution-profile";
	} else if (role === "applicant") {
		return "/explore";
	}
	// Default fallback
	return "/explore";
}

// Edge Runtime compatible auth check function
async function checkAuthentication(request: NextRequest) {
	try {
		// Use the same authentication method as the profile API
		const sessionResponse = await fetch(
			`${request.nextUrl.origin}/api/auth/get-session`,
			{
				headers: {
					Cookie: request.headers.get("cookie") || "",
				},
			}
		);

		if (sessionResponse.ok) {
			const sessionData = await sessionResponse.json();
			if (sessionData?.user) {
				// eslint-disable-next-line no-console
				console.log(
					`[MIDDLEWARE] Valid session found - user authenticated:`,
					sessionData.user.id
				);
				return {
					isAuthenticated: true,
					userId: sessionData.user.id,
				};
			}
		}

		// eslint-disable-next-line no-console
		console.log(`[MIDDLEWARE] No valid session found`);
		return { isAuthenticated: false, userId: null };
	} catch (error) {
		// eslint-disable-next-line no-console
		console.error("[MIDDLEWARE] Auth check error:", error);
		return { isAuthenticated: false, userId: null };
	}
}

export async function middleware(request: NextRequest) {
	const { pathname } = request.nextUrl;

	// Debug: Log all requests
	// eslint-disable-next-line no-console
	console.log(`[MIDDLEWARE] Processing: ${pathname}`);

	// Skip middleware for static files and API routes (except auth API)
	if (
		pathname.startsWith("/_next/") ||
		pathname.startsWith("/api/") ||
		pathname.includes(".") ||
		pathname.startsWith("/favicon")
	) {
		// eslint-disable-next-line no-console
		console.log(`[MIDDLEWARE] Skipping: ${pathname}`);
		return NextResponse.next();
	}

	// Skip middleware for client-side navigation to prevent hydration issues
	if (request.headers.get("x-middleware-rewrite")) {
		// eslint-disable-next-line no-console
		console.log(`[MIDDLEWARE] Skipping rewrite request: ${pathname}`);
		return NextResponse.next();
	}

	try {
		// Use Edge Runtime compatible auth check
		const { isAuthenticated, userId } = await checkAuthentication(request);

		// Debug logging
		// eslint-disable-next-line no-console
		console.log(
			`[MIDDLEWARE] ${pathname} - Auth: ${isAuthenticated}, UserId: ${userId}`
		);

		// Additional debugging for profile routes
		if (
			pathname.startsWith("/applicant-profile") ||
			pathname.startsWith("/institution-profile")
		) {
			// eslint-disable-next-line no-console
			console.log(`[MIDDLEWARE] Profile route detected: ${pathname}`);
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

		const requiresProfile = routeConfig.profileRequiredRoutes.some(
			(route: string) => pathname.startsWith(route)
		);

		// Handle public routes
		if (isPublicRoute) {
			return NextResponse.next();
		}

		// Handle auth routes (signin, signup) - redirect authenticated users
		if (isAuthRoute) {
			if (isAuthenticated) {
				// Get user role and redirect accordingly
				const userRole = await getUserRole(request);
				const redirectUrl = getRoleBasedRedirect(userRole);

				return NextResponse.redirect(new URL(redirectUrl, request.url));
			}
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

		// Handle protected routes
		if (isProtectedRoute) {
			// eslint-disable-next-line no-console
			console.log(
				`[MIDDLEWARE] Protected route ${pathname} - Auth: ${isAuthenticated}`
			);

			if (!isAuthenticated) {
				// eslint-disable-next-line no-console
				console.log(
					`[MIDDLEWARE] Redirecting unauthenticated user from ${pathname} to signin`
				);
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

			// For profile routes, let the client-side handle profile checks to avoid hydration issues
			// The client-side components will check for profile existence and redirect if needed
			if (requiresProfile && isAuthenticated) {
				// eslint-disable-next-line no-console
				console.log(
					`[MIDDLEWARE] Profile route detected, allowing access - client will handle profile check`
				);
			}
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
		"/((?!api|_next/static|_next/image|favicon.ico).*)",
	],
};
