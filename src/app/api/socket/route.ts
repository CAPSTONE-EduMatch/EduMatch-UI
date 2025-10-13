import { NextRequest } from "next/server";
import { auth } from "@/app/lib/auth";
import { prismaClient } from "../../../../prisma/index";

// WebSocket upgrade handler
export async function GET(request: NextRequest) {
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

	// Fetch messages for the thread
	const messages = await prismaClient.mesage.findMany({
		where: {
			threadId,
		},
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
			threadId,
			userId: session.user.id,
			userName: session.user.name,
		}),
		{
			status: 200,
			headers: {
				"Content-Type": "application/json",
			},
		}
	);
}

// Send message via WebSocket-like API
export async function POST(request: NextRequest) {
	try {
		const body = await request.json();
		const { threadId, content, messageId } = body;

		if (!threadId || !content) {
			return new Response("Thread ID and content required", {
				status: 400,
			});
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
			include: {
				User_thread_createdByToUser: true,
				User_thread_participantIdToUser: true,
			},
		});

		if (!thread) {
			return new Response("Access denied", { status: 403 });
		}

		// Save message to database
		const message = await prismaClient.mesage.create({
			data: {
				id: messageId || crypto.randomUUID(),
				senderId: session.user.id,
				threadId,
				body: content,
				createdAt: new Date(),
			},
			include: {
				User: {
					select: {
						id: true,
						name: true,
						image: true,
					},
				},
			},
		});

		// Update thread's last message
		await prismaClient.thread.update({
			where: { id: threadId },
			data: {
				lastMessageId: message.id,
				lastMessageAt: message.createdAt,
			},
		});

		// Prepare message for broadcasting
		const messageData = {
			id: message.id,
			threadId: message.threadId,
			senderId: message.senderId,
			content: message.body,
			sender: {
				id: message.User.id,
				name: message.User.name,
				image: message.User.image,
			},
			createdAt: message.createdAt.toISOString(),
			isRead: false,
		};

		// Return the message for real-time updates
		return new Response(
			JSON.stringify({
				success: true,
				message: messageData,
			}),
			{
				status: 200,
				headers: { "Content-Type": "application/json" },
			}
		);
	} catch (error) {
		console.error("Send message error:", error);
		return new Response("Failed to send message", { status: 500 });
	}
}
