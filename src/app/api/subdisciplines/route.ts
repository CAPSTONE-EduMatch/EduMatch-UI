import { NextRequest, NextResponse } from "next/server";
import { prismaClient } from "../../../../prisma/index";

export async function GET(request: NextRequest) {
	try {
		console.log("🔍 API: Fetching subdisciplines from database");

		// Fetch all subdisciplines with their discipline information
		const subdisciplines = await prismaClient.subdiscipline.findMany({
			include: {
				discipline: true,
			},
			orderBy: {
				name: "asc",
			},
		});

		// Transform the data to match the frontend format
		const transformedSubdisciplines = subdisciplines.map((sub) => ({
			value: sub.name,
			label: sub.name,
			discipline: sub.discipline.name,
			subdiscipline_id: sub.subdiscipline_id,
		}));

		console.log(
			`✅ API: Found ${transformedSubdisciplines.length} subdisciplines`
		);

		return NextResponse.json({
			success: true,
			subdisciplines: transformedSubdisciplines,
		});
	} catch (error) {
		console.error("❌ API: Error fetching subdisciplines:", error);
		return NextResponse.json(
			{ error: "Failed to fetch subdisciplines" },
			{ status: 500 }
		);
	}
}
