import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-utils";
import { prismaClient } from "../../../../../../prisma";
import { randomUUID } from "crypto";

/**
 * POST /api/applications/[applicationId]/update-request - Submit update response
 * Applicant submits new documents and response message for a pending update request
 */
export async function POST(
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

		// Verify application belongs to this applicant
		const application = await prismaClient.application.findFirst({
			where: {
				application_id: params.applicationId,
				applicant_id: applicant.applicant_id,
				status: "REQUIRE_UPDATE",
			},
			include: {
				updateRequests: {
					where: {
						status: "PENDING",
					},
					orderBy: {
						created_at: "desc",
					},
					take: 1,
				},
			},
		});

		if (!application) {
			return NextResponse.json(
				{
					error: "Application not found or not in REQUIRE_UPDATE status",
				},
				{ status: 404 }
			);
		}

		const pendingUpdateRequest = application.updateRequests[0];

		if (!pendingUpdateRequest) {
			return NextResponse.json(
				{
					error: "No pending update request found for this application",
				},
				{ status: 404 }
			);
		}

		// Parse request body
		const body = await request.json();
		const { documents, responseMessage } = body;

		if (!documents || documents.length === 0) {
			return NextResponse.json(
				{ error: "At least one document is required" },
				{ status: 400 }
			);
		}

		// Map document type IDs to enum values
		const mapDocumentType = (docTypeId: string): string => {
			const typeMapping: Record<string, string> = {
				"1": "RESEARCH_PROPOSAL",
				"2": "CV_RESUME",
				"3": "PORTFOLIO",
				"4": "ACADEMIC_TRANSCRIPT",
				"5": "PERSONAL_STATEMENT",
				"6": "RECOMMENDATION_LETTER",
				"7": "LANGUAGE_CERTIFICATE",
				"8": "PASSPORT_COPY",
				"9": "DEGREE_CERTIFICATE",
				"10": "RESEARCH_PAPER",
				"11": "INSTITUTION_VERIFICATION",
				"12": "REQUIRED_DOCUMENTS",
			};
			return typeMapping[docTypeId] || "OTHER";
		};

		// Create new documents with is_update_submission flag
		const applicationDetails = documents.map((doc: any) => ({
			document_id: randomUUID(),
			application_id: params.applicationId,
			update_request_id: pendingUpdateRequest.update_request_id,
			url: doc.url,
			name: doc.name,
			size: doc.size,
			document_type: mapDocumentType(
				doc.documentTypeId || "OTHER"
			) as any,
			is_update_submission: true,
			update_at: new Date(),
		}));

		await prismaClient.applicationDetail.createMany({
			data: applicationDetails,
		});

		// Update the update request
		const updatedRequest =
			await prismaClient.applicationUpdateRequest.update({
				where: {
					update_request_id: pendingUpdateRequest.update_request_id,
				},
				data: {
					status: "RESPONDED",
					response_submitted_at: new Date(),
					response_message: responseMessage?.trim() || null,
				},
			});

		// Check if there are any other pending update requests for this application
		const remainingPendingRequests =
			await prismaClient.applicationUpdateRequest.findMany({
				where: {
					application_id: params.applicationId,
					status: "PENDING",
				},
			});

		// Only update application status to UPDATED if all update requests have been responded to
		if (remainingPendingRequests.length === 0) {
			await prismaClient.application.update({
				where: { application_id: params.applicationId },
				data: {
					status: "UPDATED",
				},
			});
		}

		// Send notification to institution
		try {
			const { NotificationUtils } = await import("@/lib/sqs-handlers");

			// Get institution info
			const institutionInfo =
				await prismaClient.opportunityPost.findUnique({
					where: { post_id: application.post_id },
					include: {
						institution: {
							include: {
								user: true,
							},
						},
					},
				});

			if (institutionInfo?.institution?.user) {
				await NotificationUtils.sendApplicationStatusNotification(
					institutionInfo.institution.user.id,
					institutionInfo.institution.user.email || "",
					params.applicationId,
					institutionInfo.title || "Application",
					"REQUIRE_UPDATE",
					"UPDATED",
					institutionInfo.institution.name
				);
			}
		} catch (notificationError) {
			// eslint-disable-next-line no-console
			console.error(
				"❌ API: Failed to send notification:",
				notificationError
			);
			// Don't fail if notification fails
		}

		return NextResponse.json({
			success: true,
			message: "Update response submitted successfully",
			updateRequest: {
				updateRequestId: updatedRequest.update_request_id,
				status: updatedRequest.status,
				responseSubmittedAt:
					updatedRequest.response_submitted_at?.toISOString(),
			},
			documentsCount: applicationDetails.length,
		});
	} catch (error) {
		if (process.env.NODE_ENV === "development") {
			// eslint-disable-next-line no-console
			console.error("❌ API: Error submitting update response:", error);
		}
		return NextResponse.json(
			{ error: "Failed to submit update response" },
			{ status: 500 }
		);
	}
}

/**
 * GET /api/applications/[applicationId]/update-request - Get update requests for an application
 */
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

		// Verify application belongs to this applicant
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

		// Get all update requests for this application
		const updateRequests =
			await prismaClient.applicationUpdateRequest.findMany({
				where: {
					application_id: params.applicationId,
				},
				include: {
					requestedBy: {
						select: {
							id: true,
							name: true,
							email: true,
						},
					},
					responseDocuments: {
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
					created_at: "desc",
				},
			});

		return NextResponse.json({
			success: true,
			updateRequests: updateRequests.map((req) => ({
				updateRequestId: req.update_request_id,
				applicationId: req.application_id,
				requestedBy: {
					userId: req.requestedBy.id,
					name: req.requestedBy.name,
					email: req.requestedBy.email,
				},
				requestMessage: req.request_message,
				requestedDocuments: req.requested_documents,
				status: req.status,
				createdAt: req.created_at.toISOString(),
				responseSubmittedAt: req.response_submitted_at?.toISOString(),
				responseMessage: req.response_message,
				responseDocuments: req.responseDocuments.map((doc) => ({
					documentId: doc.document_id,
					name: doc.name,
					url: doc.url,
					size: doc.size,
					documentType: doc.document_type,
					updatedAt: doc.update_at?.toISOString(),
				})),
			})),
		});
	} catch (error) {
		if (process.env.NODE_ENV === "development") {
			// eslint-disable-next-line no-console
			console.error("❌ API: Error fetching update requests:", error);
		}
		return NextResponse.json(
			{ error: "Failed to fetch update requests" },
			{ status: 500 }
		);
	}
}
