import { requireAuth } from "@/utils/auth/auth-utils";
import { NextRequest, NextResponse } from "next/server";
import { prismaClient } from "../../../../../prisma/index";
import { PostStatus } from "@prisma/client";

interface PostFilters {
	search?: string;
	status?: "all" | PostStatus;
	type?: "all" | "Program" | "Scholarship" | "Job";
	sortBy?: "title" | "create_at" | "start_date";
	sortDirection?: "asc" | "desc";
	page?: number;
	limit?: number;
}

// Get list of posts with advanced filtering, sorting, and pagination
export async function GET(request: NextRequest) {
	try {
		// Authenticate user and check admin permissions
		await requireAuth();

		const { searchParams } = new URL(request.url);

		// Parse query parameters
		const filters: PostFilters = {
			search: searchParams.get("search") || undefined,
			status: (searchParams.get("status") as "all" | PostStatus) || "all",
			type:
				(searchParams.get("type") as
					| "all"
					| "Program"
					| "Scholarship"
					| "Job") || "all",
			sortBy:
				(searchParams.get("sortBy") as
					| "title"
					| "create_at"
					| "start_date") || "create_at",
			sortDirection:
				(searchParams.get("sortDirection") as "asc" | "desc") || "desc",
			page: parseInt(searchParams.get("page") || "1"),
			limit: parseInt(searchParams.get("limit") || "10"),
		};

		// Build where clause for filtering
		const whereClause: any = {};

		// Search across title
		if (filters.search) {
			whereClause.OR = [
				{
					title: {
						contains: filters.search,
						mode: "insensitive",
					},
				},
				{
					institution: {
						name: {
							contains: filters.search,
							mode: "insensitive",
						},
					},
				},
			];
		}

		// Filter by status
		if (filters.status && filters.status !== "all") {
			whereClause.status = filters.status;
		}

		// Filter by post type
		if (filters.type && filters.type !== "all") {
			if (filters.type === "Program") {
				whereClause.programPost = { isNot: null };
			} else if (filters.type === "Scholarship") {
				whereClause.scholarshipPost = { isNot: null };
			} else if (filters.type === "Job") {
				whereClause.jobPost = { isNot: null };
			}
		}

		// Calculate pagination
		const skip = (filters.page! - 1) * filters.limit!;
		const take = filters.limit!;

		// Build order by clause
		const orderBy: any = {};
		orderBy[filters.sortBy!] = filters.sortDirection;

		// Fetch posts with pagination
		const [posts, totalCount] = await Promise.all([
			prismaClient.opportunityPost.findMany({
				where: whereClause,
				skip,
				take,
				orderBy,
				include: {
					institution: {
						select: {
							name: true,
							institution_id: true,
						},
					},
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
			}),
			prismaClient.opportunityPost.count({ where: whereClause }),
		]);

		// Transform posts to include type
		const transformedPosts = posts.map((post) => {
			let type: "Program" | "Scholarship" | "Job" = "Program";

			if (post.programPost) {
				type = "Program";
			} else if (post.scholarshipPost) {
				type = "Scholarship";
			} else if (post.jobPost) {
				type = "Job";
			}

			return {
				id: post.post_id,
				title: post.title,
				status: post.status,
				postedBy: post.institution.name,
				institutionId: post.institution.institution_id,
				postedDate: post.create_at,
				startDate: post.start_date,
				endDate: post.end_date,
				type,
				location: post.location,
				degreeLevel: post.degree_level,
			};
		});

		// Calculate statistics
		const statusCounts = await prismaClient.opportunityPost.groupBy({
			by: ["status"],
			_count: {
				status: true,
			},
		});

		const stats = {
			total: totalCount,
			published:
				statusCounts.find((s) => s.status === "PUBLISHED")?._count
					.status || 0,
			closed:
				statusCounts.find((s) => s.status === "CLOSED")?._count
					.status || 0,
			draft:
				statusCounts.find((s) => s.status === "DRAFT")?._count.status ||
				0,
			archived:
				statusCounts.find((s) => s.status === "ARCHIVED")?._count
					.status || 0,
		};

		// Build pagination metadata
		const totalPages = Math.ceil(totalCount / filters.limit!);
		const pagination = {
			currentPage: filters.page!,
			totalPages,
			totalCount,
			limit: filters.limit!,
			hasNextPage: filters.page! < totalPages,
			hasPrevPage: filters.page! > 1,
		};

		return NextResponse.json({
			success: true,
			posts: transformedPosts,
			stats,
			total: totalCount,
			pagination,
			filters,
		});
	} catch (error) {
		return NextResponse.json(
			{
				success: false,
				message:
					error instanceof Error
						? error.message
						: "Failed to fetch posts",
			},
			{ status: 500 }
		);
	}
}

// Update post status or other actions
export async function PATCH(request: NextRequest) {
	try {
		await requireAuth();

		const body = await request.json();
		const { postId, status } = body;

		if (!postId) {
			return NextResponse.json(
				{
					success: false,
					message: "Post ID is required",
				},
				{ status: 400 }
			);
		}

		// Update the post
		const updatedPost = await prismaClient.opportunityPost.update({
			where: { post_id: postId },
			data: {
				status: status,
				update_at: new Date(),
			},
		});

		return NextResponse.json({
			success: true,
			message: "Post updated successfully",
			post: updatedPost,
		});
	} catch (error) {
		return NextResponse.json(
			{
				success: false,
				message:
					error instanceof Error
						? error.message
						: "Failed to update post",
			},
			{ status: 500 }
		);
	}
}
