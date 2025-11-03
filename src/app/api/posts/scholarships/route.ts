import { NextRequest, NextResponse } from "next/server";
import { prismaClient } from "../../../../../prisma";
import { PostStatus } from "@prisma/client";
import { requireAuth } from "@/utils/auth/auth-utils";
import { v4 as uuidv4 } from "uuid";
import { de } from "date-fns/locale";

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
	scholarshipType: string;
	numberOfScholarships: string;
	grant: string;
	scholarshipCoverage: string;

	// Eligibility Requirements
	eligibilityRequirements: {
		academicMerit: string;
		financialNeed: string;
		otherCriteria: string;
	};

	// File Requirements
	fileRequirements: {
		fileName: string;
		fileDescription: string;
	};

	// Award Details
	awardDetails: {
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
				other_info: body.scholarshipDescription,
				status: body.status || "DRAFT", // Use provided status or default to DRAFT
				create_at: new Date(),
				institution_id: institution.institution_id,
				degree_level: body.degree_level || "SCHOLARSHIP",
			},
		});

		// Create the scholarship post
		await prismaClient.scholarshipPost.create({
			data: {
				post_id: opportunityPost.post_id,
				description: body.scholarshipDescription,
				type: body.scholarshipType,
				number: parseInt(body.numberOfScholarships) || 1,
				grant: body.grant,
				scholarship_coverage: body.scholarshipCoverage,
				essay_required:
					body.eligibilityRequirements.otherCriteria
						.toLowerCase()
						.includes("essay") ||
					body.eligibilityRequirements.otherCriteria
						.toLowerCase()
						.includes("writing"),
				eligibility: [
					body.eligibilityRequirements.academicMerit,
					body.eligibilityRequirements.financialNeed,
					body.eligibilityRequirements.otherCriteria,
				]
					.filter(Boolean)
					.join("; "),
				award_amount: body.awardDetails.amount
					? parseFloat(body.awardDetails.amount)
					: null,
				award_duration: body.awardDetails.duration,
				renewable: body.awardDetails.renewable === "Yes",
			},
		});

		// Create post documents for file requirements
		if (
			body.fileRequirements.fileName &&
			body.fileRequirements.fileDescription
		) {
			// First, get or create a document type for "Scholarship Documents"
			let documentType = await prismaClient.documentType.findFirst({
				where: { name: "Scholarship Documents" },
			});

			if (!documentType) {
				documentType = await prismaClient.documentType.create({
					data: {
						document_type_id: `doc_type_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
						name: "Scholarship Documents",
						description:
							"Documents required for scholarship application",
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
