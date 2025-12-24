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
					where: {
						is_update_submission: false,
					},
					select: {
						document_id: true,
						name: true,
						url: true,
						size: true,
						document_type: true,
						update_at: true,
					},
				},
				ApplicationProfileSnapshot: true,
			},
			orderBy: {
				apply_at: "desc", // Most recent first
			},
		});

		// Transform applications - include both ApplicationDetail and snapshot documents
		const transformedApplications = await Promise.all(
			applications.map(async (app) => {
				// Get ApplicationDetail documents (uploaded files)
				const applicationDetailDocuments = app.details.map(
					(detail) => ({
						documentId: detail.document_id,
						name: detail.name,
						url: detail.url,
						size: detail.size,
						documentType: detail.document_type,
						uploadDate:
							detail.update_at?.toISOString() ||
							app.apply_at.toISOString(),
						isFromSnapshot: false,
					})
				);

				// Fetch profile snapshot documents
				let snapshotDocuments: any[] = [];
				const snapshot = app.ApplicationProfileSnapshot;
				if (snapshot && snapshot.document_ids) {
					// Handle document_ids - could be array or comma-separated string
					let documentIds: string[] = [];
					const docIds: any = snapshot.document_ids;
					if (Array.isArray(docIds)) {
						documentIds = docIds.filter(
							(id: any) => id && typeof id === "string"
						);
					} else if (typeof docIds === "string") {
						const idsString = (docIds as string).replace(
							/[{}]/g,
							""
						);
						documentIds = idsString
							.split(",")
							.map((id: string) => id.trim())
							.filter((id: string) => id);
					}

					if (documentIds.length > 0) {
						const snapshotDocs =
							await prismaClient.applicantDocument.findMany({
								where: {
									document_id: {
										in: documentIds,
									},
								},
								include: {
									documentType: true,
								},
							});

						snapshotDocuments = snapshotDocs.map((doc: any) => ({
							documentId: doc.document_id,
							documentTypeId: doc.document_type_id,
							name: doc.name,
							url: doc.url,
							size: doc.size,
							documentType:
								doc.documentType?.name || doc.document_type_id,
							isFromSnapshot: true,
						}));
					}
				}

				// Combine documents - exclude snapshot documents that have matching URLs in ApplicationDetail
				const applicationDetailUrls = new Set(
					applicationDetailDocuments.map((doc: any) => doc.url)
				);
				const uniqueSnapshotDocuments = snapshotDocuments.filter(
					(doc) => !applicationDetailUrls.has(doc.url)
				);

				// Combine all documents
				const allDocuments = [
					...applicationDetailDocuments,
					...uniqueSnapshotDocuments,
				];

				return {
					applicationId: app.application_id,
					applicantId: app.applicant_id,
					postId: app.post_id,
					status: app.status,
					applyAt: app.apply_at.toISOString(),
					reapplyCount: app.reapply_count || 0,
					rejectionNote: app.rejection_note || null,
					rejectionNoteAt:
						app.rejection_note_at?.toISOString() || null,
					documents: allDocuments,
					post: {
						id: app.post.post_id,
						title: app.post.title,
						institution: {
							name: app.post.institution.name,
							logo: app.post.institution.logo,
							country: app.post.institution.country,
						},
					},
				};
			})
		);

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
