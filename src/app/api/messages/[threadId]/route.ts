import { NextRequest, NextResponse } from "next/server";
import { prismaClient } from "../../../../../prisma/index";

export async function GET(
	request: NextRequest,
	{ params }: { params: { threadId: string } }
) {
	try {
		const { threadId } = params;

		if (!threadId) {
			return NextResponse.json(
				{ error: "Thread ID is required" },
				{ status: 400 }
			);
		}

		// Fetch messages for the thread
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

		// Transform messages to match client format
		const formattedMessages = messages.map((msg) => {
			const sender = userMap.get(msg.sender_id);
			return {
				id: msg.message_id,
				threadId: msg.box_id,
				senderId: msg.sender_id,
				content: msg.body,
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
