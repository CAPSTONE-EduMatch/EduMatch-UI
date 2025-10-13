import { NextRequest } from "next/server";
import { auth } from "@/app/lib/auth";
import { prismaClient } from "../../../../../prisma/index";

// Update user online status
export async function POST(request: NextRequest) {
	try {
		const body = await request.json();
		const { isOnline } = body;

		// Authenticate user
		const session = await auth.api.getSession({
			headers: request.headers,
		});

		if (!session?.user) {
			return new Response("Unauthorized", { status: 401 });
		}

		// Update user's last seen timestamp
		await prismaClient.user.update({
			where: { id: session.user.id },
			data: {
				lastSeen: new Date(),
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
		const session = await auth.api.getSession({
			headers: request.headers,
		});

		if (!session?.user) {
			return new Response("Unauthorized", { status: 401 });
		}

		// Get all users with their last seen status
		const users = await prismaClient.user.findMany({
			where: {
				id: { not: session.user.id }, // Exclude current user
			},
			select: {
				id: true,
				name: true,
				email: true,
				image: true,
				lastSeen: true,
			},
			orderBy: {
				name: "asc",
			},
		});

		// Determine online status (online if last seen within 5 minutes)
		const now = new Date();
		const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);

		const usersWithStatus = users.map((user) => ({
			id: user.id,
			name: user.name || "Unknown User",
			email: user.email || "",
			image: user.image,
			status:
				user.lastSeen && user.lastSeen > fiveMinutesAgo
					? "online"
					: "offline",
			lastSeen: user.lastSeen,
		}));

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
