import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/app/lib/auth";
import { prismaClient } from "../../../../../../prisma";

// GET /api/applications/institution/[applicationId] - Get detailed applicant information for institutions
export async function GET(
	request: NextRequest,
	{ params }: { params: { applicationId: string } }
) {
	try {
		console.log(
			"🔵 API: Get institution application details request received:",
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

		// Get institution for the user
		const institution = await prismaClient.institution.findUnique({
			where: { user_id: session.user.id },
			select: { institution_id: true, name: true },
		});

		if (!institution) {
			console.log("❌ API: User is not an institution");
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
				profileSnapshot: true, // Include the profile snapshot
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
								name: true,
								discipline: {
									select: {
										name: true,
									},
								},
							},
						},
						documents: {
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
			console.log(
				"❌ API: Application not found or not owned by institution"
			);
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
					application.profileSnapshot?.first_name ||
					application.applicant.first_name,
				lastName:
					application.profileSnapshot?.last_name ||
					application.applicant.last_name,
				name:
					application.profileSnapshot?.user_name ||
					application.applicant.user.name ||
					`${application.applicant.first_name || ""} ${application.applicant.last_name || ""}`.trim(),
				email:
					application.profileSnapshot?.user_email ||
					application.applicant.user.email,
				image:
					application.profileSnapshot?.user_image ||
					application.applicant.user.image,
				birthday:
					application.profileSnapshot?.birthday
						?.toISOString()
						.split("T")[0] ||
					application.applicant.birthday?.toISOString().split("T")[0],
				gender:
					application.profileSnapshot?.gender === true
						? "Male"
						: application.profileSnapshot?.gender === false
							? "Female"
							: application.applicant.gender === true
								? "Male"
								: application.applicant.gender === false
									? "Female"
									: "Not specified",
				nationality:
					application.profileSnapshot?.nationality ||
					application.applicant.nationality,
				phoneNumber:
					application.profileSnapshot?.phone_number ||
					application.applicant.phone_number,
				countryCode:
					application.profileSnapshot?.country_code ||
					application.applicant.country_code,
				graduated:
					application.profileSnapshot?.graduated ??
					application.applicant.graduated,
				level:
					application.profileSnapshot?.level ||
					application.applicant.level,
				// For subdisciplines, we need to fetch the names from the IDs
				subdiscipline:
					(application.profileSnapshot?.subdiscipline_ids?.length ??
						0) > 0
						? `${application.profileSnapshot?.subdiscipline_ids?.length ?? 0} interests`
						: application.applicant.subdiscipline?.name ||
							"Unknown",
				discipline: "Multiple disciplines", // We'll need to fetch this from the subdiscipline IDs
				gpa:
					application.profileSnapshot?.gpa ||
					application.applicant.gpa,
				university:
					application.profileSnapshot?.university ||
					application.applicant.university,
				countryOfStudy:
					application.profileSnapshot?.country_of_study ||
					application.applicant.country_of_study,
				hasForeignLanguage:
					application.profileSnapshot?.has_foreign_language ??
					application.applicant.has_foreign_language,
				languages:
					application.profileSnapshot?.languages ||
					application.applicant.languages,
				// Additional snapshot data
				favoriteCountries:
					application.profileSnapshot?.favorite_countries || [],
				subdisciplineIds:
					application.profileSnapshot?.subdiscipline_ids || [],
				// Documents from profile snapshot - use snapshot document IDs
				// Include soft-deleted documents for profile snapshots to preserve historical data
				documents:
					application.profileSnapshot?.document_ids &&
					application.profileSnapshot.document_ids.length > 0
						? await Promise.all(
								application.profileSnapshot.document_ids.map(
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
										return doc
											? {
													documentId: doc.document_id,
													name: doc.name,
													url: doc.url,
													size: doc.size,
													documentType:
														doc.documentType
															?.name || "OTHER",
													uploadDate:
														doc.upload_at.toISOString(),
													// Include status info for debugging
													isActive: doc.status,
													deletedAt:
														doc.deleted_at?.toISOString(),
												}
											: null;
									}
								)
							).then((docs) => docs.filter((doc) => doc !== null))
						: [],
			},
		};

		console.log("✅ API: Application details retrieved successfully");
		return NextResponse.json({
			success: true,
			data: transformedData,
		});
	} catch (error) {
		console.error("❌ API: Error fetching application details:", error);
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
		console.log(
			"🔵 API: Update application status request received:",
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

		// Get institution for the user
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

		const body = await request.json();
		const { status, notes } = body;

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
			console.log(
				"❌ API: Application not found or not owned by institution"
			);
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

		console.log("✅ API: Application status updated successfully");
		return NextResponse.json({
			success: true,
			message: "Application status updated successfully",
			application: {
				applicationId: updatedApplication.application_id,
				status: updatedApplication.status,
			},
		});
	} catch (error) {
		console.error("❌ API: Error updating application:", error);
		return NextResponse.json(
			{ error: "Failed to update application" },
			{ status: 500 }
		);
	}
}
