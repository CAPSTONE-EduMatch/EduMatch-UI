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
		const messages = await prismaClient.mesage.findMany({
			where: { threadId },
			include: {
				User: {
					select: {
						id: true,
						name: true,
						image: true,
					},
				},
			},
			orderBy: { createdAt: "asc" },
		});

		// Transform messages to match client format
		const formattedMessages = messages.map((msg) => ({
			id: msg.id,
			threadId: msg.threadId,
			senderId: msg.senderId,
			content: msg.body,
			sender: {
				id: msg.User.id,
				name: msg.User.name,
				image: msg.User.image,
			},
			fileUrl: msg.fileUrl,
			fileName: msg.fileName,
			fileSize: msg.fileSize,
			mimeType: msg.mimeType,
			createdAt: msg.createdAt.toISOString(),
			isRead: msg.isRead,
		}));

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
