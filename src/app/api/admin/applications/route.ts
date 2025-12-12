import { requireAuth } from "@/utils/auth/auth-utils";
import { ApplicationStatus } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { prismaClient } from "../../../../../prisma/index";

interface ApplicationFilters {
	search?: string;
	status?: "all" | ApplicationStatus;
	sortBy?: "newest" | "oldest" | "name";
	page?: number;
	limit?: number;
}

// Get list of applications with advanced filtering, sorting, and pagination
export async function GET(request: NextRequest) {
	try {
		// Authenticate user and check admin permissions
		await requireAuth();

		const { searchParams } = new URL(request.url);

		// Parse query parameters
		const filters: ApplicationFilters = {
			search: searchParams.get("search") || undefined,
			status:
				(searchParams.get("status") as "all" | ApplicationStatus) ||
				"all",
			sortBy:
				(searchParams.get("sortBy") as "newest" | "oldest" | "name") ||
				"newest",
			page: parseInt(searchParams.get("page") || "1"),
			limit: Math.min(parseInt(searchParams.get("limit") || "10"), 50),
		};

		// Build where clause for filtering
		const whereClause: any = {};

		// Search conditions - search across multiple fields
		const searchConditions: any[] = [];
		if (filters.search) {
			searchConditions.push(
				// Search by application ID
				{
					application_id: {
						contains: filters.search,
						mode: "insensitive",
					},
				},
				// Search by applicant name from snapshot
				{
					ApplicationProfileSnapshot: {
						user_name: {
							contains: filters.search,
							mode: "insensitive",
						},
					},
				},
				// Search by post title
				{
					post: {
						title: {
							contains: filters.search,
							mode: "insensitive",
						},
					},
				},
				// Search by institution name
				{
					post: {
						institution: {
							name: {
								contains: filters.search,
								mode: "insensitive",
							},
						},
					},
				}
			);
		}

		// Filter by status
		if (filters.status && filters.status !== "all") {
			whereClause.status = filters.status;
		}

		// Combine search conditions
		if (searchConditions.length > 0) {
			whereClause.OR = searchConditions;
		}

		// Calculate pagination
		const skip = (filters.page! - 1) * filters.limit!;
		const take = filters.limit!;

		// Build order by clause
		let orderBy: any = {};
		if (filters.sortBy === "newest") {
			orderBy = { apply_at: "desc" };
		} else if (filters.sortBy === "oldest") {
			orderBy = { apply_at: "asc" };
		} else if (filters.sortBy === "name") {
			orderBy = {
				ApplicationProfileSnapshot: {
					user_name: "asc",
				},
			};
		}

		// Fetch applications with pagination
		const [applications, totalCount] = await Promise.all([
			prismaClient.application.findMany({
				where: whereClause,
				skip,
				take,
				orderBy,
				include: {
					ApplicationProfileSnapshot: {
						select: {
							user_name: true,
							user_email: true,
							first_name: true,
							last_name: true,
						},
					},
					post: {
						select: {
							post_id: true,
							title: true,
							institution: {
								select: {
									institution_id: true,
									name: true,
								},
							},
						},
					},
				},
			}),
			prismaClient.application.count({ where: whereClause }),
		]);

		// Transform applications
		const transformedApplications = applications.map((app) => ({
			id: app.application_id,
			applicantName:
				app.ApplicationProfileSnapshot?.user_name ||
				`${app.ApplicationProfileSnapshot?.first_name || ""} ${app.ApplicationProfileSnapshot?.last_name || ""}`.trim() ||
				"Unknown",
			applicantEmail: app.ApplicationProfileSnapshot?.user_email || "",
			postId: app.post.post_id,
			postTitle: app.post.title,
			institutionId: app.post.institution.institution_id,
			institutionName: app.post.institution.name,
			appliedDate: app.apply_at,
			status: app.status,
			reapplyCount: app.reapply_count,
		}));

		// Calculate statistics by status
		const statusCounts = await prismaClient.application.groupBy({
			by: ["status"],
			_count: {
				status: true,
			},
		});

		const stats = {
			total: totalCount,
			submitted:
				statusCounts.find((s) => s.status === "SUBMITTED")?._count
					.status || 0,
			progressing:
				statusCounts.find((s) => s.status === "PROGRESSING")?._count
					.status || 0,
			accepted:
				statusCounts.find((s) => s.status === "ACCEPTED")?._count
					.status || 0,
			rejected:
				statusCounts.find((s) => s.status === "REJECTED")?._count
					.status || 0,
		};

		// Calculate pagination metadata
		const totalPages = Math.ceil(totalCount / filters.limit!);
		const hasNextPage = filters.page! < totalPages;
		const hasPrevPage = filters.page! > 1;

		return NextResponse.json({
			success: true,
			applications: transformedApplications,
			stats,
			pagination: {
				currentPage: filters.page!,
				totalPages,
				totalCount,
				limit: filters.limit!,
				hasNextPage,
				hasPrevPage,
			},
		});
	} catch (error) {
		// eslint-disable-next-line no-console
		console.error("Error fetching applications:", error);
		return NextResponse.json(
			{
				success: false,
				error: "Failed to fetch applications",
				message:
					error instanceof Error ? error.message : "Unknown error",
			},
			{ status: 500 }
		);
	}
}
