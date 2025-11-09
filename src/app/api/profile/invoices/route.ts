import { auth } from "@/config/auth";
import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { prismaClient } from "../../../../../prisma";

export async function GET(req: NextRequest) {
	try {
		// Get authenticated user
		const session = await auth.api.getSession({
			headers: await headers(),
		});

		if (!session?.user) {
			return NextResponse.json(
				{ success: false, error: "Unauthorized" },
				{ status: 401 }
			);
		}

		const userId = session.user.id;

		// Get query parameters
		const searchParams = req.nextUrl.searchParams;
		const page = parseInt(searchParams.get("page") || "1", 10);
		const limit = parseInt(searchParams.get("limit") || "10", 10);
		const status = searchParams.get("status") || undefined;

		// Calculate pagination
		const skip = (page - 1) * limit;

		// Build where clause
		const where: any = {
			userId,
		};

		if (status) {
			where.status = status;
		}

		// Fetch invoices for the current user
		const [invoices, total] = await Promise.all([
			prismaClient.invoice.findMany({
				where,
				skip,
				take: limit,
				orderBy: {
					createdAt: "desc",
				},
				select: {
					id: true,
					stripeInvoiceId: true,
					amount: true,
					currency: true,
					status: true,
					paymentMethod: true,
					hostedInvoiceUrl: true,
					invoicePdf: true,
					receiptNumber: true,
					periodStart: true,
					periodEnd: true,
					paidAt: true,
					createdAt: true,
				},
			}),
			prismaClient.invoice.count({ where }),
		]);

		// Format response
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
		console.error("Error fetching user invoices:", error);
		return NextResponse.json(
			{ success: false, error: "Failed to fetch invoices" },
			{ status: 500 }
		);
	}
}
