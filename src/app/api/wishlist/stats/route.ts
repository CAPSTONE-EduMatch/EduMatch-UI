import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/app/lib/auth";
import { prismaClient } from "../../../../../prisma";
import {
	WishlistStatsResponse,
	WishlistStats,
	WishlistErrorResponse,
} from "@/types/wishlist-api";

// GET /api/wishlist/stats - Get wishlist statistics
export async function GET(request: NextRequest) {
	try {
		// Check if user is authenticated using the same method as profile API
		const session = await auth.api.getSession({
			headers: request.headers,
		});

		if (!session) {
			const errorResponse: WishlistErrorResponse = {
				success: false,
				error: "Authentication required",
				code: "AUTHENTICATION_REQUIRED",
			};
			return NextResponse.json(errorResponse, { status: 401 });
		}

		const userId = session.user.id;

		// Get all wishlist items for the user
		const wishlistItems = await prismaClient.wishlist.findMany({
			where: { userId },
		});

		// Get posts data for wishlist items
		const postIds = wishlistItems.map((item) => item.postId);
		const posts = await prismaClient.post.findMany({
			where: {
				id: { in: postIds },
			},
		});

		// Get related data separately
		const [postPrograms, postScholarships, postJobs] = await Promise.all([
			prismaClient.postProgram.findMany({
				where: { PostId: { in: postIds } },
			}),
			prismaClient.postScholarship.findMany({
				where: { PostId: { in: postIds } },
			}),
			prismaClient.postJob.findMany({
				where: { PostId: { in: postIds } },
			}),
		]);

		// Get institution data for posts
		const institutions = await prismaClient.institution_profile.findMany({
			where: {
				profile_id: { in: postIds },
			},
		});

		// Create maps for quick lookups
		const postMap = new Map(posts.map((post) => [post.id, post]));
		const postProgramMap = new Map(
			postPrograms.map((pp) => [pp.PostId, pp])
		);
		const postScholarshipMap = new Map(
			postScholarships.map((ps) => [ps.PostId, ps])
		);
		const postJobMap = new Map(postJobs.map((pj) => [pj.PostId, pj]));
		const institutionMap = new Map(
			institutions.map((inst) => [inst.profile_id, inst])
		);

		// Calculate statistics
		const total = wishlistItems.length;
		const active = wishlistItems.filter((item) => item.status === 1).length;
		const inactive = wishlistItems.filter(
			(item) => item.status === 0
		).length;

		// Count by type
		let programs = 0;
		let scholarships = 0;
		let jobs = 0;

		// Count by country
		const byCountry: Record<string, number> = {};
		const byDiscipline: Record<string, number> = {};

		wishlistItems.forEach((item) => {
			const post = postMap.get(item.postId);
			if (!post) return;

			// Count by type
			if (postProgramMap.has(item.postId)) {
				programs++;
			} else if (postScholarshipMap.has(item.postId)) {
				scholarships++;
			} else if (postJobMap.has(item.postId)) {
				jobs++;
			}

			// Count by country
			const institution = institutionMap.get(item.postId);
			if (institution?.country) {
				byCountry[institution.country] =
					(byCountry[institution.country] || 0) + 1;
			}

			// Count by discipline
			const program = postProgramMap.get(item.postId);
			if (program?.degreeLevel) {
				byDiscipline[program.degreeLevel] =
					(byDiscipline[program.degreeLevel] || 0) + 1;
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
