import { NextRequest, NextResponse } from "next/server";
import { prismaClient } from "../../../../../prisma";
import { auth } from "@/app/lib/auth";

export async function GET(request: NextRequest) {
	try {
		const { searchParams } = new URL(request.url);

		// Get user from session
		const session = await auth.api.getSession({
			headers: request.headers,
		});
		if (!session?.user?.id) {
			return NextResponse.json(
				{ error: "User not authenticated" },
				{ status: 401 }
			);
		}

		// Get institution for the user
		const institution = await prismaClient.institution.findUnique({
			where: { user_id: session.user.id },
		});

		if (!institution) {
			return NextResponse.json(
				{ error: "Institution not found" },
				{ status: 404 }
			);
		}

		// Parse query parameters
		const search = searchParams.get("search") || "";
		const status = searchParams.get("status") || "all";
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
		};

		// Add status filter
		if (status !== "all") {
			whereClause.status = status.toUpperCase();
		}

		// Get total count for pagination
		const totalCount = await prismaClient.opportunityPost.count({
			where: whereClause,
		});

		// Query posts with related data
		const posts = await prismaClient.opportunityPost.findMany({
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
			skip,
			take: limit,
		});

		// Get application counts for each post
		const applicationCounts = await Promise.all(
			posts.map(async (post) => {
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
		const transformedPosts = posts.map((post) => {
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

		// Apply search filter
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

		// Apply post type filter
		if (postType !== "all") {
			// Map frontend filter values to API values
			const typeMapping: { [key: string]: string } = {
				Program: "Program",
				Scholarship: "Scholarship",
				"Research Lab": "Research Lab",
			};

			const mappedType = typeMapping[postType] || postType;
			filteredPosts = filteredPosts.filter(
				(post) => post.type === mappedType
			);
		}

		// Calculate statistics
		const stats = {
			total: totalCount,
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

		const totalPages = Math.ceil(filteredPosts.length / limit);

		return NextResponse.json({
			success: true,
			data: filteredPosts,
			meta: {
				total: totalCount,
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
