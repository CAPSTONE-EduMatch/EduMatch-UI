import { requireAuth } from "@/utils/auth/auth-utils";
import { randomUUID } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { prismaClient } from "../../../../../../prisma";

// PUT /api/applications/[applicationId]/documents - Update application documents (for applicants)
export async function PUT(
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

		// Get application and verify ownership
		const application = await prismaClient.application.findFirst({
			where: {
				application_id: params.applicationId,
				applicant_id: applicant.applicant_id,
			},
			include: {
				ApplicationProfileSnapshot: true,
			},
		});

		if (!application) {
			return NextResponse.json(
				{ error: "Application not found" },
				{ status: 404 }
			);
		}

		// Check subscription eligibility - user must have active paid plan to edit
		const { canApplyToOpportunity } =
			await import("@/services/authorization");
		const eligibility = await canApplyToOpportunity(applicant.applicant_id);

		if (!eligibility.canApply) {
			return NextResponse.json(
				{
					error: "You need an active Standard or Premium subscription to edit applications. Please upgrade your plan to continue.",
					eligibility: {
						canApply: false,
						planName: eligibility.planName,
						reason: eligibility.reason,
					},
				},
				{ status: 403 }
			);
		}

		// Only allow editing if status is SUBMITTED
		if (application.status !== "SUBMITTED") {
			return NextResponse.json(
				{
					error: "Cannot edit documents. Application status must be SUBMITTED to edit documents.",
				},
				{ status: 400 }
			);
		}

		const body = await request.json();
		const { documents, selectedProfileDocumentIds } = body; // Array of documents to keep/add, and selected profile document IDs

		if (!Array.isArray(documents)) {
			return NextResponse.json(
				{ error: "Documents must be an array" },
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

		// Get existing documents (non-update-submission documents only)
		const existingDocuments = await prismaClient.applicationDetail.findMany(
			{
				where: {
					application_id: params.applicationId,
					is_update_submission: false,
				},
			}
		);

		// Extract document IDs from the request
		const documentIdsToKeep = new Set(
			documents
				.map((doc: any) => doc.documentId)
				.filter((id: string) => id)
		);

		// Get applicant profile to validate selectedProfileDocumentIds and filter profile documents
		const applicantProfile = await prismaClient.applicant.findUnique({
			where: { applicant_id: applicant.applicant_id },
			include: {
				documents: {
					where: { status: true },
					select: {
						document_id: true,
						name: true,
						url: true,
						size: true,
						document_type_id: true,
					},
				},
			},
		});

		// Build a map of profile document URLs to IDs for quick lookup
		const profileDocumentUrlMap = new Map(
			applicantProfile?.documents?.map((doc) => [
				doc.url,
				doc.document_id,
			]) || []
		);

		// Delete documents that are not in the new list
		// BUT: Preserve ApplicationDetail records for profile documents that are in the NEW selectedProfileDocumentIds
		// This maintains backward compatibility - profile documents that were originally in ApplicationDetail should stay
		// if they're still selected in the profile snapshot
		const selectedProfileDocIdsSet = new Set(
			selectedProfileDocumentIds || []
		);
		const documentsToDelete = existingDocuments.filter((doc) => {
			// Keep if it's in the new list (explicitly included in documentsToUpdate)
			if (documentIdsToKeep.has(doc.document_id)) {
				return false;
			}
			// Keep if it's a profile document that's in the NEW selectedProfileDocumentIds (backward compatibility)
			// Check if this document URL matches a profile document that's selected
			const profileDocId = profileDocumentUrlMap.get(doc.url);
			if (profileDocId && selectedProfileDocIdsSet.has(profileDocId)) {
				// This is a profile document that's selected in the new snapshot - preserve it for backward compatibility
				return false;
			}
			// Delete if not in new list and not a preserved profile document
			return true;
		});

		// Create new documents that don't have documentId (new uploads only)
		// Filter out profile documents - they should only update the profile snapshot, not create ApplicationDetail records
		const profileDocumentUrls = new Set(
			applicantProfile?.documents?.map((doc) => doc.url) || []
		);
		const profileDocumentIds = new Set(
			applicantProfile?.documents?.map((doc) => doc.document_id) || []
		);

		// Only create ApplicationDetail for documents that:
		// 1. Don't have a documentId (new documents)
		// 2. Are NOT in the applicant's profile (not profile documents)
		const newDocuments = documents.filter(
			(doc: any) =>
				!doc.documentId &&
				!profileDocumentUrls.has(doc.url) &&
				!profileDocumentIds.has(doc.documentId || "")
		);

		// Perform updates in a transaction
		await prismaClient.$transaction(async (tx) => {
			// Update profile snapshot document_ids if selectedProfileDocumentIds is provided
			if (
				selectedProfileDocumentIds &&
				application.ApplicationProfileSnapshot
			) {
				const validDocumentIds =
					selectedProfileDocumentIds.length > 0
						? selectedProfileDocumentIds.filter((docId: string) =>
								applicantProfile?.documents?.some(
									(doc) => doc.document_id === docId
								)
							) // Only include IDs that exist in the profile
						: applicantProfile?.documents?.map(
								(doc) => doc.document_id
							) || [];

				await tx.applicationProfileSnapshot.update({
					where: {
						snapshot_id:
							application.ApplicationProfileSnapshot.snapshot_id,
					},
					data: {
						document_ids: validDocumentIds,
					},
				});
			}

			// Delete removed documents
			if (documentsToDelete.length > 0) {
				await tx.applicationDetail.deleteMany({
					where: {
						document_id: {
							in: documentsToDelete.map((doc) => doc.document_id),
						},
					},
				});
			}

			// Add new documents
			if (newDocuments.length > 0) {
				const applicationDetails = newDocuments.map((doc: any) => ({
					document_id: doc.documentId || randomUUID(),
					application_id: params.applicationId,
					url: doc.url,
					name: doc.name,
					size: doc.size,
					document_type: mapDocumentType(
						doc.documentTypeId || doc.documentType || "OTHER"
					) as any,
					update_at: new Date(),
					is_update_submission: false,
				}));

				await tx.applicationDetail.createMany({
					data: applicationDetails,
				});
			}
		});

		return NextResponse.json({
			success: true,
			message: "Application documents updated successfully",
		});
	} catch (error) {
		// eslint-disable-next-line no-console
		console.error("Error updating application documents:", error);
		return NextResponse.json(
			{ error: "Failed to update application documents" },
			{ status: 500 }
		);
	}
}
