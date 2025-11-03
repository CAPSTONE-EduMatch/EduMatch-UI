import { NextRequest, NextResponse } from "next/server";
import { SQSMessageHandler } from "@/services/messaging/sqs-handlers";

/**
 * API route to process SQS notification messages
 * This can be called by AWS Lambda, cron jobs, or manually
 */
export async function POST(request: NextRequest) {
	try {
		console.log("Processing notification messages via API...");

		await SQSMessageHandler.processNotificationMessages();

		return NextResponse.json({
			success: true,
			message: "Notification messages processed successfully",
		});
	} catch (error) {
		console.error("Error processing notification messages:", error);

		return NextResponse.json(
			{
				success: false,
				error: "Failed to process notification messages",
				details:
					error instanceof Error ? error.message : "Unknown error",
			},
			{ status: 500 }
		);
	}
}

/**
 * API route to process SQS email messages
 */
export async function PUT(request: NextRequest) {
	try {
		console.log("Processing email messages via API...");

		await SQSMessageHandler.processEmailMessages();

		return NextResponse.json({
			success: true,
			message: "Email messages processed successfully",
		});
	} catch (error) {
		console.error("Error processing email messages:", error);

		return NextResponse.json(
			{
				success: false,
				error: "Failed to process email messages",
				details:
					error instanceof Error ? error.message : "Unknown error",
			},
			{ status: 500 }
		);
	}
}

/**
 * API route to process both notification and email messages
 */
export async function GET(request: NextRequest) {
	try {
		console.log("Processing all messages via API...");

		await Promise.all([
			SQSMessageHandler.processNotificationMessages(),
			SQSMessageHandler.processEmailMessages(),
		]);

		return NextResponse.json({
			success: true,
			message: "All messages processed successfully",
		});
	} catch (error) {
		console.error("Error processing all messages:", error);

		return NextResponse.json(
			{
				success: false,
				error: "Failed to process messages",
				details:
					error instanceof Error ? error.message : "Unknown error",
			},
			{ status: 500 }
		);
	}
}
