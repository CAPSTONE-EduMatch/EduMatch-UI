import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/app/lib/auth";
import { prismaClient } from "../../../../prisma";
import {
	ApplicationRequest,
	ApplicationResponse,
	ApplicationListResponse,
	ApplicationStatsResponse,
} from "@/types/application-api";

// GET /api/applications - Get user's applications
export async function GET(request: NextRequest) {
	try {
		console.log("🔵 API: Applications list request received");

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

		// Get query parameters
		const { searchParams } = new URL(request.url);
		const page = parseInt(searchParams.get("page") || "1");
		const limit = parseInt(searchParams.get("limit") || "10");
		const status = searchParams.get("status");
		const stats = searchParams.get("stats") === "true";

		// Get user's applicant profile
		const applicant = await prismaClient.applicant.findUnique({
			where: { user_id: session.user.id },
			select: { applicant_id: true },
		});

		if (!applicant) {
			console.log("❌ API: No applicant profile found");
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
						statsData.find((s) => s.status === "PENDING")?._count
							.application_id || 0,
					reviewed:
						statsData.find((s) => s.status === "REVIEWED")?._count
							.application_id || 0,
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
		}));

		const response: ApplicationListResponse = {
			success: true,
			applications: transformedApplications,
			total,
			page,
			limit,
		};

		console.log(`✅ API: Found ${applications.length} applications`);
		return NextResponse.json(response);
	} catch (error) {
		console.error("❌ API: Error fetching applications:", error);
		return NextResponse.json(
			{ error: "Failed to fetch applications" },
			{ status: 500 }
		);
	}
}

// POST /api/applications - Submit new application
export async function POST(request: NextRequest) {
	try {
		console.log("🔵 API: Application submission request received");

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

		const body: ApplicationRequest = await request.json();
		console.log("📋 API: Application data:", {
			postId: body.postId,
			hasDocuments: body.documents?.length || 0,
		});

		// Validate required fields
		if (!body.postId) {
			return NextResponse.json(
				{ error: "Post ID is required" },
				{ status: 400 }
			);
		}

		// Get user's applicant profile
		const applicant = await prismaClient.applicant.findUnique({
			where: { user_id: session.user.id },
			select: { applicant_id: true },
		});

		if (!applicant) {
			console.log("❌ API: No applicant profile found");
			return NextResponse.json(
				{ error: "Applicant profile not found" },
				{ status: 404 }
			);
		}

		// Check if post exists
		const post = await prismaClient.opportunityPost.findUnique({
			where: { post_id: body.postId },
			select: { post_id: true, title: true },
		});

		if (!post) {
			console.log("❌ API: Post not found:", body.postId);
			return NextResponse.json(
				{ error: "Post not found" },
				{ status: 404 }
			);
		}

		// Check if user already applied to this post
		const existingApplication = await prismaClient.application.findFirst({
			where: {
				applicant_id: applicant.applicant_id,
				post_id: body.postId,
			},
		});

		if (existingApplication) {
			console.log("❌ API: Application already exists");
			return NextResponse.json(
				{ error: "You have already applied to this post" },
				{ status: 409 }
			);
		}

		// Create application
		const application = await prismaClient.application.create({
			data: {
				application_id: `app_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
				applicant_id: applicant.applicant_id,
				post_id: body.postId,
				apply_at: new Date(),
				status: "PENDING",
			},
		});

		console.log("✅ API: Application created:", application.application_id);

		// Create application details (documents) if provided
		if (body.documents && body.documents.length > 0) {
			const applicationDetails = body.documents.map((doc) => ({
				document_id: `doc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
				document_type_id: doc.documentTypeId,
				application_id: application.application_id,
				url: doc.url,
				name: doc.name,
				size: doc.size,
				update_at: new Date(),
			}));

			await prismaClient.applicationDetail.createMany({
				data: applicationDetails,
			});

			console.log(
				`✅ API: Created ${applicationDetails.length} application documents`
			);
		}

		// Send notification to institution
		try {
			const { NotificationUtils } = await import("@/lib/sqs-handlers");

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
					"PENDING",
					institution.institution.name
				);
				console.log("✅ API: Application notification sent");
			}
		} catch (notificationError) {
			console.error(
				"❌ API: Failed to send notification:",
				notificationError
			);
			// Don't fail the application if notification fails
		}

		// Return success response
		const response: ApplicationResponse = {
			success: true,
			application: {
				applicationId: application.application_id,
				applicantId: application.applicant_id,
				postId: application.post_id,
				status: application.status,
				applyAt: application.apply_at.toISOString(),
				documents: body.documents || [],
				post: {
					id: post.post_id,
					title: post.title,
					institution: {
						name: "Institution Name", // Will be populated in full response
					},
				},
			},
		};

		console.log("✅ API: Application submitted successfully");
		return NextResponse.json(response, { status: 201 });
	} catch (error) {
		console.error("❌ API: Error submitting application:", error);
		return NextResponse.json(
			{ error: "Failed to submit application" },
			{ status: 500 }
		);
	}
}
