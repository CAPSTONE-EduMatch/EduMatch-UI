"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

interface AdminAuthState {
	isAdmin: boolean | null;
	isLoading: boolean;
	error: string | null;
}

/**
 * Hook to check if the current user has admin privileges
 * Redirects to home page if user is not an admin
 */
export function useAdminAuth() {
	const [state, setState] = useState<AdminAuthState>({
		isAdmin: null,
		isLoading: true,
		error: null,
	});
	const router = useRouter();

	useEffect(() => {
		const checkAdminStatus = async () => {
			try {
				const response = await fetch("/api/auth/admin-check", {
					method: "GET",
					credentials: "include",
					headers: {
						"Cache-Control": "no-cache",
					},
				});

				if (!response.ok) {
					if (response.status === 401) {
						// Not authenticated - redirect to signin
						router.push("/signin");
						return;
					}
					throw new Error(`Admin check failed: ${response.status}`);
				}

				const data = await response.json();

				if (!data.isAdmin) {
					// Not an admin - redirect to home page
					router.push("/");
					return;
				}

				setState({
					isAdmin: true,
					isLoading: false,
					error: null,
				});
			} catch (error) {
				const errorMessage =
					error instanceof Error ? error.message : "Unknown error";

				// On error, assume not admin and redirect
				setState({
					isAdmin: false,
					isLoading: false,
					error: errorMessage,
				});

				// Redirect to home page on error
				router.push("/");
			}
		};

		checkAdminStatus();
	}, [router]);

	return state;
}
