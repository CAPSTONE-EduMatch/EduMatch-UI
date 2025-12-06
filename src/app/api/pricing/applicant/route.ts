import { NextResponse } from "next/server";
import { prismaClient } from "../../../../../prisma/index";

// Force dynamic rendering - no caching
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
	try {
		// eslint-disable-next-line no-console
		console.log("[PRICING APPLICANT] Fetching applicant plans...");

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

		// eslint-disable-next-line no-console
		console.log("[PRICING APPLICANT] ✅ Fetched", plans.length, "plans");
		// eslint-disable-next-line no-console
		console.log(
			"[PRICING APPLICANT] Plan prices:",
			plans.map((p) => ({
				name: p.name,
				month_price: p.month_price,
				year_price: p.year_price,
			}))
		);

		// Return with cache control headers to prevent stale data in production
		return NextResponse.json(
			{
				success: true,
				plans,
			},
			{
				headers: {
					"Cache-Control":
						"no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0",
					Pragma: "no-cache",
					Expires: "0",
				},
			}
		);
	} catch (error) {
		// eslint-disable-next-line no-console
		console.error(
			"[PRICING APPLICANT] ❌ Error fetching pricing plans:",
			error
		);
		// eslint-disable-next-line no-console
		console.error("[PRICING APPLICANT] Error details:", {
			name: error instanceof Error ? error.name : "Unknown",
			message: error instanceof Error ? error.message : String(error),
		});
		return NextResponse.json(
			{ success: false, error: "Failed to fetch pricing plans" },
			{ status: 500 }
		);
	}
}
