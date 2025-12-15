import { requireAuth } from "@/utils/auth/auth-utils";
import { NextRequest, NextResponse } from "next/server";
import { prismaClient } from "../../../../../../../prisma";

export async function GET(request: NextRequest) {
	try {
		const { searchParams } = new URL(request.url);
		const scholarshipId = searchParams.get("scholarshipId");

		if (!scholarshipId) {
			return NextResponse.json(
				{ success: false, message: "Scholarship ID is required" },
				{ status: 400 }
			);
		}

		// PLAN-BASED AUTHORIZATION: Check if user can see recommendations
		let canViewRecommendations = false;
		try {
			const { user } = await requireAuth();

			const applicant = await prismaClient.applicant.findFirst({
				where: { user_id: user.id },
				select: { applicant_id: true },
			});

			if (applicant) {
				const { canSeeRecommendations } =
					await import("@/services/authorization/authorization-service");
				const recommendationPermission = await canSeeRecommendations(
					applicant.applicant_id
				);
				canViewRecommendations = recommendationPermission.authorized;
			}
		} catch (error) {
			// User not authenticated
		}

		// If user cannot see recommendations (Free plan or not authenticated), return restricted response
		if (!canViewRecommendations) {
			return NextResponse.json({
				success: true,
				data: [],
				restricted: true,
				message:
					"Upgrade to Standard or Premium to see personalized recommendations.",
			});
		}

		// Get current scholarship details
		const currentScholarship =
			await prismaClient.opportunityPost.findUnique({
				where: { post_id: scholarshipId },
				include: {
					subdisciplines: {
						include: {
							subdiscipline: {
								include: {
									discipline: true,
								},
							},
						},
					},
				},
			});

		if (!currentScholarship) {
			return NextResponse.json(
				{ success: false, message: "Scholarship not found" },
				{ status: 404 }
			);
		}

		// Extract criteria for matching - use subdiscipline IDs
		const subdisciplineIds = currentScholarship.subdisciplines.map(
			(ps) => ps.subdiscipline.subdiscipline_id
		);
		const currentDegreeLevel = currentScholarship.degree_level;

		// If we don't have any criteria, return empty array
		if (subdisciplineIds.length === 0 && !currentDegreeLevel) {
			return NextResponse.json({
				success: true,
				data: [],
				message: "No matching criteria available",
			});
		}

		// Build query conditions - match BOTH subdiscipline AND degree level
		const whereConditions: any = {
			AND: [
				{ post_id: { not: scholarshipId } }, // Exclude current scholarship
				{ status: "PUBLISHED" },
				{ scholarshipPost: { isNot: null } }, // Must have ScholarshipPost relation
				{ end_date: { gte: new Date() } }, // Only active posts
			],
		};

		// Require both subdiscipline AND degree level to match
		if (subdisciplineIds.length > 0) {
			whereConditions.AND.push({
				subdisciplines: {
					some: {
						subdiscipline_id: {
							in: subdisciplineIds,
						},
					},
				},
			});
		}

		if (currentDegreeLevel) {
			whereConditions.AND.push({
				degree_level: currentDegreeLevel,
			});
		}

		// Fetch recommended scholarships
		const recommendedScholarships =
			await prismaClient.opportunityPost.findMany({
				where: whereConditions,
				include: {
					institution: {
						select: {
							institution_id: true,
							name: true,
							logo: true,
							country: true,
							verification_status: true,
							deleted_at: true,
						},
					},
					scholarshipPost: {
						select: {
							description: true,
							type: true,
							number: true,
							grant: true,
							scholarship_coverage: true,
							essay_required: true,
							eligibility: true,
							award_amount: true,
							award_duration: true,
							renewable: true,
						},
					},
					subdisciplines: {
						include: {
							subdiscipline: {
								include: {
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
					postDocs: {
						include: {
							documentType: {
								select: {
									document_type_id: true,
									name: true,
									description: true,
								},
							},
						},
					},
					_count: {
						select: {
							applications: true,
						},
					},
				},
				orderBy: [
					{ create_at: "desc" }, // Sort by creation date
				],
				take: 10, // Take a few extra in case we need to filter out some
			});

		// Transform the data to match the expected format
		const transformedScholarships = recommendedScholarships
			.slice(0, 9)
			.map((scholarship) => ({
				id: scholarship.post_id,
				title: scholarship.title,
				description: scholarship.description,
				location: scholarship.location,
				country: scholarship.institution?.country,
				degreeLevel: scholarship.degree_level,
				scholarshipType: scholarship.scholarshipPost?.type,
				scholarshipCoverage:
					scholarship.scholarshipPost?.scholarship_coverage,
				awardAmount: scholarship.scholarshipPost?.award_amount
					? `$${scholarship.scholarshipPost.award_amount}`
					: null,
				awardDuration: scholarship.scholarshipPost?.award_duration,
				renewable: scholarship.scholarshipPost?.renewable,
				essayRequired: scholarship.scholarshipPost?.essay_required,
				eligibility: scholarship.scholarshipPost?.eligibility,
				grant: scholarship.scholarshipPost?.grant,
				number: scholarship.scholarshipPost?.number,
				startDateFormatted: scholarship.start_date
					? new Date(scholarship.start_date).toLocaleDateString(
							"en-US",
							{
								year: "numeric",
								month: "short",
								day: "numeric",
							}
						)
					: null,
				endDateFormatted: scholarship.end_date
					? new Date(scholarship.end_date).toLocaleDateString(
							"en-US",
							{
								year: "numeric",
								month: "short",
								day: "numeric",
							}
						)
					: null,
				applicationDeadline: scholarship.end_date
					? new Date(scholarship.end_date).toLocaleDateString(
							"en-US",
							{
								year: "numeric",
								month: "short",
								day: "numeric",
							}
						)
					: null,
				daysLeft: scholarship.end_date
					? Math.max(
							0,
							Math.ceil(
								(new Date(scholarship.end_date).getTime() -
									new Date().getTime()) /
									(1000 * 60 * 60 * 24)
							)
						)
					: null,
				institution: scholarship.institution
					? {
							id: scholarship.institution.institution_id,
							name: scholarship.institution.name,
							logo: scholarship.institution.logo,
							country: scholarship.institution.country,
							status: scholarship.institution.verification_status,
							deletedAt: scholarship.institution.deleted_at,
						}
					: null,
				subdiscipline:
					scholarship.subdisciplines?.map((sub) => ({
						id: sub.subdiscipline.subdiscipline_id,
						name: sub.subdiscipline.name,
						disciplineName: sub.subdiscipline.discipline?.name,
						discipline: {
							id: sub.subdiscipline.discipline?.discipline_id,
							name: sub.subdiscipline.discipline?.name,
						},
					})) || [],
				documents:
					scholarship.postDocs?.map((doc) => ({
						document_type_id: doc.documentType.document_type_id,
						name: doc.documentType.name,
						description: doc.documentType.description,
					})) || [],
				statistics: {
					applications: {
						total: scholarship._count.applications,
					},
				},
			}));

		return NextResponse.json({
			success: true,
			data: transformedScholarships,
			message: `Found ${transformedScholarships.length} recommended scholarships`,
			criteria: {
				subdisciplineIds: subdisciplineIds,
				degreeLevel: currentDegreeLevel,
				matchType: "AND", // Both subdiscipline AND degree level must match
			},
		});
	} catch (error) {
		console.error("Error fetching recommended scholarships:", error);
		return NextResponse.json(
			{
				success: false,
				message: "Failed to fetch recommended scholarships",
				error: error instanceof Error ? error.message : "Unknown error",
			},
			{ status: 500 }
		);
	} finally {
		await prismaClient.$disconnect();
	}
}
