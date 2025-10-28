import { NextRequest, NextResponse } from "next/server";
import { prismaClient } from "../../../../../prisma";
import { requireAuth } from "@/lib/auth-utils";

export async function GET(request: NextRequest) {
	try {
		const { searchParams } = new URL(request.url);

		// Get user from session
		const { user } = await requireAuth();
		if (!user?.id) {
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

		// Parse query parameters
		const search = searchParams.get("search") || "";
		const status = searchParams.get("status") || "all";
		const sortBy = searchParams.get("sortBy") || "newest";
		const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
		const limit = Math.max(
			1,
			Math.min(50, parseInt(searchParams.get("limit") || "10"))
		);
		const skip = (page - 1) * limit;

		// Build where clause for filtering
		const whereClause: any = {
			post: {
				institution_id: institution.institution_id,
			},
		};

		// Add status filter
		if (status !== "all") {
			whereClause.status = status.toUpperCase();
		}

		// Get total count for pagination
		const totalCount = await prismaClient.application.count({
			where: whereClause,
		});

		// Query applications with related data including profile snapshot
		const applications = await prismaClient.application.findMany({
			where: whereClause,
			include: {
				profileSnapshot: true, // Include the profile snapshot
				applicant: {
					include: {
						user: {
							select: {
								id: true, // Include user ID for thread matching
								name: true,
								email: true,
								image: true,
							},
						},
						subdiscipline: {
							select: {
								name: true,
							},
						},
					},
				},
				post: {
					select: {
						post_id: true,
						title: true,
						start_date: true,
						end_date: true,
					},
				},
			},
			orderBy:
				sortBy === "newest"
					? { apply_at: "desc" }
					: sortBy === "oldest"
						? { apply_at: "asc" }
						: { apply_at: "desc" },
			skip,
			take: limit,
		});

		// Transform data to match the expected format using snapshot data
		const transformedApplications = applications.map((app) => {
			// Use snapshot data if available, otherwise fallback to live data
			const snapshot = app.profileSnapshot;
			const transformed = {
				id: app.application_id,
				postId: app.post.post_id,
				// Use snapshot data for consistent profile information
				name:
					snapshot?.user_name || app.applicant.user.name || "Unknown",
				email: snapshot?.user_email || app.applicant.user.email,
				image: snapshot?.user_image || app.applicant.user.image,
				appliedDate: app.apply_at.toLocaleDateString(),
				degreeLevel:
					snapshot?.level || app.applicant.level || "Unknown",
				// For subdisciplines, we'll show a count or "Multiple interests"
				subDiscipline:
					(snapshot?.subdiscipline_ids?.length ?? 0) > 0
						? `${snapshot?.subdiscipline_ids?.length ?? 0} interests`
						: app.applicant.subdiscipline?.name || "Unknown",
				status: app.status.toLowerCase(),
				matchingScore: Math.floor(Math.random() * 30) + 70, // Mock matching score
				postTitle: app.post.title,
				applicantId: app.applicant.applicant_id,
				userId: app.applicant.user.id, // Include user ID for thread matching
				// Additional snapshot data for detailed view
				snapshotData: snapshot
					? {
							firstName: snapshot.first_name,
							lastName: snapshot.last_name,
							nationality: snapshot.nationality,
							phoneNumber: snapshot.phone_number,
							countryCode: snapshot.country_code,
							graduated: snapshot.graduated,
							gpa: snapshot.gpa,
							university: snapshot.university,
							countryOfStudy: snapshot.country_of_study,
							hasForeignLanguage: snapshot.has_foreign_language,
							languages: snapshot.languages,
							favoriteCountries: snapshot.favorite_countries,
							subdisciplineIds: snapshot.subdiscipline_ids,
						}
					: null,
			};
			return transformed;
		});

		// Apply search filter
		let filteredApplications = transformedApplications;
		if (search) {
			filteredApplications = transformedApplications.filter(
				(app) =>
					app.name.toLowerCase().includes(search.toLowerCase()) ||
					app.subDiscipline
						.toLowerCase()
						.includes(search.toLowerCase()) ||
					app.degreeLevel
						.toLowerCase()
						.includes(search.toLowerCase()) ||
					app.postTitle.toLowerCase().includes(search.toLowerCase())
			);
		}

		// Calculate statistics
		const stats = {
			total: totalCount,
			approved: transformedApplications.filter(
				(app) => app.status === "accepted"
			).length,
			rejected: transformedApplications.filter(
				(app) => app.status === "rejected"
			).length,
			pending: transformedApplications.filter(
				(app) => app.status === "pending"
			).length,
		};

		const totalPages = Math.ceil(filteredApplications.length / limit);

		return NextResponse.json({
			success: true,
			data: filteredApplications,
			meta: {
				total: totalCount,
				page,
				limit,
				totalPages,
			},
			stats,
		});
	} catch (error) {
		// eslint-disable-next-line no-console
		console.error("Error fetching applications:", error);
		return NextResponse.json(
			{
				error: "Failed to fetch applications",
				details:
					error instanceof Error ? error.message : "Unknown error",
			},
			{ status: 500 }
		);
	}
}
