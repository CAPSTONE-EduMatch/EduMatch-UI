import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/auth-utils";
import { prismaClient } from "../../../../../prisma/index";

interface UserFilters {
	search?: string;
	status?: "all" | "active" | "banned";
	role?: string;
	userType?: "applicant" | "institution";
	sortBy?: "name" | "email" | "createdAt";
	sortDirection?: "asc" | "desc";
	page?: number;
	limit?: number;
}

// Get list of users with advanced filtering, sorting, and pagination
export async function GET(request: NextRequest) {
	try {
		// Authenticate user and check admin permissions
		const { user: currentUser } = await requireAuth();

		const { searchParams } = new URL(request.url);

		// Parse query parameters
		const filters: UserFilters = {
			search: searchParams.get("search") || undefined,
			status:
				(searchParams.get("status") as "all" | "active" | "banned") ||
				"all",
			role: searchParams.get("role") || undefined,
			userType:
				(searchParams.get("userType") as "applicant" | "institution") ||
				undefined,
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

		// Filter by status (banned/active)
		if (filters.status !== "all") {
			if (filters.status === "banned") {
				whereClause.banned = true;
			} else if (filters.status === "active") {
				whereClause.banned = { not: true };
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
			} else {
				whereClause.role = { not: "institution" };
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
		const transformedUsers = users.map((user) => ({
			id: user.id,
			name: user.name || "Unknown User",
			email: user.email || "",
			image: user.image,
			banned: user.banned || false,
			banReason: user.banReason,
			banExpires: user.banExpires?.toISOString(),
			role: user.role || "user",
			createdAt: user.createdAt.toISOString(),
			status: user.banned ? "banned" : "active",
			type: user.role === "institution" ? "University" : undefined,
		}));

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
		console.error("Error fetching users:", error);
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
		const { user: currentUser } = await requireAuth();

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
		console.error("Error performing user action:", error);
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
