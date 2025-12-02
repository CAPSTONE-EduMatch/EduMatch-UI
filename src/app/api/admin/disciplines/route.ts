import { requireAuth } from "@/utils/auth/auth-utils";
import { NextRequest, NextResponse } from "next/server";
import { prismaClient } from "../../../../../prisma/index";

interface DisciplineFilters {
	search?: string;
	status?: "all" | "active" | "inactive";
	sortBy?: "name" | "createdAt";
	sortDirection?: "asc" | "desc";
	page?: number;
	limit?: number;
}

// GET - List all disciplines and subdisciplines with filtering
export async function GET(request: NextRequest) {
	try {
		await requireAuth();

		const { searchParams } = new URL(request.url);

		const filters: DisciplineFilters = {
			search: searchParams.get("search") || undefined,
			status:
				(searchParams.get("status") as "all" | "active" | "inactive") ||
				"all",
			sortBy:
				(searchParams.get("sortBy") as "name" | "createdAt") || "name",
			sortDirection:
				(searchParams.get("sortDirection") as "asc" | "desc") || "asc",
			page: parseInt(searchParams.get("page") || "1"),
			limit: parseInt(searchParams.get("limit") || "10"),
		};

		// Build where clause for disciplines
		const disciplineWhere: any = {};

		if (filters.status === "active") {
			disciplineWhere.status = true;
		} else if (filters.status === "inactive") {
			disciplineWhere.status = false;
		}

		if (filters.search) {
			disciplineWhere.name = {
				contains: filters.search,
				mode: "insensitive",
			};
		}

		// Fetch all disciplines
		const disciplines = await prismaClient.discipline.findMany({
			where: disciplineWhere,
			include: {
				subdisciplines: {
					orderBy: { name: "asc" },
				},
			},
			orderBy: {
				[filters.sortBy || "name"]: filters.sortDirection || "asc",
			},
		});

		// Build where clause for subdisciplines (for the main list view)
		const subdisciplineWhere: any = {};

		if (filters.status === "active") {
			subdisciplineWhere.status = true;
		} else if (filters.status === "inactive") {
			subdisciplineWhere.status = false;
		}

		if (filters.search) {
			subdisciplineWhere.OR = [
				{
					name: {
						contains: filters.search,
						mode: "insensitive",
					},
				},
				{
					discipline: {
						name: {
							contains: filters.search,
							mode: "insensitive",
						},
					},
				},
			];
		}

		// Get total count for pagination
		const totalCount = await prismaClient.subdiscipline.count({
			where: subdisciplineWhere,
		});

		// Calculate pagination
		const skip = (filters.page! - 1) * filters.limit!;
		const take = filters.limit!;

		// Fetch subdisciplines with pagination
		const subdisciplines = await prismaClient.subdiscipline.findMany({
			where: subdisciplineWhere,
			include: {
				discipline: {
					select: {
						discipline_id: true,
						name: true,
						status: true,
					},
				},
			},
			orderBy: {
				[filters.sortBy || "name"]: filters.sortDirection || "asc",
			},
			skip,
			take,
		});

		// Transform subdisciplines for response
		const transformedSubdisciplines = subdisciplines.map((sub) => ({
			id: sub.subdiscipline_id,
			subdisciplineName: sub.name,
			discipline: sub.discipline.name,
			disciplineId: sub.discipline.discipline_id,
			status: sub.status ? "Active" : "Inactive",
			createdAt: new Date().toLocaleDateString("en-US", {
				month: "2-digit",
				day: "2-digit",
				year: "numeric",
			}),
		}));

		// Calculate stats
		const allSubdisciplines = await prismaClient.subdiscipline.findMany();
		const stats = {
			total: allSubdisciplines.length,
			active: allSubdisciplines.filter((s) => s.status).length,
			inactive: allSubdisciplines.filter((s) => !s.status).length,
		};

		const totalPages = Math.ceil(totalCount / filters.limit!);

		return NextResponse.json({
			success: true,
			disciplines: disciplines.map((d) => ({
				id: d.discipline_id,
				name: d.name,
				status: d.status ? "Active" : "Inactive",
				subdisciplineCount: d.subdisciplines.length,
			})),
			subdisciplines: transformedSubdisciplines,
			stats,
			pagination: {
				currentPage: filters.page,
				totalPages,
				totalCount,
				limit: filters.limit,
				hasNextPage: filters.page! < totalPages,
				hasPrevPage: filters.page! > 1,
			},
		});
	} catch (error) {
		if (process.env.NODE_ENV === "development") {
			// eslint-disable-next-line no-console
			console.error("Error fetching disciplines:", error);
		}
		return NextResponse.json(
			{
				success: false,
				error: "Failed to fetch disciplines",
				message:
					error instanceof Error ? error.message : "Unknown error",
			},
			{ status: 500 }
		);
	}
}

// POST - Create a new discipline or subdiscipline
export async function POST(request: NextRequest) {
	try {
		await requireAuth();

		const body = await request.json();
		const { type, name, disciplineId } = body;

		if (!type || !name) {
			return NextResponse.json(
				{
					success: false,
					error: "Missing required fields: type, name",
				},
				{ status: 400 }
			);
		}

		if (type === "discipline") {
			// Check if discipline already exists
			const existing = await prismaClient.discipline.findFirst({
				where: {
					name: {
						equals: name,
						mode: "insensitive",
					},
				},
			});

			if (existing) {
				return NextResponse.json(
					{
						success: false,
						error: "A discipline with this name already exists",
					},
					{ status: 400 }
				);
			}

			// Create new discipline
			const discipline = await prismaClient.discipline.create({
				data: {
					discipline_id: crypto.randomUUID(),
					name: name.trim(),
					status: true,
				},
			});

			return NextResponse.json({
				success: true,
				message: "Discipline created successfully",
				discipline: {
					id: discipline.discipline_id,
					name: discipline.name,
					status: discipline.status ? "Active" : "Inactive",
				},
			});
		} else if (type === "subdiscipline") {
			if (!disciplineId) {
				return NextResponse.json(
					{
						success: false,
						error: "Missing required field: disciplineId for subdiscipline",
					},
					{ status: 400 }
				);
			}

			// Check if discipline exists
			const discipline = await prismaClient.discipline.findUnique({
				where: { discipline_id: disciplineId },
			});

			if (!discipline) {
				return NextResponse.json(
					{ success: false, error: "Discipline not found" },
					{ status: 404 }
				);
			}

			// Check if subdiscipline already exists under this discipline
			const existing = await prismaClient.subdiscipline.findFirst({
				where: {
					name: {
						equals: name,
						mode: "insensitive",
					},
					discipline_id: disciplineId,
				},
			});

			if (existing) {
				return NextResponse.json(
					{
						success: false,
						error: "A subdiscipline with this name already exists under this discipline",
					},
					{ status: 400 }
				);
			}

			// Create new subdiscipline
			const subdiscipline = await prismaClient.subdiscipline.create({
				data: {
					subdiscipline_id: crypto.randomUUID(),
					name: name.trim(),
					status: true,
					discipline_id: disciplineId,
				},
				include: {
					discipline: {
						select: {
							name: true,
						},
					},
				},
			});

			return NextResponse.json({
				success: true,
				message: "Subdiscipline created successfully",
				subdiscipline: {
					id: subdiscipline.subdiscipline_id,
					name: subdiscipline.name,
					discipline: subdiscipline.discipline.name,
					disciplineId: subdiscipline.discipline_id,
					status: subdiscipline.status ? "Active" : "Inactive",
				},
			});
		} else {
			return NextResponse.json(
				{
					success: false,
					error: "Invalid type. Must be 'discipline' or 'subdiscipline'",
				},
				{ status: 400 }
			);
		}
	} catch (error) {
		if (process.env.NODE_ENV === "development") {
			// eslint-disable-next-line no-console
			console.error("Error creating discipline/subdiscipline:", error);
		}
		return NextResponse.json(
			{
				success: false,
				error: "Failed to create",
				message:
					error instanceof Error ? error.message : "Unknown error",
			},
			{ status: 500 }
		);
	}
}

// PATCH - Update a discipline or subdiscipline
export async function PATCH(request: NextRequest) {
	try {
		await requireAuth();

		const body = await request.json();
		const { type, id, name, status, disciplineId } = body;

		if (!type || !name) {
			return NextResponse.json(
				{
					success: false,
					error: "Missing required fields: type, name",
				},
				{ status: 400 }
			);
		}

		if (type === "discipline") {
			const updateData: any = {};

			if (name !== undefined) {
				// Check for duplicate name
				const existing = await prismaClient.discipline.findFirst({
					where: {
						name: {
							equals: name,
							mode: "insensitive",
						},
						discipline_id: {
							not: id,
						},
					},
				});

				if (existing) {
					return NextResponse.json(
						{
							success: false,
							error: "A discipline with this name already exists",
						},
						{ status: 400 }
					);
				}
				updateData.name = name.trim();
			}

			if (status !== undefined) {
				updateData.status = status === "Active" || status === true;
			}

			const discipline = await prismaClient.discipline.update({
				where: { discipline_id: id },
				data: updateData,
			});

			return NextResponse.json({
				success: true,
				message: "Discipline updated successfully",
				discipline: {
					id: discipline.discipline_id,
					name: discipline.name,
					status: discipline.status ? "Active" : "Inactive",
				},
			});
		} else if (type === "subdiscipline") {
			const updateData: any = {};

			if (name !== undefined) {
				// Check for duplicate name under the same or new discipline
				const targetDisciplineId =
					disciplineId ||
					(
						await prismaClient.subdiscipline.findUnique({
							where: { subdiscipline_id: id },
						})
					)?.discipline_id;

				const existing = await prismaClient.subdiscipline.findFirst({
					where: {
						name: {
							equals: name,
							mode: "insensitive",
						},
						discipline_id: targetDisciplineId,
						subdiscipline_id: {
							not: id,
						},
					},
				});

				if (existing) {
					return NextResponse.json(
						{
							success: false,
							error: "A subdiscipline with this name already exists under this discipline",
						},
						{ status: 400 }
					);
				}
				updateData.name = name.trim();
			}

			if (status !== undefined) {
				updateData.status = status === "Active" || status === true;
			}

			if (disciplineId !== undefined) {
				// Verify the new discipline exists
				const discipline = await prismaClient.discipline.findUnique({
					where: { discipline_id: disciplineId },
				});

				if (!discipline) {
					return NextResponse.json(
						{
							success: false,
							error: "Target discipline not found",
						},
						{ status: 404 }
					);
				}
				updateData.discipline_id = disciplineId;
			}

			const subdiscipline = await prismaClient.subdiscipline.update({
				where: { subdiscipline_id: id },
				data: updateData,
				include: {
					discipline: {
						select: {
							name: true,
						},
					},
				},
			});

			return NextResponse.json({
				success: true,
				message: "Subdiscipline updated successfully",
				subdiscipline: {
					id: subdiscipline.subdiscipline_id,
					name: subdiscipline.name,
					discipline: subdiscipline.discipline.name,
					disciplineId: subdiscipline.discipline_id,
					status: subdiscipline.status ? "Active" : "Inactive",
				},
			});
		} else {
			return NextResponse.json(
				{
					success: false,
					error: "Invalid type. Must be 'discipline' or 'subdiscipline'",
				},
				{ status: 400 }
			);
		}
	} catch (error) {
		if (process.env.NODE_ENV === "development") {
			// eslint-disable-next-line no-console
			console.error("Error updating discipline/subdiscipline:", error);
		}
		return NextResponse.json(
			{
				success: false,
				error: "Failed to update",
				message:
					error instanceof Error ? error.message : "Unknown error",
			},
			{ status: 500 }
		);
	}
}

// DELETE - Soft delete (set status to false) a discipline or subdiscipline
export async function DELETE(request: NextRequest) {
	try {
		await requireAuth();

		const { searchParams } = new URL(request.url);
		const type = searchParams.get("type");
		const id = searchParams.get("id");

		if (!type || !id) {
			return NextResponse.json(
				{ success: false, error: "Missing required params: type, id" },
				{ status: 400 }
			);
		}

		if (type === "discipline") {
			// Soft delete - set status to false
			const discipline = await prismaClient.discipline.update({
				where: { discipline_id: id },
				data: { status: false },
			});

			// Also deactivate all subdisciplines under this discipline
			await prismaClient.subdiscipline.updateMany({
				where: { discipline_id: id },
				data: { status: false },
			});

			return NextResponse.json({
				success: true,
				message: "Discipline deactivated successfully",
				discipline: {
					id: discipline.discipline_id,
					name: discipline.name,
					status: "Inactive",
				},
			});
		} else if (type === "subdiscipline") {
			// Soft delete - set status to false
			const subdiscipline = await prismaClient.subdiscipline.update({
				where: { subdiscipline_id: id },
				data: { status: false },
				include: {
					discipline: {
						select: {
							name: true,
						},
					},
				},
			});

			return NextResponse.json({
				success: true,
				message: "Subdiscipline deactivated successfully",
				subdiscipline: {
					id: subdiscipline.subdiscipline_id,
					name: subdiscipline.name,
					discipline: subdiscipline.discipline.name,
					status: "Inactive",
				},
			});
		} else {
			return NextResponse.json(
				{
					success: false,
					error: "Invalid type. Must be 'discipline' or 'subdiscipline'",
				},
				{ status: 400 }
			);
		}
	} catch (error) {
		if (process.env.NODE_ENV === "development") {
			// eslint-disable-next-line no-console
			console.error("Error deleting discipline/subdiscipline:", error);
		}
		return NextResponse.json(
			{
				success: false,
				error: "Failed to delete",
				message:
					error instanceof Error ? error.message : "Unknown error",
			},
			{ status: 500 }
		);
	}
}
