import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/utils/auth/auth-utils";
import { prismaClient } from "../../../../../../prisma";

// GET /api/applications/post/[postId] - Get applicant's applications for a specific post
export async function GET(
	request: NextRequest,
	{ params }: { params: { postId: string } }
) {
	try {
		// Check if user is authenticated
		const { user } = await requireAuth();

		// Get user's applicant profile
		const applicant = await prismaClient.applicant.findUnique({
			where: { user_id: user.id },
			select: { applicant_id: true },
		});

		if (!applicant) {
			return NextResponse.json(
				{ error: "Applicant profile not found" },
				{ status: 404 }
			);
		}

		// Get all applications for this post by this applicant
		const applications = await prismaClient.application.findMany({
			where: {
				applicant_id: applicant.applicant_id,
				post_id: params.postId,
			},
			include: {
				post: {
					include: {
						institution: {
							select: {
								name: true,
								logo: true,
								country: true,
							},
						},
						programPost: true,
						scholarshipPost: true,
						jobPost: true,
					},
				},
				details: {
					select: {
						document_id: true,
						name: true,
						url: true,
						size: true,
						document_type: true,
						update_at: true,
					},
				},
			},
			orderBy: {
				apply_at: "desc", // Most recent first
			},
		});

		// Transform applications
		const transformedApplications = applications.map((app) => ({
			applicationId: app.application_id,
			applicantId: app.applicant_id,
			postId: app.post_id,
			status: app.status,
			applyAt: app.apply_at.toISOString(),
			reapplyCount: app.reapply_count,
			documents: app.details.map((detail) => ({
				documentId: detail.document_id,
				name: detail.name,
				url: detail.url,
				size: detail.size,
				documentType: detail.document_type,
				uploadDate:
					detail.update_at?.toISOString() ||
					app.apply_at.toISOString(),
			})),
			post: {
				id: app.post.post_id,
				title: app.post.title,
				institution: {
					name: app.post.institution.name,
					logo: app.post.institution.logo,
					country: app.post.institution.country,
				},
			},
		}));

		return NextResponse.json({
			success: true,
			applications: transformedApplications,
		});
	} catch (error) {
		console.error("Error fetching applications for post:", error);
		return NextResponse.json(
			{ error: "Failed to fetch applications" },
			{ status: 500 }
		);
	}
}
