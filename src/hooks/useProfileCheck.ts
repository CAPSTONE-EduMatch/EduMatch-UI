"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuthCheck } from "./useAuthCheck";

export function useProfileCheck() {
	const router = useRouter();
	const pathname = usePathname();
	const { isAuthenticated, isLoading: authLoading, user } = useAuthCheck();
	const [isCheckingProfile, setIsCheckingProfile] = useState(false);
	const hasCheckedRef = useRef(false);
	const lastAuthStateRef = useRef<boolean | null>(null);

	useEffect(() => {
		const checkProfile = async () => {
			// Skip if still loading auth
			if (authLoading) {
				console.log(
					"⏳ useProfileCheck: Auth still loading, skipping profile check"
				);
				return;
			}

			// Skip if not authenticated
			if (!isAuthenticated) {
				console.log(
					"❌ useProfileCheck: Not authenticated, resetting check flag"
				);
				hasCheckedRef.current = false;
				lastAuthStateRef.current = false;
				return;
			}

			// Skip if on profile create page
			if (pathname.startsWith("/profile/create")) {
				console.log(
					"📝 useProfileCheck: On profile create page, skipping check"
				);
				hasCheckedRef.current = false;
				return;
			}

			// Skip if we've already checked for this session and auth state hasn't changed
			if (
				hasCheckedRef.current &&
				lastAuthStateRef.current === isAuthenticated
			) {
				console.log(
					"✅ useProfileCheck: Already checked for this session"
				);
				return;
			}

			// Prevent multiple simultaneous profile checks
			if (isCheckingProfile) {
				console.log(
					"⏳ useProfileCheck: Profile check already in progress"
				);
				return;
			}

			setIsCheckingProfile(true);

			try {
				console.log(
					"🔍 useProfileCheck: Starting profile check for authenticated user"
				);

				// Add a small delay to ensure auth state is fully settled
				await new Promise((resolve) => setTimeout(resolve, 100));

				const response = await fetch("/api/profile", {
					method: "GET",
					headers: {
						"Content-Type": "application/json",
					},
					credentials: "include",
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
					lastAuthStateRef.current = isAuthenticated;
					router.push("/profile/create");
					return;
				}

				// If profile exists, mark as checked
				console.log(
					"✅ useProfileCheck: Profile found, user can continue"
				);
				hasCheckedRef.current = true;
				lastAuthStateRef.current = isAuthenticated;

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
				lastAuthStateRef.current = isAuthenticated;
				router.push("/profile/create");
			} finally {
				setIsCheckingProfile(false);
			}
		};

		checkProfile();
	}, [isAuthenticated, authLoading, pathname, router, user?.id]);

	// Reset check flag when pathname changes to profile create
	useEffect(() => {
		if (pathname.startsWith("/profile/create")) {
			hasCheckedRef.current = false;
		}
	}, [pathname]);

	// Reset check flag when user changes (different user logged in)
	useEffect(() => {
		if (user?.id) {
			hasCheckedRef.current = false;
		}
	}, [user?.id]);

	return {
		isCheckingProfile,
	};
}
