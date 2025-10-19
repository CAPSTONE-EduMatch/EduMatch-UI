"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuthCheck } from "./useAuthCheck";

export function useProfileCheck() {
	const router = useRouter();
	const pathname = usePathname();
	const { isAuthenticated, isLoading: authLoading } = useAuthCheck();

	useEffect(() => {
		const checkProfile = async () => {
			// Skip if still loading auth
			if (authLoading) {
				return;
			}

			// Skip if not authenticated
			if (!isAuthenticated) {
				return;
			}

			// Skip if on profile create page
			if (pathname.startsWith("/profile/create")) {
				return;
			}

			try {
				const response = await fetch("/api/profile", {
					method: "GET",
					headers: {
						"Content-Type": "application/json",
					},
				});

				// If profile doesn't exist (404) or any error, redirect to create profile
				if (response.status === 404 || !response.ok) {
					router.push("/profile/create");
				}
				// If profile exists, do nothing - user can stay on current page
			} catch (err) {
				console.error("Profile check error:", err);
				// On error, redirect to create profile
				router.push("/profile/create");
			}
		};

		checkProfile();
	}, [isAuthenticated, authLoading, pathname, router]);
}
