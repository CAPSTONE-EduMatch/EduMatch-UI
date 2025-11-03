import { requireAuth } from "@/lib/auth-utils";
import { NextRequest, NextResponse } from "next/server";
import { prismaClient } from "../../../../../prisma/index";

export async function GET(request: NextRequest) {
	try {
		// Authenticate user and check admin permissions
		const { user } = await requireAuth();

		if (!user.id) {
			return NextResponse.json(
				{ success: false, message: "Unauthorized" },
				{ status: 401 }
			);
		}

		// Check if user has admin role
		const isAdmin =
			user.email === process.env.ADMIN_EMAIL || user.role === "admin";

		if (!isAdmin) {
			return NextResponse.json(
				{
					success: false,
					message: "Forbidden - Admin access required",
				},
				{ status: 403 }
			);
		}
		const url = new URL(request.url);
		const page = parseInt(url.searchParams.get("page") || "1");
		const limit = parseInt(url.searchParams.get("limit") || "10");
		const status = url.searchParams.get("status");
		const userType = url.searchParams.get("userType");

		const skip = (page - 1) * limit;

		// Build where clause
		const where: any = {};
		if (status) {
			where.status = status;
		}
		if (userType) {
			where.userType = userType;
		}

		// Get invoices with user information
		const invoices = await prismaClient.invoice.findMany({
			where,
			include: {
				user: {
					select: {
						id: true,
						name: true,
						email: true,
						stripeCustomerId: true,
					},
				},
			},
			orderBy: {
				createdAt: "desc",
			},
			skip,
			take: limit,
		});
		console.log(invoices);

		// Get total count for pagination
		const total = await prismaClient.invoice.count({ where });

		return NextResponse.json({
			success: true,
			data: {
				invoices,
				pagination: {
					page,
					limit,
					total,
					totalPages: Math.ceil(total / limit),
				},
			},
		});
	} catch (error) {
		// eslint-disable-next-line no-console
		console.error("Error fetching invoices:", error);
		return NextResponse.json(
			{ success: false, error: "Failed to fetch invoices" },
			{ status: 500 }
		);
	}
}
