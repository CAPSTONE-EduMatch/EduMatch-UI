import { NextRequest, NextResponse } from "next/server";
import { prismaClient } from "../../../../../prisma";
import { requireAuth } from "@/utils/auth/auth-utils";

export async function GET(request: NextRequest) {
	try {
		const { searchParams } = new URL(request.url);

		// Get user from session
		const { user } = await requireAuth();
		if (!user?.id) {
			return NextResponse.json(
				{ error: "User not authenticated" },
				{ status: 401 }
			);
		}

		// Get institution for the user
		const institution = await prismaClient.institution.findUnique({
			where: { user_id: user.id },
		});

		if (!institution) {
			return NextResponse.json(
				{ error: "Institution not found" },
				{ status: 404 }
			);
		}

		// Parse query parameters
		const search = searchParams.get("search") || "";
		const statusParam = searchParams.get("status") || "all";
		const postType = searchParams.get("type") || "all";
		const sortBy = searchParams.get("sortBy") || "newest";
		const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
		const limit = Math.max(
			1,
			Math.min(50, parseInt(searchParams.get("limit") || "10"))
		);
		const skip = (page - 1) * limit;

		// Build where clause for filtering
		const whereClause: any = {
			institution_id: institution.institution_id,
			// Exclude DELETED posts by default
			status: { not: "DELETED" },
		};

		// Add status filter - handle multiple statuses
		if (statusParam !== "all" && statusParam) {
			// Split by comma to handle multiple statuses
			const statusArray = statusParam
				.split(",")
				.map((s) => s.trim().toUpperCase())
				.filter((s) => s);

			if (statusArray.length === 1) {
				// Single status
				whereClause.status = statusArray[0];
			} else if (statusArray.length > 1) {
				// Multiple statuses - use 'in' operator
				whereClause.status = { in: statusArray };
			}
			// If user explicitly requests DELETED, allow it by removing the default filter
			if (statusArray.includes("DELETED")) {
				delete whereClause.status;
				whereClause.status =
					statusArray.length === 1
						? statusArray[0]
						: { in: statusArray };
			}
		}

		// Add post type filter to where clause if specified - handle multiple types
		if (postType !== "all" && postType) {
			// Split by comma to handle multiple types
			const typeArray = postType
				.split(",")
				.map((t) => t.trim())
				.filter((t) => t);

			if (typeArray.length === 1) {
				// Single type
				const singleType = typeArray[0];
				if (singleType === "Program") {
					whereClause.programPost = { isNot: null };
				} else if (singleType === "Scholarship") {
					whereClause.scholarshipPost = { isNot: null };
				} else if (singleType === "Research Lab") {
					whereClause.jobPost = { isNot: null };
				}
			} else if (typeArray.length > 1) {
				// Multiple types - use OR condition
				const orConditions: any[] = [];
				if (typeArray.includes("Program")) {
					orConditions.push({ programPost: { isNot: null } });
				}
				if (typeArray.includes("Scholarship")) {
					orConditions.push({ scholarshipPost: { isNot: null } });
				}
				if (typeArray.includes("Research Lab")) {
					orConditions.push({ jobPost: { isNot: null } });
				}
				if (orConditions.length > 0) {
					whereClause.OR = orConditions;
				}
			}
		}

		// Query ALL posts first (without pagination) to apply filtering
		// This is necessary because search and type filters depend on transformed data
		const allPosts = await prismaClient.opportunityPost.findMany({
			where: whereClause,
			include: {
				programPost: {
					select: {
						duration: true,
						// degree_level: true,
						attendance: true,
						tuition_fee: true,
					},
				},
				scholarshipPost: {
					select: {
						description: true,
						type: true,
						number: true,
						award_amount: true,
					},
				},
				jobPost: {
					select: {
						contract_type: true,
						attendance: true,
						job_type: true,
						min_salary: true,
						max_salary: true,
					},
				},
				subdisciplines: {
					include: {
						subdiscipline: {
							select: {
								name: true,
							},
						},
					},
				},
			},
			orderBy:
				sortBy === "newest"
					? { create_at: "desc" }
					: sortBy === "oldest"
						? { create_at: "asc" }
						: { create_at: "desc" },
		});

		// Get application counts for each post
		const applicationCounts = await Promise.all(
			allPosts.map(async (post) => {
				const count = await prismaClient.application.count({
					where: { post_id: post.post_id },
				});
				return { post_id: post.post_id, applicationCount: count };
			})
		);

		// Create a map for quick lookup
		const applicationCountMap = new Map(
			applicationCounts.map((item) => [
				item.post_id,
				item.applicationCount,
			])
		);

		// Transform data to match the expected format
		const transformedPosts = allPosts.map((post) => {
			// Determine post type and extract relevant data
			let postType = "Program";
			let postData = null;

			if (post.programPost) {
				postType = "Program";
				postData = post.programPost;
			} else if (post.scholarshipPost) {
				postType = "Scholarship";
				postData = post.scholarshipPost;
			} else if (post.jobPost) {
				postType = "Research Lab";
				postData = post.jobPost;
			}

			// Format dates to dd/mm/yyyy
			const formatDate = (date: Date | null) => {
				if (!date) return "";
				const day = date.getDate().toString().padStart(2, "0");
				const month = (date.getMonth() + 1).toString().padStart(2, "0");
				const year = date.getFullYear();
				return `${day}/${month}/${year}`;
			};

			return {
				id: post.post_id,
				title: post.title,
				status: post.status.toLowerCase(),
				postedDate: formatDate(post.create_at),
				applicationCount: applicationCountMap.get(post.post_id) || 0,
				startDate: formatDate(post.start_date),
				endDate: formatDate(post.end_date),
				location: post.location,
				type: postType,
				data: postData,
				subdisciplines: post.subdisciplines.map(
					(ps) => ps.subdiscipline.name
				),
			};
		});

		// Apply search filter (client-side because it depends on transformed data)
		let filteredPosts = transformedPosts;
		if (search) {
			filteredPosts = transformedPosts.filter(
				(post) =>
					post.title.toLowerCase().includes(search.toLowerCase()) ||
					post.location
						?.toLowerCase()
						.includes(search.toLowerCase()) ||
					post.subdisciplines.some((sub) =>
						sub.toLowerCase().includes(search.toLowerCase())
					)
			);
		}

		// Note: Post type filter is already applied in the database query above

		// Get total count AFTER filtering
		const totalFilteredCount = filteredPosts.length;

		// Apply pagination AFTER filtering
		const startIndex = skip;
		const endIndex = startIndex + limit;
		const paginatedPosts = filteredPosts.slice(startIndex, endIndex);

		// Calculate statistics (based on all posts, not filtered)
		const stats = {
			total: allPosts.length,
			published: transformedPosts.filter(
				(post) => post.status === "published"
			).length,
			draft: transformedPosts.filter((post) => post.status === "draft")
				.length,
			submitted: transformedPosts.filter(
				(post) => post.status === "submitted"
			).length,
			closed: transformedPosts.filter((post) => post.status === "closed")
				.length,
		};

		// Calculate total pages based on filtered count
		const totalPages = Math.ceil(totalFilteredCount / limit);

		return NextResponse.json({
			success: true,
			data: paginatedPosts,
			meta: {
				total: totalFilteredCount,
				page,
				limit,
				totalPages,
			},
			stats,
		});
	} catch (error) {
		// eslint-disable-next-line no-console
		console.error("Error fetching posts:", error);
		return NextResponse.json(
			{
				error: "Failed to fetch posts",
				details:
					error instanceof Error ? error.message : "Unknown error",
			},
			{ status: 500 }
		);
	}
}
