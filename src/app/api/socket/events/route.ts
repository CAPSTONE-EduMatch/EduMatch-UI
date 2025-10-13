import { NextRequest } from "next/server";
import { auth } from "@/app/lib/auth";
import { prismaClient } from "../../../../../prisma/index";

// Extend global type for thread connections
declare global {
	var threadConnections:
		| Map<string, Set<ReadableStreamDefaultController>>
		| undefined;
}

// Server-Sent Events for real-time updates
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

	// Create a readable stream for Server-Sent Events
	const stream = new ReadableStream({
		start(controller) {
			// Send initial connection event
			const initialEvent = `data: ${JSON.stringify({
				type: "connected",
				userId: session.user.id,
				threadId,
				timestamp: new Date().toISOString(),
			})}\n\n`;
			controller.enqueue(new TextEncoder().encode(initialEvent));

			// Store connection for this thread
			if (!global.threadConnections) {
				global.threadConnections = new Map();
			}

			if (!global.threadConnections.has(threadId)) {
				global.threadConnections.set(threadId, new Set());
			}

			global.threadConnections.get(threadId)?.add(controller);

			// Simple heartbeat to keep connection alive (no database queries)
			const heartbeatInterval = setInterval(() => {
				const heartbeat = `data: ${JSON.stringify({
					type: "heartbeat",
					timestamp: new Date().toISOString(),
				})}\n\n`;
				controller.enqueue(new TextEncoder().encode(heartbeat));
			}, 30000); // Send heartbeat every 30 seconds

			// Cleanup function
			const cleanup = () => {
				clearInterval(heartbeatInterval);
				// Remove connection from global map
				if (
					global.threadConnections &&
					global.threadConnections.has(threadId)
				) {
					global.threadConnections.get(threadId)?.delete(controller);
					if (global.threadConnections.get(threadId)?.size === 0) {
						global.threadConnections.delete(threadId);
					}
				}
				controller.close();
			};

			// Handle client disconnect
			request.signal.addEventListener("abort", cleanup);
		},
	});

	return new Response(stream, {
		headers: {
			"Content-Type": "text/event-stream",
			"Cache-Control": "no-cache",
			Connection: "keep-alive",
			"Access-Control-Allow-Origin": "*",
			"Access-Control-Allow-Headers": "Cache-Control",
		},
	});
}
