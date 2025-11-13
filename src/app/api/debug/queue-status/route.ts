import { NextRequest, NextResponse } from "next/server";
import { SQSService, QUEUE_URLS } from "@/config/sqs-config";

/**
 * Debug endpoint to check SQS queue status
 * Shows how many messages are in each queue
 */
export async function GET(request: NextRequest) {
	try {
		// Check notifications queue
		const notificationsMessages = await SQSService.receiveMessages(
			QUEUE_URLS.NOTIFICATIONS,
			10 // Get up to 10 messages to check
		);

		// Check emails queue
		const emailsMessages = await SQSService.receiveMessages(
			QUEUE_URLS.EMAILS,
			10 // Get up to 10 messages to check
		);

		// Parse message bodies to see what's in them
		const notificationsContent = notificationsMessages.map((msg) => {
			try {
				return {
					messageId: msg.MessageId,
					body: JSON.parse(msg.Body || "{}"),
					receiptHandle: msg.ReceiptHandle?.substring(0, 20) + "...",
				};
			} catch {
				return {
					messageId: msg.MessageId,
					body: msg.Body,
					receiptHandle: msg.ReceiptHandle?.substring(0, 20) + "...",
				};
			}
		});

		const emailsContent = emailsMessages.map((msg) => {
			try {
				return {
					messageId: msg.MessageId,
					body: JSON.parse(msg.Body || "{}"),
					receiptHandle: msg.ReceiptHandle?.substring(0, 20) + "...",
				};
			} catch {
				return {
					messageId: msg.MessageId,
					body: msg.Body,
					receiptHandle: msg.ReceiptHandle?.substring(0, 20) + "...",
				};
			}
		});

		return NextResponse.json({
			success: true,
			notificationsQueue: {
				count: notificationsMessages.length,
				messages: notificationsContent,
			},
			emailsQueue: {
				count: emailsMessages.length,
				messages: emailsContent,
			},
			note: "Messages shown here are temporarily visible. They will become visible again after visibility timeout.",
		});
	} catch (error) {
		console.error("Error checking queue status:", error);
		return NextResponse.json(
			{
				success: false,
				error: "Failed to check queue status",
				details:
					error instanceof Error ? error.message : "Unknown error",
			},
			{ status: 500 }
		);
	}
}
