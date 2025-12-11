import { requireAuth } from "@/utils/auth/auth-utils";
import { NextRequest } from "next/server";
import { prismaClient } from "../../../../../prisma/index";

interface UserFilters {
	search?: string;
	status?: string; // Can be "all", single status, or comma-separated multiple statuses
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
			status: searchParams.get("status") || "all",
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

		// Search across name, email, and profile names
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
				// Search in applicant profile names
				{
					applicant: {
						OR: [
							{
								first_name: {
									contains: filters.search,
									mode: "insensitive",
								},
							},
							{
								last_name: {
									contains: filters.search,
									mode: "insensitive",
								},
							},
						],
					},
				},
				// Search in institution profile name
				{
					institution: {
						name: {
							contains: filters.search,
							mode: "insensitive",
						},
					},
				},
			];
		}

		// Filter by status - handle multiple statuses (comma-separated)
		if (filters.status && filters.status !== "all") {
			// Split by comma to handle multiple statuses
			const statusArray = filters.status
				.split(",")
				.map((s) => s.trim())
				.filter((s) => s);

			if (statusArray.length === 0) {
				// No valid statuses, skip filter
			} else if (statusArray.length === 1) {
				// Single status
				const status = statusArray[0];
				if (status === "banned") {
					whereClause.banned = true;
				} else if (status === "active") {
					// For active status, exclude banned users
					// For institutions, also require approved status (institution.status = true and verification_status = APPROVED)
					whereClause.banned = { not: true };
					if (filters.userType === "institution") {
						whereClause.institution = {
							status: true,
							verification_status: "APPROVED",
						};
					}
				} else if (status === "rejected") {
					// Rejected institutions have verification_status = REJECTED
					whereClause.role = "institution";
					whereClause.institution = {
						verification_status: "REJECTED",
					};
				} else if (status === "pending") {
					// Pending institutions have verification_status = PENDING
					whereClause.role = "institution";
					whereClause.banned = { not: true };
					whereClause.institution = {
						verification_status: "PENDING",
					};
				} else if (status === "require_update") {
					// Require update institutions have verification_status = REQUIRE_UPDATE
					whereClause.role = "institution";
					whereClause.banned = { not: true };
					whereClause.institution = {
						verification_status: "REQUIRE_UPDATE",
					};
				} else if (status === "updated") {
					// Updated institutions have verification_status = UPDATED
					whereClause.role = "institution";
					whereClause.banned = { not: true };
					whereClause.institution = {
						verification_status: "UPDATED",
					};
				}
			} else {
				// Multiple statuses - use OR conditions
				const orConditions: any[] = [];

				if (statusArray.includes("banned")) {
					orConditions.push({ banned: true });
				}

				if (statusArray.includes("active")) {
					const activeCondition: any = { banned: { not: true } };
					if (filters.userType === "institution") {
						activeCondition.institution = {
							status: true,
							verification_status: "APPROVED",
						};
					}
					orConditions.push(activeCondition);
				}

				if (statusArray.includes("rejected")) {
					orConditions.push({
						role: "institution",
						institution: {
							verification_status: "REJECTED",
						},
					});
				}

				if (statusArray.includes("pending")) {
					orConditions.push({
						role: "institution",
						banned: { not: true },
						institution: {
							verification_status: "PENDING",
						},
					});
				}

				if (statusArray.includes("require_update")) {
					orConditions.push({
						role: "institution",
						banned: { not: true },
						institution: {
							verification_status: "REQUIRE_UPDATE",
						},
					});
				}

				if (statusArray.includes("updated")) {
					orConditions.push({
						role: "institution",
						banned: { not: true },
						institution: {
							verification_status: "UPDATED",
						},
					});
				}

				if (orConditions.length > 0) {
					// If we already have OR conditions from search, combine them
					if (whereClause.OR) {
						whereClause.AND = [
							{ OR: whereClause.OR },
							{ OR: orConditions },
						];
						delete whereClause.OR;
					} else {
						whereClause.OR = orConditions;
					}
				}
			}
		}

		// Filter by role
		if (filters.role) {
			whereClause.role = filters.role;
		}

		// Filter by user type
		if (filters.userType) {
			if (filters.userType === "institution") {
				// Find institutions by having an institution record
				// This is the source of truth - if they have an institution record, they're an institution
				// If we already have OR conditions (from search), combine with AND
				if (whereClause.OR) {
					const existingOR = whereClause.OR;
					whereClause.AND = [
						{ OR: existingOR },
						{ institution: { isNot: null } },
					];
					delete whereClause.OR;
				} else {
					// No existing OR conditions, just add institution filter
					whereClause.institution = { isNot: null };
				}
			} else if (filters.userType === "admin") {
				whereClause.role = { in: ["admin", "super_admin"] };
			} else if (filters.userType === "applicant") {
				// Find applicants by having an applicant record
				// This is the source of truth - if they have an applicant record, they're an applicant
				// If we already have OR conditions (from search), combine with AND
				if (whereClause.OR) {
					const existingOR = whereClause.OR;
					whereClause.AND = [
						{ OR: existingOR },
						{ applicant: { isNot: null } },
						{ institution: null }, // Applicants don't have institution records
					];
					delete whereClause.OR;
				} else {
					whereClause.applicant = { isNot: null };
					whereClause.institution = null; // Applicants don't have institution records
				}
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
					role_id: true,
					institution: {
						select: {
							name: true,
							type: true,
							verification_status: true,
							submitted_at: true,
							verified_at: true,
							verified_by: true,
							rejection_reason: true,
						},
					},
					applicant: {
						select: {
							applicant_id: true,
							first_name: true,
							last_name: true,
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
			// Determine user type based on profile records (source of truth)
			const isInstitution = !!user.institution;
			const isApplicant = !!user.applicant;

			// Determine display name based on user type
			let displayName = "Unknown User";
			if (isApplicant && user.applicant) {
				// For applicants: use first_name + last_name from applicant profile
				const firstName = user.applicant.first_name || "";
				const lastName = user.applicant.last_name || "";
				displayName = `${firstName} ${lastName}`.trim();
				// Fallback to user.name if profile names are empty
				if (!displayName) {
					displayName = user.name || "Unknown User";
				}
			} else if (isInstitution && user.institution) {
				// For institutions: use name from institution profile
				displayName =
					user.institution.name || user.name || "Unknown User";
			} else {
				// Fallback to user.name for admins or users without profiles
				displayName = user.name || "Unknown User";
			}

			let status = "active";
			if (user.banned) {
				status = "banned";
			} else if (isInstitution && user.institution) {
				// For institutions: check verification_status first
				if (user.institution.verification_status === "PENDING") {
					status = "pending";
				} else if (
					user.institution.verification_status === "REJECTED"
				) {
					status = "rejected";
				} else if (
					user.institution.verification_status === "REQUIRE_UPDATE"
				) {
					status = "require_update";
				} else if (user.institution.verification_status === "UPDATED") {
					status = "updated";
				} else if (
					user.institution.verification_status === "APPROVED"
				) {
					// Approved institutions show as "active"
					status = "active";
				} else {
					// Fallback: treat unknown verification status as pending
					status = "pending";
				}
			} else if (isApplicant) {
				// Applicants are always "active" unless banned
				status = "active";
			}

			// Determine role for display - use institution record as source of truth
			let displayRole = user.role || "user";
			if (isInstitution) {
				displayRole = "institution";
			} else if (isApplicant) {
				displayRole = "user";
			}

			// Format institution type for display
			let institutionType: string | undefined = undefined;
			if (isInstitution && user.institution?.type) {
				const type = user.institution.type;
				if (type === "university") {
					institutionType = "University";
				} else if (type === "scholarship-provider") {
					institutionType = "Scholarship Provider";
				} else if (type === "research-lab") {
					institutionType = "Research Lab";
				} else {
					institutionType =
						type.charAt(0).toUpperCase() +
						type.slice(1).replace(/-/g, " ");
				}
			}

			return {
				id: user.id,
				name: displayName,
				email: user.email || "",
				image: user.image,
				banned: user.banned || false,
				banReason: user.banReason,
				banExpires: user.banExpires?.toISOString(),
				role: displayRole,
				createdAt: user.createdAt.toISOString(),
				status: status,
				type: institutionType,
				verification_status:
					user.institution?.verification_status || null,
				submitted_at:
					user.institution?.submitted_at?.toISOString() || null,
				verified_at:
					user.institution?.verified_at?.toISOString() || null,
				verified_by: user.institution?.verified_by || null,
				rejection_reason: user.institution?.rejection_reason || null,
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
