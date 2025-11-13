import { NextRequest, NextResponse } from "next/server";
import { EmailService } from "@/services/email/email-service";
import { NotificationMessage } from "@/config/sqs-config";

/**
 * API endpoint for Lambda to send emails
 * This endpoint is called by the EmailProcessor Lambda after messages are forwarded from the notifications queue
 */
export async function POST(request: NextRequest) {
	try {
		const message: NotificationMessage = await request.json();

		// Validate required fields
		if (!message.type || !message.userEmail || !message.userId) {
			return NextResponse.json(
				{
					error: "Missing required fields: type, userEmail, or userId",
				},
				{ status: 400 }
			);
		}

		// Send email using the email service
		await EmailService.sendNotificationEmail(message);

		return NextResponse.json({
			success: true,
			message: `Email sent successfully to ${message.userEmail}`,
		});
	} catch (error) {
		console.error("Error sending email via API:", error);
		return NextResponse.json(
			{
				success: false,
				error:
					error instanceof Error
						? error.message
						: "Unknown error occurred",
			},
			{ status: 500 }
		);
	}
}
