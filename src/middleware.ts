import { NextRequest, NextResponse } from "next/server";

// Inline route configuration to avoid Edge Runtime issues
const routeConfig = {
	publicRoutes: ["/", "/about", "/api/health"],
	authRoutes: ["/signin", "/signup", "/forgot-password"],
	protectedRoutes: ["/dashboard", "/files", "/admin"],
	adminRoutes: ["/admin"],
	profileRequiredRoutes: ["/dashboard", "/files"],
	// Routes that should show auth modal instead of redirecting
	authModalRoutes: ["/profile/create-profile"],
	defaultRedirects: {
		afterLogin: "/dashboard",
		afterLogout: "/signin",
		createProfile: "/profile/create-profile",
	},
};

// Edge Runtime compatible auth check function
async function checkAuthentication(request: NextRequest) {
	try {
		// Get all cookies and log them for debugging
		const allCookies = request.cookies.getAll();
		// eslint-disable-next-line no-console
		console.log(
			`[MIDDLEWARE] Available cookies:`,
			allCookies.map((c) => c.name)
		);

		// Check for Better Auth session - try common cookie names
		const sessionCookie = allCookies.find(
			(cookie) =>
				cookie.name.includes("session") ||
				cookie.name.includes("auth") ||
				cookie.name.includes("better-auth")
		);

		// eslint-disable-next-line no-console
		console.log(`[MIDDLEWARE] Found session cookie:`, sessionCookie?.name);

		// Better Auth session validation: If session cookies exist, user is authenticated
		if (sessionCookie && sessionCookie.name.includes("session")) {
			// eslint-disable-next-line no-console
			console.log(
				`[MIDDLEWARE] Valid session cookie - user authenticated`
			);
			return {
				isAuthenticated: true,
				userId: null,
			};
		}

		// eslint-disable-next-line no-console
		console.log(`[MIDDLEWARE] No valid session cookie found`);
		return { isAuthenticated: false, userId: null };
	} catch (error) {
		// eslint-disable-next-line no-console
		console.error("[MIDDLEWARE] Auth check error:", error);
		return { isAuthenticated: false, userId: null };
	}
}

// Edge Runtime compatible profile check (simplified)
async function hasUserProfile(userId: string, request: NextRequest) {
	if (!userId) return false;

	try {
		// Make API call to check profile - this keeps middleware lightweight
		const response = await fetch(
			`${request.nextUrl.origin}/api/profile/check/${userId}`,
			{
				headers: {
					Cookie: request.headers.get("cookie") || "",
				},
			}
		);

		if (response.ok) {
			const data = await response.json();
			return data.hasProfile;
		}
		return false;
	} catch (error) {
		console.error("[MIDDLEWARE] Profile check error:", error);
		return false;
	}
}

export async function middleware(request: NextRequest) {
	const { pathname } = request.nextUrl;

	// Debug: Log all requests
	console.log(`[MIDDLEWARE] Processing: ${pathname}`);

	// Skip middleware for static files and API routes (except auth API)
	if (
		pathname.startsWith("/_next/") ||
		pathname.startsWith("/api/") ||
		pathname.includes(".") ||
		pathname.startsWith("/favicon")
	) {
		console.log(`[MIDDLEWARE] Skipping: ${pathname}`);
		return NextResponse.next();
	}

	try {
		// Use Edge Runtime compatible auth check
		const { isAuthenticated, userId } = await checkAuthentication(request);

		// Debug logging
		console.log(`[MIDDLEWARE] ${pathname} - Auth: ${isAuthenticated}`);

		// Route flags
		const isPublicRoute =
			routeConfig.publicRoutes.includes(pathname) || pathname === "/";

		const isAuthRoute = routeConfig.authRoutes.includes(pathname);

		const isProtectedRoute = routeConfig.protectedRoutes.some(
			(route: string) => pathname.startsWith(route)
		);

		const isAuthModalRoute = routeConfig.authModalRoutes.includes(pathname);

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
				return NextResponse.redirect(
					new URL(
						routeConfig.defaultRedirects.afterLogin,
						request.url
					)
				);
			}
			return NextResponse.next();
		}

		// Handle auth modal routes - allow access but let component handle auth
		if (isAuthModalRoute) {
			return NextResponse.next();
		}

		// Handle protected routes
		if (isProtectedRoute) {
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

			// Check if profile is required for this route
			if (requiresProfile && isAuthenticated && userId) {
				try {
					const hasProfile = await hasUserProfile(userId, request);
					if (!hasProfile) {
						return NextResponse.redirect(
							new URL(
								routeConfig.defaultRedirects.createProfile,
								request.url
							)
						);
					}
				} catch (error) {
					// On error checking profile, redirect to profile creation to be safe
					return NextResponse.redirect(
						new URL(
							routeConfig.defaultRedirects.createProfile,
							request.url
						)
					);
				}
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
