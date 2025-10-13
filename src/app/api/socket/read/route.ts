import { NextRequest } from "next/server";
import { auth } from "@/app/lib/auth";
import { prismaClient } from "../../../../../prisma/index";

// Simple endpoint to get unread count for a thread
export async function GET(request: NextRequest) {
	try {
		const { searchParams } = new URL(request.url);
		const threadId = searchParams.get("threadId");

		if (!threadId) {
			return new Response("Thread ID required", { status: 400 });
		}

		// Authenticate user
		const session = await auth.api.getSession({
			headers: request.headers,
		});

		if (!session?.user) {
			return new Response("Unauthorized", { status: 401 });
		}

		// Verify user has access to this thread
		const thread = await prismaClient.thread.findFirst({
			where: {
				id: threadId,
				OR: [
					{ createdBy: session.user.id },
					{ participantId: session.user.id },
				],
			},
		});

		if (!thread) {
			return new Response("Access denied", { status: 403 });
		}

		// Get unread count
		const unreadCount = await prismaClient.mesage.count({
			where: {
				threadId,
				senderId: { not: session.user.id }, // Messages not from current user
				isRead: false,
			},
		});

		return new Response(
			JSON.stringify({
				success: true,
				unreadCount,
				threadId,
			}),
			{
				status: 200,
				headers: { "Content-Type": "application/json" },
			}
		);
	} catch (error) {
		console.error("Get unread count error:", error);
		return new Response(
			JSON.stringify({
				error: "Failed to get unread count",
				details:
					error instanceof Error ? error.message : "Unknown error",
			}),
			{
				status: 500,
				headers: { "Content-Type": "application/json" },
			}
		);
	}
}

// Mark messages as read
export async function POST(request: NextRequest) {
	try {
		const body = await request.json();
		const { messageIds, threadId, markAllUnread } = body;

		if (!threadId) {
			return new Response("Thread ID required", {
				status: 400,
			});
		}

		// If markAllUnread is true, we'll mark all unread messages in the thread
		// Otherwise, we'll use the specific messageIds
		if (!markAllUnread && (!messageIds || !Array.isArray(messageIds))) {
			return new Response(
				"Message IDs array required when markAllUnread is false",
				{
					status: 400,
				}
			);
		}

		// Authenticate user
		const session = await auth.api.getSession({
			headers: request.headers,
		});

		if (!session?.user) {
			return new Response("Unauthorized", { status: 401 });
		}

		// Verify user has access to this thread
		const thread = await prismaClient.thread.findFirst({
			where: {
				id: threadId,
				OR: [
					{ createdBy: session.user.id },
					{ participantId: session.user.id },
				],
			},
		});

		if (!thread) {
			return new Response("Access denied", { status: 403 });
		}

		console.log("Mark as read request:", {
			messageIds,
			threadId,
			userId: session.user.id,
			markAllUnread,
		});

		let result;

		if (markAllUnread) {
			// Mark all unread messages in the thread as read
			console.log("Marking all unread messages in thread as read");
			result = await prismaClient.mesage.updateMany({
				where: {
					threadId,
					senderId: { not: session.user.id }, // Don't mark own messages as read
					isRead: false, // Only mark unread messages
				},
				data: {
					isRead: true,
					readAt: new Date(),
				},
			});
			console.log("Mark all unread result:", result);
		} else {
			// Mark specific messages as read
			const existingMessages = await prismaClient.mesage.findMany({
				where: {
					id: { in: messageIds },
					threadId,
				},
				select: {
					id: true,
					senderId: true,
					isRead: true,
				},
			});

			console.log("Existing messages found:", existingMessages);

			// Filter out messages that don't exist or are from the current user
			const validMessageIds = existingMessages
				.filter((msg) => msg.senderId !== session.user.id)
				.map((msg) => msg.id);

			console.log("Valid message IDs to mark as read:", validMessageIds);

			if (validMessageIds.length === 0) {
				return new Response(
					JSON.stringify({
						success: true,
						message: "No messages to mark as read",
						readReceipt: {
							messageIds: [],
							readBy: session.user.id,
							readAt: new Date(),
							threadId,
							updatedCount: 0,
						},
					}),
					{
						status: 200,
						headers: { "Content-Type": "application/json" },
					}
				);
			}

			// Update read status in database
			result = await prismaClient.mesage.updateMany({
				where: {
					id: { in: validMessageIds },
					threadId,
					senderId: { not: session.user.id }, // Don't mark own messages as read
				},
				data: {
					isRead: true,
					readAt: new Date(),
				},
			});
		}

		console.log("Mark as read result:", result);

		return new Response(
			JSON.stringify({
				success: true,
				readReceipt: {
					messageIds: markAllUnread ? [] : messageIds || [],
					readBy: session.user.id,
					readAt: new Date(),
					threadId,
					updatedCount: result.count,
					markAllUnread: markAllUnread,
				},
			}),
			{
				status: 200,
				headers: { "Content-Type": "application/json" },
			}
		);
	} catch (error) {
		console.error("Mark read error:", error);
		return new Response(
			JSON.stringify({
				error: "Failed to mark messages as read",
				details:
					error instanceof Error ? error.message : "Unknown error",
			}),
			{
				status: 500,
				headers: { "Content-Type": "application/json" },
			}
		);
	}
}
