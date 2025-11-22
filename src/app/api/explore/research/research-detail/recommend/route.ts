import { NextRequest, NextResponse } from "next/server";
import { prismaClient } from "../../../../../../../prisma";

export async function GET(request: NextRequest) {
	try {
		const { searchParams } = new URL(request.url);
		const researchLabId = searchParams.get("researchLabId");

		if (!researchLabId) {
			return NextResponse.json(
				{ success: false, message: "Research Lab ID is required" },
				{ status: 400 }
			);
		}

		// Get current research lab details
		const currentLab = await prismaClient.opportunityPost.findUnique({
			where: { post_id: researchLabId },
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

		if (!currentLab) {
			return NextResponse.json(
				{ success: false, message: "Research lab not found" },
				{ status: 404 }
			);
		}

		// Extract criteria for matching
		const currentDiscipline =
			currentLab.subdisciplines?.[0]?.subdiscipline?.discipline?.name;
		const currentDegreeLevel = currentLab.degree_level;

		// If we don't have any criteria, return empty array
		if (!currentDiscipline && !currentDegreeLevel) {
			return NextResponse.json({
				success: true,
				data: [],
				message: "No matching criteria available",
			});
		}

		// Build query conditions - match either discipline OR degree level
		const whereConditions: any = {
			post_id: { not: researchLabId }, // Exclude current research lab
			status: "PUBLISHED",
			jobPost: { isNot: null }, // Must have JobPost relation
			// end_date: { gte: new Date() }, // Only active posts
		};

		// Create OR condition for discipline OR degree level match
		const orConditions: any[] = [];

		if (currentDiscipline) {
			orConditions.push({
				subdisciplines: {
					some: {
						subdiscipline: {
							discipline: {
								name: currentDiscipline,
							},
						},
					},
				},
			});
		}

		if (currentDegreeLevel) {
			orConditions.push({
				degree_level: currentDegreeLevel,
			});
		}

		// Only add OR condition if we have at least one criteria
		if (orConditions.length > 0) {
			whereConditions.OR = orConditions;
		}

		// Fetch recommended research labs
		const recommendedLabs = await prismaClient.opportunityPost.findMany({
			where: whereConditions,
			include: {
				institution: {
					select: {
						institution_id: true,
						name: true,
						logo: true,
						country: true,
						status: true,
						deleted_at: true,
					},
				},
				jobPost: {
					select: {
						contract_type: true,
						job_type: true,
						min_salary: true,
						max_salary: true,
						salary_description: true,
						main_responsibility: true,
						qualification_requirement: true,
						experience_requirement: true,
						assessment_criteria: true,
						other_requirement: true,
						academic_background: true,
						research_areas: true,
						research_focus: true,
						technical_skills: true,
						professor_name: true,
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
		const transformedLabs = recommendedLabs.slice(0, 9).map((lab) => ({
			id: lab.post_id,
			title: lab.title,
			description: lab.description,
			location: lab.location,
			country: lab.institution?.country,
			salary: lab.jobPost?.max_salary
				? `Up to $${lab.jobPost.max_salary}`
				: lab.jobPost?.salary_description || "Competitive",
			jobType: lab.jobPost?.job_type,
			degreeLevel: lab.degree_level,
			contractType: lab.jobPost?.contract_type,
			startDateFormatted: lab.start_date
				? new Date(lab.start_date).toLocaleDateString("en-US", {
						year: "numeric",
						month: "short",
						day: "numeric",
					})
				: null,
			endDateFormatted: lab.end_date
				? new Date(lab.end_date).toLocaleDateString("en-US", {
						year: "numeric",
						month: "short",
						day: "numeric",
					})
				: null,
			applicationDeadline: lab.end_date
				? new Date(lab.end_date).toLocaleDateString("en-US", {
						year: "numeric",
						month: "short",
						day: "numeric",
					})
				: null,
			daysLeft: lab.end_date
				? Math.max(
						0,
						Math.ceil(
							(new Date(lab.end_date).getTime() -
								new Date().getTime()) /
								(1000 * 60 * 60 * 24)
						)
					)
				: null,
			institution: lab.institution.name,
			subdiscipline:
				lab.subdisciplines?.map((sub) => ({
					id: sub.subdiscipline.subdiscipline_id,
					name: sub.subdiscipline.name,
					disciplineName: sub.subdiscipline.discipline?.name,
					discipline: {
						id: sub.subdiscipline.discipline?.discipline_id,
						name: sub.subdiscipline.discipline?.name,
					},
				})) || [],
			documents:
				lab.postDocs?.map((doc) => ({
					document_type_id: doc.documentType.document_type_id,
					name: doc.documentType.name,
					description: doc.documentType.description,
				})) || [],
			statistics: {
				applications: {
					total: lab._count.applications,
				},
			},
			// Additional job-specific fields
			mainResponsibility: lab.jobPost?.main_responsibility,
			qualificationRequirement: lab.jobPost?.qualification_requirement,
			experienceRequirement: lab.jobPost?.experience_requirement,
			researchAreas: lab.jobPost?.research_areas,
			researchFocus: lab.jobPost?.research_focus,
			technicalSkills: lab.jobPost?.technical_skills,
			professorName: lab.jobPost?.professor_name,
		}));

		return NextResponse.json({
			success: true,
			data: transformedLabs,
			message: `Found ${transformedLabs.length} recommended research labs`,
			criteria: {
				discipline: currentDiscipline,
				degreeLevel: currentDegreeLevel,
				matchType: "OR", // Either discipline OR degree level
			},
		});
	} catch (error) {
		console.error("Error fetching recommended research labs:", error);
		return NextResponse.json(
			{
				success: false,
				message: "Failed to fetch recommended research labs",
				error: error instanceof Error ? error.message : "Unknown error",
			},
			{ status: 500 }
		);
	} finally {
		await prismaClient.$disconnect();
	}
}
