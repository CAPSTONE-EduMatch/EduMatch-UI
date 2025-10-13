import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/app/lib/auth";
import { prismaClient } from "../../../../prisma/index";

export async function GET(request: NextRequest) {
	try {
		// Check authentication
		const session = await auth.api.getSession({
			headers: request.headers,
		});

		if (!session || !session.user) {
			return NextResponse.json(
				{ error: "Authentication required" },
				{ status: 401 }
			);
		}

		// Get user's threads
		const threads = await prismaClient.thread.findMany({
			where: {
				OR: [
					{ createdBy: session.user.id },
					{ participantId: session.user.id },
				],
			},
			include: {
				User_thread_createdByToUser: {
					select: {
						id: true,
						name: true,
						image: true,
					},
				},
				User_thread_participantIdToUser: {
					select: {
						id: true,
						name: true,
						image: true,
					},
				},
				mesage: {
					take: 1,
					orderBy: { createdAt: "desc" },
					include: {
						User: {
							select: {
								id: true,
								name: true,
								image: true,
							},
						},
					},
				},
			},
			orderBy: { lastMessageAt: "desc" },
		});

		// Format threads with new simplified schema
		const formattedThreads = await Promise.all(
			threads.map(async (thread) => {
				// Determine the other participant
				const otherParticipant =
					thread.createdBy === session.user.id
						? thread.User_thread_participantIdToUser
						: thread.User_thread_createdByToUser;

				// Get last message
				const lastMessage = thread.mesage[0];
				let lastMessageContent = "";
				let lastMessageSenderId = null;
				let lastMessageSenderName = null;
				let lastMessageSenderImage = null;

				if (lastMessage) {
					// Use message body directly (encryption removed for simplicity)
					lastMessageContent = lastMessage.body;

					lastMessageSenderId = lastMessage.User.id;
					lastMessageSenderName = lastMessage.User.name;
					lastMessageSenderImage = lastMessage.User.image;
				}

				// Calculate unread count from messages
				const unreadCount = await prismaClient.mesage.count({
					where: {
						threadId: thread.id,
						senderId: { not: session.user.id }, // Messages not from current user
						isRead: false,
					},
				});

				return {
					id: thread.id,
					// New simplified schema for 1-on-1 chats
					user1Id: thread.createdBy,
					user2Id: thread.participantId,
					lastMessage: lastMessageContent,
					lastMessageAt: thread.lastMessageAt,
					lastMessageSenderId,
					lastMessageSenderName,
					lastMessageSenderImage,
					createdAt: thread.createdAt,
					updatedAt: thread.lastMessageAt || thread.createdAt,
					unreadCount,
					// Include file data if it's a file message
					...(lastMessage && {
						lastMessageFileUrl: lastMessage.fileUrl,
						lastMessageFileName: lastMessage.fileName,
						lastMessageMimeType: lastMessage.mimeType,
					}),
					// Keep otherParticipant for backward compatibility with UI
					otherParticipant,
				};
			})
		);

		return NextResponse.json({
			success: true,
			threads: formattedThreads,
		});
	} catch (error) {
		console.error("Get threads error:", error);
		return NextResponse.json(
			{ error: "Failed to fetch threads" },
			{ status: 500 }
		);
	}
}

export async function POST(request: NextRequest) {
	try {
		// Check authentication
		const session = await auth.api.getSession({
			headers: request.headers,
		});

		if (!session || !session.user) {
			return NextResponse.json(
				{ error: "Authentication required" },
				{ status: 401 }
			);
		}

		const body = await request.json();
		const { participantId, threadId } = body;

		console.log("Create thread request:", {
			participantId,
			threadId,
			userId: session.user.id,
		});

		if (!participantId) {
			console.log("Missing participantId");
			return NextResponse.json(
				{ error: "Participant ID is required" },
				{ status: 400 }
			);
		}

		if (participantId === session.user.id) {
			console.log("Cannot create thread with yourself");
			return NextResponse.json(
				{ error: "Cannot create thread with yourself" },
				{ status: 400 }
			);
		}

		// Check if thread already exists between these users
		const existingThread = await prismaClient.thread.findFirst({
			where: {
				OR: [
					{
						createdBy: session.user.id,
						participantId: participantId,
					},
					{
						createdBy: participantId,
						participantId: session.user.id,
					},
				],
			},
		});

		if (existingThread) {
			console.log("Thread already exists:", existingThread.id);
			return NextResponse.json({
				success: true,
				thread: {
					id: existingThread.id,
					alreadyExists: true,
				},
			});
		}

		// Verify participant exists
		const participant = await prismaClient.user.findUnique({
			where: { id: participantId },
			select: {
				id: true,
				name: true,
				image: true,
			},
		});

		if (!participant) {
			console.log("Participant not found:", participantId);
			return NextResponse.json(
				{ error: "Participant not found" },
				{ status: 404 }
			);
		}

		// Create new thread
		const thread = await prismaClient.thread.create({
			data: {
				id: threadId || crypto.randomUUID(), // Use provided threadId or generate new one
				createdBy: session.user.id,
				participantId: participantId,
				lastMessageId: "",
				lastMessageAt: new Date(),
				createdAt: new Date(),
			},
			include: {
				User_thread_createdByToUser: {
					select: {
						id: true,
						name: true,
						image: true,
					},
				},
				User_thread_participantIdToUser: {
					select: {
						id: true,
						name: true,
						image: true,
					},
				},
			},
		});

		return NextResponse.json({
			success: true,
			thread: {
				id: thread.id,
				// New simplified schema for 1-on-1 chats
				user1Id: thread.createdBy,
				user2Id: thread.participantId,
				lastMessage: "",
				lastMessageAt: thread.lastMessageAt,
				lastMessageSenderId: null,
				lastMessageSenderName: null,
				lastMessageSenderImage: null,
				createdAt: thread.createdAt,
				updatedAt: thread.lastMessageAt || thread.createdAt,
				unreadCount: 0,
				// Keep otherParticipant for backward compatibility with UI
				otherParticipant: participant,
			},
		});
	} catch (error) {
		console.error("Create thread error:", error);
		return NextResponse.json(
			{ error: "Failed to create thread" },
			{ status: 500 }
		);
	}
}
