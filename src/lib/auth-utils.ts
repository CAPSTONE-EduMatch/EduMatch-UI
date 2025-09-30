export async function checkEmailExists(email: string): Promise<boolean> {
	try {
		const response = await fetch(
			`/api/user?email=${encodeURIComponent(email)}`,
			{
				method: "GET",
				headers: {
					"Content-Type": "application/json",
				},
			}
		);

		if (!response.ok) {
			// If API fails, assume email exists to be safe
			return true;
		}

		const data = await response.json();
		return data.exists;
	} catch (error) {
		// On error, assume email exists to prevent duplicate attempts
		return true;
	}
}

export async function checkUserHasProfile(userId: string): Promise<boolean> {
	try {
		// For server-side usage (middleware), use direct service call
		if (typeof window === "undefined") {
			const { ProfileService } = await import("@/lib/profile-service");
			return await ProfileService.hasProfile(userId);
		}

		// For client-side usage, use API call
		const { ApiService } = await import("@/lib/axios-config");
		const profileData = await ApiService.checkProfile(userId);

		// Check if profile has minimum required fields
		return !!(
			profileData.profile &&
			profileData.profile.role &&
			profileData.profile.firstName &&
			profileData.profile.lastName
		);

		// If profile not found (404) or other error, assume no profile
		return false;
	} catch (error) {
		// Removed console.error for production
		return false;
	}
}

export async function getUserProfile(userId: string): Promise<any> {
	try {
		// For server-side usage, use direct service call
		if (typeof window === "undefined") {
			const { ProfileService } = await import("@/lib/profile-service");
			return await ProfileService.getProfile(userId);
		}

		// For client-side usage, use API call
		const { ApiService } = await import("@/lib/axios-config");
		const data = await ApiService.checkProfile(userId);
		return data.profile;

		return null;
	} catch (error) {
		// Removed console.error for production
		return null;
	}
}
