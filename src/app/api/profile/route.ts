import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/app/lib/auth";
import { ProfileService, ProfileFormData } from "@/lib/profile-service";

export async function GET(request: NextRequest) {
	console.log("🚨 API ROUTE HIT: GET /api/profile");
	try {
		console.log("🔵 API: GET profile request received");

		// Check if user is authenticated
		const session = await auth.api.getSession({
			headers: request.headers,
		});

		if (!session) {
			console.log("❌ API: No session found for GET");
			return NextResponse.json(
				{ error: "Authentication required" },
				{ status: 401 }
			);
		}

		const userId = session.user.id;
		console.log("✅ API: User authenticated for GET:", userId);

		// Use the profile service to get the profile
		console.log("🔍 API: Fetching profile from ProfileService...");
		const profile = await ProfileService.getProfile(userId);
		console.log(
			"🔍 API: ProfileService returned:",
			profile ? "Found profile" : "No profile found"
		);

		if (profile) {
			console.log("✅ API: Returning profile to client");
			return NextResponse.json({
				profile: profile,
			});
		} else {
			console.log("❌ API: Profile not found, returning 404");
			return NextResponse.json(
				{ error: "Profile not found" },
				{ status: 404 }
			);
		}
	} catch (error) {
		console.error("❌ API: Error fetching profile:", error);
		return NextResponse.json(
			{ error: "Failed to fetch profile" },
			{ status: 500 }
		);
	}
}

export async function POST(request: NextRequest) {
	try {
		console.log("🔵 API: Profile creation request received");

		// Check if user is authenticated
		const session = await auth.api.getSession({
			headers: request.headers,
		});

		if (!session) {
			console.log("❌ API: No session found");
			return NextResponse.json(
				{ error: "Authentication required" },
				{ status: 401 }
			);
		}

		console.log("✅ API: User authenticated:", session.user.id);

		const formData: ProfileFormData = await request.json();
		console.log("📋 API: Form data received:", {
			role: formData.role,
			firstName: formData.firstName,
			lastName: formData.lastName,
			email: formData.email,
			// Don't log sensitive data
		});

		const userId = session.user.id;

		// Check if profile already exists
		const existingProfile = await ProfileService.getProfile(userId);
		if (existingProfile) {
			console.log("⚠️ API: Profile already exists");
			return NextResponse.json(
				{ error: "Profile already exists" },
				{ status: 409 }
			);
		}

		console.log("💾 API: Creating new profile...");
		// Use the profile service to create the profile
		const newProfile = await ProfileService.upsertProfile(userId, formData);
		console.log(
			"✅ API: Profile created successfully:",
			newProfile ? "Success" : "Failed"
		);

		return NextResponse.json({
			success: true,
			message: "Profile created successfully",
			profile: newProfile,
		});
	} catch (error) {
		console.error("❌ API: Error saving profile:", error);
		return NextResponse.json(
			{ error: "Failed to save profile" },
			{ status: 500 }
		);
	}
}

export async function PUT(request: NextRequest) {
	try {
		// Check if user is authenticated
		const session = await auth.api.getSession({
			headers: request.headers,
		});

		if (!session) {
			return NextResponse.json(
				{ error: "Authentication required" },
				{ status: 401 }
			);
		}

		const userId = session.user.id;
		const formData: ProfileFormData = await request.json();

		// Use the profile service to update the profile
		const updatedProfile = await ProfileService.upsertProfile(
			userId,
			formData
		);

		return NextResponse.json({
			success: true,
			message: "Profile updated successfully",
			profile: updatedProfile,
		});
	} catch (error) {
		console.error("Error updating profile:", error);
		return NextResponse.json(
			{ error: "Failed to update profile" },
			{ status: 500 }
		);
	}
}
