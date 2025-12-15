import { requireAuth } from "@/utils/auth/auth-utils";
import { NextRequest, NextResponse } from "next/server";
import { prismaClient } from "../../../../../../prisma";
import { SimilarityService } from "@/services/similarity/similarity-service";

// Helper function to calculate match score between applicant and post
async function calculateApplicationMatchScore(
	applicantId: string,
	postId: string
): Promise<string> {
	try {
		// Get applicant embedding
		const applicant = await prismaClient.applicant.findUnique({
			where: { applicant_id: applicantId },
			select: { embedding: true },
		});

		if (!applicant?.embedding) {
			return "0%";
		}

		// Get post embedding from the appropriate table
		const [programPost, scholarshipPost, jobPost] = await Promise.all([
			prismaClient.programPost.findUnique({
				where: { post_id: postId },
				select: { embedding: true },
			}),
			prismaClient.scholarshipPost.findUnique({
				where: { post_id: postId },
				select: { embedding: true },
			}),
			prismaClient.jobPost.findUnique({
				where: { post_id: postId },
				select: { embedding: true },
			}),
		]);

		const postEmbedding =
			(programPost?.embedding as number[] | null) ||
			(scholarshipPost?.embedding as number[] | null) ||
			(jobPost?.embedding as number[] | null);

		if (!postEmbedding) {
			return "0%";
		}

		// Calculate similarity
		const similarity = SimilarityService.calculateCosineSimilarity(
			applicant.embedding as number[],
			postEmbedding
		);
		const matchPercentage =
			SimilarityService.similarityToMatchPercentage(similarity);

		return matchPercentage;
	} catch (error) {
		if (process.env.NODE_ENV === "development") {
			// eslint-disable-next-line no-console
			console.error("Error calculating match score:", error);
		}
		return "0%";
	}
}

// GET /api/applications/institution/[applicationId] - Get detailed applicant information for institutions
export async function GET(
	request: NextRequest,
	{ params }: { params: { applicationId: string } }
) {
	try {
		// Check if user is authenticated
		const { user } = await requireAuth();

		// Get institution for the user
		const institution = await prismaClient.institution.findUnique({
			where: { user_id: user.id },
			select: { institution_id: true, name: true },
		});

		if (!institution) {
			return NextResponse.json(
				{ error: "Only institutions can access this endpoint" },
				{ status: 403 }
			);
		}

		// SECURITY: First check if application exists at all
		const applicationExists = await prismaClient.application.findUnique({
			where: { application_id: params.applicationId },
			select: {
				application_id: true,
				post: {
					select: {
						institution_id: true,
					},
				},
			},
		});

		// If application exists but belongs to another institution, deny access
		if (
			applicationExists &&
			applicationExists.post.institution_id !== institution.institution_id
		) {
			return NextResponse.json(
				{
					error: "Access denied. This application belongs to another institution.",
				},
				{ status: 403 }
			);
		}

		// Get application with detailed applicant information including profile snapshot
		// Only fetch if it belongs to this institution
		const application = await prismaClient.application.findFirst({
			where: {
				application_id: params.applicationId,
				post: {
					institution_id: institution.institution_id,
				},
			},
			include: {
				ApplicationProfileSnapshot: true, // Include the profile snapshot
				applicant: {
					include: {
						user: {
							select: {
								id: true,
								name: true,
								email: true,
								image: true,
							},
						},
						subdiscipline: {
							select: {
								subdiscipline_id: true,
								name: true,
								discipline: {
									select: {
										name: true,
									},
								},
							},
						},
						// Don't include applicant.documents - we only use snapshot document_ids
					},
				},
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
				details: true,
			},
		});

		if (!application) {
			return NextResponse.json(
				{ error: "Application not found" },
				{ status: 404 }
			);
		}

		// Change status to PROGRESSING when institution views application details
		// Only if current status is SUBMITTED
		if (application.status === "SUBMITTED") {
			const oldStatus = application.status;
			await prismaClient.application.update({
				where: { application_id: params.applicationId },
				data: {
					status: "PROGRESSING",
				},
			});
			// Update the application object for response
			application.status = "PROGRESSING";

			// Send notification to applicant about status change to PROGRESSING
			try {
				const { NotificationUtils } =
					await import("@/services/messaging/sqs-handlers");

				if (application.applicant?.user) {
					await NotificationUtils.sendApplicationStatusNotification(
						application.applicant.user.id,
						application.applicant.user.email || "",
						params.applicationId,
						application.post.title,
						oldStatus,
						"PROGRESSING",
						institution.name
					);
				}
			} catch (notificationError) {
				console.error(
					"❌ Failed to send PROGRESSING status notification:",
					notificationError
				);
				// Don't fail the request if notification fails
			}
		}

		// Fetch ALL documents from snapshot (profile snapshot preserves state at application time)
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
				// Even if a document is deleted later, it should still display if it was in the snapshot
				// Use findMany with 'in' for better performance when fetching multiple documents
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

				// Collect all unique subdiscipline IDs and names for batch querying
				const subdisciplineIds = new Set<string>();
				const subdisciplineNameSet = new Set<string>();

				snapshotDocs.forEach((doc) => {
					if (doc.subdiscipline && doc.subdiscipline.length > 0) {
						doc.subdiscipline.forEach((item) => {
							const items = item.includes(",")
								? item
										.split(",")
										.map((s) => s.trim())
										.filter((s) => s)
								: [item.trim()];

							items.forEach((subId) => {
								if (subId.includes("_") && subId.length > 30) {
									// Looks like an ID
									subdisciplineIds.add(subId);
								} else if (subId) {
									// Looks like a name
									subdisciplineNameSet.add(subId);
								}
							});
						});
					}
				});

				// Batch fetch all subdisciplines by ID
				const subdisciplinesByIdMap = new Map<
					string,
					{ name: string; disciplineName: string }
				>();
				if (subdisciplineIds.size > 0) {
					const subdisciplineByIdResults =
						await prismaClient.subdiscipline.findMany({
							where: {
								subdiscipline_id: {
									in: Array.from(subdisciplineIds),
								},
							},
							include: {
								discipline: {
									select: {
										name: true,
									},
								},
							},
						});

					subdisciplineByIdResults.forEach((sub) => {
						subdisciplinesByIdMap.set(sub.subdiscipline_id, {
							name: sub.name,
							disciplineName: sub.discipline.name,
						});
					});
				}

				// Batch fetch all subdisciplines by name
				const subdisciplinesByNameMap = new Map<
					string,
					{ name: string; disciplineName: string }
				>();
				if (subdisciplineNameSet.size > 0) {
					const subdisciplineByNameResults =
						await prismaClient.subdiscipline.findMany({
							where: {
								name: {
									in: Array.from(subdisciplineNameSet),
								},
							},
							include: {
								discipline: {
									select: {
										name: true,
									},
								},
							},
						});

					subdisciplineByNameResults.forEach((sub) => {
						subdisciplinesByNameMap.set(sub.name, {
							name: sub.name,
							disciplineName: sub.discipline.name,
						});
					});
				}

				// Process each document using the pre-fetched subdiscipline maps
				snapshotDocuments = snapshotDocs.map((doc) => {
					// Get subdiscipline names for research papers
					let docSubdisciplineNames: string[] = [];
					if (doc.subdiscipline && doc.subdiscipline.length > 0) {
						const uniqueNames = new Set<string>();

						doc.subdiscipline.forEach((item) => {
							const items = item.includes(",")
								? item
										.split(",")
										.map((s) => s.trim())
										.filter((s) => s)
								: [item.trim()];

							items.forEach((subId) => {
								let subData: {
									name: string;
									disciplineName: string;
								} | null = null;

								// Try to find by ID first
								if (subId.includes("_") && subId.length > 30) {
									subData =
										subdisciplinesByIdMap.get(subId) ||
										null;
								}

								// If not found by ID, try by name
								if (!subData) {
									subData =
										subdisciplinesByNameMap.get(subId) ||
										null;
								}

								if (subData) {
									uniqueNames.add(subData.name);
								}
							});
						});

						docSubdisciplineNames = Array.from(uniqueNames);
					}

					return {
						documentId: doc.document_id,
						name: doc.name,
						url: doc.url,
						size: doc.size,
						documentType: doc.documentType?.name || "OTHER",
						uploadDate: doc.upload_at.toISOString(),
						title: doc.title || null,
						subdiscipline: docSubdisciplineNames,
					};
				});
			}
		}

		// Fetch academic subdiscipline from snapshot ONLY (not from live applicant data)
		// Always use snapshot data to preserve state at application time
		let snapshotSubdiscipline = null;
		if (application.ApplicationProfileSnapshot?.subdiscipline_id) {
			snapshotSubdiscipline = await prismaClient.subdiscipline.findUnique(
				{
					where: {
						subdiscipline_id:
							application.ApplicationProfileSnapshot
								.subdiscipline_id,
					},
					include: {
						discipline: {
							select: {
								name: true,
							},
						},
					},
				}
			);
		}

		// Calculate match score between applicant and post
		const matchScore = await calculateApplicationMatchScore(
			application.applicant_id,
			application.post_id
		);

		// Transform the data for the frontend
		const transformedData = {
			application: {
				applicationId: application.application_id,
				applicantId: application.applicant_id,
				postId: application.post_id,
				status: application.status,
				applyAt: application.apply_at.toISOString(),
				// Include ALL ApplicationDetail documents (uploaded files)
				// Even if they also exist in profile snapshot, show them here as uploaded documents
				// This allows the same document to appear in both "Program Requirements" and "Academic Profile"
				documents: application.details
					.filter((detail) => !detail.is_update_submission)
					.map((detail) => ({
						documentId: detail.document_id,
						name: detail.name,
						url: detail.url,
						size: detail.size,
						documentType: detail.document_type,
						uploadDate:
							detail.update_at?.toISOString() ||
							new Date().toISOString(),
					})),
				updateDocuments: application.details
					.filter((detail) => detail.is_update_submission)
					.map((detail) => ({
						documentId: detail.document_id,
						name: detail.name,
						url: detail.url,
						size: detail.size,
						documentType: detail.document_type,
						uploadDate:
							detail.update_at?.toISOString() ||
							new Date().toISOString(),
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
						country:
							application.post.institution.country || undefined,
					},
					program: application.post.programPost
						? {
								post_id: application.post.programPost.post_id,
								duration: application.post.programPost.duration,
								degree_level: application.post.degree_level,
								attendance:
									application.post.programPost.attendance,
								course_include:
									application.post.programPost
										.course_include || undefined,
								gpa: application.post.programPost.gpa
									? Number(application.post.programPost.gpa)
									: undefined,
								gre:
									application.post.programPost.gre ||
									undefined,
								gmat:
									application.post.programPost.gmat ||
									undefined,
								tuition_fee: application.post.programPost
									.tuition_fee
									? Number(
											application.post.programPost
												.tuition_fee
										)
									: undefined,
								fee_description:
									application.post.programPost
										.fee_description || undefined,
								scholarship_info:
									application.post.programPost
										.scholarship_info || undefined,
							}
						: undefined,
					scholarship: application.post.scholarshipPost
						? {
								post_id:
									application.post.scholarshipPost.post_id,
								description:
									application.post.scholarshipPost
										.description,
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
									application.post.scholarshipPost
										.eligibility || undefined,
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
									? Number(
											application.post.jobPost.min_salary
										)
									: undefined,
								max_salary: application.post.jobPost.max_salary
									? Number(
											application.post.jobPost.max_salary
										)
									: undefined,
								salary_description:
									application.post.jobPost
										.salary_description || undefined,
								benefit:
									application.post.jobPost.benefit ||
									undefined,
								main_responsibility:
									application.post.jobPost
										.main_responsibility || undefined,
								qualification_requirement:
									application.post.jobPost
										.qualification_requirement || undefined,
								experience_requirement:
									application.post.jobPost
										.experience_requirement || undefined,
								assessment_criteria:
									application.post.jobPost
										.assessment_criteria || undefined,
								other_requirement:
									application.post.jobPost
										.other_requirement || undefined,
							}
						: undefined,
				},
			},
			applicant: {
				applicantId: application.applicant.applicant_id,
				userId: application.applicant.user.id, // Include userId for messaging
				// ONLY use snapshot data - do NOT fallback to live data
				// This preserves the state at the time of application
				firstName:
					application.ApplicationProfileSnapshot?.first_name || null,
				lastName:
					application.ApplicationProfileSnapshot?.last_name || null,
				name: (() => {
					// First try snapshot user_name
					if (application.ApplicationProfileSnapshot?.user_name) {
						return application.ApplicationProfileSnapshot.user_name;
					}
					// Construct from snapshot firstName and lastName only
					const firstName =
						application.ApplicationProfileSnapshot?.first_name;
					const lastName =
						application.ApplicationProfileSnapshot?.last_name;
					return (
						`${firstName || ""} ${lastName || ""}`.trim() ||
						"Unknown"
					);
				})(),
				email:
					application.ApplicationProfileSnapshot?.user_email || null,
				image:
					application.ApplicationProfileSnapshot?.user_image || null,
				birthday:
					application.ApplicationProfileSnapshot?.birthday
						?.toISOString()
						.split("T")[0] || null,
				gender:
					application.ApplicationProfileSnapshot?.gender === true
						? "Male"
						: application.ApplicationProfileSnapshot?.gender ===
							  false
							? "Female"
							: "Not specified",
				nationality:
					application.ApplicationProfileSnapshot?.nationality || null,
				phoneNumber:
					application.ApplicationProfileSnapshot?.phone_number ||
					null,
				countryCode:
					application.ApplicationProfileSnapshot?.country_code ||
					null,
				graduated:
					application.ApplicationProfileSnapshot?.graduated ?? null,
				level: application.ApplicationProfileSnapshot?.level || null,
				// Get subdiscipline from snapshot ONLY (not live data)
				// Use snapshot's subdiscipline_id (academic) from snapshot
				subdiscipline: snapshotSubdiscipline
					? [
							{
								id: snapshotSubdiscipline.subdiscipline_id,
								name: snapshotSubdiscipline.name,
								disciplineName:
									snapshotSubdiscipline.discipline?.name ||
									"Unknown",
							},
						]
					: [],
				// Extract unique discipline names from snapshot subdisciplines ONLY
				disciplines:
					application.ApplicationProfileSnapshot?.subdiscipline_ids &&
					application.ApplicationProfileSnapshot.subdiscipline_ids
						.length > 0
						? Array.from(
								new Set(
									(
										await Promise.all(
											application.ApplicationProfileSnapshot.subdiscipline_ids.map(
												async (subId) => {
													const sub =
														await prismaClient.subdiscipline.findUnique(
															{
																where: {
																	subdiscipline_id:
																		subId,
																},
																include: {
																	discipline:
																		{
																			select: {
																				name: true,
																			},
																		},
																},
															}
														);
													return (
														sub?.discipline?.name ||
														null
													);
												}
											)
										)
									).filter(
										(name): name is string => name !== null
									)
								)
							)
						: [],
				gpa: application.ApplicationProfileSnapshot?.gpa || null,
				university:
					application.ApplicationProfileSnapshot?.university || null,
				countryOfStudy:
					application.ApplicationProfileSnapshot?.country_of_study ||
					null,
				hasForeignLanguage:
					application.ApplicationProfileSnapshot
						?.has_foreign_language ?? null,
				languages:
					application.ApplicationProfileSnapshot?.languages || null,
				// Additional snapshot data
				favoriteCountries:
					application.ApplicationProfileSnapshot
						?.favorite_countries || [],
				subdisciplineIds:
					application.ApplicationProfileSnapshot?.subdiscipline_ids ||
					[],
				// Documents from profile snapshot - ONLY show documents that were submitted with the application
				// Filtered from snapshot documents to match only those in application.details
				// Shows documents from snapshot (preserves state at application time, even if soft-deleted now)
				documents: snapshotDocuments,
				// Match score between applicant and this specific post
				matchingScore: parseInt(matchScore.replace("%", "")), // Convert percentage string to number
			},
		};

		return NextResponse.json({
			success: true,
			data: transformedData,
		});
	} catch (error) {
		if (process.env.NODE_ENV === "development") {
			// eslint-disable-next-line no-console
			console.error("❌ API: Error fetching application details:", error);
		}
		return NextResponse.json(
			{ error: "Failed to fetch application details" },
			{ status: 500 }
		);
	}
}

// PUT /api/applications/institution/[applicationId] - Update application status
export async function PUT(
	request: NextRequest,
	{ params }: { params: { applicationId: string } }
) {
	try {
		// Check if user is authenticated
		const { user } = await requireAuth();

		// Get institution for the user
		const institution = await prismaClient.institution.findUnique({
			where: { user_id: user.id },
			select: { institution_id: true, name: true },
		});

		if (!institution) {
			return NextResponse.json(
				{ error: "Only institutions can update applications" },
				{ status: 403 }
			);
		}

		const body = await request.json();
		const { status } = body;

		// Validate status - only allow ACCEPTED or REJECTED
		if (!status || !["ACCEPTED", "REJECTED"].includes(status)) {
			return NextResponse.json(
				{
					error: "Invalid status. Must be one of: ACCEPTED, REJECTED",
				},
				{ status: 400 }
			);
		}

		// SECURITY: First check if application exists and verify ownership
		const applicationExists = await prismaClient.application.findUnique({
			where: { application_id: params.applicationId },
			select: {
				application_id: true,
				post: {
					select: {
						institution_id: true,
					},
				},
			},
		});

		// If application exists but belongs to another institution, deny access
		if (
			applicationExists &&
			applicationExists.post.institution_id !== institution.institution_id
		) {
			return NextResponse.json(
				{
					error: "Access denied. This application belongs to another institution.",
				},
				{ status: 403 }
			);
		}

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
					select: {
						title: true,
					},
				},
				applicant: {
					include: {
						user: {
							select: {
								id: true,
								email: true,
							},
						},
					},
				},
			},
		});

		if (!application) {
			return NextResponse.json(
				{ error: "Application not found" },
				{ status: 404 }
			);
		}

		const oldStatus = application.status;

		// Update application status
		const updatedApplication = await prismaClient.application.update({
			where: { application_id: params.applicationId },
			data: {
				status,
			},
		});

		// Send notification to applicant about status change
		try {
			const { NotificationUtils } =
				await import("@/services/messaging/sqs-handlers");

			if (application.applicant?.user) {
				await NotificationUtils.sendApplicationStatusNotification(
					application.applicant.user.id,
					application.applicant.user.email || "",
					params.applicationId,
					application.post.title,
					oldStatus,
					status,
					institution.name
				);
			}
		} catch (notificationError) {
			// eslint-disable-next-line no-console
			console.error(
				"❌ API: Failed to send notification:",
				notificationError
			);
			// Don't fail the update if notification fails
		}

		return NextResponse.json({
			success: true,
			message: "Application status updated successfully",
			application: {
				applicationId: updatedApplication.application_id,
				status: updatedApplication.status,
			},
		});
	} catch (error) {
		if (process.env.NODE_ENV === "development") {
			// eslint-disable-next-line no-console
			console.error("❌ API: Error updating application:", error);
		}
		return NextResponse.json(
			{ error: "Failed to update application" },
			{ status: 500 }
		);
	}
}
