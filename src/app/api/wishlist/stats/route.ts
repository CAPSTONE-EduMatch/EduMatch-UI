import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-utils";
import { prismaClient } from "../../../../../prisma";
import {
	WishlistStatsResponse,
	WishlistStats,
	WishlistErrorResponse,
} from "@/types/wishlist-api";

// GET /api/wishlist/stats - Get wishlist statistics
export async function GET() {
	try {
		// Check if user is authenticated using the same method as profile API
		const { user } = await requireAuth();

		const userId = user.id;

		// Get all wishlist items for the user
		const wishlistItems = await prismaClient.wishlist.findMany({
			where: { applicant_id: userId },
		});

		// Get posts data for wishlist items
		const postIds = wishlistItems.map((item) => item.post_id);
		const posts = await prismaClient.opportunityPost.findMany({
			where: {
				post_id: { in: postIds },
			},
		});

		// Get related data separately
		const [postPrograms, postScholarships, postJobs] = await Promise.all([
			prismaClient.programPost.findMany({
				where: { post_id: { in: postIds } },
			}),
			prismaClient.scholarshipPost.findMany({
				where: { post_id: { in: postIds } },
			}),
			prismaClient.jobPost.findMany({
				where: { post_id: { in: postIds } },
			}),
		]);

		// Get institution data for posts
		const institutions = await prismaClient.institution.findMany({
			where: {
				institution_id: {
					in: posts.map((p) => p.institution_id).filter(Boolean),
				},
			},
		});

		// Create maps for quick lookups
		const postMap = new Map(posts.map((post) => [post.post_id, post]));
		const postProgramMap = new Map(
			postPrograms.map((pp) => [pp.post_id, pp])
		);
		const postScholarshipMap = new Map(
			postScholarships.map((ps) => [ps.post_id, ps])
		);
		const postJobMap = new Map(postJobs.map((pj) => [pj.post_id, pj]));
		const institutionMap = new Map(
			institutions.map((inst) => [inst.institution_id, inst])
		);

		// Calculate statistics
		const total = wishlistItems.length;
		const active = total; // All items are active in new schema
		const inactive = 0; // No inactive status in new schema

		// Count by type
		let programs = 0;
		let scholarships = 0;
		let jobs = 0;

		// Count by country
		const byCountry: Record<string, number> = {};
		const byDiscipline: Record<string, number> = {};

		wishlistItems.forEach((item) => {
			const post = postMap.get(item.post_id);
			if (!post) return;

			// Count by type
			if (postProgramMap.has(item.post_id)) {
				programs++;
			} else if (postScholarshipMap.has(item.post_id)) {
				scholarships++;
			} else if (postJobMap.has(item.post_id)) {
				jobs++;
			}

			// Count by country
			const institution = institutionMap.get(post.institution_id);
			if (institution?.country) {
				byCountry[institution.country] =
					(byCountry[institution.country] || 0) + 1;
			}

			// Count by discipline
			const program = postProgramMap.get(item.post_id);
			if (program?.duration) {
				byDiscipline[program.duration] =
					(byDiscipline[program.duration] || 0) + 1;
			}
		});

		const stats: WishlistStats = {
			total,
			active,
			inactive,
			byType: {
				programs,
				scholarships,
				jobs,
			},
			byCountry,
			byDiscipline,
		};

		const response: WishlistStatsResponse = {
			success: true,
			data: stats,
		};

		return NextResponse.json(response);
	} catch (error) {
		// eslint-disable-next-line no-console
		console.error("Error fetching wishlist stats:", error);
		const errorResponse: WishlistErrorResponse = {
			success: false,
			error: "Internal server error",
			code: "INTERNAL_ERROR",
		};
		return NextResponse.json(errorResponse, { status: 500 });
	}
}
