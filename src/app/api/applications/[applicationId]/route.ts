import {
	ApplicationResponse,
	ApplicationUpdateRequest,
	ApplicationUpdateResponse,
} from "@/types/api/application-api";
import { requireAuth } from "@/utils/auth/auth-utils";
import { NextRequest, NextResponse } from "next/server";
import { prismaClient } from "../../../../../prisma";

// GET /api/applications/[applicationId] - Get specific application
export async function GET(
	request: NextRequest,
	{ params }: { params: { applicationId: string } }
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

		// Get application
		const application = (await prismaClient.application.findFirst({
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
								verification_status: true,
								deleted_at: true,
							},
						},
						programPost: true,
						scholarshipPost: true,
						jobPost: true,
					},
				},
				details: true,
				ApplicationProfileSnapshot: true,
			},
		})) as any;

		if (!application) {
			return NextResponse.json(
				{ error: "Application not found" },
				{ status: 404 }
			);
		}

		// Fetch profile snapshot documents
		let snapshotDocuments: any[] = [];
		const snapshot = application.ApplicationProfileSnapshot;
		if (snapshot && snapshot.document_ids) {
			// Handle document_ids - could be array or comma-separated string
			let documentIds: string[] = [];
			const docIds: any = snapshot.document_ids;
			if (Array.isArray(docIds)) {
				documentIds = docIds.filter(
					(id: any) => id && typeof id === "string"
				);
			} else if (typeof docIds === "string") {
				// Parse comma-separated string (remove curly braces if present)
				const idsString = (docIds as string).replace(/[{}]/g, "");
				documentIds = idsString
					.split(",")
					.map((id: string) => id.trim())
					.filter((id: string) => id);
			}

			if (documentIds.length > 0) {
				// Fetch all documents from snapshot by ID from ApplicantDocument table
				// IMPORTANT: Do NOT filter by status or deleted_at - snapshot preserves state at application time
				// Even if documents are soft-deleted, they should still appear in the snapshot
				const snapshotDocs =
					await prismaClient.applicantDocument.findMany({
						where: {
							document_id: {
								in: documentIds,
							},
							// No status or deleted_at filter - snapshot documents should display even if deleted
						},
						include: {
							documentType: true,
						},
					});

				// Map found documents
				snapshotDocuments = snapshotDocs.map((doc: any) => ({
					documentId: doc.document_id,
					documentTypeId: doc.document_type_id,
					name: doc.name,
					url: doc.url,
					size: doc.size,
					documentType:
						doc.documentType?.name || doc.document_type_id,
					isFromSnapshot: true, // Flag to identify snapshot documents
				}));

				// Log if some snapshot documents were not found (for debugging)
				if (
					snapshotDocs.length < documentIds.length &&
					process.env.NODE_ENV === "development"
				) {
					// eslint-disable-next-line no-console
					console.log(
						`Warning: ${documentIds.length - snapshotDocs.length} snapshot document(s) not found in ApplicantDocument table`
					);
				}
			}
		}

		// Get ApplicationDetail documents (uploaded files)
		// Include ALL uploaded documents, even if they also exist in profile
		// This allows the same document to appear in both places if user both uploads it AND selects from profile
		const applicationDetailDocuments = application.details
			.filter((detail: any) => !detail.is_update_submission)
			.map((detail: any) => ({
				documentId: detail.document_id,
				documentTypeId: detail.document_type,
				name: detail.name,
				url: detail.url,
				size: detail.size,
				documentType: detail.document_type,
				isFromSnapshot: false, // Flag to identify ApplicationDetail documents (uploaded)
			}));

		// Combine both types of documents
		// Include all snapshot documents (from profile) + all ApplicationDetail documents (uploaded)
		// If the same document exists in both, it will appear twice (once as "From Profile", once as "Uploaded")
		const allDocuments = [
			...snapshotDocuments, // Profile documents first
			...applicationDetailDocuments, // Then uploaded documents (may include duplicates if same doc uploaded + selected)
		];

		// Transform application
		const transformedApplication = {
			applicationId: application.application_id,
			applicantId: application.applicant_id,
			postId: application.post_id,
			status: application.status,
			applyAt: application.apply_at.toISOString(),
			rejectionNote: application.rejection_note || null,
			rejectionNoteAt:
				application.rejection_note_at?.toISOString() || null,
			documents: allDocuments,
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
					status: application.post.institution.verification_status,
					deletedAt: application.post.institution.deleted_at,
				},
				program: application.post.programPost
					? {
							post_id: application.post.programPost.post_id,
							duration: application.post.programPost.duration,
							degree_level: application.post.degree_level,
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

		return NextResponse.json(response);
	} catch (error) {
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
		// Check if user is authenticated
		const { user } = await requireAuth();

		// Check if user is an institution
		const institution = await prismaClient.institution.findUnique({
			where: { user_id: user.id },
			select: { institution_id: true },
		});

		if (!institution) {
			return NextResponse.json(
				{ error: "Only institutions can update applications" },
				{ status: 403 }
			);
		}

		const body: ApplicationUpdateRequest = await request.json();

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
								country: true,
								verification_status: true,
								deleted_at: true,
							},
						},
					},
				},
			},
		});

		if (!application || !application.post) {
			return NextResponse.json(
				{ error: "Application not found" },
				{ status: 404 }
			);
		}

		// Update application
		const updatedApplication = (await prismaClient.application.update({
			where: { application_id: params.applicationId },
			data: {
				...(body.status && { status: body.status as any }),
			},
			include: {
				post: {
					include: {
						institution: {
							select: {
								name: true,
								logo: true,
								country: true,
								verification_status: true,
								deleted_at: true,
							},
						},
					},
				},
				details: true,
			},
		})) as any;

		// Send notification to applicant about status change
		try {
			const { NotificationUtils } =
				await import("@/services/messaging/sqs-handlers");

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
			}
		} catch (notificationError) {
			// Don't fail the update if notification fails
		}

		// Transform response
		const transformedApplication = {
			applicationId: updatedApplication.application_id,
			applicantId: updatedApplication.applicant_id,
			postId: updatedApplication.post_id,
			status: updatedApplication.status,
			applyAt: updatedApplication.apply_at.toISOString(),
			documents: updatedApplication.details.map((detail: any) => ({
				documentTypeId: detail.document_type,
				name: detail.name,
				url: detail.url,
				size: detail.size,
				documentType: detail.document_type,
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
					status: updatedApplication.post.institution
						.verification_status,
					deletedAt: updatedApplication.post.institution.deleted_at,
				},
			},
		};

		const response: ApplicationUpdateResponse = {
			success: true,
			application: transformedApplication,
		};

		return NextResponse.json(response);
	} catch (error) {
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

		// Check if application exists and belongs to user
		const application = await prismaClient.application.findFirst({
			where: {
				application_id: params.applicationId,
				applicant_id: applicant.applicant_id,
			},
		});

		if (!application) {
			return NextResponse.json(
				{ error: "Application not found" },
				{ status: 404 }
			);
		}

		// Check if application can be cancelled (only SUBMITTED applications)
		if (application.status !== "SUBMITTED") {
			return NextResponse.json(
				{ error: "Only submitted applications can be cancelled" },
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

		return NextResponse.json({
			success: true,
			message: "Application cancelled successfully",
		});
	} catch (error) {
		return NextResponse.json(
			{ error: "Failed to delete application" },
			{ status: 500 }
		);
	}
}
