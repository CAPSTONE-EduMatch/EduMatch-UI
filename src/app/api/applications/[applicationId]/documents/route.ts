import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/utils/auth/auth-utils";
import { prismaClient } from "../../../../../../prisma";
import { randomUUID } from "crypto";

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
		});

		if (!application) {
			return NextResponse.json(
				{ error: "Application not found" },
				{ status: 404 }
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
		const { documents } = body; // Array of documents to keep/add

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

		// Delete documents that are not in the new list
		const documentsToDelete = existingDocuments.filter(
			(doc) => !documentIdsToKeep.has(doc.document_id)
		);

		// Create new documents that don't have documentId (new uploads)
		const newDocuments = documents.filter(
			(doc: any) =>
				!doc.documentId || !documentIdsToKeep.has(doc.documentId)
		);

		// Perform updates in a transaction
		await prismaClient.$transaction(async (tx) => {
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
