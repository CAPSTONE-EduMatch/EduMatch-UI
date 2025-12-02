import { NextRequest } from "next/server";
import { requireAuth } from "@/utils/auth/auth-utils";
import { prismaClient } from "../../../../../prisma/index";

// Update user online status
export async function POST(request: NextRequest) {
	try {
		const body = await request.json();
		const { isOnline } = body;

		// Authenticate user
		const { user: currentUser } = await requireAuth();

		// Update user's last seen timestamp
		await prismaClient.user.update({
			where: { id: currentUser.id },
			data: {
				updatedAt: new Date(),
			},
		});

		return new Response(
			JSON.stringify({
				success: true,
				message: "Status updated",
			}),
			{
				status: 200,
				headers: { "Content-Type": "application/json" },
			}
		);
	} catch (error) {
		console.error("Update status error:", error);
		return new Response("Failed to update status", { status: 500 });
	}
}

// Get user online status
export async function GET(request: NextRequest) {
	try {
		// Authenticate user
		const { user: currentUser } = await requireAuth();

		// Get all users with their last seen status, including applicant and institution data
		const users = await prismaClient.user.findMany({
			where: {
				id: { not: currentUser.id }, // Exclude current user
			},
			select: {
				id: true,
				name: true,
				email: true,
				image: true,
				updatedAt: true, // Use updatedAt as last seen indicator
				applicant: {
					select: {
						first_name: true,
						last_name: true,
					},
				},
				institution: {
					select: {
						name: true,
					},
				},
			},
			orderBy: {
				email: "asc", // Order by email since name might be null
			},
		});

		// Determine online status (online if last seen within 5 minutes)
		const now = new Date();
		const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);

		const usersWithStatus = users.map((user) => {
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

			return {
				id: user.id,
				name: displayName,
				email: user.email || "",
				image: user.image,
				status:
					user.updatedAt && user.updatedAt > fiveMinutesAgo
						? "online"
						: "offline",
				lastSeen: user.updatedAt,
			};
		});

		return new Response(
			JSON.stringify({
				success: true,
				users: usersWithStatus,
			}),
			{
				status: 200,
				headers: { "Content-Type": "application/json" },
			}
		);
	} catch (error) {
		console.error("Get user status error:", error);
		return new Response("Failed to get user status", { status: 500 });
	}
}
