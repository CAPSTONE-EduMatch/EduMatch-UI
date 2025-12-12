import { NextResponse } from "next/server";
import { prismaClient } from "../../../../../prisma/index";

// Force dynamic rendering - no caching
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
	try {
		// eslint-disable-next-line no-console
		console.log("[PRICING INSTITUTION] Fetching institution plan...");

		// Fetch institution plan: type = 2, status = true
		const plans = await prismaClient.plan.findMany({
			where: {
				type: 2,
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
				features: true,
				month_price: true,
				year_price: true,
				hierarchy: true,
			},
		});

		// eslint-disable-next-line no-console
		console.log(
			"[PRICING INSTITUTION] ✅ Fetched",
			plans.length,
			"plan(s)"
		);
		// eslint-disable-next-line no-console
		console.log(
			"[PRICING INSTITUTION] Plan prices:",
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
					"Cache-Control": "no-store, no-cache, must-revalidate",
					Pragma: "no-cache",
					Expires: "0",
				},
			}
		);
	} catch (error) {
		// eslint-disable-next-line no-console
		console.error("[PRICING INSTITUTION] ❌ Error fetching plans:", error);
		return NextResponse.json(
			{
				success: false,
				error: "Failed to fetch institution pricing plans",
			},
			{ status: 500 }
		);
	}
}
