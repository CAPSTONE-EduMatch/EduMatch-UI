import { NextRequest, NextResponse } from "next/server";
import { prismaClient } from "../../../../../prisma";
import { PostStatus } from "@prisma/client";
import { requireAuth } from "@/utils/auth/auth-utils";
import { v4 as uuidv4 } from "uuid";
import { EmbeddingService } from "@/services/embedding/embedding-service";

interface CreateScholarshipRequest {
	// Overview Section
	scholarshipName: string;
	startDate: string;
	applicationDeadline: string;
	subdisciplines: string[];
	country: string;
	degree_level: string;

	// Detail Section
	scholarshipDescription: string;
	scholarshipType: string | string[]; // Can be string or array
	numberOfScholarships: string;
	grant: string;
	scholarshipCoverage: string;

	// Eligibility Requirements - can be string or object
	eligibilityRequirements:
		| string
		| {
				academicMerit: string;
				financialNeed: string;
				otherCriteria: string;
		  };

	// File Requirements - optional
	fileRequirements?: {
		fileName?: string;
		fileDescription?: string;
	};

	// Award Details - optional
	awardDetails?: {
		amount: string;
		duration: string;
		renewable: string;
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
		const body: CreateScholarshipRequest = await request.json();

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
				title: body.scholarshipName,
				status: "PUBLISHED",
			},
		});

		if (existingPost) {
			return NextResponse.json(
				{
					error: `A published post with the title "${body.scholarshipName}" already exists. Please use a different title.`,
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
				title: body.scholarshipName,
				start_date: startDate,
				end_date: applicationDeadline,
				location: body.country,
				other_info: body.additionalInformation?.content || null,
				status: body.status || "DRAFT", // Use provided status or default to DRAFT
				create_at: new Date(),
				institution_id: institution.institution_id,
				degree_level: body.degree_level || "SCHOLARSHIP",
			},
		});

		// Handle eligibility requirements - can be string or object
		let eligibilityString = "";
		let essayRequired = false;

		if (typeof body.eligibilityRequirements === "string") {
			// Frontend sends string directly
			eligibilityString = body.eligibilityRequirements;
			essayRequired =
				eligibilityString.toLowerCase().includes("essay") ||
				eligibilityString.toLowerCase().includes("writing");
		} else {
			// Legacy format - object with separate fields
			const eligibilityArray = [
				body.eligibilityRequirements.academicMerit,
				body.eligibilityRequirements.financialNeed,
				body.eligibilityRequirements.otherCriteria,
			].filter(Boolean);
			eligibilityString = eligibilityArray.join("; ");
			essayRequired =
				body.eligibilityRequirements.otherCriteria
					?.toLowerCase()
					.includes("essay") ||
				body.eligibilityRequirements.otherCriteria
					?.toLowerCase()
					.includes("writing") ||
				false;
		}

		// Handle scholarship type - can be string or array
		const scholarshipTypeString = Array.isArray(body.scholarshipType)
			? body.scholarshipType.join(", ")
			: body.scholarshipType || "";

		// Generate embedding for the scholarship post
		let embeddingData: any = null;
		try {
			const textForEmbedding =
				EmbeddingService.formatScholarshipDataForEmbedding(body);
			// eslint-disable-next-line no-console
			console.log(
				"📝 Generating embedding for scholarship text:",
				textForEmbedding.substring(0, 200) + "..."
			);

			const embedding =
				await EmbeddingService.generateEmbedding(textForEmbedding);
			if (embedding) {
				embeddingData = embedding;
				// eslint-disable-next-line no-console
				console.log(
					"✅ Embedding generated successfully for scholarship post"
				);
			} else {
				// eslint-disable-next-line no-console
				console.warn(
					"⚠️ Failed to generate embedding for scholarship post"
				);
			}
		} catch (embeddingError) {
			// eslint-disable-next-line no-console
			console.error("❌ Error generating embedding:", embeddingError);
			// Continue without embedding - don't fail the entire operation
		}

		// Create the scholarship post
		await prismaClient.scholarshipPost.create({
			data: {
				post_id: opportunityPost.post_id,
				description: body.scholarshipDescription,
				type: scholarshipTypeString,
				number: parseInt(body.numberOfScholarships) || 1,
				grant: body.grant,
				scholarship_coverage: body.scholarshipCoverage,
				essay_required: essayRequired,
				eligibility: eligibilityString || null,
				award_amount: body.awardDetails?.amount
					? parseFloat(body.awardDetails.amount)
					: null,
				award_duration: body.awardDetails?.duration || null,
				renewable: body.awardDetails?.renewable === "Yes" || false,
				embedding: embeddingData,
			},
		});

		// Create post documents for file requirements
		// Only need fileDescription, fileName is optional (will use default)
		if (body.fileRequirements?.fileDescription) {
			// First, get or create a document type for "Scholarship Documents"
			let documentType = await prismaClient.documentType.findFirst({
				where: { name: "Scholarship Documents" },
			});

			if (!documentType) {
				documentType = await prismaClient.documentType.create({
					data: {
						document_type_id: `doc_type_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
						name: "Scholarship Documents",
						description: null,
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

		// Link to subdisciplines
		if (body.subdisciplines && body.subdisciplines.length > 0) {
			for (const subdisciplineName of body.subdisciplines) {
				const subdiscipline =
					await prismaClient.subdiscipline.findFirst({
						where: { name: subdisciplineName },
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
		console.error("Error creating scholarship post:", error);
		return NextResponse.json(
			{
				error: "Failed to create scholarship post",
				details:
					error instanceof Error ? error.message : "Unknown error",
			},
			{ status: 500 }
		);
	}
}

export async function PUT(request: NextRequest) {
	try {
		const body: CreateScholarshipRequest & { postId: string } =
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
				title: updateData.scholarshipName,
				start_date: startDate,
				end_date: applicationDeadline,
				location: updateData.country,
				other_info: updateData.additionalInformation?.content || null,
				degree_level: updateData.degree_level || "SCHOLARSHIP",
				...(updateData.status && { status: updateData.status }),
			},
		});

		// Handle eligibility requirements - can be string or object
		let eligibilityString = "";
		let essayRequired = false;

		if (typeof updateData.eligibilityRequirements === "string") {
			// Frontend sends string directly
			eligibilityString = updateData.eligibilityRequirements;
			essayRequired =
				eligibilityString.toLowerCase().includes("essay") ||
				eligibilityString.toLowerCase().includes("writing");
		} else {
			// Legacy format - object with separate fields
			const eligibilityArray = [
				updateData.eligibilityRequirements.academicMerit,
				updateData.eligibilityRequirements.financialNeed,
				updateData.eligibilityRequirements.otherCriteria,
			].filter(Boolean);
			eligibilityString = eligibilityArray.join("; ");
			essayRequired =
				updateData.eligibilityRequirements.otherCriteria
					?.toLowerCase()
					.includes("essay") ||
				updateData.eligibilityRequirements.otherCriteria
					?.toLowerCase()
					.includes("writing") ||
				false;
		}

		// Handle scholarship type - can be string or array
		const scholarshipTypeString = Array.isArray(updateData.scholarshipType)
			? updateData.scholarshipType.join(", ")
			: updateData.scholarshipType || "";

		// Generate embedding for the scholarship post
		let embeddingData: any = null;
		try {
			const textForEmbedding =
				EmbeddingService.formatScholarshipDataForEmbedding(updateData);
			// eslint-disable-next-line no-console
			console.log(
				"📝 Generating embedding for updated scholarship text:",
				textForEmbedding.substring(0, 200) + "..."
			);

			const embedding =
				await EmbeddingService.generateEmbedding(textForEmbedding);
			if (embedding) {
				embeddingData = embedding;
				// eslint-disable-next-line no-console
				console.log(
					"✅ Embedding generated successfully for updated scholarship post"
				);
			} else {
				// eslint-disable-next-line no-console
				console.warn(
					"⚠️ Failed to generate embedding for updated scholarship post"
				);
			}
		} catch (embeddingError) {
			// eslint-disable-next-line no-console
			console.error("❌ Error generating embedding:", embeddingError);
			// Continue without embedding - don't fail the entire operation
		}

		// Update the scholarship post
		await prismaClient.scholarshipPost.update({
			where: { post_id: postId },
			data: {
				description: updateData.scholarshipDescription,
				type: scholarshipTypeString,
				number: parseInt(updateData.numberOfScholarships) || 1,
				grant: updateData.grant,
				scholarship_coverage: updateData.scholarshipCoverage,
				essay_required: essayRequired,
				eligibility: eligibilityString || null,
				award_amount: updateData.awardDetails?.amount
					? parseFloat(updateData.awardDetails.amount)
					: null,
				award_duration: updateData.awardDetails?.duration || null,
				renewable:
					updateData.awardDetails?.renewable === "Yes" || false,
				embedding: embeddingData,
			},
		});

		// Delete existing documents and recreate
		await prismaClient.postDocument.deleteMany({
			where: { post_id: postId },
		});

		// Only need fileDescription, fileName is optional (will use default)
		if (updateData.fileRequirements?.fileDescription) {
			let documentType = await prismaClient.documentType.findFirst({
				where: { name: "Scholarship Documents" },
			});

			if (!documentType) {
				documentType = await prismaClient.documentType.create({
					data: {
						document_type_id: `doc_type_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
						name: "Scholarship Documents",
						description: null,
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

		if (updateData.subdisciplines && updateData.subdisciplines.length > 0) {
			for (const subdisciplineName of updateData.subdisciplines) {
				const subdiscipline =
					await prismaClient.subdiscipline.findFirst({
						where: { name: subdisciplineName },
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
				title: updateData.scholarshipName,
			},
		});
	} catch (error) {
		// eslint-disable-next-line no-console
		console.error("Error updating scholarship post:", error);
		return NextResponse.json(
			{
				error: "Failed to update scholarship post",
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
				scholarshipPost: true,
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
		console.error("Error deleting scholarship post:", error);
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
