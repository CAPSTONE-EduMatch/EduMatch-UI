import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/auth-utils";
import { prismaClient } from "../../../../../prisma/index";

// Get specific user by ID
export async function GET(
	request: NextRequest,
	{ params }: { params: { userId: string } }
) {
	try {
		// Authenticate user
		const { user: currentUser } = await requireAuth();

		const { userId } = params;

		// Get specific user
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
			},
		});

		if (!user) {
			return new Response("User not found", { status: 404 });
		}

		// Transform the data to match our interface
		const transformedUser = {
			id: user.id,
			name: user.name || "Unknown User",
			email: user.email || "",
			image: user.image,
			status: "offline", // You can implement real-time status later
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
