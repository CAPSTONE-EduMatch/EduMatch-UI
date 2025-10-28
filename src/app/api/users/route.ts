import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/auth-utils";
import { prismaClient } from "../../../../prisma/index";

// Get list of users
export async function GET(request: NextRequest) {
	try {
		// Authenticate user using optimized auth utilities
		const { user } = await requireAuth();

		// Get all users except the current user
		const users = await prismaClient.user.findMany({
			where: {
				id: { not: user.id }, // Exclude current user
			},
			select: {
				id: true,
				name: true,
				email: true,
				image: true,
				createdAt: true,
				// You can add more fields as needed
			},
			orderBy: {
				name: "asc",
			},
		});

		// Transform the data to match our interface
		const transformedUsers = users.map((user) => ({
			id: user.id,
			name: user.name || "Unknown User",
			email: user.email || "",
			image: user.image,
			status: "offline", // You can implement real-time status later
		}));

		return new Response(
			JSON.stringify({
				success: true,
				users: transformedUsers,
			}),
			{
				status: 200,
				headers: { "Content-Type": "application/json" },
			}
		);
	} catch (error) {
		console.error("Get users error:", error);
		return new Response("Failed to fetch users", { status: 500 });
	}
}
