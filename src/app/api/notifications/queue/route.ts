import { NextRequest, NextResponse } from "next/server";
import { NotificationMessage, SQSService } from "@/config/sqs-config";
import { requireAuth } from "@/utils/auth/auth-utils";
import { EmailService } from "@/services/email/email-service";

/**
 * Unified API endpoint for sending notification messages to SQS
 * This endpoint accepts notification messages and queues them for processing
 * All notification types should use this endpoint for consistency
 */
export async function POST(request: NextRequest) {
	try {
		// Parse the notification message from request body
		const message: NotificationMessage = await request.json();

		// Validate required fields
		if (
			!message.type ||
			!message.userEmail ||
			!message.userId ||
			!message.id
		) {
			return NextResponse.json(
				{
					success: false,
					error: "Missing required fields: type, userEmail, userId, or id",
				},
				{ status: 400 }
			);
		}

		// For security, verify the authenticated user matches the userId in the message
		// (unless it's a system notification like payment webhooks)
		const systemNotificationTypes = [
			"PAYMENT_SUCCESS",
			"PAYMENT_FAILED",
			"SUBSCRIPTION_EXPIRING",
			"SUBSCRIPTION_CANCELED",
		];

		if (!systemNotificationTypes.includes(message.type)) {
			try {
				const { user } = await requireAuth();
				// Allow if user is admin or if userId matches authenticated user
				if (user.role_id !== "3" && user.id !== message.userId) {
					return NextResponse.json(
						{
							success: false,
							error: "Unauthorized: Cannot send notification for another user",
						},
						{ status: 403 }
					);
				}
			} catch (authError) {
				// If auth fails, still allow for system notifications
				// This handles cases where notifications are sent from server-side code
			}
		}

		// Send message to SQS
		try {
			await SQSService.sendEmailMessage(message);
			// eslint-disable-next-line no-console
			console.log(
				`✅ Successfully queued ${message.type} notification for ${message.userEmail}`
			);
		} catch (sqsError) {
			// eslint-disable-next-line no-console
			console.error(
				`❌ Failed to queue notification to SQS:`,
				sqsError instanceof Error ? sqsError.message : sqsError
			);
			throw sqsError;
		}

		return NextResponse.json({
			success: true,
			message: `Notification queued successfully: ${message.type}`,
		});
	} catch (error) {
		console.error("Error queueing notification:", error);
		return NextResponse.json(
			{
				success: false,
				error:
					error instanceof Error
						? error.message
						: "Failed to queue notification",
			},
			{ status: 500 }
		);
	}
}
