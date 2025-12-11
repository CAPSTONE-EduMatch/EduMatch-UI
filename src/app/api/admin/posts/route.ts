import { requireAuth } from "@/utils/auth/auth-utils";
import { PostStatus } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { prismaClient } from "../../../../../prisma/index";

interface PostFilters {
	search?: string;
	status?: "all" | PostStatus;
	type?:
		| "all"
		| "Program"
		| "Scholarship"
		| "Job"
		| ("Program" | "Scholarship" | "Job")[];
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
		// Handle multiple type filters
		const typeParams = searchParams.getAll("type");
		const typeFilter: "all" | ("Program" | "Scholarship" | "Job")[] =
			typeParams.length === 0
				? "all"
				: typeParams.length === 1 && typeParams[0] === "all"
					? "all"
					: (typeParams as ("Program" | "Scholarship" | "Job")[]);

		const filters: PostFilters = {
			search: searchParams.get("search") || undefined,
			status: (searchParams.get("status") as "all" | PostStatus) || "all",
			type: typeFilter,
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

		// Search conditions
		const searchConditions: any[] = [];
		if (filters.search) {
			searchConditions.push(
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
				}
			);
		}

		// Filter by status
		if (filters.status && filters.status !== "all") {
			whereClause.status = filters.status;
		}

		// Filter by post type (support multiple types)
		const typeConditions: any[] = [];
		if (filters.type && filters.type !== "all") {
			const types = Array.isArray(filters.type)
				? filters.type
				: [filters.type];
			types.forEach((type) => {
				if (type === "Program") {
					typeConditions.push({ programPost: { isNot: null } });
				} else if (type === "Scholarship") {
					typeConditions.push({
						scholarshipPost: { isNot: null },
					});
				} else if (type === "Job") {
					typeConditions.push({ jobPost: { isNot: null } });
				}
			});
		}

		// Combine search and type conditions properly
		// If we have both search and type filters, use AND with OR groups
		if (searchConditions.length > 0 && typeConditions.length > 0) {
			whereClause.AND = [
				{ OR: searchConditions },
				{ OR: typeConditions },
			];
		} else if (searchConditions.length > 0) {
			// Only search filter
			whereClause.OR = searchConditions;
		} else if (typeConditions.length > 0) {
			// Only type filter
			whereClause.OR = typeConditions;
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
			deleted:
				statusCounts.find((s) => s.status === "DELETED")?._count
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

		// Get current post to get institution info for notifications
		const currentPost = await prismaClient.opportunityPost.findUnique({
			where: { post_id: postId },
			include: {
				institution: {
					include: {
						user: true,
					},
				},
				programPost: true,
				scholarshipPost: true,
				jobPost: true,
			},
		});

		if (!currentPost) {
			return NextResponse.json(
				{
					success: false,
					message: "Post not found",
				},
				{ status: 404 }
			);
		}

		const currentStatus = currentPost.status;

		// Update the post
		const updatedPost = await prismaClient.opportunityPost.update({
			where: { post_id: postId },
			data: {
				status: status,
				update_at: new Date(),
			},
		});

		// Send notification if status changed and institution user exists
		if (
			status &&
			status !== currentStatus &&
			currentPost.institution?.user
		) {
			try {
				const { NotificationUtils } =
					await import("@/services/messaging/sqs-handlers");

				const institutionUser = currentPost.institution.user;

				// Determine post type
				let postType = "Post";
				if (currentPost.programPost) postType = "Program";
				else if (currentPost.scholarshipPost) postType = "Scholarship";
				else if (currentPost.jobPost) postType = "Research Lab";

				const baseUrl =
					process.env.NEXT_PUBLIC_BETTER_AUTH_URL ||
					"https://dev.d1jaxpbx3axxsh.amplifyapp.com";
				const postUrl = `${baseUrl}/institution/posts/${postId}`;

				await NotificationUtils.sendPostStatusUpdateNotification(
					institutionUser.id,
					institutionUser.email,
					postId,
					currentPost.title,
					postType as "Program" | "Scholarship" | "Research Lab",
					currentPost.institution.name,
					currentStatus,
					status,
					postUrl,
					status === "REJECTED" ? body.rejectionReason : undefined
				);
			} catch (notificationError) {
				// Log error but don't fail the request
				// eslint-disable-next-line no-console
				console.error(
					"Failed to send post status update notification:",
					notificationError
				);
			}
		}

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
