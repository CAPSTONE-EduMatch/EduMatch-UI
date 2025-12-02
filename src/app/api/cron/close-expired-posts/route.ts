import { NextRequest, NextResponse } from "next/server";
import { prismaClient } from "../../../../../prisma";

/**
 * POST /api/cron/close-expired-posts - Close expired posts (programs, scholarships, research labs)
 * This endpoint should be called by a cron job (e.g., daily at midnight UTC)
 *
 * Finds all posts where end_date has passed and status is not already CLOSED or DELETED,
 * then updates their status to CLOSED.
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

		// Get current UTC date (start of day for comparison)
		const now = new Date();
		const todayUTC = new Date(
			Date.UTC(
				now.getUTCFullYear(),
				now.getUTCMonth(),
				now.getUTCDate(),
				0,
				0,
				0,
				0
			)
		);

		console.log(
			`🔍 Checking for expired posts as of ${todayUTC.toISOString()}`
		);

		// Find all posts where:
		// 1. end_date is not null
		// 2. end_date is less than today (expired)
		// 3. status is not CLOSED or DELETED
		const expiredPosts = await prismaClient.opportunityPost.findMany({
			where: {
				end_date: {
					not: null,
					lt: todayUTC, // Less than today (expired)
				},
				status: {
					notIn: ["CLOSED", "DELETED"], // Not already closed or deleted
				},
			},
			select: {
				post_id: true,
				title: true,
				end_date: true,
				status: true,
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
		});

		if (expiredPosts.length === 0) {
			console.log("✅ No expired posts found");
			return NextResponse.json({
				success: true,
				message: "No expired posts found",
				postsClosed: 0,
				checkedAt: todayUTC.toISOString(),
			});
		}

		console.log(`📋 Found ${expiredPosts.length} expired post(s) to close`);

		// Update all expired posts to CLOSED status
		const updateResult = await prismaClient.opportunityPost.updateMany({
			where: {
				post_id: {
					in: expiredPosts.map((post) => post.post_id),
				},
			},
			data: {
				status: "CLOSED",
				update_at: new Date(),
			},
		});

		// Categorize posts by type for reporting
		const postsByType = {
			programs: expiredPosts.filter((p) => p.programPost).length,
			scholarships: expiredPosts.filter((p) => p.scholarshipPost).length,
			researchLabs: expiredPosts.filter((p) => p.jobPost).length,
		};

		console.log(
			`✅ Successfully closed ${updateResult.count} expired post(s)`
		);
		console.log(`   - Programs: ${postsByType.programs}`);
		console.log(`   - Scholarships: ${postsByType.scholarships}`);
		console.log(`   - Research Labs: ${postsByType.researchLabs}`);

		return NextResponse.json({
			success: true,
			message: `Closed ${updateResult.count} expired post(s)`,
			postsClosed: updateResult.count,
			postsByType,
			checkedAt: todayUTC.toISOString(),
			details: expiredPosts.map((post) => ({
				post_id: post.post_id,
				title: post.title,
				end_date: post.end_date?.toISOString(),
				previous_status: post.status,
				type: post.programPost
					? "program"
					: post.scholarshipPost
						? "scholarship"
						: post.jobPost
							? "research-lab"
							: "unknown",
			})),
		});
	} catch (error) {
		console.error("❌ Error in close-expired-posts cron job:", error);

		return NextResponse.json(
			{
				success: false,
				error: "Failed to close expired posts",
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
