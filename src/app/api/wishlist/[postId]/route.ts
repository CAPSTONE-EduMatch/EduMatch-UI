import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/app/lib/auth";
import { prismaClient } from "../../../../../prisma";
import {
	WishlistItemResponse,
	WishlistUpdateRequest,
	WishlistErrorResponse,
} from "@/types/wishlist-api";

// GET /api/wishlist/[postId] - Get specific wishlist item
export async function GET(
	request: NextRequest,
	{ params }: { params: { postId: string } }
) {
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

		const { postId } = params;

		const wishlistItem = await prismaClient.wishlist.findUnique({
			where: {
				postId_userId: {
					postId: postId,
					userId: userId,
				},
			},
		});

		if (!wishlistItem) {
			const errorResponse: WishlistErrorResponse = {
				success: false,
				error: "Wishlist item not found",
				code: "WISHLIST_ITEM_NOT_FOUND",
			};
			return NextResponse.json(errorResponse, { status: 404 });
		}

		// Get post data
		const post = await prismaClient.post.findUnique({
			where: { id: postId },
		});

		// Get related data separately
		const [postProgram, postScholarship, postJob] = await Promise.all([
			prismaClient.postProgram.findUnique({ where: { PostId: postId } }),
			prismaClient.postScholarship.findUnique({
				where: { PostId: postId },
			}),
			prismaClient.postJob.findUnique({ where: { PostId: postId } }),
		]);

		if (!post) {
			const errorResponse: WishlistErrorResponse = {
				success: false,
				error: "Post not found",
				code: "POST_NOT_FOUND",
			};
			return NextResponse.json(errorResponse, { status: 404 });
		}

		// Get institution data
		const institution = await prismaClient.institution_profile.findUnique({
			where: { profile_id: postId },
		});

		const response: WishlistItemResponse = {
			success: true,
			data: {
				id: `${wishlistItem.postId}-${wishlistItem.userId}`,
				postId: wishlistItem.postId,
				userId: wishlistItem.userId,
				createdAt: wishlistItem.createdAt.toISOString(),
				status: wishlistItem.status as 0 | 1,
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
	} catch (error) {
		// eslint-disable-next-line no-console
		console.error("Error fetching wishlist item:", error);
		const errorResponse: WishlistErrorResponse = {
			success: false,
			error: "Internal server error",
			code: "INTERNAL_ERROR",
		};
		return NextResponse.json(errorResponse, { status: 500 });
	}
}

// PUT /api/wishlist/[postId] - Update wishlist item status
export async function PUT(
	request: NextRequest,
	{ params }: { params: { postId: string } }
) {
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

		const { postId } = params;
		const body: WishlistUpdateRequest = await request.json();

		// Check if wishlist item exists
		const existingItem = await prismaClient.wishlist.findUnique({
			where: {
				postId_userId: {
					postId: postId,
					userId: userId,
				},
			},
		});

		if (!existingItem) {
			const errorResponse: WishlistErrorResponse = {
				success: false,
				error: "Wishlist item not found",
				code: "WISHLIST_ITEM_NOT_FOUND",
			};
			return NextResponse.json(errorResponse, { status: 404 });
		}

		// Update the wishlist item
		const updatedItem = await prismaClient.wishlist.update({
			where: {
				postId_userId: {
					postId: postId,
					userId: userId,
				},
			},
			data: {
				status: body.status,
				createdAt: new Date(), // Update timestamp
			},
		});

		// Get post data for response
		const post = await prismaClient.post.findUnique({
			where: { id: postId },
		});

		// Get related data separately
		const [postProgram, postScholarship, postJob] = await Promise.all([
			prismaClient.postProgram.findUnique({ where: { PostId: postId } }),
			prismaClient.postScholarship.findUnique({
				where: { PostId: postId },
			}),
			prismaClient.postJob.findUnique({ where: { PostId: postId } }),
		]);

		if (!post) {
			const errorResponse: WishlistErrorResponse = {
				success: false,
				error: "Post not found",
				code: "POST_NOT_FOUND",
			};
			return NextResponse.json(errorResponse, { status: 404 });
		}

		// Get institution data
		const institution = await prismaClient.institution_profile.findUnique({
			where: { profile_id: postId },
		});

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
	} catch (error) {
		// eslint-disable-next-line no-console
		console.error("Error updating wishlist item:", error);
		const errorResponse: WishlistErrorResponse = {
			success: false,
			error: "Internal server error",
			code: "INTERNAL_ERROR",
		};
		return NextResponse.json(errorResponse, { status: 500 });
	}
}

// DELETE /api/wishlist/[postId] - Remove item from wishlist
export async function DELETE(
	request: NextRequest,
	{ params }: { params: { postId: string } }
) {
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

		const { postId } = params;

		// Check if wishlist item exists
		const existingItem = await prismaClient.wishlist.findUnique({
			where: {
				postId_userId: {
					postId: postId,
					userId: userId,
				},
			},
		});

		if (!existingItem) {
			const errorResponse: WishlistErrorResponse = {
				success: false,
				error: "Wishlist item not found",
				code: "WISHLIST_ITEM_NOT_FOUND",
			};
			return NextResponse.json(errorResponse, { status: 404 });
		}

		// Delete the wishlist item
		await prismaClient.wishlist.delete({
			where: {
				postId_userId: {
					postId: postId,
					userId: userId,
				},
			},
		});

		return NextResponse.json({
			success: true,
			message: "Wishlist item removed successfully",
		});
	} catch (error) {
		// eslint-disable-next-line no-console
		console.error("Error deleting wishlist item:", error);
		const errorResponse: WishlistErrorResponse = {
			success: false,
			error: "Internal server error",
			code: "INTERNAL_ERROR",
		};
		return NextResponse.json(errorResponse, { status: 500 });
	}
}
