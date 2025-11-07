import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/utils/auth/auth-utils";
import { prismaClient } from "../../../../prisma";

/**
 * GET /api/notification-settings - Fetch user notification settings
 * Auto-creates default settings if they don't exist
 */
export async function GET() {
	try {
		// Check if user is authenticated
		const { user } = await requireAuth();

		if (!user) {
			return NextResponse.json(
				{ error: "Authentication required" },
				{ status: 401 }
			);
		}

		// Try to find existing settings
		let settings = await prismaClient.notificationSetting.findUnique({
			where: { user_id: user.id },
		});

		// If settings don't exist, create default settings
		if (!settings) {
			settings = await prismaClient.notificationSetting.create({
				data: {
					user_id: user.id,
					notify_application: true, // Default: enabled
					notify_wishlist: true, // Default: enabled
					notify_subscription: true, // Default: enabled
					update_at: new Date(),
				},
			});
		}

		// Transform to match frontend interface
		return NextResponse.json({
			success: true,
			settings: {
				applicationStatus: settings.notify_application,
				wishlistDeadline: settings.notify_wishlist ?? true,
				payment: settings.notify_subscription,
			},
		});
	} catch (error) {
		console.error("Error fetching notification settings:", error);

		return NextResponse.json(
			{
				success: false,
				error: "Failed to fetch notification settings",
				details:
					error instanceof Error ? error.message : "Unknown error",
			},
			{ status: 500 }
		);
	}
}

/**
 * PUT /api/notification-settings - Update user notification settings
 * Auto-creates settings if they don't exist
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

		const body = await request.json();
		const { applicationStatus, wishlistDeadline, payment } = body;

		// Validate input
		if (
			typeof applicationStatus !== "boolean" ||
			typeof wishlistDeadline !== "boolean" ||
			typeof payment !== "boolean"
		) {
			return NextResponse.json(
				{
					error: "Invalid input: all fields must be boolean values",
				},
				{ status: 400 }
			);
		}

		// Upsert settings (create if doesn't exist, update if exists)
		const settings = await prismaClient.notificationSetting.upsert({
			where: { user_id: user.id },
			update: {
				notify_application: applicationStatus,
				notify_wishlist: wishlistDeadline,
				notify_subscription: payment,
				update_at: new Date(),
			},
			create: {
				user_id: user.id,
				notify_application: applicationStatus,
				notify_wishlist: wishlistDeadline,
				notify_subscription: payment,
				update_at: new Date(),
			},
		});

		return NextResponse.json({
			success: true,
			message: "Notification settings updated successfully",
			settings: {
				applicationStatus: settings.notify_application,
				wishlistDeadline: settings.notify_wishlist ?? true,
				payment: settings.notify_subscription,
			},
		});
	} catch (error) {
		console.error("Error updating notification settings:", error);

		return NextResponse.json(
			{
				success: false,
				error: "Failed to update notification settings",
				details:
					error instanceof Error ? error.message : "Unknown error",
			},
			{ status: 500 }
		);
	}
}
