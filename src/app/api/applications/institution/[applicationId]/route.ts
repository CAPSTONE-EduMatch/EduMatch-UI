import { requireAuth } from "@/lib/auth-utils";
import { NextRequest, NextResponse } from "next/server";
import { prismaClient } from "../../../../../../prisma";
import { randomUUID } from "crypto";

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

		// Get application with detailed applicant information including profile snapshot
		const application = await prismaClient.application.findFirst({
			where: {
				application_id: params.applicationId,
				post: {
					institution_id: institution.institution_id,
				},
			},
			include: {
				ApplicationProfileSnapshot: true, // Include the profile snapshot
				updateRequests: {
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
				},
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
				// Use findMany with 'in' for better performance when fetching multiple documents
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

		// Transform the data for the frontend
		const transformedData = {
			application: {
				applicationId: application.application_id,
				applicantId: application.applicant_id,
				postId: application.post_id,
				status: application.status,
				applyAt: application.apply_at.toISOString(),
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
						updateRequestId: detail.update_request_id,
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
				// Use snapshot data if available, otherwise fallback to live data
				firstName:
					application.ApplicationProfileSnapshot?.first_name ||
					application.applicant.first_name,
				lastName:
					application.ApplicationProfileSnapshot?.last_name ||
					application.applicant.last_name,
				name:
					application.ApplicationProfileSnapshot?.user_name ||
					application.applicant.user.name ||
					`${application.applicant.first_name || ""} ${application.applicant.last_name || ""}`.trim(),
				email:
					application.ApplicationProfileSnapshot?.user_email ||
					application.applicant.user.email,
				image:
					application.ApplicationProfileSnapshot?.user_image ||
					application.applicant.user.image,
				birthday:
					application.ApplicationProfileSnapshot?.birthday
						?.toISOString()
						.split("T")[0] ||
					application.applicant.birthday?.toISOString().split("T")[0],
				gender:
					application.ApplicationProfileSnapshot?.gender === true
						? "Male"
						: application.ApplicationProfileSnapshot?.gender ===
							  false
							? "Female"
							: application.applicant.gender === true
								? "Male"
								: application.applicant.gender === false
									? "Female"
									: "Not specified",
				nationality:
					application.ApplicationProfileSnapshot?.nationality ||
					application.applicant.nationality,
				phoneNumber:
					application.ApplicationProfileSnapshot?.phone_number ||
					application.applicant.phone_number,
				countryCode:
					application.ApplicationProfileSnapshot?.country_code ||
					application.applicant.country_code,
				graduated:
					application.ApplicationProfileSnapshot?.graduated ??
					application.applicant.graduated,
				level:
					application.ApplicationProfileSnapshot?.level ||
					application.applicant.level,
				// Fetch subdiscipline and discipline names from IDs
				subdiscipline:
					application.ApplicationProfileSnapshot?.subdiscipline_ids &&
					application.ApplicationProfileSnapshot.subdiscipline_ids
						.length > 0
						? (
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
															discipline: {
																select: {
																	name: true,
																},
															},
														},
													}
												);
											return sub
												? {
														id: sub.subdiscipline_id,
														name: sub.name,
														disciplineName:
															sub.discipline.name,
													}
												: null;
										}
									)
								)
							).filter(
								(sub): sub is NonNullable<typeof sub> =>
									sub !== null
							)
						: application.applicant.subdiscipline
							? [
									{
										id: application.applicant.subdiscipline
											.subdiscipline_id,
										name: application.applicant
											.subdiscipline.name,
										disciplineName:
											application.applicant.subdiscipline
												.discipline?.name || "Unknown",
									},
								]
							: [],
				// Extract unique discipline names from subdisciplines
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
						: application.applicant.subdiscipline?.discipline?.name
							? [
									application.applicant.subdiscipline
										.discipline.name,
								]
							: [],
				gpa:
					application.ApplicationProfileSnapshot?.gpa ||
					application.applicant.gpa,
				university:
					application.ApplicationProfileSnapshot?.university ||
					application.applicant.university,
				countryOfStudy:
					application.ApplicationProfileSnapshot?.country_of_study ||
					application.applicant.country_of_study,
				hasForeignLanguage:
					application.ApplicationProfileSnapshot
						?.has_foreign_language ??
					application.applicant.has_foreign_language,
				languages:
					application.ApplicationProfileSnapshot?.languages ||
					application.applicant.languages,
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
			},
		};

		// Add update requests to response
		const responseData = {
			...transformedData,
			updateRequests: application.updateRequests.map((req) => ({
				updateRequestId: req.update_request_id,
				requestMessage: req.request_message,
				requestedDocuments: req.requested_documents,
				status: req.status,
				createdAt: req.created_at.toISOString(),
				responseSubmittedAt: req.response_submitted_at?.toISOString(),
				responseMessage: req.response_message,
				requestedBy: {
					userId: req.requestedBy.id,
					name: req.requestedBy.name,
					email: req.requestedBy.email,
				},
				responseDocuments: req.responseDocuments.map((doc) => ({
					documentId: doc.document_id,
					name: doc.name,
					url: doc.url,
					size: doc.size,
					documentType: doc.document_type,
					updatedAt: doc.update_at?.toISOString(),
				})),
			})),
		};

		return NextResponse.json({
			success: true,
			data: responseData,
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
		const { status, message } = body;

		// Validate status
		if (
			!status ||
			![
				"SUBMITTED",
				"REQUIRE_UPDATE",
				"ACCEPTED",
				"REJECTED",
				"UPDATED",
			].includes(status)
		) {
			return NextResponse.json(
				{
					error: "Invalid status. Must be one of: SUBMITTED, REQUIRE_UPDATE, ACCEPTED, REJECTED, UPDATED",
				},
				{ status: 400 }
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

		// If status is REQUIRE_UPDATE, create an ApplicationUpdateRequest record
		if (status === "REQUIRE_UPDATE" && message && message.trim()) {
			try {
				// Extract requested documents from message (if mentioned) or leave empty
				// Frontend can send requestedDocuments array if needed
				const { requestedDocuments } = body;

				await prismaClient.applicationUpdateRequest.create({
					data: {
						update_request_id: randomUUID(),
						application_id: params.applicationId,
						requested_by_user_id: user.id,
						request_message: message.trim(),
						requested_documents: requestedDocuments || [],
						status: "PENDING",
						created_at: new Date(),
					},
				});
			} catch (updateRequestError) {
				// eslint-disable-next-line no-console
				console.error(
					"❌ API: Failed to create update request:",
					updateRequestError
				);
				// Don't fail the status update if update request creation fails
			}
		}

		// Send notification to applicant about status change
		try {
			const { NotificationUtils } = await import("@/lib/sqs-handlers");

			if (application.applicant?.user) {
				await NotificationUtils.sendApplicationStatusNotification(
					application.applicant.user.id,
					application.applicant.user.email || "",
					params.applicationId,
					application.post.title,
					oldStatus,
					status,
					institution.name,
					message && status === "REQUIRE_UPDATE"
						? message.trim()
						: undefined
				);

				// If there's a message (for REQUIRE_UPDATE status), send it via Box messaging
				if (message && message.trim() && status === "REQUIRE_UPDATE") {
					try {
						// Get or create a Box between institution and applicant
						let box = await prismaClient.box.findFirst({
							where: {
								OR: [
									{
										user_one_id: user.id,
										user_two_id:
											application.applicant.user.id,
									},
									{
										user_one_id:
											application.applicant.user.id,
										user_two_id: user.id,
									},
								],
							},
						});

						// Create box if it doesn't exist
						if (!box) {
							box = await prismaClient.box.create({
								data: {
									box_id: randomUUID(),
									user_one_id: user.id,
									user_two_id: application.applicant.user.id,
									created_at: new Date(),
									updated_at: new Date(),
								},
							});
						}

						// Create message
						await prismaClient.message.create({
							data: {
								message_id: randomUUID(),
								box_id: box.box_id,
								sender_id: user.id,
								body: message.trim(),
								send_at: new Date(),
							},
						});
					} catch (messageError) {
						// eslint-disable-next-line no-console
						console.error(
							"❌ API: Failed to send message:",
							messageError
						);
						// Don't fail the update if message sending fails
					}
				}
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
