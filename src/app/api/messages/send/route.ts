import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/app/lib/auth";
import { prismaClient } from "../../../../../prisma/index";

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
		const { threadId, content, fileUrl, fileName, fileSize, mimeType } =
			body;

		console.log("Message send request:", {
			threadId,
			content,
			fileUrl,
			fileName,
			user: session.user.id,
		});

		if (!threadId || (!content && !fileUrl)) {
			return NextResponse.json(
				{
					error: "Thread ID and either content or fileUrl are required",
				},
				{ status: 400 }
			);
		}

		// Verify user has access to this thread
		console.log(
			"Checking thread access for user:",
			session.user.id,
			"thread:",
			threadId
		);
		const thread = await prismaClient.thread.findFirst({
			where: {
				id: threadId,
				OR: [
					{ createdBy: session.user.id },
					{ participantId: session.user.id },
				],
			},
		});

		console.log(
			"Thread found:",
			thread ? "Yes" : "No",
			thread
				? {
						id: thread.id,
						createdBy: thread.createdBy,
						participantId: thread.participantId,
					}
				: null
		);

		if (!thread) {
			// Thread doesn't exist in PostgreSQL, but might exist in AppSync
			// This can happen when using the hybrid approach
			console.log(
				"Thread not found in PostgreSQL, this might be an AppSync-only thread"
			);
			return NextResponse.json(
				{
					error: "Thread not found in database. Please refresh and try again.",
				},
				{ status: 404 }
			);
		}

		// Create message
		const message = await prismaClient.mesage.create({
			data: {
				id: crypto.randomUUID(),
				senderId: session.user.id,
				threadId,
				body: content || "",
				fileUrl: fileUrl || null,
				fileName: fileName || null,
				fileSize: fileSize || null,
				mimeType: mimeType || null,
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

		return NextResponse.json({
			success: true,
			message: {
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
				createdAt: message.createdAt,
				isRead: false,
			},
		});
	} catch (error) {
		console.error("Send message error:", error);
		return NextResponse.json(
			{ error: "Failed to send message" },
			{ status: 500 }
		);
	}
}
