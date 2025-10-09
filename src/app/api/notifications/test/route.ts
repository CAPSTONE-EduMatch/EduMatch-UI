import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/app/lib/auth";
import { NotificationUtils } from "@/lib/sqs-handlers";

/**
 * POST /api/notifications/test - Send a test notification
 * This endpoint is for testing the notification system
 */
export async function POST(request: NextRequest) {
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

		const { type = "WELCOME" } = await request.json();

		// Send test notification based on type
		switch (type) {
			case "WELCOME":
				await NotificationUtils.sendWelcomeNotification(
					session.user.id,
					session.user.email || "",
					session.user.name?.split(" ")[0] || "User",
					session.user.name?.split(" ").slice(1).join(" ") || ""
				);
				break;
			case "PROFILE_CREATED":
				await NotificationUtils.sendProfileCreatedNotification(
					session.user.id,
					session.user.email || "",
					"test-profile-id",
					session.user.name?.split(" ")[0] || "User",
					session.user.name?.split(" ").slice(1).join(" ") || "",
					"student"
				);
				break;
			default:
				return NextResponse.json(
					{ error: "Invalid notification type" },
					{ status: 400 }
				);
		}

		return NextResponse.json({
			success: true,
			message: `Test ${type} notification sent successfully`,
		});
	} catch (error) {
		console.error("Error sending test notification:", error);

		return NextResponse.json(
			{
				success: false,
				error: "Failed to send test notification",
				details:
					error instanceof Error ? error.message : "Unknown error",
			},
			{ status: 500 }
		);
	}
}
