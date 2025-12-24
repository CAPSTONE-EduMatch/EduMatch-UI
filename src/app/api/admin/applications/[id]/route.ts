import { requireAuth } from "@/utils/auth/auth-utils";
import { NextRequest, NextResponse } from "next/server";
import { prismaClient } from "../../../../../../prisma/index";

// Get detailed information for a specific application
export async function GET(
	request: NextRequest,
	{ params }: { params: { id: string } }
) {
	try {
		// Authenticate user and check admin permissions
		await requireAuth();

		const applicationId = params.id;

		if (!applicationId) {
			return NextResponse.json(
				{
					success: false,
					error: "Application ID is required",
				},
				{ status: 400 }
			);
		}

		// Fetch application with all related data
		const application = await prismaClient.application.findUnique({
			where: {
				application_id: applicationId,
			},
			include: {
				ApplicationProfileSnapshot: true,
				details: {
					orderBy: {
						update_at: "desc",
					},
				},
				post: {
					include: {
						institution: {
							select: {
								institution_id: true,
								name: true,
								logo: true,
								country: true,
								type: true,
								website: true,
								email: true,
							},
						},
						subdisciplines: {
							include: {
								subdiscipline: {
									select: {
										subdiscipline_id: true,
										name: true,
										discipline: {
											select: {
												discipline_id: true,
												name: true,
											},
										},
									},
								},
							},
						},
						programPost: true,
						scholarshipPost: true,
						jobPost: true,
					},
				},
				applicant: {
					select: {
						applicant_id: true,
						user: {
							select: {
								id: true,
								name: true,
								email: true,
								image: true,
							},
						},
					},
				},
			},
		});

		if (!application) {
			return NextResponse.json(
				{
					success: false,
					error: "Application not found",
				},
				{ status: 404 }
			);
		}

		// Determine post type
		let postType: "Program" | "Scholarship" | "Job" = "Program";
		if (application.post.programPost) {
			postType = "Program";
		} else if (application.post.scholarshipPost) {
			postType = "Scholarship";
		} else if (application.post.jobPost) {
			postType = "Job";
		}

		// Transform the application data
		const transformedApplication = {
			id: application.application_id,
			status: application.status,
			appliedDate: application.apply_at,
			reapplyCount: application.reapply_count,
			applicant: {
				id: application.applicant.applicant_id,
				userId: application.applicant.user.id,
				name: application.applicant.user.name,
				email: application.applicant.user.email,
				image: application.applicant.user.image,
			},
			snapshot: application.ApplicationProfileSnapshot
				? {
						firstName:
							application.ApplicationProfileSnapshot.first_name,
						lastName:
							application.ApplicationProfileSnapshot.last_name,
						userName:
							application.ApplicationProfileSnapshot.user_name,
						userEmail:
							application.ApplicationProfileSnapshot.user_email,
						birthday:
							application.ApplicationProfileSnapshot.birthday,
						gender: application.ApplicationProfileSnapshot.gender,
						nationality:
							application.ApplicationProfileSnapshot.nationality,
						phoneNumber:
							application.ApplicationProfileSnapshot.phone_number,
						countryCode:
							application.ApplicationProfileSnapshot.country_code,
						profilePhoto:
							application.ApplicationProfileSnapshot
								.profile_photo,
						graduated:
							application.ApplicationProfileSnapshot.graduated,
						level: application.ApplicationProfileSnapshot.level,
						gpa: application.ApplicationProfileSnapshot.gpa,
						university:
							application.ApplicationProfileSnapshot.university,
						countryOfStudy:
							application.ApplicationProfileSnapshot
								.country_of_study,
						hasForeignLanguage:
							application.ApplicationProfileSnapshot
								.has_foreign_language,
						languages:
							application.ApplicationProfileSnapshot.languages,
						favoriteCountries:
							application.ApplicationProfileSnapshot
								.favorite_countries,
						subdisciplineIds:
							application.ApplicationProfileSnapshot
								.subdiscipline_ids,
						documentIds:
							application.ApplicationProfileSnapshot.document_ids,
					}
				: null,
			documents: application.details.map((doc) => ({
				id: doc.document_id,
				name: doc.name,
				url: doc.url,
				size: doc.size,
				documentType: doc.document_type,
				updateAt: doc.update_at,
				isUpdateSubmission: doc.is_update_submission,
			})),
			post: {
				id: application.post.post_id,
				title: application.post.title,
				description: application.post.description,
				startDate: application.post.start_date,
				endDate: application.post.end_date,
				location: application.post.location,
				degreeLevel: application.post.degree_level,
				status: application.post.status,
				type: postType,
				institution: {
					id: application.post.institution.institution_id,
					name: application.post.institution.name,
					logo: application.post.institution.logo,
					country: application.post.institution.country,
					type: application.post.institution.type,
					website: application.post.institution.website,
					email: application.post.institution.email,
				},
				subdisciplines: application.post.subdisciplines.map((sub) => ({
					id: sub.subdiscipline.subdiscipline_id,
					name: sub.subdiscipline.name,
					discipline: {
						id: sub.subdiscipline.discipline.discipline_id,
						name: sub.subdiscipline.discipline.name,
					},
				})),
			},
		};

		return NextResponse.json({
			success: true,
			application: transformedApplication,
		});
	} catch (error) {
		// eslint-disable-next-line no-console
		console.error("Error fetching application details:", error);
		return NextResponse.json(
			{
				success: false,
				error: "Failed to fetch application details",
				message:
					error instanceof Error ? error.message : "Unknown error",
			},
			{ status: 500 }
		);
	}
}
