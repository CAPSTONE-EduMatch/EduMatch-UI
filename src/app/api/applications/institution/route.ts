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
								},
							},
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
				institution: {
					name: app.post.institution.name,
					logo: app.post.institution.logo,
				},
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
