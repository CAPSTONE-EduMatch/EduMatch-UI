import { NextRequest, NextResponse } from "next/server";
import { prismaClient } from "../../../../../prisma";
import { NotificationUtils } from "@/services/messaging/sqs-handlers";

/**
 * POST /api/cron/wishlist-deadlines - Check and send wishlist deadline notifications
 * This endpoint should be called by a cron job (e.g., daily at 9 AM)
 *
 * Checks wishlist items that are approaching their deadline (within 7 days)
 * and sends notifications to users who have enabled wishlist deadline notifications
 */
export async function POST(request: NextRequest) {
	try {
		// Optional: Add authentication/authorization for cron endpoint
		// For example, check for a secret token in headers
		// Skip auth check in development mode for testing
		const isDevelopment = process.env.NODE_ENV !== "production";
		const authHeader = request.headers.get("authorization");
		const cronSecret = process.env.CRON_SECRET;

		if (
			!isDevelopment &&
			cronSecret &&
			authHeader !== `Bearer ${cronSecret}`
		) {
			return NextResponse.json(
				{ error: "Unauthorized" },
				{ status: 401 }
			);
		}

		const now = new Date();
		// Check items expiring within the next 7 days
		const sevenDaysFromNow = new Date(
			now.getTime() + 7 * 24 * 60 * 60 * 1000
		);

		// Find all wishlist items where the post end_date is within the next 7 days
		const wishlistItems = await prismaClient.wishlist.findMany({
			where: {
				post: {
					end_date: {
						not: null,
						gte: now, // End date is in the future
						lte: sevenDaysFromNow, // But within 7 days
					},
					status: "PUBLISHED", // Only check published posts
				},
			},
			include: {
				applicant: {
					include: {
						user: true,
					},
				},
				post: {
					include: {
						institution: true,
						programPost: {
							select: {
								post_id: true,
							},
						},
						scholarshipPost: {
							select: {
								post_id: true,
							},
						},
						jobPost: {
							select: {
								post_id: true,
							},
						},
					},
				},
			},
		});

		if (wishlistItems.length === 0) {
			return NextResponse.json({
				success: true,
				message: "No wishlist items approaching deadline",
				notificationsSent: 0,
			});
		}

		let notificationsSent = 0;
		const errors: string[] = [];

		// Process each wishlist item
		for (const item of wishlistItems) {
			try {
				if (!item.post.end_date) continue;

				const endDate = new Date(item.post.end_date);
				const daysRemaining = Math.ceil(
					(endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
				);

				// Only send notification if deadline is within 7 days and more than 0 days
				if (daysRemaining <= 0 || daysRemaining > 7) continue;

				// Check if user has notification settings enabled
				const notificationSettings =
					await prismaClient.notificationSetting.findUnique({
						where: { user_id: item.applicant.user.id },
					});

				// Default to true if settings don't exist (backward compatibility)
				const shouldNotify =
					notificationSettings?.notify_wishlist ?? true;

				if (!shouldNotify) {
					continue; // Skip if user has disabled wishlist notifications
				}

				// Check if we've already sent a notification for this item recently (within last 24 hours)
				// to avoid spamming users
				const recentNotification =
					await prismaClient.notification.findFirst({
						where: {
							user_id: item.applicant.user.id,
							type: "WISHLIST_DEADLINE",
							create_at: {
								gte: new Date(
									now.getTime() - 24 * 60 * 60 * 1000
								), // Last 24 hours
							},
						},
						orderBy: {
							create_at: "desc",
						},
					});

				// If there's a recent notification, check if it's for the same post
				if (
					recentNotification &&
					recentNotification.body?.includes(item.post.post_id)
				) {
					continue; // Skip if we already notified about this post recently
				}

				// Determine post type
				let postType: "programme" | "scholarship" | "research-lab" =
					"programme";
				if (item.post.programPost) {
					postType = "programme";
				} else if (item.post.scholarshipPost) {
					postType = "scholarship";
				} else if (item.post.jobPost) {
					postType = "research-lab";
				}

				// Send notification to SQS (Lambda will process it)
				console.log(
					`📤 Sending wishlist deadline notification for user ${item.applicant.user.id}, post ${item.post.post_id}`
				);
				await NotificationUtils.sendWishlistDeadlineNotification(
					item.applicant.user.id,
					item.applicant.user.email || "",
					item.post.post_id,
					item.post.title,
					endDate.toISOString(),
					daysRemaining,
					item.post.institution?.name,
					postType
				);
				console.log(
					`✅ Successfully sent wishlist deadline notification to SQS for user ${item.applicant.user.id}`
				);

				notificationsSent++;
			} catch (error) {
				const errorMessage = `Error processing wishlist item ${item.post_id}: ${
					error instanceof Error ? error.message : "Unknown error"
				}`;
				errors.push(errorMessage);
				console.error(`❌ ${errorMessage}`, error);
				if (error instanceof Error) {
					console.error(`❌ Error stack:`, error.stack);
				}
			}
		}

		// Note: Emails are now sent directly after queuing to SQS
		// The SQS Lambda will also process messages, but direct sending ensures immediate delivery

		return NextResponse.json({
			success: true,
			message: `Processed ${wishlistItems.length} wishlist items`,
			notificationsSent,
			errors: errors.length > 0 ? errors : undefined,
		});
	} catch (error) {
		console.error("Error in wishlist deadline cron job:", error);

		return NextResponse.json(
			{
				success: false,
				error: "Failed to process wishlist deadlines",
				details:
					error instanceof Error ? error.message : "Unknown error",
			},
			{ status: 500 }
		);
	}
}

// Also support GET for manual testing
export async function GET(request: NextRequest) {
	return POST(request);
}
