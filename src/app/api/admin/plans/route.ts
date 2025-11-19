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
			select: { role_id: true },
		});

		if (!user || user.role_id !== "3") {
			return NextResponse.json({ error: "Forbidden" }, { status: 403 });
		}

		const { plan_id, month_price, year_price, priceId } =
			await request.json();

		if (!plan_id) {
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

		if (Object.keys(updateData).length === 0) {
			return NextResponse.json(
				{ error: "No valid fields to update" },
				{ status: 400 }
			);
		}

		// Update plan
		const updatedPlan = await prismaClient.plan.update({
			where: { plan_id },
			data: updateData,
		});

		return NextResponse.json(
			{ message: "Plan updated successfully", plan: updatedPlan },
			{ status: 200 }
		);
	} catch (error) {
		console.error("Admin plans PATCH API error:", error);
		return NextResponse.json(
			{ error: "Internal server error" },
			{ status: 500 }
		);
	}
}
