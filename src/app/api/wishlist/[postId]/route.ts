import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-utils";
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
		const { user } = await requireAuth();
		if (!user?.id) {
			return Response.json(
				{ error: "User not authenticated" },
				{ status: 401 }
			);
		}

		const userId = user.id;

		// Check if user has an applicant profile
		const applicant = await prismaClient.applicant.findUnique({
			where: { user_id: userId },
		});

		if (!applicant) {
			const errorResponse: WishlistErrorResponse = {
				success: false,
				error: "Applicant profile not found. Please complete your profile first.",
				code: "APPLICANT_NOT_FOUND",
			};
			return NextResponse.json(errorResponse, { status: 404 });
		}

		const { postId } = params;

		const wishlistItem = await prismaClient.wishlist.findFirst({
			where: {
				post_id: postId,
				applicant_id: applicant.applicant_id,
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
		const post = await prismaClient.opportunityPost.findUnique({
			where: { post_id: postId },
		});

		// Get related data separately
		const [postProgram, postScholarship, postJob] = await Promise.all([
			prismaClient.programPost.findFirst({ where: { post_id: postId } }),
			prismaClient.scholarshipPost.findFirst({
				where: { post_id: postId },
			}),
			prismaClient.jobPost.findFirst({ where: { post_id: postId } }),
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
		const institution = await prismaClient.institution.findFirst({
			where: { institution_id: post.institution_id },
		});

		const response: WishlistItemResponse = {
			success: true,
			data: {
				id: `${wishlistItem.post_id}-${wishlistItem.applicant_id}`,
				postId: wishlistItem.post_id,
				userId: wishlistItem.applicant_id,
				createdAt: wishlistItem.add_at.toISOString(),
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
					institution: (institution as any) || undefined,
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
		const { user } = await requireAuth();

		const userId = user.id;

		// Check if user has an applicant profile
		const applicant = await prismaClient.applicant.findUnique({
			where: { user_id: userId },
		});

		if (!applicant) {
			const errorResponse: WishlistErrorResponse = {
				success: false,
				error: "Applicant profile not found. Please complete your profile first.",
				code: "APPLICANT_NOT_FOUND",
			};
			return NextResponse.json(errorResponse, { status: 404 });
		}

		const { postId } = params;
		const body: WishlistUpdateRequest = await request.json();

		// Check if wishlist item exists
		const existingItem = await prismaClient.wishlist.findUnique({
			where: {
				applicant_id_post_id: {
					applicant_id: applicant.applicant_id,
					post_id: postId,
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

		// Update the wishlist item (only timestamp since status field doesn't exist in new schema)
		const updatedItem = await prismaClient.wishlist.update({
			where: {
				applicant_id_post_id: {
					applicant_id: applicant.applicant_id,
					post_id: postId,
				},
			},
			data: {
				add_at: new Date(), // Update timestamp
			},
		});

		// Get post data for response
		const post = await prismaClient.opportunityPost.findUnique({
			where: { post_id: postId },
		});

		// Get related data separately
		const [postProgram, postScholarship, postJob] = await Promise.all([
			prismaClient.programPost.findFirst({ where: { post_id: postId } }),
			prismaClient.scholarshipPost.findFirst({
				where: { post_id: postId },
			}),
			prismaClient.jobPost.findFirst({ where: { post_id: postId } }),
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
		const institution = await prismaClient.institution.findFirst({
			where: { institution_id: post.institution_id },
		});

		const response: WishlistItemResponse = {
			success: true,
			data: {
				id: `${updatedItem.post_id}-${updatedItem.applicant_id}`,
				postId: updatedItem.post_id,
				userId: updatedItem.applicant_id,
				createdAt: updatedItem.add_at.toISOString(),
				status: 1 as 0 | 1, // Always active since status field doesn't exist in new schema
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
					institution: (institution as any) || undefined,
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
		const { user } = await requireAuth();

		const userId = user.id;

		// Check if user has an applicant profile
		const applicant = await prismaClient.applicant.findUnique({
			where: { user_id: userId },
		});

		if (!applicant) {
			const errorResponse: WishlistErrorResponse = {
				success: false,
				error: "Applicant profile not found. Please complete your profile first.",
				code: "APPLICANT_NOT_FOUND",
			};
			return NextResponse.json(errorResponse, { status: 404 });
		}

		const { postId } = params;

		// Check if wishlist item exists
		const existingItem = await prismaClient.wishlist.findUnique({
			where: {
				applicant_id_post_id: {
					applicant_id: applicant.applicant_id,
					post_id: postId,
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
				applicant_id_post_id: {
					applicant_id: applicant.applicant_id,
					post_id: postId,
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
