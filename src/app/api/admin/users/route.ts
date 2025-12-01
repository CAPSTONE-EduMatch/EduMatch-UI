import { requireAuth } from "@/utils/auth/auth-utils";
import { NextRequest } from "next/server";
import { prismaClient } from "../../../../../prisma/index";

interface UserFilters {
	search?: string;
	status?: "all" | "active" | "inactive" | "banned" | "pending" | "denied";
	role?: string;
	userType?: "applicant" | "institution" | "admin";
	sortBy?: "name" | "email" | "createdAt";
	sortDirection?: "asc" | "desc";
	page?: number;
	limit?: number;
}

// Get list of users with advanced filtering, sorting, and pagination
export async function GET(request: NextRequest) {
	try {
		// Authenticate user and check admin permissions
		await requireAuth();

		const { searchParams } = new URL(request.url);

		// Parse query parameters
		const filters: UserFilters = {
			search: searchParams.get("search") || undefined,
			status:
				(searchParams.get("status") as
					| "all"
					| "active"
					| "inactive"
					| "banned"
					| "pending"
					| "denied") || "all",
			role: searchParams.get("role") || undefined,
			userType:
				(searchParams.get("userType") as
					| "applicant"
					| "institution"
					| "admin") || undefined,
			sortBy:
				(searchParams.get("sortBy") as
					| "name"
					| "email"
					| "createdAt") || "createdAt",
			sortDirection:
				(searchParams.get("sortDirection") as "asc" | "desc") || "desc",
			page: parseInt(searchParams.get("page") || "1"),
			limit: parseInt(searchParams.get("limit") || "10"),
		};

		// Build where clause for filtering
		const whereClause: any = {};

		// Search across name and email
		if (filters.search) {
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
			];
		}

		// Filter by status
		if (filters.status !== "all") {
			if (filters.status === "banned") {
				whereClause.banned = true;
			} else if (filters.status === "active") {
				// For active status, exclude banned users and require active status
				whereClause.banned = { not: true };
				whereClause.status = true;
				if (filters.userType === "institution") {
					whereClause.institution = {
						status: "ACTIVE",
					};
				}
			} else if (filters.status === "inactive") {
				// Inactive users have user.status = false and are not banned (for non-institution users)
				whereClause.banned = { not: true };
				whereClause.status = false;
			} else if (filters.status === "pending") {
				// Pending institutions have institution.status = PENDING
				whereClause.role = "institution";
				whereClause.banned = { not: true };
				whereClause.institution = {
					status: "PENDING",
				};
			} else if (filters.status === "denied") {
				// Denied institutions have institution.status = DENIED
				whereClause.role = "institution";
				whereClause.institution = {
					status: "DENIED",
				};
			}
		}

		// Filter by role
		if (filters.role) {
			whereClause.role = filters.role;
		}

		// Filter by user type
		if (filters.userType) {
			if (filters.userType === "institution") {
				whereClause.role = "institution";
			} else if (filters.userType === "admin") {
				whereClause.role = { in: ["admin", "super_admin"] };
			} else if (filters.userType === "applicant") {
				whereClause.role = {
					notIn: ["institution", "admin", "super_admin"],
				};
			}
		}

		// Calculate pagination
		const skip = (filters.page! - 1) * filters.limit!;
		const take = filters.limit!;

		// Build order by clause
		const orderBy: any = {};
		if (filters.sortBy === "name") {
			orderBy.name = filters.sortDirection;
		} else if (filters.sortBy === "email") {
			orderBy.email = filters.sortDirection;
		} else {
			orderBy.createdAt = filters.sortDirection;
		}

		// Execute queries
		const [users, totalCount] = await Promise.all([
			prismaClient.user.findMany({
				where: whereClause,
				select: {
					id: true,
					name: true,
					email: true,
					image: true,
					createdAt: true,
					banned: true,
					banReason: true,
					banExpires: true,
					role: true,
					status: true,
					institution: {
						select: {
							status: true,
						},
					},
				},
				orderBy,
				skip,
				take,
			}),
			prismaClient.user.count({
				where: whereClause,
			}),
		]);

		// Transform the data
		const transformedUsers = users.map((user) => {
			let status = "active";
			if (user.banned) {
				status = "banned";
			} else if (user.role === "institution" && user.institution) {
				// For institutions: map enum status to string
				const instStatus = user.institution.status;
				if (instStatus === "ACTIVE") {
					status = "active";
				} else if (instStatus === "PENDING") {
					status = "pending";
				} else if (instStatus === "DENIED") {
					status = "denied";
				}
			} else if (user.status === false) {
				// For non-institution users: inactive when user.status is false
				status = "inactive";
			}

			return {
				id: user.id,
				name: user.name || "Unknown User",
				email: user.email || "",
				image: user.image,
				banned: user.banned || false,
				banReason: user.banReason,
				banExpires: user.banExpires?.toISOString(),
				role: user.role || "user",
				createdAt: user.createdAt.toISOString(),
				status: status,
				type: user.role === "institution" ? "University" : undefined,
				institutionStatus: user.institution?.status,
			};
		});

		const totalPages = Math.ceil(totalCount / filters.limit!);

		return new Response(
			JSON.stringify({
				success: true,
				users: transformedUsers,
				total: totalCount,
				pagination: {
					currentPage: filters.page,
					totalPages,
					totalCount,
					limit: filters.limit,
					hasNextPage: filters.page! < totalPages,
					hasPrevPage: filters.page! > 1,
				},
				filters: filters,
			}),
			{
				status: 200,
				headers: {
					"Content-Type": "application/json",
				},
			}
		);
	} catch (error) {
		if (process.env.NODE_ENV === "development") {
			// eslint-disable-next-line no-console
			console.error("Error fetching users:", error);
		}
		return new Response(
			JSON.stringify({
				success: false,
				error: "Failed to fetch users",
				message:
					error instanceof Error ? error.message : "Unknown error",
			}),
			{
				status: 500,
				headers: {
					"Content-Type": "application/json",
				},
			}
		);
	}
}

// User management actions (ban, unban, delete)
export async function POST(request: NextRequest) {
	try {
		await requireAuth();

		const body = await request.json();
		const { userId, action, reason, expiresIn } = body;

		if (!userId || !action) {
			return new Response("Missing required fields", { status: 400 });
		}

		let result;
		switch (action) {
			case "ban":
				result = await prismaClient.user.update({
					where: { id: userId },
					data: {
						banned: true,
						banReason: reason || "Banned by admin",
						banExpires: expiresIn
							? new Date(
									Date.now() + expiresIn * 24 * 60 * 60 * 1000
								)
							: null,
					},
				});
				break;

			case "unban":
				result = await prismaClient.user.update({
					where: { id: userId },
					data: {
						banned: false,
						banReason: null,
						banExpires: null,
					},
				});
				break;

			case "delete":
				result = await prismaClient.user.delete({
					where: { id: userId },
				});
				break;

			default:
				return new Response("Invalid action", { status: 400 });
		}

		return new Response(
			JSON.stringify({
				success: true,
				message: `User ${action}ned successfully`,
				user: result,
			}),
			{
				status: 200,
				headers: {
					"Content-Type": "application/json",
				},
			}
		);
	} catch (error) {
		if (process.env.NODE_ENV === "development") {
			// eslint-disable-next-line no-console
			console.error("Error performing user action:", error);
		}
		return new Response(
			JSON.stringify({
				success: false,
				error: "Failed to perform action",
				message:
					error instanceof Error ? error.message : "Unknown error",
			}),
			{
				status: 500,
				headers: {
					"Content-Type": "application/json",
				},
			}
		);
	}
}
