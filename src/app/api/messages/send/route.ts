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

		// Verify user has access to this thread (now called Box)
		console.log(
			"Checking box access for user:",
			session.user.id,
			"box:",
			threadId
		);
		const box = await prismaClient.box.findFirst({
			where: {
				box_id: threadId,
				OR: [
					{ user_one_id: session.user.id },
					{ user_two_id: session.user.id },
				],
			},
		});

		console.log(
			"Box found:",
			box ? "Yes" : "No",
			box
				? {
						box_id: box.box_id,
						user_one_id: box.user_one_id,
						user_two_id: box.user_two_id,
					}
				: null
		);

		if (!box) {
			// Box doesn't exist in PostgreSQL, but might exist in AppSync
			// This can happen when using the hybrid approach
			console.log(
				"Box not found in PostgreSQL, this might be an AppSync-only box"
			);
			return NextResponse.json(
				{
					error: "Box not found in database. Please refresh and try again.",
				},
				{ status: 404 }
			);
		}

		// Create message
		const message = await prismaClient.message.create({
			data: {
				message_id: crypto.randomUUID(),
				box_id: threadId,
				sender_id: session.user.id,
				body: content || "",
				send_at: new Date(),
			},
		});

		// Update box's last message
		await prismaClient.box.update({
			where: { box_id: threadId },
			data: {
				last_message_id: message.message_id,
				last_message_at: message.send_at,
			},
		});

		// Get sender information
		const user = await prismaClient.user.findUnique({
			where: { id: session.user.id },
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

		let sender = null;
		if (user) {
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
			sender = {
				id: user.id,
				name,
				image: user.image,
			};
		}

		return NextResponse.json({
			success: true,
			message: {
				id: message.message_id,
				threadId: message.box_id,
				senderId: message.sender_id,
				content: message.body,
				sender: sender
					? {
							id: sender.id,
							name: sender.name,
							image: sender.image,
						}
					: {
							id: session.user.id,
							name: "Unknown User",
							image: null,
						},
				fileUrl: null, // Not in new schema
				fileName: null, // Not in new schema
				fileSize: null, // Not in new schema
				mimeType: null, // Not in new schema
				createdAt: message.send_at,
				isRead: false, // Not in new schema
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
