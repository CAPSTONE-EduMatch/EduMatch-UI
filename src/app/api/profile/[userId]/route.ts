import { ProfileService } from "@/services/profile/profile-service";
import { requireAuth } from "@/utils/auth/auth-utils";
import { NextRequest, NextResponse } from "next/server";

// GET /api/profile/[userId] - Get user profile
export async function GET(
	request: NextRequest,
	{ params }: { params: { userId: string } }
) {
	try {
		const { userId } = params;

		if (!userId) {
			return NextResponse.json(
				{ error: "User ID is required" },
				{ status: 400 }
			);
		}

		// Verify the requesting user is authenticated and matches the userId
		const { user } = await requireAuth();

		// SECURITY FIX: Verify the authenticated user matches the userId parameter
		// This prevents users from accessing other users' profiles
		if (user.id !== userId) {
			return NextResponse.json(
				{ error: "Forbidden: You can only access your own profile" },
				{ status: 403 }
			);
		}

		// Use ProfileService to check for profile
		const profile = await ProfileService.getProfile(userId);
		const hasProfile = await ProfileService.hasProfile(userId);

		if (!profile) {
			return NextResponse.json({
				profile: null,
				hasProfile: false,
				message: "Profile not found - please create your profile",
			});
		}

		return NextResponse.json({
			profile,
			hasProfile,
		});

		// TODO: When Profile model is implemented, replace above with:
		// const profile = await prismaClient.profile.findUnique({
		//   where: { userId },
		//   include: {
		//     languages: true,
		//     researchPapers: true,
		//     files: true
		//   }
		// });
		//
		// if (!profile) {
		//   return NextResponse.json({
		//     profile: null,
		//     hasProfile: false,
		//     message: "Profile not found"
		//   });
		// }
		//
		// return NextResponse.json({
		//   profile,
		//   hasProfile: true
		// });
	} catch (error) {
		// eslint-disable-next-line no-console
		console.error("Error fetching profile:", error);
		return NextResponse.json(
			{ error: "Failed to fetch profile" },
			{ status: 500 }
		);
	}
}

// PUT /api/profile/[userId] - Update user profile
export async function PUT(
	request: NextRequest,
	{ params }: { params: { userId: string } }
) {
	try {
		const { userId } = params;
		const profileData = await request.json();

		if (!userId) {
			return NextResponse.json(
				{ error: "User ID is required" },
				{ status: 400 }
			);
		}

		// Verify the requesting user is authenticated and matches the userId
		const { user } = await requireAuth();
		if (user.id !== userId) {
			return NextResponse.json(
				{ error: "Unauthorized" },
				{ status: 401 }
			);
		}

		// Use ProfileService to save profile
		const savedProfile = await ProfileService.upsertProfile(
			userId,
			profileData
		);

		if (!savedProfile) {
			return NextResponse.json(
				{ error: "Failed to save profile" },
				{ status: 500 }
			);
		}

		return NextResponse.json({
			profile: savedProfile,
			hasProfile: ProfileService.isProfileComplete(savedProfile),
			completionPercentage:
				ProfileService.getProfileCompletionPercentage(savedProfile),
		});

		// TODO: When Profile model is implemented, replace above with:
		// const profile = await prismaClient.profile.upsert({
		//   where: { userId },
		//   update: profileData,
		//   create: {
		//     userId,
		//     ...profileData
		//   }
		// });
		//
		// return NextResponse.json({ profile });
	} catch (error) {
		// eslint-disable-next-line no-console
		console.error("Error updating profile:", error);
		return NextResponse.json(
			{ error: "Failed to update profile" },
			{ status: 500 }
		);
	}
}
