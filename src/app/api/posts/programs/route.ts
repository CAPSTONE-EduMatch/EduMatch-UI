import { NextRequest, NextResponse } from "next/server";
import { prismaClient } from "../../../../../prisma";
import { PostStatus } from "@prisma/client";
import { requireAuth } from "@/utils/auth/auth-utils";
import { v4 as uuidv4 } from "uuid";

interface CreateProgramRequest {
	// Overview Section
	programTitle: string;
	startDate: string;
	applicationDeadline: string;
	subdiscipline: string;
	duration: string;
	degreeLevel: string;
	attendance: string;
	location: string;

	// Programme Structure
	courseInclude: string;
	description: string;

	// Admission Requirements
	academicRequirements: {
		gpa: string;
		gre: string;
		gmat: string;
	};
	languageRequirements: Array<{
		language: string;
		certificate: string;
		score: string;
	}>;

	// File Requirements
	fileRequirements: {
		fileName: string;
		fileDescription: string;
	};

	// Tuition Fee
	tuitionFee: {
		international: string;
		description: string;
	};

	// Scholarship
	scholarship: {
		information: string;
	};

	// Other Information
	otherInformation: {
		content: string;
	};

	// Status
	status?: PostStatus;
}

export async function POST(request: NextRequest) {
	try {
		const body: CreateProgramRequest = await request.json();

		// Get user from session using optimized auth utilities
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
				title: body.programTitle,
				start_date: startDate,
				end_date: applicationDeadline,
				location: body.location,
				other_info: body.otherInformation.content,
				status: body.status || "DRAFT", // Use provided status or default to DRAFT
				create_at: new Date(),
				institution_id: institution.institution_id,
				degree_level: body.degreeLevel,
				description: body.description,
			},
		});

		// Create the program post
		await prismaClient.programPost.create({
			data: {
				post_id: opportunityPost.post_id,
				duration: body.duration,
				// degree_level: body.degreeLevel,
				attendance: body.attendance,
				course_include: body.courseInclude,
				gpa: body.academicRequirements.gpa
					? parseFloat(body.academicRequirements.gpa)
					: null,
				gre: body.academicRequirements.gre
					? parseInt(body.academicRequirements.gre)
					: null,
				gmat: body.academicRequirements.gmat
					? parseInt(body.academicRequirements.gmat)
					: null,
				tuition_fee: body.tuitionFee.international
					? parseFloat(body.tuitionFee.international)
					: null,
				fee_description: body.tuitionFee.description,
				scholarship_info: body.scholarship.information,
				language_requirement:
					body.languageRequirements.length > 0
						? body.languageRequirements[0].language
						: null,
			},
		});

		// Create post certificates for language requirements
		if (body.languageRequirements && body.languageRequirements.length > 0) {
			for (const langReq of body.languageRequirements) {
				if (langReq.language && langReq.certificate && langReq.score) {
					await prismaClient.postCertificate.create({
						data: {
							certificate_id: `cert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
							post_id: opportunityPost.post_id,
							name: langReq.certificate,
							score: langReq.score,
						},
					});
				}
			}
		}

		// Create post documents for file requirements
		if (
			body.fileRequirements.fileName &&
			body.fileRequirements.fileDescription
		) {
			// First, get or create a document type for "Required Documents"
			let documentType = await prismaClient.documentType.findFirst({
				where: { name: "Required Documents" },
			});

			if (!documentType) {
				documentType = await prismaClient.documentType.create({
					data: {
						document_type_id: `doc_type_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
						name: "Required Documents",
						description: "Documents required for application",
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
		const subdiscipline = await prismaClient.subdiscipline.findFirst({
			where: { name: body.subdiscipline },
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
		console.error("Error creating program post:", error);
		return NextResponse.json(
			{
				error: "Failed to create program post",
				details:
					error instanceof Error ? error.message : "Unknown error",
			},
			{ status: 500 }
		);
	}
}

export async function PUT(request: NextRequest) {
	try {
		const body: CreateProgramRequest & { postId: string } =
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
				title: updateData.programTitle,
				start_date: startDate,
				end_date: applicationDeadline,
				location: updateData.location,
				other_info: updateData.otherInformation.content,
				degree_level: updateData.degreeLevel,
				description: updateData.description,
			},
		});

		// Update the program post
		await prismaClient.programPost.update({
			where: { post_id: postId },
			data: {
				duration: updateData.duration,
				attendance: updateData.attendance,
				course_include: updateData.courseInclude,
				gpa: updateData.academicRequirements.gpa
					? parseFloat(updateData.academicRequirements.gpa)
					: null,
				gre: updateData.academicRequirements.gre
					? parseInt(updateData.academicRequirements.gre)
					: null,
				gmat: updateData.academicRequirements.gmat
					? parseInt(updateData.academicRequirements.gmat)
					: null,
				tuition_fee: updateData.tuitionFee.international
					? parseFloat(updateData.tuitionFee.international)
					: null,
				fee_description: updateData.tuitionFee.description,
				scholarship_info: updateData.scholarship.information,
				language_requirement:
					updateData.languageRequirements.length > 0
						? updateData.languageRequirements[0].language
						: null,
			},
		});

		// Delete existing certificates and recreate
		await prismaClient.postCertificate.deleteMany({
			where: { post_id: postId },
		});

		if (
			updateData.languageRequirements &&
			updateData.languageRequirements.length > 0
		) {
			for (const langReq of updateData.languageRequirements) {
				if (langReq.language && langReq.certificate && langReq.score) {
					await prismaClient.postCertificate.create({
						data: {
							certificate_id: `cert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
							post_id: postId,
							name: langReq.certificate,
							score: langReq.score,
						},
					});
				}
			}
		}

		// Delete existing documents and recreate
		await prismaClient.postDocument.deleteMany({
			where: { post_id: postId },
		});

		if (
			updateData.fileRequirements.fileName &&
			updateData.fileRequirements.fileDescription
		) {
			let documentType = await prismaClient.documentType.findFirst({
				where: { name: "Required Documents" },
			});

			if (!documentType) {
				documentType = await prismaClient.documentType.create({
					data: {
						document_type_id: `doc_type_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
						name: "Required Documents",
						description: "Documents required for application",
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

		const subdiscipline = await prismaClient.subdiscipline.findFirst({
			where: { name: updateData.subdiscipline },
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

		return NextResponse.json({
			success: true,
			post: {
				id: postId,
				title: updateData.programTitle,
			},
		});
	} catch (error) {
		console.error("Error updating program post:", error);
		return NextResponse.json(
			{
				error: "Failed to update program post",
				details:
					error instanceof Error ? error.message : "Unknown error",
			},
			{ status: 500 }
		);
	}
}
