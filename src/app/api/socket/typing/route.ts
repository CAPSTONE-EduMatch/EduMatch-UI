import { NextRequest } from "next/server";
import { auth } from "@/app/lib/auth";
import { prismaClient } from "../../../../../prisma/index";

// Update typing status
export async function POST(request: NextRequest) {
	try {
		const body = await request.json();
		const { threadId, isTyping } = body;

		if (!threadId || typeof isTyping !== "boolean") {
			return new Response("Thread ID and typing status required", {
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
		});

		if (!thread) {
			return new Response("Access denied", { status: 403 });
		}

		// Update typing status in database
		const typingStatus = (thread.isTyping as any) || {};
		typingStatus[session.user.id] = isTyping;

		await prismaClient.thread.update({
			where: { id: threadId },
			data: { isTyping: typingStatus },
		});

		return new Response(
			JSON.stringify({
				success: true,
				typingStatus: {
					userId: session.user.id,
					userName: session.user.name,
					isTyping,
					threadId,
				},
			}),
			{
				status: 200,
				headers: { "Content-Type": "application/json" },
			}
		);
	} catch (error) {
		console.error("Typing status error:", error);
		return new Response("Failed to update typing status", { status: 500 });
	}
}

// Get typing status for a thread
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

		const typingStatus = (thread.isTyping as any) || {};

		return new Response(
			JSON.stringify({
				success: true,
				typingStatus,
			}),
			{
				status: 200,
				headers: { "Content-Type": "application/json" },
			}
		);
	} catch (error) {
		console.error("Get typing status error:", error);
		return new Response("Failed to get typing status", { status: 500 });
	}
}
