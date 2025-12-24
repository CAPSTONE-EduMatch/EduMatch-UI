import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/utils/auth/auth-utils";
import { NotificationUtils } from "@/services/messaging/sqs-handlers";

/**
 * API route to send welcome notification after successful signup
 */
export async function POST(request: NextRequest) {
	try {
		// Check if user is authenticated
		const { user } = await requireAuth();

		if (!user) {
			return NextResponse.json(
				{ error: "Authentication required" },
				{ status: 401 }
			);
		}

		const { firstName, lastName } = await request.json();

		// Send welcome notification
		await NotificationUtils.sendWelcomeNotification(
			user.id,
			user.email || "",
			firstName || user.name?.split(" ")[0] || "User",
			lastName || user.name?.split(" ").slice(1).join(" ") || ""
		);

		return NextResponse.json({
			success: true,
			message: "Welcome notification sent successfully",
		});
	} catch (error) {
		console.error("Error sending welcome notification:", error);

		return NextResponse.json(
			{
				success: false,
				error: "Failed to send welcome notification",
				details:
					error instanceof Error ? error.message : "Unknown error",
			},
			{ status: 500 }
		);
	}
}
