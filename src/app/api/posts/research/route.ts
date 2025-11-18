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
	professorName?: string;
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

	// File Requirements - optional
	fileRequirements?: {
		fileName?: string;
		fileDescription?: string;
	};

	// Additional Information - optional
	additionalInformation?: {
		content?: string;
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

		// Check if a published post with the same title already exists
		const existingPost = await prismaClient.opportunityPost.findFirst({
			where: {
				institution_id: institution.institution_id,
				title: body.jobName,
				status: "PUBLISHED",
			},
		});

		if (existingPost) {
			return NextResponse.json(
				{
					error: `A published post with the title "${body.jobName}" already exists. Please use a different title.`,
				},
				{ status: 409 } // 409 Conflict
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
				other_info: body.additionalInformation?.content || null,
				status: body.status || "DRAFT", // Use provided status or default to DRAFT
				create_at: new Date(),
				institution_id: institution.institution_id,
				degree_level: body.degree_level || "RESEARCH", // Add required degree_level field
			},
		});

		// Validate salary min/max
		let minSalary: number | null = null;
		let maxSalary: number | null = null;

		if (body.salary.min) {
			const minValue = parseFloat(body.salary.min);
			if (isNaN(minValue)) {
				// eslint-disable-next-line no-console
				console.error("Invalid min_salary value:", body.salary.min);
				return NextResponse.json(
					{ error: "Invalid minimum salary value" },
					{ status: 400 }
				);
			}
			if (minValue < 0) {
				// eslint-disable-next-line no-console
				console.error("Min salary cannot be negative:", minValue);
				return NextResponse.json(
					{ error: "Minimum salary must be a positive number" },
					{ status: 400 }
				);
			}
			minSalary = minValue;
		}

		if (body.salary.max) {
			const maxValue = parseFloat(body.salary.max);
			if (isNaN(maxValue)) {
				// eslint-disable-next-line no-console
				console.error("Invalid max_salary value:", body.salary.max);
				return NextResponse.json(
					{ error: "Invalid maximum salary value" },
					{ status: 400 }
				);
			}
			if (maxValue < 0) {
				// eslint-disable-next-line no-console
				console.error("Max salary cannot be negative:", maxValue);
				return NextResponse.json(
					{ error: "Maximum salary must be a positive number" },
					{ status: 400 }
				);
			}
			maxSalary = maxValue;
		}

		// Validate min <= max
		if (minSalary !== null && maxSalary !== null && minSalary > maxSalary) {
			// eslint-disable-next-line no-console
			console.error("Min salary cannot be greater than max salary:", {
				min: minSalary,
				max: maxSalary,
			});
			return NextResponse.json(
				{
					error: "Minimum salary must be less than or equal to maximum salary",
				},
				{ status: 400 }
			);
		}

		// Validate lab capacity
		let labCapacity: number | null = null;
		if (body.labCapacity) {
			const capacityValue = parseInt(body.labCapacity);
			if (isNaN(capacityValue)) {
				// eslint-disable-next-line no-console
				console.error("Invalid lab_capacity value:", body.labCapacity);
				return NextResponse.json(
					{ error: "Invalid lab capacity value" },
					{ status: 400 }
				);
			}
			if (capacityValue <= 0) {
				// eslint-disable-next-line no-console
				console.error(
					"Lab capacity must be greater than 0:",
					capacityValue
				);
				return NextResponse.json(
					{ error: "Lab capacity must be greater than 0" },
					{ status: 400 }
				);
			}
			if (capacityValue > 10000) {
				// eslint-disable-next-line no-console
				console.error("Lab capacity exceeds maximum:", capacityValue);
				return NextResponse.json(
					{ error: "Lab capacity must be less than 10,000" },
					{ status: 400 }
				);
			}
			labCapacity = capacityValue;
		}

		// Create the job post (research position)
		await prismaClient.jobPost.create({
			data: {
				post_id: opportunityPost.post_id,
				contract_type: body.typeOfContract,
				attendance: body.attendance,
				job_type: body.jobType,
				professor_name: body.professorName || null,
				min_salary: minSalary,
				max_salary: maxSalary,
				salary_description: body.salary.description,
				benefit: body.benefit,
				main_responsibility: body.mainResponsibility,
				qualification_requirement: body.qualificationRequirement,
				experience_requirement: body.experienceRequirement,
				assessment_criteria: body.assessmentCriteria,
				other_requirement: body.otherRequirement,
				lab_type: body.labType,
				research_focus: body.researchFocus,
				lab_capacity: labCapacity,
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
		// Only need fileDescription, fileName is optional (will use default)
		if (body.fileRequirements?.fileDescription) {
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
					name:
						body.fileRequirements?.fileName || "Required Documents",
					description: body.fileRequirements?.fileDescription || "",
				},
			});
		}

		// Link to subdisciplines (research fields)
		// Also save subdiscipline IDs as comma-separated string in research_areas
		const subdisciplineIds: string[] = [];
		if (body.researchFields && body.researchFields.length > 0) {
			// eslint-disable-next-line no-console
			console.log(
				"Research fields received:",
				JSON.stringify(body.researchFields)
			);

			for (const researchField of body.researchFields) {
				// Trim whitespace and handle case-insensitive matching
				const trimmedField = researchField?.trim();
				if (!trimmedField) {
					// eslint-disable-next-line no-console
					console.warn("Empty research field, skipping");
					continue;
				}

				// Try case-insensitive search first
				let subdiscipline = await prismaClient.subdiscipline.findFirst({
					where: {
						name: {
							equals: trimmedField,
							mode: "insensitive", // Case-insensitive search
						},
					},
				});

				// If not found, try exact match (fallback)
				if (!subdiscipline) {
					subdiscipline = await prismaClient.subdiscipline.findFirst({
						where: { name: trimmedField },
					});
				}

				if (subdiscipline) {
					// Save to PostSubdiscipline join table
					await prismaClient.postSubdiscipline.create({
						data: {
							subdiscipline_id: subdiscipline.subdiscipline_id,
							post_id: opportunityPost.post_id,
							add_at: new Date(),
						},
					});
					// Collect subdiscipline IDs for research_areas field
					subdisciplineIds.push(subdiscipline.subdiscipline_id);
					// eslint-disable-next-line no-console
					console.log(
						`Successfully linked research field "${trimmedField}" to subdiscipline ${subdiscipline.subdiscipline_id}`
					);
				} else {
					// eslint-disable-next-line no-console
					console.error(
						`Subdiscipline not found for research field: "${trimmedField}"`
					);
				}
			}

			// Update research_areas field with comma-separated subdiscipline IDs
			if (subdisciplineIds.length > 0) {
				await prismaClient.jobPost.update({
					where: { post_id: opportunityPost.post_id },
					data: {
						research_areas: subdisciplineIds.join(","),
					},
				});
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
		console.error("Error creating research lab post:", {
			error: error instanceof Error ? error.message : "Unknown error",
			stack: error instanceof Error ? error.stack : undefined,
			timestamp: new Date().toISOString(),
		});
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
				other_info: updateData.additionalInformation?.content || null,
				degree_level: updateData.degree_level || "RESEARCH",
				...(updateData.status && { status: updateData.status }),
			},
		});

		// Validate salary min/max
		let minSalary: number | null = null;
		let maxSalary: number | null = null;

		if (updateData.salary.min) {
			const minValue = parseFloat(updateData.salary.min);
			if (isNaN(minValue)) {
				// eslint-disable-next-line no-console
				console.error(
					"Invalid min_salary value:",
					updateData.salary.min
				);
				return NextResponse.json(
					{ error: "Invalid minimum salary value" },
					{ status: 400 }
				);
			}
			if (minValue < 0) {
				// eslint-disable-next-line no-console
				console.error("Min salary cannot be negative:", minValue);
				return NextResponse.json(
					{ error: "Minimum salary must be a positive number" },
					{ status: 400 }
				);
			}
			minSalary = minValue;
		}

		if (updateData.salary.max) {
			const maxValue = parseFloat(updateData.salary.max);
			if (isNaN(maxValue)) {
				// eslint-disable-next-line no-console
				console.error(
					"Invalid max_salary value:",
					updateData.salary.max
				);
				return NextResponse.json(
					{ error: "Invalid maximum salary value" },
					{ status: 400 }
				);
			}
			if (maxValue < 0) {
				// eslint-disable-next-line no-console
				console.error("Max salary cannot be negative:", maxValue);
				return NextResponse.json(
					{ error: "Maximum salary must be a positive number" },
					{ status: 400 }
				);
			}
			maxSalary = maxValue;
		}

		// Validate min <= max
		if (minSalary !== null && maxSalary !== null && minSalary > maxSalary) {
			// eslint-disable-next-line no-console
			console.error("Min salary cannot be greater than max salary:", {
				min: minSalary,
				max: maxSalary,
			});
			return NextResponse.json(
				{
					error: "Minimum salary must be less than or equal to maximum salary",
				},
				{ status: 400 }
			);
		}

		// Validate lab capacity
		let labCapacity: number | null = null;
		if (updateData.labCapacity) {
			const capacityValue = parseInt(updateData.labCapacity);
			if (isNaN(capacityValue)) {
				// eslint-disable-next-line no-console
				console.error(
					"Invalid lab_capacity value:",
					updateData.labCapacity
				);
				return NextResponse.json(
					{ error: "Invalid lab capacity value" },
					{ status: 400 }
				);
			}
			if (capacityValue <= 0) {
				// eslint-disable-next-line no-console
				console.error(
					"Lab capacity must be greater than 0:",
					capacityValue
				);
				return NextResponse.json(
					{ error: "Lab capacity must be greater than 0" },
					{ status: 400 }
				);
			}
			if (capacityValue > 10000) {
				// eslint-disable-next-line no-console
				console.error("Lab capacity exceeds maximum:", capacityValue);
				return NextResponse.json(
					{ error: "Lab capacity must be less than 10,000" },
					{ status: 400 }
				);
			}
			labCapacity = capacityValue;
		}

		// Update the job post (research position)
		await prismaClient.jobPost.update({
			where: { post_id: postId },
			data: {
				contract_type: updateData.typeOfContract,
				attendance: updateData.attendance,
				job_type: updateData.jobType,
				professor_name: updateData.professorName || null,
				min_salary: minSalary,
				max_salary: maxSalary,
				salary_description: updateData.salary.description,
				benefit: updateData.benefit,
				main_responsibility: updateData.mainResponsibility,
				qualification_requirement: updateData.qualificationRequirement,
				experience_requirement: updateData.experienceRequirement,
				assessment_criteria: updateData.assessmentCriteria,
				other_requirement: updateData.otherRequirement,
				lab_type: updateData.labType,
				research_focus: updateData.researchFocus,
				lab_capacity: labCapacity,
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

		// Only need fileDescription, fileName is optional (will use default)
		if (updateData.fileRequirements?.fileDescription) {
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
					name:
						updateData.fileRequirements?.fileName ||
						"Required Documents",
					description:
						updateData.fileRequirements?.fileDescription || "",
				},
			});
		}

		// Delete existing subdisciplines and recreate
		await prismaClient.postSubdiscipline.deleteMany({
			where: { post_id: postId },
		});

		// Link to subdisciplines (research fields)
		// Also save subdiscipline IDs as comma-separated string in research_areas
		const subdisciplineIds: string[] = [];
		if (updateData.researchFields && updateData.researchFields.length > 0) {
			// eslint-disable-next-line no-console
			console.log(
				"Research fields received for update:",
				JSON.stringify(updateData.researchFields)
			);

			for (const researchField of updateData.researchFields) {
				// Trim whitespace and handle case-insensitive matching
				const trimmedField = researchField?.trim();
				if (!trimmedField) {
					// eslint-disable-next-line no-console
					console.warn("Empty research field, skipping");
					continue;
				}

				// Try case-insensitive search first
				let subdiscipline = await prismaClient.subdiscipline.findFirst({
					where: {
						name: {
							equals: trimmedField,
							mode: "insensitive", // Case-insensitive search
						},
					},
				});

				// If not found, try exact match (fallback)
				if (!subdiscipline) {
					subdiscipline = await prismaClient.subdiscipline.findFirst({
						where: { name: trimmedField },
					});
				}

				if (subdiscipline) {
					// Save to PostSubdiscipline join table
					await prismaClient.postSubdiscipline.create({
						data: {
							subdiscipline_id: subdiscipline.subdiscipline_id,
							post_id: postId,
							add_at: new Date(),
						},
					});
					// Collect subdiscipline IDs for research_areas field
					subdisciplineIds.push(subdiscipline.subdiscipline_id);
					// eslint-disable-next-line no-console
					console.log(
						`Successfully linked research field "${trimmedField}" to subdiscipline ${subdiscipline.subdiscipline_id}`
					);
				} else {
					// eslint-disable-next-line no-console
					console.error(
						`Subdiscipline not found for research field: "${trimmedField}"`
					);
				}
			}

			// Update research_areas field with comma-separated subdiscipline IDs
			if (subdisciplineIds.length > 0) {
				await prismaClient.jobPost.update({
					where: { post_id: postId },
					data: {
						research_areas: subdisciplineIds.join(","),
					},
				});
			} else {
				// Clear research_areas if no subdisciplines found
				await prismaClient.jobPost.update({
					where: { post_id: postId },
					data: {
						research_areas: null,
					},
				});
			}
		} else {
			// Clear research_areas if no research fields provided
			await prismaClient.jobPost.update({
				where: { post_id: postId },
				data: {
					research_areas: null,
				},
			});
		}

		return NextResponse.json({
			success: true,
			post: {
				id: postId,
				title: updateData.jobName,
			},
		});
	} catch (error) {
		// eslint-disable-next-line no-console
		console.error("Error updating research lab post:", {
			error: error instanceof Error ? error.message : "Unknown error",
			stack: error instanceof Error ? error.stack : undefined,
			timestamp: new Date().toISOString(),
		});
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

export async function DELETE(request: NextRequest) {
	try {
		const { searchParams } = new URL(request.url);
		const postId = searchParams.get("postId");

		if (!postId) {
			return NextResponse.json(
				{ error: "Post ID is required" },
				{ status: 400 }
			);
		}

		// Get user from session
		const { user } = await requireAuth();

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

		// Check if post exists and belongs to this institution
		const post = await prismaClient.opportunityPost.findUnique({
			where: { post_id: postId },
			include: {
				jobPost: true,
			},
		});

		if (!post) {
			return NextResponse.json(
				{ error: "Post not found" },
				{ status: 404 }
			);
		}

		if (post.institution_id !== institution.institution_id) {
			return NextResponse.json(
				{ error: "Unauthorized to delete this post" },
				{ status: 403 }
			);
		}

		// Only allow deletion of DRAFT posts
		if (post.status !== "DRAFT") {
			return NextResponse.json(
				{
					error: "Only draft posts can be deleted",
				},
				{ status: 400 }
			);
		}

		// Soft delete: Set status to DELETED
		await prismaClient.opportunityPost.update({
			where: { post_id: postId },
			data: {
				status: "DELETED",
				update_at: new Date(),
			},
		});

		return NextResponse.json({
			success: true,
			message: "Post deleted successfully",
		});
	} catch (error) {
		// eslint-disable-next-line no-console
		console.error("Error deleting research lab post:", error);
		return NextResponse.json(
			{
				error: "Failed to delete post",
				details:
					error instanceof Error ? error.message : "Unknown error",
			},
			{ status: 500 }
		);
	}
}
