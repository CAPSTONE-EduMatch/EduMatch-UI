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
			userId: userId,
		};

		if (queryParams.status !== undefined) {
			whereClause.status = queryParams.status;
		}

		// Note: We'll filter by post data after fetching wishlist items
		// since the Wishlist model doesn't have a direct relation to Post

		// Build orderBy clause - only use fields available in Wishlist model
		let orderBy: any = { createdAt: "desc" }; // default
		switch (queryParams.sortBy) {
			case "oldest":
				orderBy = { createdAt: "asc" };
				break;
			case "newest":
			default:
				orderBy = { createdAt: "desc" };
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

		// Create maps for quick lookups
		const postProgramMap = new Map(
			postPrograms.map((pp) => [pp.PostId, pp])
		);
		const postScholarshipMap = new Map(
			postScholarships.map((ps) => [ps.PostId, ps])
		);
		const postJobMap = new Map(postJobs.map((pj) => [pj.PostId, pj]));

		// Get institution data for posts
		const institutions = await prismaClient.institution_profile.findMany({
			where: {
				profile_id: { in: postIds },
			},
		});

		// Create maps for quick lookups
		const postMap = new Map(posts.map((post) => [post.id, post]));
		const institutionMap = new Map(
			institutions.map((inst) => [inst.profile_id, inst])
		);

		// Transform data to include post and institution information
		const transformedItems = wishlistItems
			.map((item) => {
				const post = postMap.get(item.postId);
				const institution = institutionMap.get(item.postId);

				if (!post) {
					// Skip items where post doesn't exist
					return null;
				}

				return {
					id: `${item.postId}-${item.userId}`,
					postId: item.postId,
					userId: item.userId,
					createdAt: item.createdAt.toISOString(),
					status: item.status as 0 | 1,
					post: {
						id: post.id,
						title: post.title,
						content: post.content,
						published: post.published,
						createdAt: post.createdAt.toISOString(),
						updatedAt: post.updatedAt.toISOString(),
						authorId: post.authorId,
						program: postProgramMap.get(post.id) || undefined,
						scholarship:
							postScholarshipMap.get(post.id) || undefined,
						job: postJobMap.get(post.id) || undefined,
						institution: institution
							? {
									...institution,
									rep_appellation: institution.rep_appellation
										.toISOString()
										.split("T")[0], // Convert Date to string
								}
							: undefined,
					},
				};
			})
			.filter((item) => item !== null) as WishlistItem[];

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
		const post = await prismaClient.post.findUnique({
			where: { id: body.postId },
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
		const existingItem = await prismaClient.wishlist.findUnique({
			where: {
				postId_userId: {
					postId: body.postId,
					userId: userId,
				},
			},
		});

		if (existingItem) {
			// Update existing item
			const updatedItem = await prismaClient.wishlist.update({
				where: {
					postId_userId: {
						postId: body.postId,
						userId: userId,
					},
				},
				data: {
					status: body.status ?? 1, // Default to active
					createdAt: new Date(), // Update timestamp
				},
			});

			// Get post data
			const post = await prismaClient.post.findUnique({
				where: { id: body.postId },
			});

			// Get related data separately
			const [postProgram, postScholarship, postJob] = await Promise.all([
				prismaClient.postProgram.findUnique({
					where: { PostId: body.postId },
				}),
				prismaClient.postScholarship.findUnique({
					where: { PostId: body.postId },
				}),
				prismaClient.postJob.findUnique({
					where: { PostId: body.postId },
				}),
			]);

			// Get institution data
			const institution =
				await prismaClient.institution_profile.findUnique({
					where: { profile_id: body.postId },
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
					id: `${updatedItem.postId}-${updatedItem.userId}`,
					postId: updatedItem.postId,
					userId: updatedItem.userId,
					createdAt: updatedItem.createdAt.toISOString(),
					status: updatedItem.status as 0 | 1,
					post: {
						id: post.id,
						title: post.title,
						content: post.content,
						published: post.published,
						createdAt: post.createdAt.toISOString(),
						updatedAt: post.updatedAt.toISOString(),
						authorId: post.authorId,
						program: postProgram || undefined,
						scholarship: postScholarship || undefined,
						job: postJob
							? {
									...postJob,
									min_salary: Number(postJob.min_salary),
									max_salary: Number(postJob.max_salary),
								}
							: undefined,
						institution: institution
							? {
									...institution,
									rep_appellation: institution.rep_appellation
										.toISOString()
										.split("T")[0],
								}
							: undefined,
					},
				},
			};

			return NextResponse.json(response);
		} else {
			// Create new wishlist item
			const newItem = await prismaClient.wishlist.create({
				data: {
					postId: body.postId,
					userId: userId,
					status: body.status ?? 1, // Default to active
				},
			});

			// Get post data
			const post = await prismaClient.post.findUnique({
				where: { id: body.postId },
			});

			// Get related data separately
			const [postProgram, postScholarship, postJob] = await Promise.all([
				prismaClient.postProgram.findUnique({
					where: { PostId: body.postId },
				}),
				prismaClient.postScholarship.findUnique({
					where: { PostId: body.postId },
				}),
				prismaClient.postJob.findUnique({
					where: { PostId: body.postId },
				}),
			]);

			// Get institution data
			const institution =
				await prismaClient.institution_profile.findUnique({
					where: { profile_id: body.postId },
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
					id: `${newItem.postId}-${newItem.userId}`,
					postId: newItem.postId,
					userId: newItem.userId,
					createdAt: newItem.createdAt.toISOString(),
					status: newItem.status as 0 | 1,
					post: {
						id: post.id,
						title: post.title,
						content: post.content,
						published: post.published,
						createdAt: post.createdAt.toISOString(),
						updatedAt: post.updatedAt.toISOString(),
						authorId: post.authorId,
						program: postProgram || undefined,
						scholarship: postScholarship || undefined,
						job: postJob
							? {
									...postJob,
									min_salary: Number(postJob.min_salary),
									max_salary: Number(postJob.max_salary),
								}
							: undefined,
						institution: institution
							? {
									...institution,
									rep_appellation: institution.rep_appellation
										.toISOString()
										.split("T")[0],
								}
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
