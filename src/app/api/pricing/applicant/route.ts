import { NextResponse } from "next/server";
import { prismaClient } from "../../../../../prisma/index";

export async function GET() {
	try {
		// Fetch applicant plans: type = 1, status = true, order by hierarchy
		const plans = await prismaClient.plan.findMany({
			where: {
				type: 1,
				status: true,
			},
			orderBy: {
				hierarchy: "asc",
			},
			select: {
				plan_id: true,
				priceId: true,
				name: true,
				description: true,
				features: true, // Already cumulative from DB
				month_price: true,
				year_price: true,
				hierarchy: true,
			},
		});

		return NextResponse.json({
			success: true,
			plans,
		});
	} catch (error) {
		console.error("Error fetching applicant pricing plans:", error);
		return NextResponse.json(
			{ success: false, error: "Failed to fetch pricing plans" },
			{ status: 500 }
		);
	}
}
