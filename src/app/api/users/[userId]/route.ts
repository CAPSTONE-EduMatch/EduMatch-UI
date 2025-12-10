import { NextRequest } from "next/server";
import { requireAuth } from "@/utils/auth/auth-utils";
import { prismaClient } from "../../../../../prisma/index";

// Configuration - same as status route
const ONLINE_STATUS_THRESHOLD_MS =
	parseInt(process.env.ONLINE_STATUS_THRESHOLD_MINUTES || "5") * 60 * 1000;

// Get specific user by ID
export async function GET(
	request: NextRequest,
	{ params }: { params: { userId: string } }
) {
	try {
		// Authenticate user
		await requireAuth();

		const { userId } = params;

		// Get specific user with applicant and institution data
		const user = await prismaClient.user.findUnique({
			where: {
				id: userId,
			},
			select: {
				id: true,
				name: true,
				email: true,
				image: true,
				createdAt: true,
				updatedAt: true, // Include updatedAt for online status calculation
				applicant: {
					select: {
						first_name: true,
						last_name: true,
						level: true,
						subdiscipline: {
							select: {
								name: true,
							},
						},
					},
				},
				institution: {
					select: {
						name: true,
						type: true,
						country: true,
						abbreviation: true,
						logo: true,
					},
				},
				role_id: true,
			},
		});

		if (!user) {
			return new Response("User not found", { status: 404 });
		}

		// Determine the correct name based on user type
		let displayName = "Unknown User";
		if (user.applicant?.first_name || user.applicant?.last_name) {
			// For applicants: use first_name + last_name
			displayName =
				`${user.applicant.first_name || ""} ${user.applicant.last_name || ""}`.trim();
		} else if (user.institution?.name) {
			// For institutions: use institution name
			displayName = user.institution.name;
		} else if (user.name) {
			// Fallback to User.name
			displayName = user.name;
		}

		// Determine user type
		const isInstitution = user.role_id === "2" || user.institution !== null;
		const isApplicant = user.role_id === "1" || user.applicant !== null;

		// Transform the data to match our interface
		// For institutions, use logo instead of user image (Google profile image)
		// If institution has no logo, return null so fallback icon is shown (not Google image)
		const imageToUse = isInstitution
			? user.institution?.logo || null // For institutions, only use logo, never Google image
			: user.image; // For applicants, use user image (Google profile image)

		// Calculate online status based on updatedAt timestamp (same logic as /api/users/status)
		const now = new Date();
		const thresholdTime = new Date(
			now.getTime() - ONLINE_STATUS_THRESHOLD_MS
		);
		const isOnline =
			user.updatedAt && user.updatedAt > thresholdTime
				? "online"
				: "offline";

		const transformedUser = {
			id: user.id,
			name: displayName,
			email: user.email || "",
			image: imageToUse,
			status: isOnline, // Real-time status based on updatedAt
			lastSeen: user.updatedAt, // Include last seen timestamp
			// Include applicant data if available
			degreeLevel: user.applicant?.level || null,
			subDiscipline: user.applicant?.subdiscipline?.name || null,
			// Include institution data if available
			institutionType: user.institution?.type || null,
			institutionCountry: user.institution?.country || null,
			institutionAbbreviation: user.institution?.abbreviation || null,
			// User type indicator
			userType: isInstitution
				? "institution"
				: isApplicant
					? "applicant"
					: "unknown",
		};

		return new Response(
			JSON.stringify({
				success: true,
				user: transformedUser,
			}),
			{
				status: 200,
				headers: { "Content-Type": "application/json" },
			}
		);
	} catch (error) {
		return new Response("Failed to fetch user", { status: 500 });
	}
}
