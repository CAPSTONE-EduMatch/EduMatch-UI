import { requireAuth } from "@/lib/auth-utils";
import { NextRequest } from "next/server";
import { prismaClient } from "../../../../../prisma/index";

interface InstitutionFilters {
	search?: string;
	status?: "all" | "active" | "suspended" | "pending" | "banned";
	type?: "all" | "University" | "College" | "Institute" | "Academy";
	country?: string;
	sortBy?: "name" | "email" | "createdAt" | "totalApplications";
	sortDirection?: "asc" | "desc";
	page?: number;
	limit?: number;
}

// Get list of institutions with advanced filtering, sorting, and pagination
export async function GET(request: NextRequest) {
	try {
		// Authenticate user and check admin permissions
		const { user } = await requireAuth();
		if (!user?.id) {
			return Response.json(
				{ error: "User not authenticated" },
				{ status: 401 }
			);
		}

		const { searchParams } = new URL(request.url);

		// Parse query parameters
		const filters: InstitutionFilters = {
			search: searchParams.get("search") || undefined,
			status:
				(searchParams.get("status") as
					| "all"
					| "active"
					| "suspended"
					| "pending"
					| "banned") || "all",
			type:
				(searchParams.get("type") as
					| "all"
					| "University"
					| "College"
					| "Institute"
					| "Academy") || "all",
			country: searchParams.get("country") || undefined,
			sortBy:
				(searchParams.get("sortBy") as
					| "name"
					| "email"
					| "createdAt"
					| "totalApplications") || "name",
			sortDirection:
				(searchParams.get("sortDirection") as "asc" | "desc") || "desc",
			page: parseInt(searchParams.get("page") || "1"),
			limit: parseInt(searchParams.get("limit") || "10"),
		};

		// Build the where clause for filtering
		const whereClause: any = {};

		// Search filter (search in name, email, rep_name, rep_email)
		if (filters.search && filters.search.trim()) {
			whereClause.OR = [
				{
					name: {
						contains: filters.search,
						mode: "insensitive",
					},
				},
				{
					email: {
						contains: filters.search,
						mode: "insensitive",
					},
				},
				{
					rep_name: {
						contains: filters.search,
						mode: "insensitive",
					},
				},
				{
					rep_email: {
						contains: filters.search,
						mode: "insensitive",
					},
				},
			];
		}

		// Type filter
		if (filters.type && filters.type !== "all") {
			whereClause.type = filters.type;
		}

		// Country filter
		if (filters.country && filters.country.trim()) {
			whereClause.country = {
				contains: filters.country,
				mode: "insensitive",
			};
		}

		// Status and banned filter
		if (filters.status && filters.status !== "all") {
			if (filters.status === "banned") {
				whereClause.user = {
					banned: true,
				};
			} else if (filters.status === "active") {
				whereClause.user = {
					banned: false,
					status: true,
				};
			} else if (filters.status === "suspended") {
				whereClause.user = {
					banned: false,
					status: false,
				};
			}
		}

		// Build the orderBy clause
		let orderByClause: any = {};

		switch (filters.sortBy) {
			case "name":
				orderByClause = { name: filters.sortDirection };
				break;
			case "email":
				orderByClause = { email: filters.sortDirection };
				break;
			case "createdAt":
				orderByClause = { user: { createdAt: filters.sortDirection } };
				break;
			case "totalApplications":
				// For total applications, we'll need to handle this differently
				// For now, we'll sort by name as a fallback
				orderByClause = { name: filters.sortDirection };
				break;
			default:
				orderByClause = { name: "asc" };
		}

		// Calculate pagination
		const skip = (filters.page! - 1) * filters.limit!;

		// Fetch institutions with related user data and application counts
		const [institutions, total] = await Promise.all([
			prismaClient.institution.findMany({
				where: whereClause,
				include: {
					user: {
						select: {
							id: true,
							email: true,
							name: true,
							banned: true,
							status: true,
							banReason: true,
							banExpires: true,
							createdAt: true,
						},
					},
					posts: {
						include: {
							applications: {
								select: {
									application_id: true,
									status: true,
								},
							},
						},
					},
				},
				orderBy: orderByClause,
				skip,
				take: filters.limit,
			}),
			prismaClient.institution.count({
				where: whereClause,
			}),
		]);

		// Transform the data to match the expected interface
		const transformedInstitutions = institutions.map((institution) => {
			// Calculate total applications from all posts
			const totalApplications = institution.posts.reduce(
				(sum, post) => sum + post.applications.length,
				0
			);

			// Determine status
			let status: "Active" | "Suspended" | "Pending" = "Active";
			if (institution.user.banned) {
				status = "Suspended"; // We'll show banned as suspended in the list
			} else if (!institution.user.status) {
				status = "Suspended";
			}

			return {
				id: institution.institution_id,
				name: institution.name,
				abbreviation: institution.abbreviation,
				email: institution.email || institution.user.email,
				country: institution.country,
				type: institution.type,
				status,
				banned: institution.user.banned || false,
				totalApplications,
				createdAt: institution.user.createdAt.toISOString(),
				repName: institution.rep_name,
				repEmail: institution.rep_email,
			};
		});

		const totalPages = Math.ceil(total / filters.limit!);

		return Response.json({
			success: true,
			data: {
				institutions: transformedInstitutions,
				pagination: {
					page: filters.page,
					limit: filters.limit,
					total,
					totalPages,
				},
			},
		});
	} catch (error) {
		// eslint-disable-next-line no-console
		console.error("Error fetching institutions:", error);
		return Response.json(
			{
				success: false,
				error: "Failed to fetch institutions",
			},
			{ status: 500 }
		);
	}
}
