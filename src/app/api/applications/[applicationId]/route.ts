import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/app/lib/auth";
import { prismaClient } from "../../../../../prisma";
import {
	ApplicationResponse,
	ApplicationUpdateRequest,
	ApplicationUpdateResponse,
} from "@/types/application-api";

// GET /api/applications/[applicationId] - Get specific application
export async function GET(
	request: NextRequest,
	{ params }: { params: { applicationId: string } }
) {
	try {
		console.log(
			"🔵 API: Get application request received:",
			params.applicationId
		);

		// Check if user is authenticated
		const session = await auth.api.getSession({
			headers: request.headers,
		});

		if (!session) {
			console.log("❌ API: No session found");
			return NextResponse.json(
				{ error: "Authentication required" },
				{ status: 401 }
			);
		}

		// Get user's applicant profile
		const applicant = await prismaClient.applicant.findUnique({
			where: { user_id: session.user.id },
			select: { applicant_id: true },
		});

		if (!applicant) {
			console.log("❌ API: No applicant profile found");
			return NextResponse.json(
				{ error: "Applicant profile not found" },
				{ status: 404 }
			);
		}

		// Get application
		const application = await prismaClient.application.findFirst({
			where: {
				application_id: params.applicationId,
				applicant_id: applicant.applicant_id,
			},
			include: {
				post: {
					include: {
						institution: {
							select: {
								name: true,
								logo: true,
							},
						},
					},
				},
				details: {
					include: {
						documentType: true,
					},
				},
			},
		});

		if (!application) {
			console.log("❌ API: Application not found");
			return NextResponse.json(
				{ error: "Application not found" },
				{ status: 404 }
			);
		}

		// Transform application
		const transformedApplication = {
			applicationId: application.application_id,
			applicantId: application.applicant_id,
			postId: application.post_id,
			status: application.status,
			applyAt: application.apply_at.toISOString(),
			documents: application.details.map((detail) => ({
				documentTypeId: detail.document_type_id,
				name: detail.name,
				url: detail.url,
				size: detail.size,
				documentType: detail.documentType.name,
			})),
			post: {
				id: application.post.post_id,
				title: application.post.title,
				institution: {
					name: application.post.institution.name,
					logo: application.post.institution.logo,
				},
			},
		};

		const response: ApplicationResponse = {
			success: true,
			application: transformedApplication,
		};

		console.log("✅ API: Application retrieved successfully");
		return NextResponse.json(response);
	} catch (error) {
		console.error("❌ API: Error fetching application:", error);
		return NextResponse.json(
			{ error: "Failed to fetch application" },
			{ status: 500 }
		);
	}
}

// PUT /api/applications/[applicationId] - Update application (for institutions)
export async function PUT(
	request: NextRequest,
	{ params }: { params: { applicationId: string } }
) {
	try {
		console.log(
			"🔵 API: Update application request received:",
			params.applicationId
		);

		// Check if user is authenticated
		const session = await auth.api.getSession({
			headers: request.headers,
		});

		if (!session) {
			console.log("❌ API: No session found");
			return NextResponse.json(
				{ error: "Authentication required" },
				{ status: 401 }
			);
		}

		// Check if user is an institution
		const institution = await prismaClient.institution.findUnique({
			where: { user_id: session.user.id },
			select: { institution_id: true },
		});

		if (!institution) {
			console.log("❌ API: User is not an institution");
			return NextResponse.json(
				{ error: "Only institutions can update applications" },
				{ status: 403 }
			);
		}

		const body: ApplicationUpdateRequest = await request.json();
		console.log("📋 API: Update data:", body);

		// Get application and verify it belongs to this institution
		const application = await prismaClient.application.findFirst({
			where: {
				application_id: params.applicationId,
				post: {
					institution_id: institution.institution_id,
				},
			},
			include: {
				post: {
					include: {
						institution: {
							select: {
								name: true,
								logo: true,
							},
						},
					},
				},
			},
		});

		if (!application || !application.post) {
			console.log(
				"❌ API: Application not found or not owned by institution"
			);
			return NextResponse.json(
				{ error: "Application not found" },
				{ status: 404 }
			);
		}

		// Update application
		const updatedApplication = await prismaClient.application.update({
			where: { application_id: params.applicationId },
			data: {
				...(body.status && { status: body.status }),
			},
			include: {
				post: {
					include: {
						institution: {
							select: {
								name: true,
								logo: true,
							},
						},
					},
				},
				details: {
					include: {
						documentType: true,
					},
				},
			},
		});

		// Send notification to applicant about status change
		try {
			const { NotificationUtils } = await import("@/lib/sqs-handlers");

			// Get applicant info
			const applicant = await prismaClient.applicant.findUnique({
				where: { applicant_id: application.applicant_id },
				include: {
					user: true,
				},
			});

			if (applicant?.user && body.status) {
				await NotificationUtils.sendApplicationStatusNotification(
					applicant.user.id,
					applicant.user.email || "",
					application.post.title,
					body.status,
					params.applicationId,
					"",
					""
				);
				console.log("✅ API: Status change notification sent");
			}
		} catch (notificationError) {
			console.error(
				"❌ API: Failed to send notification:",
				notificationError
			);
			// Don't fail the update if notification fails
		}

		// Transform response
		const transformedApplication = {
			applicationId: updatedApplication.application_id,
			applicantId: updatedApplication.applicant_id,
			postId: updatedApplication.post_id,
			status: updatedApplication.status,
			applyAt: updatedApplication.apply_at.toISOString(),
			documents: updatedApplication.details.map((detail) => ({
				documentTypeId: detail.document_type_id,
				name: detail.name,
				url: detail.url,
				size: detail.size,
				documentType: detail.documentType.name,
			})),
			post: {
				id: updatedApplication.post.post_id,
				title: updatedApplication.post.title,
				institution: {
					name: updatedApplication.post.institution.name,
					logo: updatedApplication.post.institution.logo,
				},
			},
		};

		const response: ApplicationUpdateResponse = {
			success: true,
			application: transformedApplication,
		};

		console.log("✅ API: Application updated successfully");
		return NextResponse.json(response);
	} catch (error) {
		console.error("❌ API: Error updating application:", error);
		return NextResponse.json(
			{ error: "Failed to update application" },
			{ status: 500 }
		);
	}
}

// DELETE /api/applications/[applicationId] - Cancel/delete application
export async function DELETE(
	request: NextRequest,
	{ params }: { params: { applicationId: string } }
) {
	try {
		console.log(
			"🔵 API: Delete application request received:",
			params.applicationId
		);

		// Check if user is authenticated
		const session = await auth.api.getSession({
			headers: request.headers,
		});

		if (!session) {
			console.log("❌ API: No session found");
			return NextResponse.json(
				{ error: "Authentication required" },
				{ status: 401 }
			);
		}

		// Get user's applicant profile
		const applicant = await prismaClient.applicant.findUnique({
			where: { user_id: session.user.id },
			select: { applicant_id: true },
		});

		if (!applicant) {
			console.log("❌ API: No applicant profile found");
			return NextResponse.json(
				{ error: "Applicant profile not found" },
				{ status: 404 }
			);
		}

		// Check if application exists and belongs to user
		const application = await prismaClient.application.findFirst({
			where: {
				application_id: params.applicationId,
				applicant_id: applicant.applicant_id,
			},
		});

		if (!application) {
			console.log("❌ API: Application not found");
			return NextResponse.json(
				{ error: "Application not found" },
				{ status: 404 }
			);
		}

		// Check if application can be cancelled (only PENDING applications)
		if (application.status !== "PENDING") {
			console.log("❌ API: Application cannot be cancelled");
			return NextResponse.json(
				{ error: "Only pending applications can be cancelled" },
				{ status: 400 }
			);
		}

		// Delete application details first (foreign key constraint)
		await prismaClient.applicationDetail.deleteMany({
			where: { application_id: params.applicationId },
		});

		// Delete application
		await prismaClient.application.delete({
			where: { application_id: params.applicationId },
		});

		console.log("✅ API: Application deleted successfully");

		return NextResponse.json({
			success: true,
			message: "Application cancelled successfully",
		});
	} catch (error) {
		console.error("❌ API: Error deleting application:", error);
		return NextResponse.json(
			{ error: "Failed to delete application" },
			{ status: 500 }
		);
	}
}
