import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/utils/auth/auth-utils";
import { prismaClient } from "../../../../prisma/index";

export async function GET(request: NextRequest) {
	try {
		// Check authentication
		const { user } = await requireAuth();

		if (!user.id) {
			return NextResponse.json(
				{ error: "Authentication required" },
				{ status: 401 }
			);
		}

		// Get user's threads (boxes)
		const boxes = await prismaClient.box.findMany({
			where: {
				OR: [{ user_one_id: user.id }, { user_two_id: user.id }],
			},
			orderBy: { last_message_at: "desc" },
		});

		// Format threads with new simplified schema
		const formattedThreads = await Promise.all(
			boxes.map(async (box) => {
				// Determine the other participant
				const otherUserId =
					box.user_one_id === user.id
						? box.user_two_id
						: box.user_one_id;

				// Get other participant info
				const otherAccount = await prismaClient.user.findUnique({
					where: { id: otherUserId },
					select: {
						id: true,
						email: true,
						image: true,
						name: true,
						applicant: {
							select: {
								first_name: true,
								last_name: true,
							},
						},
						institution: {
							select: {
								name: true,
							},
						},
					},
				});

				let otherParticipant = null;
				if (otherAccount) {
					let name = otherAccount.name || "Unknown User";
					if (!name || name === "Unknown User") {
						if (otherAccount.applicant) {
							name =
								`${otherAccount.applicant.first_name || ""} ${otherAccount.applicant.last_name || ""}`.trim() ||
								"Applicant";
						} else if (otherAccount.institution) {
							name = otherAccount.institution.name;
						}
					}

					otherParticipant = {
						id: otherAccount.id,
						name,
						email: otherAccount.email,
						image: otherAccount.image,
					};
				}

				// Get last message
				const lastMessage = await prismaClient.message.findFirst({
					where: { box_id: box.box_id },
					orderBy: { send_at: "desc" },
				});

				let lastMessageContent = "";
				let lastMessageSenderId = null;
				let lastMessageSenderName = null;
				let lastMessageSenderImage = null;

				if (lastMessage) {
					lastMessageContent = lastMessage.body;
					lastMessageSenderId = lastMessage.sender_id;

					// Get sender info
					const senderAccount = await prismaClient.user.findUnique({
						where: { id: lastMessage.sender_id },
						select: {
							name: true,
							email: true,
							image: true,
							applicant: {
								select: {
									first_name: true,
									last_name: true,
								},
							},
							institution: {
								select: {
									name: true,
								},
							},
						},
					});

					if (senderAccount) {
						lastMessageSenderName =
							senderAccount.name || "Unknown User";
						if (
							!lastMessageSenderName ||
							lastMessageSenderName === "Unknown User"
						) {
							if (senderAccount.applicant) {
								lastMessageSenderName =
									`${senderAccount.applicant.first_name || ""} ${senderAccount.applicant.last_name || ""}`.trim() ||
									"Applicant";
							} else if (senderAccount.institution) {
								lastMessageSenderName =
									senderAccount.institution.name;
							}
						}
						lastMessageSenderImage = senderAccount.image;
					}
				}

				// Calculate unread count from messages (simplified - no isRead field in new schema)
				const unreadCount = 0; // Since isRead field doesn't exist in new schema

				return {
					id: box.box_id,
					// New simplified schema for 1-on-1 chats
					user1Id: box.user_one_id,
					user2Id: box.user_two_id,
					lastMessage: lastMessageContent,
					lastMessageAt: box.last_message_at,
					lastMessageSenderId,
					lastMessageSenderName,
					lastMessageSenderImage,
					createdAt: box.created_at,
					updatedAt: box.last_message_at || box.created_at,
					unreadCount,
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
		const { user } = await requireAuth();

		if (!user.id) {
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
			userId: user.id,
		});

		if (!participantId) {
			console.log("Missing participantId");
			return NextResponse.json(
				{ error: "Participant ID is required" },
				{ status: 400 }
			);
		}

		if (participantId === user.id) {
			console.log("Cannot create thread with yourself");
			return NextResponse.json(
				{ error: "Cannot create thread with yourself" },
				{ status: 400 }
			);
		}

		// Check if box already exists between these users
		const existingBox = await prismaClient.box.findFirst({
			where: {
				OR: [
					{
						user_one_id: user.id,
						user_two_id: participantId,
					},
					{
						user_one_id: participantId,
						user_two_id: user.id,
					},
				],
			},
		});

		if (existingBox) {
			console.log("Box already exists:", existingBox.box_id);
			return NextResponse.json({
				success: true,
				thread: {
					id: existingBox.box_id,
					alreadyExists: true,
				},
			});
		}

		// Verify participant exists
		const participantAccount = await prismaClient.user.findUnique({
			where: { id: participantId },
			select: {
				id: true,
				name: true,
				email: true,
				image: true,
				applicant: {
					select: {
						first_name: true,
						last_name: true,
					},
				},
				institution: {
					select: {
						name: true,
					},
				},
			},
		});

		if (!participantAccount) {
			console.log("Participant not found:", participantId);
			return NextResponse.json(
				{ error: "Participant not found" },
				{ status: 404 }
			);
		}

		// Create participant object for response
		let participant = null;
		if (participantAccount) {
			let name = participantAccount.name || "Unknown User";
			if (!name || name === "Unknown User") {
				if (participantAccount.applicant) {
					name =
						`${participantAccount.applicant.first_name || ""} ${participantAccount.applicant.last_name || ""}`.trim() ||
						"Applicant";
				} else if (participantAccount.institution) {
					name = participantAccount.institution.name;
				}
			}

			participant = {
				id: participantAccount.id,
				name,
				email: participantAccount.email,
				image: participantAccount.image,
			};
		}

		// Create new box
		const box = await prismaClient.box.create({
			data: {
				box_id: threadId || crypto.randomUUID(), // Use provided threadId or generate new one
				user_one_id: user.id,
				user_two_id: participantId,
				created_at: new Date(),
				updated_at: new Date(),
			},
		});

		return NextResponse.json({
			success: true,
			thread: {
				id: box.box_id,
				// New simplified schema for 1-on-1 chats
				user1Id: box.user_one_id,
				user2Id: box.user_two_id,
				lastMessage: "",
				lastMessageAt: null,
				lastMessageSenderId: null,
				lastMessageSenderName: null,
				lastMessageSenderImage: null,
				createdAt: box.created_at,
				updatedAt: box.created_at,
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
