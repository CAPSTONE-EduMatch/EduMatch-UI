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

		// eslint-disable-next-line no-console
		console.log(
			`📧 Received email request from Lambda: ${message.type} for ${message.userEmail}`
		);

		// Validate required fields
		if (!message.type || !message.userEmail || !message.userId) {
			// eslint-disable-next-line no-console
			console.error("❌ Missing required fields in email request:", {
				type: message.type,
				userEmail: message.userEmail,
				userId: message.userId,
			});
			return NextResponse.json(
				{
					error: "Missing required fields: type, userEmail, or userId",
				},
				{ status: 400 }
			);
		}

		// Send email using the email service
		// eslint-disable-next-line no-console
		console.log(
			`📤 Sending email via EmailService for ${message.userEmail}`
		);
		await EmailService.sendNotificationEmail(message);
		// eslint-disable-next-line no-console
		console.log(`✅ Email sent successfully to ${message.userEmail}`);

		return NextResponse.json({
			success: true,
			message: `Email sent successfully to ${message.userEmail}`,
		});
	} catch (error) {
		// eslint-disable-next-line no-console
		console.error("❌ Error sending email via API:", error);
		if (error instanceof Error) {
			// eslint-disable-next-line no-console
			console.error("❌ Error details:", error.message);
			// eslint-disable-next-line no-console
			console.error("❌ Error stack:", error.stack);
		}
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
