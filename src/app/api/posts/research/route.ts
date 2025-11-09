import { NextRequest, NextResponse } from "next/server";
import { prismaClient } from "../../../../../prisma";
import { PostStatus } from "@prisma/client";
import { requireAuth } from "@/utils/auth/auth-utils";
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
	degree_level: string;

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
		const { user } = await requireAuth();
		if (!user.id) {
			return NextResponse.json(
				{ error: "User not authenticated" },
				{ status: 401 }
			);
		}

		// Get institution for the user
		const institution = await prismaClient.institution.findUnique({
			where: { user_id: user.id },
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
				degree_level: body.degree_level || "RESEARCH", // Add required degree_level field
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

export async function PUT(request: NextRequest) {
	try {
		const body: CreateResearchLabRequest & { postId: string } =
			await request.json();
		const { postId, ...updateData } = body;

		if (!postId) {
			return NextResponse.json(
				{ error: "Post ID is required for update" },
				{ status: 400 }
			);
		}

		// Get user from session
		const { user } = await requireAuth();
		if (!user.id) {
			return NextResponse.json(
				{ error: "User not authenticated" },
				{ status: 401 }
			);
		}

		// Get institution for the user
		const institution = await prismaClient.institution.findUnique({
			where: { user_id: user.id },
		});

		if (!institution) {
			return NextResponse.json(
				{ error: "Institution not found" },
				{ status: 404 }
			);
		}

		// Verify the post belongs to this institution
		const existingPost = await prismaClient.opportunityPost.findFirst({
			where: {
				post_id: postId,
				institution_id: institution.institution_id,
			},
		});

		if (!existingPost) {
			return NextResponse.json(
				{ error: "Post not found or access denied" },
				{ status: 404 }
			);
		}

		// Parse dates with validation
		const startDate = new Date(updateData.startDate);
		const applicationDeadline = new Date(updateData.applicationDeadline);

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

		// Update the opportunity post
		await prismaClient.opportunityPost.update({
			where: { post_id: postId },
			data: {
				title: updateData.jobName,
				start_date: startDate,
				end_date: applicationDeadline,
				location: updateData.country,
				other_info: updateData.labDescription,
				degree_level: updateData.degree_level || "RESEARCH",
				...(updateData.status && { status: updateData.status }),
			},
		});

		// Update the job post (research position)
		await prismaClient.jobPost.update({
			where: { post_id: postId },
			data: {
				contract_type: updateData.typeOfContract,
				attendance: updateData.attendance,
				job_type: updateData.jobType,
				min_salary: updateData.salary.min
					? parseFloat(updateData.salary.min)
					: null,
				max_salary: updateData.salary.max
					? parseFloat(updateData.salary.max)
					: null,
				salary_description: updateData.salary.description,
				benefit: updateData.benefit,
				main_responsibility: updateData.mainResponsibility,
				qualification_requirement: updateData.qualificationRequirement,
				experience_requirement: updateData.experienceRequirement,
				assessment_criteria: updateData.assessmentCriteria,
				other_requirement: updateData.otherRequirement,
				lab_type: updateData.labType,
				research_focus: updateData.researchFocus,
				lab_capacity: updateData.labCapacity
					? parseInt(updateData.labCapacity)
					: null,
				research_areas: updateData.researchAreas,
				lab_facilities: updateData.labFacilities,
				lab_director: updateData.labInformation.director,
				lab_contact_email: updateData.labInformation.contactEmail,
				lab_website: updateData.labInformation.website,
				academic_background:
					updateData.researchRequirements.academicBackground,
				research_experience:
					updateData.researchRequirements.researchExperience,
				technical_skills:
					updateData.researchRequirements.technicalSkills,
				application_documents:
					updateData.applicationRequirements.documents,
				research_proposal:
					updateData.applicationRequirements.researchProposal,
				recommendations:
					updateData.applicationRequirements.recommendations,
			},
		});

		// Delete existing documents and recreate
		await prismaClient.postDocument.deleteMany({
			where: { post_id: postId },
		});

		if (
			updateData.fileRequirements.fileName &&
			updateData.fileRequirements.fileDescription
		) {
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
					post_id: postId,
					document_type_id: documentType.document_type_id,
					name: updateData.fileRequirements.fileName,
					description: updateData.fileRequirements.fileDescription,
				},
			});
		}

		// Delete existing subdisciplines and recreate
		await prismaClient.postSubdiscipline.deleteMany({
			where: { post_id: postId },
		});

		if (updateData.researchFields && updateData.researchFields.length > 0) {
			for (const researchField of updateData.researchFields) {
				const subdiscipline =
					await prismaClient.subdiscipline.findFirst({
						where: { name: researchField },
					});

				if (subdiscipline) {
					await prismaClient.postSubdiscipline.create({
						data: {
							subdiscipline_id: subdiscipline.subdiscipline_id,
							post_id: postId,
							add_at: new Date(),
						},
					});
				}
			}
		}

		return NextResponse.json({
			success: true,
			post: {
				id: postId,
				title: updateData.jobName,
			},
		});
	} catch (error) {
		console.error("Error updating research lab post:", error);
		return NextResponse.json(
			{
				error: "Failed to update research lab post",
				details:
					error instanceof Error ? error.message : "Unknown error",
			},
			{ status: 500 }
		);
	}
}
