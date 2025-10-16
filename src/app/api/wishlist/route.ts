import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/app/lib/auth";
import { prismaClient } from "../../../../prisma";
import {
	WishlistResponse,
	WishlistItemResponse,
	WishlistCreateRequest,
	WishlistQueryParams,
	WishlistItem,
	WishlistErrorResponse,
} from "@/types/wishlist-api";

// GET /api/wishlist - Get user's wishlist items
export async function GET(request: NextRequest) {
	try {
		const { searchParams } = new URL(request.url);

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

		// Parse query parameters
		const queryParams: WishlistQueryParams = {
			page: Math.max(1, parseInt(searchParams.get("page") || "1")),
			limit: Math.max(
				1,
				Math.min(50, parseInt(searchParams.get("limit") || "10"))
			),
			status: searchParams.get("status")
				? (parseInt(searchParams.get("status")!) as 0 | 1)
				: undefined,
			search: searchParams.get("search") || undefined,
			sortBy: (searchParams.get("sortBy") as any) || "newest",
			postType: searchParams.get("postType") as any,
			country: searchParams.get("country") || undefined,
			discipline: searchParams.get("discipline") || undefined,
		};

		// Build where clause
		const whereClause: any = {
			applicant_id: userId,
		};

		// Note: We'll filter by post data after fetching wishlist items
		// since the Wishlist model doesn't have a direct relation to Post

		// Build orderBy clause - only use fields available in Wishlist model
		let orderBy: any = { add_at: "desc" }; // default
		switch (queryParams.sortBy) {
			case "oldest":
				orderBy = { add_at: "asc" };
				break;
			case "newest":
			default:
				orderBy = { add_at: "desc" };
				break;
		}

		// Note: We'll calculate total count after filtering since we filter post data

		// Get wishlist items with pagination
		const wishlistItems = await prismaClient.wishlist.findMany({
			where: whereClause,
			orderBy,
			skip: (queryParams.page! - 1) * queryParams.limit!,
			take: queryParams.limit!,
		});

		// Get posts data for wishlist items
		const postIds = wishlistItems.map((item: any) => item.post_id);
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

		// Create maps for quick lookups
		const postProgramMap = new Map(
			postPrograms.map((pp: any) => [pp.post_id, pp])
		);
		const postScholarshipMap = new Map(
			postScholarships.map((ps: any) => [ps.post_id, ps])
		);
		const postJobMap = new Map(postJobs.map((pj: any) => [pj.post_id, pj]));

		// Get institution data for posts
		const institutions = await prismaClient.institution.findMany({
			where: {
				institution_id: { in: postIds },
			},
		});

		// Create maps for quick lookups
		const postMap = new Map(posts.map((post: any) => [post.post_id, post]));
		const institutionMap = new Map(
			institutions.map((inst: any) => [inst.institution_id, inst])
		);

		// Transform data to include post and institution information
		const transformedItems = wishlistItems
			.map((item: any) => {
				const post = postMap.get(item.post_id);
				const institution = institutionMap.get(item.post_id);

				if (!post) {
					// Skip items where post doesn't exist
					return null;
				}

				return {
					id: `${item.post_id}-${item.applicant_id}`,
					postId: item.post_id,
					userId: item.applicant_id,
					createdAt: item.add_at.toISOString(),
					status: 1 as 0 | 1, // Default to active status
					post: {
						id: (post as any).post_id,
						title: (post as any).title,
						content: (post as any).other_info,
						published: (post as any).status === "PUBLISHED",
						createdAt: (post as any).create_at.toISOString(),
						updatedAt:
							(post as any).update_at?.toISOString() ||
							(post as any).create_at.toISOString(),
						authorId: (post as any).institution_id,
						program:
							(postProgramMap.get(
								(post as any).post_id
							) as any) || undefined,
						scholarship:
							(postScholarshipMap.get(
								(post as any).post_id
							) as any) || undefined,
						job:
							(postJobMap.get((post as any).post_id) as any) ||
							undefined,
						institution: institution
							? {
									...(institution as any),
									rep_appellation:
										(institution as any).rep_appellation
											?.toISOString()
											?.split("T")[0] || "", // Convert Date to string
								}
							: undefined,
					},
				};
			})
			.filter((item: any) => item !== null) as WishlistItem[];

		// Apply additional filters that require post data
		let filteredItems = transformedItems;

		// Apply search filter
		if (queryParams.search) {
			filteredItems = filteredItems.filter((item) => {
				const searchTerm = queryParams.search!.toLowerCase();
				return (
					item?.post.title.toLowerCase().includes(searchTerm) ||
					(item?.post.content &&
						item.post.content.toLowerCase().includes(searchTerm))
				);
			});
		}

		// Apply post type filter
		if (queryParams.postType) {
			filteredItems = filteredItems.filter((item) => {
				if (queryParams.postType === "program") {
					return !!item?.post.program;
				} else if (queryParams.postType === "scholarship") {
					return !!item?.post.scholarship;
				} else if (queryParams.postType === "job") {
					return !!item?.post.job;
				}
				return true;
			});
		}

		if (queryParams.country) {
			filteredItems = filteredItems.filter(
				(item) =>
					item?.post.institution?.country === queryParams.country
			);
		}

		if (queryParams.discipline) {
			filteredItems = filteredItems.filter((item) => {
				if (item?.post.program?.degreeLevel) {
					return item.post.program.degreeLevel
						.toLowerCase()
						.includes(queryParams.discipline!.toLowerCase());
				}
				return false;
			});
		}

		// Update total count based on filtered results
		const filteredTotal = filteredItems.length;
		const totalPages = Math.ceil(filteredTotal / queryParams.limit!);

		const response: WishlistResponse = {
			success: true,
			data: filteredItems,
			meta: {
				total: filteredTotal,
				page: queryParams.page!,
				limit: queryParams.limit!,
				totalPages,
			},
		};

		return NextResponse.json(response);
	} catch (error) {
		// eslint-disable-next-line no-console
		console.error("Error fetching wishlist:", error);
		const errorResponse: WishlistErrorResponse = {
			success: false,
			error: "Internal server error",
			code: "INTERNAL_ERROR",
		};
		return NextResponse.json(errorResponse, { status: 500 });
	}
}

// POST /api/wishlist - Add item to wishlist
export async function POST(request: NextRequest) {
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

		const body: WishlistCreateRequest = await request.json();

		if (!body.postId) {
			const errorResponse: WishlistErrorResponse = {
				success: false,
				error: "Post ID is required",
				code: "MISSING_POST_ID",
			};
			return NextResponse.json(errorResponse, { status: 400 });
		}

		// Check if post exists
		const post = await prismaClient.opportunityPost.findUnique({
			where: { post_id: body.postId },
		});

		if (!post) {
			const errorResponse: WishlistErrorResponse = {
				success: false,
				error: "Post not found",
				code: "POST_NOT_FOUND",
			};
			return NextResponse.json(errorResponse, { status: 404 });
		}

		// Check if item already exists in wishlist
		const existingItem = await prismaClient.wishlist.findFirst({
			where: {
				post_id: body.postId,
				applicant_id: userId,
			},
		});

		if (existingItem) {
			// Update existing item
			const updatedItem = await prismaClient.wishlist.update({
				where: {
					applicant_id_post_id: {
						applicant_id: userId,
						post_id: body.postId,
					},
				},
				data: {
					add_at: new Date(), // Update timestamp
				},
			});

			// Get post data
			const post = await prismaClient.opportunityPost.findUnique({
				where: { post_id: body.postId },
			});

			// Get related data separately
			const [postProgram, postScholarship, postJob] = await Promise.all([
				prismaClient.programPost.findFirst({
					where: { post_id: body.postId },
				}),
				prismaClient.scholarshipPost.findFirst({
					where: { post_id: body.postId },
				}),
				prismaClient.jobPost.findFirst({
					where: { post_id: body.postId },
				}),
			]);

			// Get institution data
			const institution = await prismaClient.institution.findFirst({
				where: { institution_id: post?.institution_id },
			});

			if (!post) {
				const errorResponse: WishlistErrorResponse = {
					success: false,
					error: "Post not found",
					code: "POST_NOT_FOUND",
				};
				return NextResponse.json(errorResponse, { status: 404 });
			}

			const response: WishlistItemResponse = {
				success: true,
				data: {
					id: `${updatedItem.post_id}-${updatedItem.applicant_id}`,
					postId: updatedItem.post_id,
					userId: updatedItem.applicant_id,
					createdAt: updatedItem.add_at.toISOString(),
					status: 1 as 0 | 1,
					post: {
						id: post.post_id,
						title: post.title,
						content: post.other_info,
						published: post.status === "PUBLISHED",
						createdAt: post.create_at.toISOString(),
						updatedAt:
							post.update_at?.toISOString() ||
							post.create_at.toISOString(),
						authorId: post.institution_id,
						program: (postProgram as any) || undefined,
						scholarship: (postScholarship as any) || undefined,
						job: (postJob as any) || undefined,
						institution: institution
							? (institution as any)
							: undefined,
					},
				},
			};

			return NextResponse.json(response);
		} else {
			// Create new wishlist item
			const newItem = await prismaClient.wishlist.create({
				data: {
					post_id: body.postId,
					applicant_id: userId,
					add_at: new Date(),
				},
			});

			// Get post data
			const post = await prismaClient.opportunityPost.findUnique({
				where: { post_id: body.postId },
			});

			// Get related data separately
			const [postProgram, postScholarship, postJob] = await Promise.all([
				prismaClient.programPost.findFirst({
					where: { post_id: body.postId },
				}),
				prismaClient.scholarshipPost.findFirst({
					where: { post_id: body.postId },
				}),
				prismaClient.jobPost.findFirst({
					where: { post_id: body.postId },
				}),
			]);

			// Get institution data
			const institution = await prismaClient.institution.findFirst({
				where: { institution_id: post?.institution_id },
			});

			if (!post) {
				const errorResponse: WishlistErrorResponse = {
					success: false,
					error: "Post not found",
					code: "POST_NOT_FOUND",
				};
				return NextResponse.json(errorResponse, { status: 404 });
			}

			const response: WishlistItemResponse = {
				success: true,
				data: {
					id: `${newItem.post_id}-${newItem.applicant_id}`,
					postId: newItem.post_id,
					userId: newItem.applicant_id,
					createdAt: newItem.add_at.toISOString(),
					status: 1 as 0 | 1,
					post: {
						id: post.post_id,
						title: post.title,
						content: post.other_info,
						published: post.status === "PUBLISHED",
						createdAt: post.create_at.toISOString(),
						updatedAt:
							post.update_at?.toISOString() ||
							post.create_at.toISOString(),
						authorId: post.institution_id,
						program: (postProgram as any) || undefined,
						scholarship: (postScholarship as any) || undefined,
						job: (postJob as any) || undefined,
						institution: institution
							? (institution as any)
							: undefined,
					},
				},
			};

			return NextResponse.json(response, { status: 201 });
		}
	} catch (error) {
		// eslint-disable-next-line no-console
		console.error("Error adding to wishlist:", error);
		const errorResponse: WishlistErrorResponse = {
			success: false,
			error: "Internal server error",
			code: "INTERNAL_ERROR",
		};
		return NextResponse.json(errorResponse, { status: 500 });
	}
}
