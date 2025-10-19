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
								country: true,
							},
						},
						programPost: true,
						scholarshipPost: true,
						jobPost: true,
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
				startDate: application.post.start_date.toISOString(),
				endDate: application.post.end_date?.toISOString(),
				location: application.post.location || undefined,
				otherInfo: application.post.other_info || undefined,
				institution: {
					name: application.post.institution.name,
					logo: application.post.institution.logo,
					country: application.post.institution.country || undefined,
				},
				program: application.post.programPost
					? {
							post_id: application.post.programPost.post_id,
							duration: application.post.programPost.duration,
							degree_level:
								application.post.programPost.degree_level,
							attendance: application.post.programPost.attendance,
							course_include:
								application.post.programPost.course_include ||
								undefined,
							gpa: application.post.programPost.gpa
								? Number(application.post.programPost.gpa)
								: undefined,
							gre: application.post.programPost.gre || undefined,
							gmat:
								application.post.programPost.gmat || undefined,
							tuition_fee: application.post.programPost
								.tuition_fee
								? Number(
										application.post.programPost.tuition_fee
									)
								: undefined,
							fee_description:
								application.post.programPost.fee_description ||
								undefined,
							scholarship_info:
								application.post.programPost.scholarship_info ||
								undefined,
						}
					: undefined,
				scholarship: application.post.scholarshipPost
					? {
							post_id: application.post.scholarshipPost.post_id,
							description:
								application.post.scholarshipPost.description,
							type: application.post.scholarshipPost.type,
							number: application.post.scholarshipPost.number,
							grant:
								application.post.scholarshipPost.grant ||
								undefined,
							scholarship_coverage:
								application.post.scholarshipPost
									.scholarship_coverage || undefined,
							essay_required:
								application.post.scholarshipPost
									.essay_required || undefined,
							eligibility:
								application.post.scholarshipPost.eligibility ||
								undefined,
						}
					: undefined,
				job: application.post.jobPost
					? {
							post_id: application.post.jobPost.post_id,
							contract_type:
								application.post.jobPost.contract_type,
							attendance: application.post.jobPost.attendance,
							job_type: application.post.jobPost.job_type,
							min_salary: application.post.jobPost.min_salary
								? Number(application.post.jobPost.min_salary)
								: undefined,
							max_salary: application.post.jobPost.max_salary
								? Number(application.post.jobPost.max_salary)
								: undefined,
							salary_description:
								application.post.jobPost.salary_description ||
								undefined,
							benefit:
								application.post.jobPost.benefit || undefined,
							main_responsibility:
								application.post.jobPost.main_responsibility ||
								undefined,
							qualification_requirement:
								application.post.jobPost
									.qualification_requirement || undefined,
							experience_requirement:
								application.post.jobPost
									.experience_requirement || undefined,
							assessment_criteria:
								application.post.jobPost.assessment_criteria ||
								undefined,
							other_requirement:
								application.post.jobPost.other_requirement ||
								undefined,
						}
					: undefined,
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
								country: true,
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
				startDate: updatedApplication.post.start_date.toISOString(),
				endDate: updatedApplication.post.end_date?.toISOString(),
				location: updatedApplication.post.location || undefined,
				otherInfo: updatedApplication.post.other_info || undefined,
				institution: {
					name: updatedApplication.post.institution.name,
					logo: updatedApplication.post.institution.logo,
					country:
						updatedApplication.post.institution.country ||
						undefined,
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
