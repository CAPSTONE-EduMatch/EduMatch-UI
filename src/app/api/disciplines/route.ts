import { NextResponse } from "next/server";
import { prismaClient } from "../../../../prisma";

// Initialize Prisma client

interface SubdisciplineType {
	subdiscipline_id: string;
	name: string;
}

interface DisciplineType {
	discipline_id: string;
	name: string;
	status: boolean;
	subdisciplines: SubdisciplineType[];
}

export async function GET() {
	try {
		// Fetch all disciplines with their subdisciplines
		const disciplines: DisciplineType[] =
			await prismaClient.discipline.findMany({
				where: {
					status: true,
				},
				include: {
					subdisciplines: {
						where: {
							status: true,
						},
						select: {
							subdiscipline_id: true,
							name: true,
						},
					},
				},
				orderBy: {
					name: "asc",
				},
			});

		// Create subdisciplines grouped by discipline name
		const subdisciplinesByDiscipline: Record<string, string[]> = {};

		disciplines.forEach((discipline: DisciplineType) => {
			subdisciplinesByDiscipline[discipline.name] =
				discipline.subdisciplines.map(
					(sub: SubdisciplineType) => sub.name
				);
		});

		// Create flat subdisciplines list with discipline name
		const allSubdisciplines = await prismaClient.subdiscipline.findMany({
			where: {
				status: true,
			},
			include: {
				discipline: {
					select: {
						name: true,
					},
				},
			},
			orderBy: {
				name: "asc",
			},
		});

		const flatSubdisciplines = allSubdisciplines.map((sub: any) => ({
			id: sub.subdiscipline_id,
			name: sub.name,
			disciplineName: sub.discipline.name,
		}));

		return NextResponse.json({
			success: true,
			disciplines: disciplines.map((d: DisciplineType) => ({
				id: d.discipline_id,
				name: d.name,
				subdisciplines: d.subdisciplines.map(
					(sub: SubdisciplineType) => ({
						id: sub.subdiscipline_id,
						name: sub.name,
					})
				),
			})),
			subdisciplines: flatSubdisciplines,
			subdisciplinesByDiscipline,
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
				disciplines: [],
				subdisciplines: [],
				subdisciplinesByDiscipline: {},
			},
			{ status: 500 }
		);
	}
}
