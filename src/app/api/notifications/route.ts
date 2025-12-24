import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/utils/auth/auth-utils";
import { prismaClient } from "../../../../prisma";

/**
 * GET /api/notifications - Fetch user notifications
 */
export async function GET(request: NextRequest) {
	try {
		// Check if user is authenticated
		const { user } = await requireAuth();

		if (!user) {
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
			user_id: user.id,
		};

		if (unreadOnly) {
			whereClause.read_at = null;
		}

		// Fetch notifications
		const notifications = await prismaClient.notification.findMany({
			where: whereClause,
			orderBy: {
				send_at: "desc",
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
				user_id: user.id,
				read_at: null,
			},
		});

		// Transform notifications to match frontend interface
		const transformedNotifications = notifications.map((notification) => ({
			id: notification.notification_id,
			userId: notification.user_id,
			type: notification.type,
			title: notification.title,
			bodyText: notification.body,
			url: notification.url || "",
			payload: {}, // Empty payload for now
			createAt: notification.send_at.toISOString(),
			queuedAt:
				notification.queued_at?.toISOString() ||
				notification.send_at.toISOString(),
			read_at: notification.read_at?.toISOString() || null,
			status: "delivered", // Default status
		}));

		return NextResponse.json({
			success: true,
			notifications: transformedNotifications,
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
		const { user } = await requireAuth();

		if (!user) {
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
					user_id: user.id,
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
					notification_id: {
						in: notificationIds,
					},
					user_id: user.id,
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
