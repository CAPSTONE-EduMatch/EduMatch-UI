import { requireAuth } from "@/lib/auth-utils";
import { NextRequest, NextResponse } from "next/server";
import { prismaClient } from "../../../../../../prisma";

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
						documents: {
							where: {
								status: true,
								deleted_at: null,
							},
							include: {
								documentType: {
									select: {
										name: true,
										description: true,
									},
								},
							},
						},
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

		// Transform the data for the frontend
		const transformedData = {
			application: {
				applicationId: application.application_id,
				applicantId: application.applicant_id,
				postId: application.post_id,
				status: application.status,
				applyAt: application.apply_at.toISOString(),
				documents: application.details.map((detail) => ({
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
				// Documents from profile snapshot - use snapshot document IDs
				// Only include active, non-deleted documents
				documents:
					application.ApplicationProfileSnapshot?.document_ids &&
					application.ApplicationProfileSnapshot.document_ids.length >
						0
						? await Promise.all(
								application.ApplicationProfileSnapshot.document_ids.map(
									async (docId) => {
										const doc =
											await prismaClient.applicantDocument.findUnique(
												{
													where: {
														document_id: docId,
													},
													include: {
														documentType: true,
													},
												}
											);
										// Only include active, non-deleted documents
										if (
											doc &&
											doc.status === true &&
											doc.deleted_at === null
										) {
											// Fetch subdiscipline names for research papers
											let subdisciplineNames: string[] =
												[];
											if (
												doc.subdiscipline &&
												doc.subdiscipline.length > 0
											) {
												const subdisciplineData =
													await Promise.all(
														// Handle comma-separated strings (e.g., "Agricultural Science - Specialization 1, Accounting - Specialization 4")
														doc.subdiscipline
															.flatMap((item) =>
																item.includes(
																	","
																)
																	? item
																			.split(
																				","
																			)
																			.map(
																				(
																					s
																				) =>
																					s.trim()
																			)
																			.filter(
																				(
																					s
																				) =>
																					s
																			)
																	: [
																			item.trim(),
																		]
															)
															.map(
																async (
																	subId
																) => {
																	// Try to find by ID first (if it looks like an ID/UUID)
																	let sub =
																		null;
																	if (
																		subId.includes(
																			"_"
																		) &&
																		subId.length >
																			30
																	) {
																		sub =
																			await prismaClient.subdiscipline.findUnique(
																				{
																					where: {
																						subdiscipline_id:
																							subId,
																					},
																					include:
																						{
																							discipline:
																								{
																									select: {
																										name: true,
																									},
																								},
																						},
																				}
																			);
																	}

																	// If not found by ID, try by name (most common case for research papers)
																	if (!sub) {
																		sub =
																			await prismaClient.subdiscipline.findFirst(
																				{
																					where: {
																						name: subId,
																					},
																					include:
																						{
																							discipline:
																								{
																									select: {
																										name: true,
																									},
																								},
																						},
																				}
																			);
																	}

																	return sub
																		? {
																				name: sub.name,
																				disciplineName:
																					sub
																						.discipline
																						.name,
																			}
																		: null;
																}
															)
													);
												subdisciplineNames =
													subdisciplineData
														.filter(
															(
																sub
															): sub is NonNullable<
																typeof sub
															> => sub !== null
														)
														.map((sub) => sub.name);
											}

											return {
												documentId: doc.document_id,
												name: doc.name,
												url: doc.url,
												size: doc.size,
												documentType:
													doc.documentType?.name ||
													"OTHER",
												uploadDate:
													doc.upload_at.toISOString(),
												title: doc.title || null,
												subdiscipline:
													subdisciplineNames,
											};
										}
										return null;
									}
								)
							).then((docs) => docs.filter((doc) => doc !== null))
						: [],
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
			select: { institution_id: true },
		});

		if (!institution) {
			return NextResponse.json(
				{ error: "Only institutions can update applications" },
				{ status: 403 }
			);
		}

		const body = await request.json();
		const { status } = body;

		// Get application and verify it belongs to this institution
		const application = await prismaClient.application.findFirst({
			where: {
				application_id: params.applicationId,
				post: {
					institution_id: institution.institution_id,
				},
			},
		});

		if (!application) {
			return NextResponse.json(
				{ error: "Application not found" },
				{ status: 404 }
			);
		}

		// Update application status
		const updatedApplication = await prismaClient.application.update({
			where: { application_id: params.applicationId },
			data: {
				...(status && { status }),
			},
		});

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
