import { requireAuth } from "@/utils/auth/auth-utils";
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
		const period = url.searchParams.get("period") || "all";

		// Calculate date range based on period
		const now = new Date();
		let startDate: Date | undefined;

		switch (period) {
			case "7d":
				startDate = new Date(now);
				startDate.setDate(now.getDate() - 7);
				break;
			case "1m":
				startDate = new Date(now);
				startDate.setMonth(now.getMonth() - 1);
				break;
			case "3m":
				startDate = new Date(now);
				startDate.setMonth(now.getMonth() - 3);
				break;
			case "6m":
				startDate = new Date(now);
				startDate.setMonth(now.getMonth() - 6);
				break;
			case "all":
			default:
				startDate = undefined;
				break;
		}

		// Build where clause for date filtering
		const whereClause: any = {};
		if (startDate) {
			whereClause.createdAt = {
				gte: startDate,
			};
		}

		// Get all invoices with user information
		const invoices = await prismaClient.invoice.findMany({
			where: whereClause,
			include: {
				user: {
					select: {
						id: true,
						name: true,
						email: true,
					},
				},
			},
			orderBy: {
				createdAt: "desc",
			},
		});

		// Convert to CSV format
		const csvHeaders = [
			"Invoice ID",
			"User Name",
			"User Email",
			"User Type",
			"Amount (USD)",
			"Status",
			"Payment Method",
			"Receipt Number",
			"Created Date",
			"Paid Date",
			"Period Start",
			"Period End",
		];

		const csvRows = invoices.map((invoice) => [
			invoice.stripeInvoiceId,
			invoice.user.name || "N/A",
			invoice.user.email,
			invoice.userType || "N/A",
			(invoice.amount / 100).toFixed(2),
			invoice.status,
			invoice.paymentMethod || "N/A",
			invoice.receiptNumber || "N/A",
			new Date(invoice.createdAt).toISOString().split("T")[0],
			invoice.paidAt
				? new Date(invoice.paidAt).toISOString().split("T")[0]
				: "N/A",
			invoice.periodStart
				? new Date(invoice.periodStart).toISOString().split("T")[0]
				: "N/A",
			invoice.periodEnd
				? new Date(invoice.periodEnd).toISOString().split("T")[0]
				: "N/A",
		]);

		// Combine headers and rows
		const csvContent = [
			csvHeaders.join(","),
			...csvRows.map((row) =>
				row
					.map((cell) =>
						// Escape cells containing commas or quotes
						typeof cell === "string" &&
						(cell.includes(",") || cell.includes('"'))
							? `"${cell.replace(/"/g, '""')}"`
							: cell
					)
					.join(",")
			),
		].join("\n");

		// Return CSV file
		const periodLabel = period === "all" ? "all-time" : period;
		const filename = `transactions-${periodLabel}-${new Date().toISOString().split("T")[0]}.csv`;

		return new NextResponse(csvContent, {
			headers: {
				"Content-Type": "text/csv",
				"Content-Disposition": `attachment; filename="${filename}"`,
			},
		});
	} catch (error) {
		// eslint-disable-next-line no-console
		console.error("Error exporting transactions:", error);
		return NextResponse.json(
			{ success: false, error: "Failed to export transactions" },
			{ status: 500 }
		);
	}
}
