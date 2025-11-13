import { NextRequest, NextResponse } from "next/server";
import { prismaClient } from "../../../../../prisma";
import { randomUUID } from "crypto";

/**
 * POST /api/notifications/store - Store notification from Lambda
 */
export async function POST(request: NextRequest) {
	try {
		const body = await request.json();

		// Validate required fields
		const { id, userId, type, title, bodyText, url, createAt, queuedAt } =
			body;

		if (!id || !userId || !type || !title || !bodyText) {
			return NextResponse.json(
				{
					error: "Missing required fields: id, userId, type, title, bodyText",
				},
				{ status: 400 }
			);
		}

		// Generate a new unique notification ID for each database record
		// The message ID (id) is for SQS deduplication, but each notification
		// stored in the database should have a unique ID
		const notificationId = randomUUID();

		// Map the notification stack fields to the database schema
		const notificationData = {
			notification_id: notificationId,
			user_id: userId,
			type: type,
			title: title,
			body: bodyText, // Map bodyText to body
			url: url || null,
			send_at: new Date(), // Use current time as send_at
			create_at: createAt ? new Date(createAt) : new Date(),
			queued_at: queuedAt ? new Date(queuedAt) : new Date(),
		};

		// Store notification in database
		// Each notification gets a unique ID, so we can use create
		const notification = await prismaClient.notification.create({
			data: notificationData,
		});

		return NextResponse.json({
			success: true,
			notification,
		});
	} catch (error) {
		console.error("Error storing notification:", error);

		return NextResponse.json(
			{
				success: false,
				error: "Failed to store notification",
				details:
					error instanceof Error ? error.message : "Unknown error",
			},
			{ status: 500 }
		);
	}
}
