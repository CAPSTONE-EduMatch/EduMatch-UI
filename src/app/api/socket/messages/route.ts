import { NextRequest } from "next/server";
import { auth } from "@/app/lib/auth";
import { prismaClient } from "../../../../../prisma/index";

// Get new messages since last message ID
export async function GET(request: NextRequest) {
	try {
		const { searchParams } = new URL(request.url);
		const threadId = searchParams.get("threadId");
		const lastMessageId = searchParams.get("lastMessageId");

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

		// Build query for new messages
		const whereClause: any = {
			threadId,
		};

		// If lastMessageId is provided, only get messages after that ID
		if (lastMessageId) {
			whereClause.id = {
				gt: lastMessageId, // Get messages with ID greater than lastMessageId
			};
		}

		// Fetch only new messages
		const messages = await prismaClient.mesage.findMany({
			where: whereClause,
			include: {
				User: {
					select: {
						id: true,
						name: true,
						image: true,
					},
				},
			},
			orderBy: {
				createdAt: "asc",
			},
			take: 50, // Limit to prevent large responses
		});

		// Transform messages to match expected format
		const transformedMessages = messages.map((message) => ({
			id: message.id,
			threadId: message.threadId,
			senderId: message.senderId,
			content: message.body,
			sender: {
				id: message.User.id,
				name: message.User.name,
				image: message.User.image,
			},
			fileUrl: message.fileUrl,
			fileName: message.fileName,
			fileSize: message.fileSize,
			mimeType: message.mimeType,
			createdAt: message.createdAt.toISOString(),
			isRead: message.isRead,
		}));

		return new Response(
			JSON.stringify({
				success: true,
				messages: transformedMessages,
				hasMore: messages.length === 50, // Indicates if there might be more messages
			}),
			{
				status: 200,
				headers: { "Content-Type": "application/json" },
			}
		);
	} catch (error) {
		console.error("Get new messages error:", error);
		return new Response("Failed to fetch messages", { status: 500 });
	}
}
