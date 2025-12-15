import { NextRequest, NextResponse } from "next/server";
import { prismaClient } from "../../../../../prisma/index";
import { requireAuth } from "@/utils/auth/auth-utils";
import { decryptMessage } from "@/utils/encryption/message-encryption";

export async function GET(
	request: NextRequest,
	{ params }: { params: { threadId: string } }
) {
	try {
		// Check authentication
		const { user } = await requireAuth();

		if (!user?.id) {
			return NextResponse.json(
				{ error: "Authentication required" },
				{ status: 401 }
			);
		}

		const { threadId } = params;

		if (!threadId) {
			return NextResponse.json(
				{ error: "Thread ID is required" },
				{ status: 400 }
			);
		}

		// SECURITY CHECK: Verify user is a participant in this thread
		const box = await prismaClient.box.findUnique({
			where: { box_id: threadId },
			select: {
				box_id: true,
				user_one_id: true,
				user_two_id: true,
			},
		});

		if (!box) {
			return NextResponse.json(
				{ error: "Thread not found" },
				{ status: 404 }
			);
		}

		// Check if user is a participant (either user_one_id or user_two_id)
		const isParticipant =
			box.user_one_id === user.id || box.user_two_id === user.id;

		if (!isParticipant) {
			// User is not a participant - deny access
			return NextResponse.json(
				{
					error: "Access denied. You are not a participant in this thread.",
				},
				{ status: 403 }
			);
		}

		// ADDITIONAL SECURITY: For institutions and admins, ensure they can only access threads they belong to
		// This prevents Institution B from accessing Institution A's threads, and admins from accessing any threads
		if (user.role === "institution" || user.role === "admin") {
			// Get the other participant in the thread
			const otherUserId =
				box.user_one_id === user.id ? box.user_two_id : box.user_one_id;

			// Get both users' institution information
			const [currentUserData, otherUserData] = await Promise.all([
				prismaClient.user.findUnique({
					where: { id: user.id },
					select: {
						id: true,
						role: true,
						institution: {
							select: {
								institution_id: true,
							},
						},
					},
				}),
				prismaClient.user.findUnique({
					where: { id: otherUserId },
					select: {
						id: true,
						role: true,
						institution: {
							select: {
								institution_id: true,
							},
						},
					},
				}),
			]);

			// For admins: Deny access to any thread (admins should not access private conversations)
			if (user.role === "admin") {
				return NextResponse.json(
					{
						error: "Access denied. Admins cannot access private message threads.",
					},
					{ status: 403 }
				);
			}

			// For institutions: Only allow if the current user is the institution user in this thread
			// This means the other participant must be an applicant (not another institution)
			if (user.role === "institution") {
				// If the other participant is also an institution, deny access
				if (
					otherUserData?.role === "institution" ||
					otherUserData?.institution
				) {
					return NextResponse.json(
						{
							error: "Access denied. You can only access threads with applicants.",
						},
						{ status: 403 }
					);
				}

				// Verify the current user is actually an institution user
				if (!currentUserData?.institution) {
					return NextResponse.json(
						{
							error: "Access denied. Invalid institution user.",
						},
						{ status: 403 }
					);
				}
			}
		}

		// Fetch messages for the thread (only if user is a participant)
		const messages = await prismaClient.message.findMany({
			where: { box_id: threadId },
			orderBy: { send_at: "asc" },
		});

		// Get user information for senders
		const senderIds = Array.from(
			new Set(messages.map((msg) => msg.sender_id))
		);
		const users = await prismaClient.user.findMany({
			where: { id: { in: senderIds } },
			select: {
				id: true,
				name: true,
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

		const userMap = new Map();
		users.forEach((user) => {
			let name = user.name || "Unknown User";
			if (!name || name === "Unknown User") {
				if (user.applicant) {
					name =
						`${user.applicant.first_name || ""} ${user.applicant.last_name || ""}`.trim() ||
						"Applicant";
				} else if (user.institution) {
					name = user.institution.name;
				}
			}
			userMap.set(user.id, {
				id: user.id,
				name,
				image: user.image,
			});
		});

		// Transform messages to match client format and decrypt content
		const formattedMessages = messages.map((msg) => {
			const sender = userMap.get(msg.sender_id);
			// Decrypt message content
			const decryptedContent = decryptMessage(msg.body);
			return {
				id: msg.message_id,
				threadId: msg.box_id,
				senderId: msg.sender_id,
				content: decryptedContent,
				sender: sender
					? {
							id: sender.id,
							name: sender.name,
							image: sender.image,
						}
					: {
							id: msg.sender_id,
							name: "Unknown User",
							image: null,
						},
				fileUrl: null, // Not in new schema
				fileName: null, // Not in new schema
				fileSize: null, // Not in new schema
				mimeType: null, // Not in new schema
				createdAt: msg.send_at.toISOString(),
				isRead: false, // Not in new schema
			};
		});

		return NextResponse.json({
			success: true,
			messages: formattedMessages,
		});
	} catch (error) {
		console.error("Error fetching messages:", error);
		return NextResponse.json(
			{ error: "Failed to fetch messages" },
			{ status: 500 }
		);
	}
}
