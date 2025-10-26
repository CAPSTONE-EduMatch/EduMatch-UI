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
				console.log("Profile API response:", data);
				if (data.profile) {
					// Extract user info from profile
					const constructedName =
						`${data.profile.firstName || ""} ${data.profile.lastName || ""}`.trim() ||
						data.profile.user?.name ||
						authUser?.name ||
						"User";
					console.log(
						"Constructed name:",
						constructedName,
						"from firstName:",
						data.profile.firstName,
						"lastName:",
						data.profile.lastName
					);

					const userProfile: UserProfile = {
						id: data.profile.user_id || authUser?.id || "",
						name: constructedName,
						email:
							data.profile.user?.email || authUser?.email || "",
						role: data.profile.role || "applicant",
						firstName: data.profile.firstName,
						lastName: data.profile.lastName,
						image: data.profile.user?.image || authUser?.image,
					};
					console.log(
						"Initial profile set with name:",
						userProfile.name
					);
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

	useEffect(() => {
		fetchProfile();
	}, [isAuthenticated, authLoading, authUser]);

	const refreshProfile = async () => {
		if (isAuthenticated) {
			setProfile(null);
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
					console.log("Refresh Profile API response:", data);
					if (data.profile) {
						// Extract user info from profile
						const constructedName =
							`${data.profile.firstName || ""} ${data.profile.lastName || ""}`.trim() ||
							data.profile.user?.name ||
							authUser?.name ||
							"User";
						console.log(
							"Refresh - Constructed name:",
							constructedName,
							"from firstName:",
							data.profile.firstName,
							"lastName:",
							data.profile.lastName
						);

						const userProfile: UserProfile = {
							id: data.profile.user_id || authUser?.id || "",
							name: constructedName,
							email:
								data.profile.user?.email ||
								authUser?.email ||
								"",
							role: data.profile.role || "applicant",
							firstName: data.profile.firstName,
							lastName: data.profile.lastName,
							image: data.profile.user?.image || authUser?.image,
						};
						console.log(
							"Setting profile with name:",
							userProfile.name
						);
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
				console.error("Error refreshing user profile:", err);
				setError("Failed to refresh profile");

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
		}
	};

	return {
		profile,
		isLoading: isLoading || authLoading,
		error,
		refreshProfile,
	};
}
