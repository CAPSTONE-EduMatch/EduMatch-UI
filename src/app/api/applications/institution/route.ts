import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/app/lib/auth";
import { prismaClient } from "../../../../../prisma";
import { ApplicationListResponse } from "@/types/application-api";

// GET /api/applications/institution - Get applications for institution's posts
export async function GET(request: NextRequest) {
	try {
		console.log("🔵 API: Institution applications request received");

		// Check if user is authenticated
		const session = await auth.api.getSession({
			headers: request.headers,
		});

		if (!session) {
			console.log("❌ API: No session found");
			return NextResponse.json(
				{ error: "Authentication required" },
				{ status: 401 }
			);
		}

		console.log("✅ API: User authenticated:", session.user.id);

		// Check if user is an institution
		const institution = await prismaClient.institution.findUnique({
			where: { user_id: session.user.id },
			select: { institution_id: true },
		});

		if (!institution) {
			console.log("❌ API: User is not an institution");
			return NextResponse.json(
				{ error: "Only institutions can access this endpoint" },
				{ status: 403 }
			);
		}

		// Get query parameters
		const { searchParams } = new URL(request.url);
		const page = parseInt(searchParams.get("page") || "1");
		const limit = parseInt(searchParams.get("limit") || "10");
		const status = searchParams.get("status");
		const postId = searchParams.get("postId");

		// Build where clause
		const whereClause: any = {
			post: {
				institution_id: institution.institution_id,
			},
		};

		if (status) {
			whereClause.status = status;
		}

		if (postId) {
			whereClause.post_id = postId;
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
								},
							},
							programPost: true,
							scholarshipPost: true,
							jobPost: true,
						},
					},
					applicant: {
						include: {
							user: {
								select: {
									email: true,
									name: true,
									image: true,
								},
							},
						},
					},
					details: {
						include: {
							documentType: true,
						},
					},
				},
				orderBy: { apply_at: "desc" },
				skip: (page - 1) * limit,
				take: limit,
			}),
			prismaClient.application.count({ where: whereClause }),
		]);

		// Transform applications
		const transformedApplications = applications.map((app) => ({
			applicationId: app.application_id,
			applicantId: app.applicant_id,
			postId: app.post_id,
			status: app.status,
			applyAt: app.apply_at.toISOString(),
			documents: app.details.map((detail) => ({
				documentTypeId: detail.document_type_id,
				name: detail.name,
				url: detail.url,
				size: detail.size,
				documentType: detail.documentType.name,
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
				},
				program: app.post.programPost
					? {
							post_id: app.post.programPost.post_id,
							duration: app.post.programPost.duration,
							degree_level: app.post.programPost.degree_level,
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
			applicant: {
				id: app.applicant.applicant_id,
				firstName: app.applicant.first_name,
				lastName: app.applicant.last_name,
				email: app.applicant.user.email,
				profilePhoto: app.applicant.user.image,
				nationality: app.applicant.nationality,
				university: app.applicant.university,
				degree: app.applicant.level,
				gpa: app.applicant.gpa,
			},
		}));

		const response: ApplicationListResponse = {
			success: true,
			applications: transformedApplications,
			total,
			page,
			limit,
		};

		console.log(
			`✅ API: Found ${applications.length} applications for institution`
		);
		return NextResponse.json(response);
	} catch (error) {
		console.error(
			"❌ API: Error fetching institution applications:",
			error
		);
		return NextResponse.json(
			{ error: "Failed to fetch applications" },
			{ status: 500 }
		);
	}
}
