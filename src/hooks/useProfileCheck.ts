"use client";

import { useEffect, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuthCheck } from "./useAuthCheck";

export function useProfileCheck() {
	const router = useRouter();
	const pathname = usePathname();
	const { isAuthenticated, isLoading: authLoading } = useAuthCheck();
	const hasCheckedRef = useRef(false);

	useEffect(() => {
		const checkProfile = async () => {
			// Skip if still loading auth
			if (authLoading) {
				return;
			}

			// Skip if not authenticated
			if (!isAuthenticated) {
				hasCheckedRef.current = false;
				return;
			}

			// Skip if on profile create page
			if (pathname.startsWith("/profile/create")) {
				hasCheckedRef.current = false;
				return;
			}

			// Skip if we've already checked for this session
			if (hasCheckedRef.current) {
				return;
			}

			try {
				console.log(
					"🔍 useProfileCheck: Checking profile for authenticated user"
				);
				const response = await fetch("/api/profile", {
					method: "GET",
					headers: {
						"Content-Type": "application/json",
					},
					credentials: "include", // Ensure cookies are sent
				});

				console.log(
					"🔍 useProfileCheck: Profile API response status:",
					response.status
				);

				// If profile doesn't exist (404) or any error, redirect to create profile
				if (response.status === 404 || !response.ok) {
					console.log(
						"❌ useProfileCheck: No profile found, redirecting to create profile"
					);
					hasCheckedRef.current = true;
					router.push("/profile/create");
					return;
				}

				// If profile exists, mark as checked
				console.log(
					"✅ useProfileCheck: Profile found, user can continue"
				);
				hasCheckedRef.current = true;

				// Check if we need to redirect based on role
				try {
					const profileData = await response.json();
					if (
						profileData.role === "institution" &&
						pathname === "/explore"
					) {
						console.log(
							"🔄 useProfileCheck: Institution user on explore page, redirecting to institution profile"
						);
						router.push("/institution-profile");
					} else if (
						profileData.role === "applicant" &&
						pathname === "/institution-profile"
					) {
						console.log(
							"🔄 useProfileCheck: Applicant user on institution page, redirecting to explore"
						);
						router.push("/explore");
					}
				} catch (parseError) {
					console.error("Error parsing profile data:", parseError);
				}
			} catch (err) {
				console.error("❌ useProfileCheck: Profile check error:", err);
				// On error, redirect to create profile
				hasCheckedRef.current = true;
				router.push("/profile/create");
			}
		};

		checkProfile();
	}, [isAuthenticated, authLoading, pathname, router]);

	// Reset check flag when pathname changes to profile create
	useEffect(() => {
		if (pathname.startsWith("/profile/create")) {
			hasCheckedRef.current = false;
		}
	}, [pathname]);
}
