"use client";

import { useState, useEffect } from "react";
import { useAuthCheck } from "./useAuthCheck";

interface UserProfile {
	id: string;
	name: string;
	email: string;
	role: "applicant" | "institution";
	firstName?: string;
	lastName?: string;
	image?: string;
}

export function useUserProfile() {
	const {
		isAuthenticated,
		user: authUser,
		isLoading: authLoading,
	} = useAuthCheck();
	const [profile, setProfile] = useState<UserProfile | null>(null);
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		const fetchProfile = async () => {
			if (!isAuthenticated || authLoading) {
				setProfile(null);
				return;
			}

			setIsLoading(true);
			setError(null);

			try {
				const response = await fetch("/api/profile", {
					method: "GET",
					headers: {
						"Content-Type": "application/json",
					},
					credentials: "include",
				});

				if (response.ok) {
					const data = await response.json();
					if (data.profile) {
						// Extract user info from profile
						const userProfile: UserProfile = {
							id: data.profile.user_id || authUser?.id || "",
							name:
								data.profile.user?.name ||
								`${data.profile.first_name || ""} ${data.profile.last_name || ""}`.trim() ||
								authUser?.name ||
								"User",
							email:
								data.profile.user?.email ||
								authUser?.email ||
								"",
							role: data.profile.role || "applicant",
							firstName: data.profile.first_name,
							lastName: data.profile.last_name,
							image: data.profile.user?.image || authUser?.image,
						};
						setProfile(userProfile);
					} else {
						// Fallback to auth user data if no profile
						const fallbackProfile: UserProfile = {
							id: authUser?.id || "",
							name: authUser?.name || "User",
							email: authUser?.email || "",
							role: "applicant", // Default role
							image: authUser?.image,
						};
						setProfile(fallbackProfile);
					}
				} else {
					// Fallback to auth user data if profile fetch fails
					const fallbackProfile: UserProfile = {
						id: authUser?.id || "",
						name: authUser?.name || "User",
						email: authUser?.email || "",
						role: "applicant", // Default role
						image: authUser?.image,
					};
					setProfile(fallbackProfile);
				}
			} catch (err) {
				// console.error("Error fetching user profile:", err);
				setError("Failed to load profile");

				// Fallback to auth user data
				const fallbackProfile: UserProfile = {
					id: authUser?.id || "",
					name: authUser?.name || "User",
					email: authUser?.email || "",
					role: "applicant", // Default role
					image: authUser?.image,
				};
				setProfile(fallbackProfile);
			} finally {
				setIsLoading(false);
			}
		};

		fetchProfile();
	}, [isAuthenticated, authLoading, authUser]);

	return {
		profile,
		isLoading: isLoading || authLoading,
		error,
		refreshProfile: () => {
			if (isAuthenticated) {
				setProfile(null);
				// Trigger re-fetch by updating a dependency
			}
		},
	};
}
