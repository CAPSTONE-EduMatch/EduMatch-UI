import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/app/lib/auth";
import { prismaClient } from "../../../../prisma";

/**
 * GET /api/notifications - Fetch user notifications
 */
export async function GET(request: NextRequest) {
	try {
		// Check if user is authenticated
		const session = await auth.api.getSession({
			headers: request.headers,
		});

		if (!session) {
			return NextResponse.json(
				{ error: "Authentication required" },
				{ status: 401 }
			);
		}

		const { searchParams } = new URL(request.url);
		const limit = parseInt(searchParams.get("limit") || "10");
		const offset = parseInt(searchParams.get("offset") || "0");
		const unreadOnly = searchParams.get("unreadOnly") === "true";

		// Build where clause
		const whereClause: any = {
			userId: session.user.id,
		};

		if (unreadOnly) {
			whereClause.read_at = null;
		}

		// Fetch notifications
		const notifications = await prismaClient.notification.findMany({
			where: whereClause,
			orderBy: {
				createAt: "desc",
			},
			take: limit,
			skip: offset,
		});

		// Get total count for pagination
		const totalCount = await prismaClient.notification.count({
			where: whereClause,
		});

		// Get unread count
		const unreadCount = await prismaClient.notification.count({
			where: {
				userId: session.user.id,
				read_at: null,
			},
		});

		return NextResponse.json({
			success: true,
			notifications,
			pagination: {
				total: totalCount,
				unread: unreadCount,
				limit,
				offset,
				hasMore: offset + limit < totalCount,
			},
		});
	} catch (error) {
		console.error("Error fetching notifications:", error);

		return NextResponse.json(
			{
				success: false,
				error: "Failed to fetch notifications",
				details:
					error instanceof Error ? error.message : "Unknown error",
			},
			{ status: 500 }
		);
	}
}

/**
 * PUT /api/notifications - Mark notifications as read
 */
export async function PUT(request: NextRequest) {
	try {
		// Check if user is authenticated
		const session = await auth.api.getSession({
			headers: request.headers,
		});

		if (!session) {
			return NextResponse.json(
				{ error: "Authentication required" },
				{ status: 401 }
			);
		}

		const { notificationIds, markAllAsRead } = await request.json();

		if (markAllAsRead) {
			// Mark all notifications as read for the user
			await prismaClient.notification.updateMany({
				where: {
					userId: session.user.id,
					read_at: null,
				},
				data: {
					read_at: new Date(),
				},
			});
		} else if (notificationIds && Array.isArray(notificationIds)) {
			// Mark specific notifications as read
			await prismaClient.notification.updateMany({
				where: {
					id: {
						in: notificationIds,
					},
					userId: session.user.id,
				},
				data: {
					read_at: new Date(),
				},
			});
		} else {
			return NextResponse.json(
				{ error: "Invalid request body" },
				{ status: 400 }
			);
		}

		return NextResponse.json({
			success: true,
			message: "Notifications marked as read",
		});
	} catch (error) {
		console.error("Error marking notifications as read:", error);

		return NextResponse.json(
			{
				success: false,
				error: "Failed to mark notifications as read",
				details:
					error instanceof Error ? error.message : "Unknown error",
			},
			{ status: 500 }
		);
	}
}
