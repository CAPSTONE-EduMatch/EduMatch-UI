import { NextResponse } from "next/server";
import { prismaClient } from "../../../../prisma";

export async function GET() {
	try {
		// Get all active disciplines with their subdisciplines
		const disciplines = await prismaClient.discipline.findMany({
			where: { status: true },
			include: {
				subdisciplines: {
					where: { status: true },
					orderBy: { name: "asc" },
				},
			},
			orderBy: { name: "asc" },
		});

		// Format response
		const formattedDisciplines = disciplines.map((discipline) => ({
			id: discipline.discipline_id,
			name: discipline.name,
			subdisciplines: discipline.subdisciplines.map((sub) => ({
				id: sub.subdiscipline_id,
				name: sub.name,
			})),
		}));

		// Also create a flat list of all subdisciplines for easier filtering
		const allSubdisciplines = disciplines.flatMap((discipline) =>
			discipline.subdisciplines.map((sub) => ({
				id: sub.subdiscipline_id,
				name: sub.name,
				disciplineName: discipline.name,
			}))
		);

		return NextResponse.json({
			disciplines: formattedDisciplines,
			subdisciplines: allSubdisciplines,
			// Create subdisciplines grouped by discipline name for FilterSidebar
			subdisciplinesByDiscipline: disciplines.reduce(
				(acc, discipline) => {
					acc[discipline.name] = discipline.subdisciplines.map(
						(sub) => sub.name
					);
					return acc;
				},
				{} as Record<string, string[]>
			),
		});
	} catch (error) {
		if (process.env.NODE_ENV === "development") {
			// eslint-disable-next-line no-console
			console.error("Error fetching disciplines:", error);
		}
		return NextResponse.json(
			{
				error: "Internal server error",
				details:
					error instanceof Error ? error.message : "Unknown error",
			},
			{ status: 500 }
		);
	}
}
