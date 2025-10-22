import { NextRequest, NextResponse } from "next/server";
import { prismaClient } from "../../../../../prisma";
import { PostStatus } from "@prisma/client";
import { auth } from "@/app/lib/auth";
import { v4 as uuidv4 } from "uuid";

interface CreateResearchLabRequest {
	// Overview Section
	jobName: string;
	startDate: string;
	applicationDeadline: string;
	country: string;
	researchFields: string[];
	typeOfContract: string;
	attendance: string;
	jobType: string;

	// Offer Information Section
	salary: {
		min: string;
		max: string;
		description: string;
	};
	benefit: string;

	// Job Requirements Section
	mainResponsibility: string;
	qualificationRequirement: string;
	experienceRequirement: string;
	assessmentCriteria: string;
	otherRequirement: string;

	// Lab Details Section
	labDescription: string;
	labType: string;
	researchFocus: string;
	labCapacity: string;

	// Research Areas
	researchAreas: string;

	// Lab Facilities
	labFacilities: string;

	// Research Requirements
	researchRequirements: {
		academicBackground: string;
		researchExperience: string;
		technicalSkills: string;
	};

	// Application Requirements
	applicationRequirements: {
		documents: string;
		researchProposal: string;
		recommendations: string;
	};

	// Lab Information
	labInformation: {
		director: string;
		contactEmail: string;
		website: string;
	};

	// File Requirements
	fileRequirements: {
		fileName: string;
		fileDescription: string;
	};

	// Additional Information
	additionalInformation: {
		content: string;
	};

	// Status
	status?: PostStatus;
}

export async function POST(request: NextRequest) {
	try {
		const body: CreateResearchLabRequest = await request.json();

		// Get user from session
		const session = await auth.api.getSession({
			headers: request.headers,
		});
		if (!session?.user?.id) {
			return NextResponse.json(
				{ error: "User not authenticated" },
				{ status: 401 }
			);
		}

		// Get institution for the user
		const institution = await prismaClient.institution.findUnique({
			where: { user_id: session.user.id },
		});

		if (!institution) {
			return NextResponse.json(
				{ error: "Institution not found" },
				{ status: 404 }
			);
		}

		// Parse dates with validation
		const startDate = new Date(body.startDate);
		const applicationDeadline = new Date(body.applicationDeadline);

		// Validate dates
		if (isNaN(startDate.getTime())) {
			return NextResponse.json(
				{ error: "Invalid start date format" },
				{ status: 400 }
			);
		}
		if (isNaN(applicationDeadline.getTime())) {
			return NextResponse.json(
				{ error: "Invalid application deadline format" },
				{ status: 400 }
			);
		}

		// Check if dates are in the future (today or later)
		const today = new Date();
		today.setHours(0, 0, 0, 0); // Reset time to start of day

		if (startDate < today) {
			return NextResponse.json(
				{ error: "Start date must be today or in the future" },
				{ status: 400 }
			);
		}
		if (applicationDeadline < today) {
			return NextResponse.json(
				{
					error: "Application deadline must be today or in the future",
				},
				{ status: 400 }
			);
		}

		// Create the opportunity post
		const opportunityPost = await prismaClient.opportunityPost.create({
			data: {
				post_id: uuidv4(),
				title: body.jobName,
				start_date: startDate,
				end_date: applicationDeadline,
				location: body.country,
				other_info: body.labDescription,
				status: body.status || "DRAFT", // Use provided status or default to DRAFT
				create_at: new Date(),
				institution_id: institution.institution_id,
			},
		});

		// Create the job post (research position)
		await prismaClient.jobPost.create({
			data: {
				post_id: opportunityPost.post_id,
				contract_type: body.typeOfContract,
				attendance: body.attendance,
				job_type: body.jobType,
				min_salary: body.salary.min
					? parseFloat(body.salary.min)
					: null,
				max_salary: body.salary.max
					? parseFloat(body.salary.max)
					: null,
				salary_description: body.salary.description,
				benefit: body.benefit,
				main_responsibility: body.mainResponsibility,
				qualification_requirement: body.qualificationRequirement,
				experience_requirement: body.experienceRequirement,
				assessment_criteria: body.assessmentCriteria,
				other_requirement: body.otherRequirement,
				lab_type: body.labType,
				research_focus: body.researchFocus,
				lab_capacity: body.labCapacity
					? parseInt(body.labCapacity)
					: null,
				research_areas: body.researchAreas,
				lab_facilities: body.labFacilities,
				lab_director: body.labInformation.director,
				lab_contact_email: body.labInformation.contactEmail,
				lab_website: body.labInformation.website,
				academic_background:
					body.researchRequirements.academicBackground,
				research_experience:
					body.researchRequirements.researchExperience,
				technical_skills: body.researchRequirements.technicalSkills,
				application_documents: body.applicationRequirements.documents,
				research_proposal:
					body.applicationRequirements.researchProposal,
				recommendations: body.applicationRequirements.recommendations,
			},
		});

		// Create post documents for file requirements
		if (
			body.fileRequirements.fileName &&
			body.fileRequirements.fileDescription
		) {
			// First, get or create a document type for "Research Documents"
			let documentType = await prismaClient.documentType.findFirst({
				where: { name: "Research Documents" },
			});

			if (!documentType) {
				documentType = await prismaClient.documentType.create({
					data: {
						document_type_id: `doc_type_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
						name: "Research Documents",
						description:
							"Documents required for research position application",
					},
				});
			}

			await prismaClient.postDocument.create({
				data: {
					document_id: `doc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
					post_id: opportunityPost.post_id,
					document_type_id: documentType.document_type_id,
					name: body.fileRequirements.fileName,
					description: body.fileRequirements.fileDescription,
				},
			});
		}

		// Link to subdisciplines (research fields)
		if (body.researchFields && body.researchFields.length > 0) {
			for (const researchField of body.researchFields) {
				const subdiscipline =
					await prismaClient.subdiscipline.findFirst({
						where: { name: researchField },
					});

				if (subdiscipline) {
					await prismaClient.postSubdiscipline.create({
						data: {
							subdiscipline_id: subdiscipline.subdiscipline_id,
							post_id: opportunityPost.post_id,
							add_at: new Date(),
						},
					});
				}
			}
		}

		return NextResponse.json({
			success: true,
			post: {
				id: opportunityPost.post_id,
				title: opportunityPost.title,
				status: opportunityPost.status,
			},
		});
	} catch (error) {
		// eslint-disable-next-line no-console
		console.error("Error creating research lab post:", error);
		return NextResponse.json(
			{
				error: "Failed to create research lab post",
				details:
					error instanceof Error ? error.message : "Unknown error",
			},
			{ status: 500 }
		);
	}
}
