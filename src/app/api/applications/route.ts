import {
	ApplicationListResponse,
	ApplicationRequest,
	ApplicationResponse,
	ApplicationStatsResponse,
	ApplicationStatus,
} from "@/types/api/application-api";
import { requireAuth } from "@/utils/auth/auth-utils";
import { NextRequest, NextResponse } from "next/server";
import { prismaClient } from "../../../../prisma";

// GET /api/applications - Get user's applications
export async function GET(request: NextRequest) {
	try {
		// Check if user is authenticated using optimized auth utilities
		const { user } = await requireAuth();

		// Get query parameters
		const { searchParams } = new URL(request.url);
		const page = parseInt(searchParams.get("page") || "1");
		const limit = parseInt(searchParams.get("limit") || "10");
		const status = searchParams.get("status");
		const stats = searchParams.get("stats") === "true";

		// Get user's applicant profile
		const applicant = await prismaClient.applicant.findUnique({
			where: { user_id: user.id },
			select: { applicant_id: true },
		});

		if (!applicant) {
			return NextResponse.json(
				{ error: "Applicant profile not found" },
				{ status: 404 }
			);
		}

		// If requesting stats
		if (stats) {
			const statsData = await prismaClient.application.groupBy({
				by: ["status"],
				where: { applicant_id: applicant.applicant_id },
				_count: { application_id: true },
			});

			const statsResponse: ApplicationStatsResponse = {
				success: true,
				stats: {
					total: statsData.reduce(
						(sum, item) => sum + item._count.application_id,
						0
					),
					pending:
						statsData.find((s) => s.status === "SUBMITTED")?._count
							.application_id || 0,
					reviewed:
						statsData.find((s) => s.status === "PROGRESSING")
							?._count.application_id || 0,
					accepted:
						statsData.find((s) => s.status === "ACCEPTED")?._count
							.application_id || 0,
					rejected:
						statsData.find((s) => s.status === "REJECTED")?._count
							.application_id || 0,
				},
			};

			return NextResponse.json(statsResponse);
		}

		// Build where clause
		const whereClause: any = {
			applicant_id: applicant.applicant_id,
		};

		if (status) {
			whereClause.status = status;
		}

		// Get applications with pagination
		const [applications, total] = await Promise.all([
			prismaClient.application.findMany({
				where: whereClause,
				include: {
					post: {
						include: {
							institution: {
								select: {
									name: true,
									logo: true,
									country: true,
									verification_status: true,
									deleted_at: true,
								},
							},
							programPost: true,
							scholarshipPost: true,
							jobPost: true,
						},
					},
					details: true,
				},
				orderBy: { apply_at: "desc" },
				skip: (page - 1) * limit,
				take: limit,
			}),
			prismaClient.application.count({ where: whereClause }),
		]);

		// Transform applications
		const transformedApplications = applications.map((app: any) => ({
			applicationId: app.application_id,
			applicantId: app.applicant_id,
			postId: app.post_id,
			status: app.status,
			applyAt: app.apply_at.toISOString(),
			documents: app.details
				.filter((detail: any) => !detail.is_update_submission)
				.map((detail: any) => ({
					documentTypeId: detail.document_type,
					name: detail.name,
					url: detail.url,
					size: detail.size,
					documentType:
						detail.documentType?.name || detail.document_type,
				})),
			post: {
				id: app.post.post_id,
				title: app.post.title,
				startDate: app.post.start_date.toISOString(),
				endDate: app.post.end_date?.toISOString(),
				location: app.post.location || undefined,
				otherInfo: app.post.other_info || undefined,
				institution: {
					name: app.post.institution.name,
					logo: app.post.institution.logo,
					country: app.post.institution.country || undefined,
					status: app.post.institution.verification_status,
					deletedAt:
						app.post.institution.deleted_at?.toISOString() || null,
				},
				program: app.post.programPost
					? {
							post_id: app.post.programPost.post_id,
							duration: app.post.programPost.duration,
							degree_level: app.post.degree_level,
							attendance: app.post.programPost.attendance,
							course_include:
								app.post.programPost.course_include ||
								undefined,
							gpa: app.post.programPost.gpa
								? Number(app.post.programPost.gpa)
								: undefined,
							gre: app.post.programPost.gre || undefined,
							gmat: app.post.programPost.gmat || undefined,
							tuition_fee: app.post.programPost.tuition_fee
								? Number(app.post.programPost.tuition_fee)
								: undefined,
							fee_description:
								app.post.programPost.fee_description ||
								undefined,
							scholarship_info:
								app.post.programPost.scholarship_info ||
								undefined,
						}
					: undefined,
				scholarship: app.post.scholarshipPost
					? {
							post_id: app.post.scholarshipPost.post_id,
							description: app.post.scholarshipPost.description,
							type: app.post.scholarshipPost.type,
							number: app.post.scholarshipPost.number,
							grant: app.post.scholarshipPost.grant || undefined,
							scholarship_coverage:
								app.post.scholarshipPost.scholarship_coverage ||
								undefined,
							essay_required:
								app.post.scholarshipPost.essay_required ||
								undefined,
							eligibility:
								app.post.scholarshipPost.eligibility ||
								undefined,
						}
					: undefined,
				job: app.post.jobPost
					? {
							post_id: app.post.jobPost.post_id,
							contract_type: app.post.jobPost.contract_type,
							attendance: app.post.jobPost.attendance,
							job_type: app.post.jobPost.job_type,
							min_salary: app.post.jobPost.min_salary
								? Number(app.post.jobPost.min_salary)
								: undefined,
							max_salary: app.post.jobPost.max_salary
								? Number(app.post.jobPost.max_salary)
								: undefined,
							salary_description:
								app.post.jobPost.salary_description ||
								undefined,
							benefit: app.post.jobPost.benefit || undefined,
							main_responsibility:
								app.post.jobPost.main_responsibility ||
								undefined,
							qualification_requirement:
								app.post.jobPost.qualification_requirement ||
								undefined,
							experience_requirement:
								app.post.jobPost.experience_requirement ||
								undefined,
							assessment_criteria:
								app.post.jobPost.assessment_criteria ||
								undefined,
							other_requirement:
								app.post.jobPost.other_requirement || undefined,
						}
					: undefined,
			},
		}));

		const response: ApplicationListResponse = {
			success: true,
			applications: transformedApplications,
			total,
			page,
			limit,
		};

		return NextResponse.json(response);
	} catch (error) {
		return NextResponse.json(
			{ error: "Failed to fetch applications" },
			{ status: 500 }
		);
	}
}

// POST /api/applications - Submit new application
export async function POST(request: NextRequest) {
	try {
		// Check if user is authenticated using optimized auth utilities
		const { user } = await requireAuth();

		const body: ApplicationRequest = await request.json();

		// Validate required fields
		if (!body.postId) {
			return NextResponse.json(
				{ error: "Post ID is required" },
				{ status: 400 }
			);
		}

		// Get user's applicant profile
		const applicant = await prismaClient.applicant.findUnique({
			where: { user_id: user.id },
			select: { applicant_id: true },
		});

		if (!applicant) {
			return NextResponse.json(
				{ error: "Applicant profile not found" },
				{ status: 404 }
			);
		}

		// PLAN-BASED AUTHORIZATION: Check if applicant can apply to opportunities
		const { canApplyToOpportunity } = await import(
			"@/services/authorization"
		);
		const eligibility = await canApplyToOpportunity(applicant.applicant_id);

		if (!eligibility.canApply) {
			return NextResponse.json(
				{
					error:
						eligibility.reason || "You cannot apply at this time",
					eligibility: {
						canApply: false,
						planName: eligibility.planName,
						applicationsUsed: eligibility.applicationsUsed,
						applicationsLimit: eligibility.applicationsLimit,
						periodEnd: eligibility.periodEnd?.toISOString(),
						daysUntilReset: eligibility.daysUntilReset,
					},
				},
				{ status: 403 } // 403 Forbidden
			);
		}

		// Check if post exists
		const post = await prismaClient.opportunityPost.findUnique({
			where: { post_id: body.postId },
			select: { post_id: true, title: true },
		});

		if (!post) {
			return NextResponse.json(
				{ error: "Post not found" },
				{ status: 404 }
			);
		}

		// Check if user already applied to this post (get most recent)
		const existingApplication = await prismaClient.application.findFirst({
			where: {
				applicant_id: applicant.applicant_id,
				post_id: body.postId,
			},
			orderBy: {
				apply_at: "desc", // Get the most recent application
			},
		});

		// Determine reapply_count
		let reapplyCount = 0;
		if (existingApplication) {
			// If application exists, check if reapply is allowed
			if (
				existingApplication.status === "REJECTED" &&
				existingApplication.reapply_count < 3
			) {
				// Allow reapply: increment the count
				reapplyCount = existingApplication.reapply_count + 1;
			} else if (existingApplication.status !== "REJECTED") {
				// If status is not REJECTED, cannot reapply
				return NextResponse.json(
					{ error: "You have already applied to this post" },
					{ status: 409 }
				);
			} else {
				// REJECTED but reapply_count >= 3
				return NextResponse.json(
					{
						error: "You have reached the maximum number of reapplication attempts (3)",
					},
					{ status: 400 }
				);
			}
		}

		// Get applicant profile data for snapshot
		const applicantProfile = await prismaClient.applicant.findUnique({
			where: { applicant_id: applicant.applicant_id },
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
				interests: {
					include: {
						subdiscipline: {
							select: {
								subdiscipline_id: true,
								name: true,
								discipline: {
									select: {
										name: true,
									},
								},
							},
						},
					},
				},
				documents: {
					where: {
						status: true, // Only include active documents
						deleted_at: null, // Exclude deleted documents
					},
					select: {
						document_id: true,
					},
				},
			},
		});

		if (!applicantProfile) {
			return NextResponse.json(
				{ error: "Applicant profile not found" },
				{ status: 404 }
			);
		}

		// Create application
		const application = await prismaClient.application.create({
			data: {
				application_id: crypto.randomUUID(),
				applicant_id: applicant.applicant_id,
				post_id: body.postId,
				apply_at: new Date(),
				status: "SUBMITTED",
				reapply_count: reapplyCount,
			},
		});

		// Create profile snapshot
		const profileSnapshot =
			await prismaClient.applicationProfileSnapshot.create({
				data: {
					snapshot_id: crypto.randomUUID(),
					application_id: application.application_id,
					// Basic profile information
					first_name: applicantProfile.first_name,
					last_name: applicantProfile.last_name,
					birthday: applicantProfile.birthday,
					gender: applicantProfile.gender,
					nationality: applicantProfile.nationality,
					phone_number: applicantProfile.phone_number,
					country_code: applicantProfile.country_code,
					profile_photo: applicantProfile.user?.image,
					// Academic information
					graduated: applicantProfile.graduated,
					level: applicantProfile.level,
					subdiscipline_id: applicantProfile.subdiscipline_id,
					gpa: applicantProfile.gpa,
					university: applicantProfile.university,
					country_of_study: applicantProfile.country_of_study,
					has_foreign_language: applicantProfile.has_foreign_language,
					languages: applicantProfile.languages as any,
					// Preferences
					favorite_countries: applicantProfile.favorite_countries,
					// User information
					user_name: applicantProfile.user?.name,
					user_email: applicantProfile.user?.email,
					user_image: applicantProfile.user?.image,
					// Subdiscipline details - capture all interest subdiscipline IDs
					subdiscipline_ids:
						applicantProfile.interests?.map(
							(interest) =>
								interest.subdiscipline.subdiscipline_id
						) || [],
					// Document IDs - use selected document IDs if provided, otherwise use all profile documents
					document_ids:
						body.selectedProfileDocumentIds &&
						body.selectedProfileDocumentIds.length > 0
							? body.selectedProfileDocumentIds.filter((docId) =>
									applicantProfile.documents?.some(
										(doc) => doc.document_id === docId
									)
								) // Only include IDs that exist in the profile
							: applicantProfile.documents?.map(
									(doc) => doc.document_id
								) || [],
				},
			});

		// Create application details (documents) if provided
		if (body.documents && body.documents.length > 0) {
			// Map document type IDs to new enum values
			const mapDocumentType = (docTypeId: string): string => {
				const typeMapping: Record<string, string> = {
					"1": "RESEARCH_PROPOSAL",
					"2": "CV_RESUME",
					"3": "PORTFOLIO",
					"4": "ACADEMIC_TRANSCRIPT",
					"5": "PERSONAL_STATEMENT",
					"6": "RECOMMENDATION_LETTER",
					"7": "LANGUAGE_CERTIFICATE",
					"8": "PASSPORT_COPY",
					"9": "DEGREE_CERTIFICATE",
					"10": "RESEARCH_PAPER",
					"11": "INSTITUTION_VERIFICATION",
					"12": "REQUIRED_DOCUMENTS",
				};
				return typeMapping[docTypeId] || "OTHER";
			};

			const applicationDetails = body.documents.map((doc) => ({
				document_id: crypto.randomUUID(),
				application_id: application.application_id,
				url: doc.url,
				name: doc.name,
				size: doc.size,
				document_type: mapDocumentType(
					doc.documentTypeId || "OTHER"
				) as any,
				update_at: new Date(),
			}));

			await prismaClient.applicationDetail.createMany({
				data: applicationDetails,
			});
		}

		// Note: Application count is now tracked by counting records in the applications table
		// within the subscription period, so no manual increment needed

		// Send notification to institution
		try {
			const { NotificationUtils } = await import(
				"@/services/messaging/sqs-handlers"
			);

			// Get institution info
			const institution = await prismaClient.opportunityPost.findUnique({
				where: { post_id: body.postId },
				include: {
					institution: {
						include: {
							user: true,
						},
					},
				},
			});

			if (institution?.institution?.user) {
				await NotificationUtils.sendApplicationStatusNotification(
					institution.institution.user.id,
					institution.institution.user.email || "",
					application.application_id,
					post.title,
					"",
					"SUBMITTED",
					institution.institution.name
				);
			}
		} catch (notificationError) {
			// Don't fail the application if notification fails
		}

		// Return success response
		const response: ApplicationResponse = {
			success: true,
			application: {
				applicationId: application.application_id,
				applicantId: application.applicant_id,
				postId: application.post_id,
				status: application.status as ApplicationStatus,
				applyAt: application.apply_at.toISOString(),
				documents: body.documents || [],
				post: {
					id: post.post_id,
					title: post.title,
					startDate: new Date().toISOString(), // Default value
					institution: {
						name: "Institution Name", // Will be populated in full response
						status: true, // Default value for new applications
						deletedAt: null,
					},
				},
			},
		};

		return NextResponse.json(response, { status: 201 });
	} catch (error) {
		return NextResponse.json(
			{ error: "Failed to submit application" },
			{ status: 500 }
		);
	}
}
