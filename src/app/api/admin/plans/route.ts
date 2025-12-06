import { auth } from "@/config/auth";
import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { prismaClient } from "../../../../../prisma/index";

export async function GET() {
	try {
		const session = await auth.api.getSession({
			headers: headers(),
		});

		if (!session?.user) {
			return NextResponse.json(
				{ error: "Unauthorized" },
				{ status: 401 }
			);
		}

		// Check if user is admin
		const user = await prismaClient.user.findUnique({
			where: { id: session.user.id },
			select: {
				role: true,
			},
		});

		console.log("User role ID:", user?.role);
		if (!user || user.role !== "admin") {
			return NextResponse.json({ error: "Forbidden" }, { status: 403 });
		}

		// Get all plans
		const plans = await prismaClient.plan.findMany({
			orderBy: [{ type: "asc" }, { hierarchy: "asc" }],
		});

		return NextResponse.json({ plans }, { status: 200 });
	} catch (error) {
		console.error("Admin plans API error:", error);
		return NextResponse.json(
			{ error: "Internal server error" },
			{ status: 500 }
		);
	}
}

export async function PATCH(request: NextRequest) {
	try {
		console.log("[ADMIN PLANS PATCH] Request received");

		const session = await auth.api.getSession({
			headers: headers(),
		});

		if (!session?.user) {
			console.log("[ADMIN PLANS PATCH] Unauthorized - no session");
			return NextResponse.json(
				{ error: "Unauthorized" },
				{ status: 401 }
			);
		}

		console.log("[ADMIN PLANS PATCH] Session user ID:", session.user.id);

		// Check if user is admin
		const user = await prismaClient.user.findUnique({
			where: { id: session.user.id },
			select: { role: true },
		});

		console.log("[ADMIN PLANS PATCH] User role:", user?.role);

		if (!user || user.role !== "admin") {
			console.log("[ADMIN PLANS PATCH] Forbidden - not admin");
			return NextResponse.json({ error: "Forbidden" }, { status: 403 });
		}

		const { plan_id, month_price, year_price, priceId } =
			await request.json();

		console.log("[ADMIN PLANS PATCH] Update payload:", {
			plan_id,
			month_price,
			year_price,
			priceId,
		});

		if (!plan_id) {
			console.log("[ADMIN PLANS PATCH] Error: Missing plan_id");
			return NextResponse.json(
				{ error: "Plan ID is required" },
				{ status: 400 }
			);
		}

		// Prepare update data
		const updateData: any = {};

		if (month_price !== undefined) {
			updateData.month_price = month_price;
		}

		if (year_price !== undefined) {
			updateData.year_price = year_price;
		}

		if (priceId !== undefined) {
			updateData.priceId = priceId;
		}

		console.log("[ADMIN PLANS PATCH] Update data prepared:", updateData);

		if (Object.keys(updateData).length === 0) {
			console.log("[ADMIN PLANS PATCH] Error: No fields to update");
			return NextResponse.json(
				{ error: "No valid fields to update" },
				{ status: 400 }
			);
		}

		// Update plan in database
		console.log("[ADMIN PLANS PATCH] Updating plan in database...");
		const updatedPlan = await prismaClient.plan.update({
			where: { plan_id },
			data: updateData,
		});

		console.log("[ADMIN PLANS PATCH] ✅ Plan updated successfully:", {
			plan_id: updatedPlan.plan_id,
			name: updatedPlan.name,
			month_price: updatedPlan.month_price,
			year_price: updatedPlan.year_price,
			priceId: updatedPlan.priceId,
		});

		// Return response with cache control headers to prevent caching
		return NextResponse.json(
			{ message: "Plan updated successfully", plan: updatedPlan },
			{
				status: 200,
				headers: {
					"Cache-Control":
						"no-store, no-cache, must-revalidate, proxy-revalidate",
					Pragma: "no-cache",
					Expires: "0",
				},
			}
		);
	} catch (error) {
		console.error("[ADMIN PLANS PATCH] ❌ Error:", error);
		console.error("[ADMIN PLANS PATCH] Error details:", {
			name: error instanceof Error ? error.name : "Unknown",
			message: error instanceof Error ? error.message : String(error),
			stack: error instanceof Error ? error.stack : undefined,
		});
		return NextResponse.json(
			{ error: "Internal server error" },
			{ status: 500 }
		);
	}
}
