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

		// Get all invoices within the period
		const [
			allInvoices,
			paidInvoices,
			pendingInvoices,
			failedInvoices,
			subscriptions,
		] = await Promise.all([
			// Total transactions
			prismaClient.invoice.count({ where: whereClause }),

			// Successful transactions
			prismaClient.invoice.findMany({
				where: {
					...whereClause,
					status: "paid",
				},
				select: {
					amount: true,
					createdAt: true,
					userType: true,
				},
			}),

			// Pending transactions
			prismaClient.invoice.count({
				where: {
					...whereClause,
					status: "open",
				},
			}),

			// Failed transactions
			prismaClient.invoice.count({
				where: {
					...whereClause,
					status: {
						in: ["void", "uncollectible"],
					},
				},
			}),

			// Get subscriptions count
			prismaClient.invoice.findMany({
				where: {
					...whereClause,
					stripeSubscriptionId: {
						not: null,
					},
				},
				distinct: ["stripeSubscriptionId"],
				select: {
					stripeSubscriptionId: true,
					status: true,
				},
			}),
		]);

		// Calculate revenue
		const totalRevenue = paidInvoices.reduce(
			(sum, invoice) => sum + invoice.amount,
			0
		);

		// Calculate monthly revenue
		const oneMonthAgo = new Date(now);
		oneMonthAgo.setMonth(now.getMonth() - 1);

		const monthlyRevenue = paidInvoices
			.filter((inv) => inv.createdAt >= oneMonthAgo)
			.reduce((sum, invoice) => sum + invoice.amount, 0);

		// Active subscriptions
		const activeSubscriptions = subscriptions.filter(
			(sub) => sub.status === "paid"
		).length;

		// Revenue by user type
		const applicantRevenue = paidInvoices
			.filter((inv) => inv.userType === "applicant")
			.reduce((sum, inv) => sum + inv.amount, 0);

		const institutionRevenue = paidInvoices
			.filter((inv) => inv.userType === "institution")
			.reduce((sum, inv) => sum + inv.amount, 0);

		// Average transaction value
		const avgTransactionValue =
			paidInvoices.length > 0 ? totalRevenue / paidInvoices.length : 0;

		// Success rate
		const successRate =
			allInvoices > 0 ? (paidInvoices.length / allInvoices) * 100 : 0;

		// Group invoices by month for trend
		const monthlyData: {
			[key: string]: { revenue: number; count: number };
		} = {};

		paidInvoices.forEach((invoice) => {
			const monthKey = new Date(invoice.createdAt)
				.toISOString()
				.slice(0, 7);
			if (!monthlyData[monthKey]) {
				monthlyData[monthKey] = { revenue: 0, count: 0 };
			}
			monthlyData[monthKey].revenue += invoice.amount;
			monthlyData[monthKey].count += 1;
		});

		// Create text report
		const periodLabel =
			period === "all"
				? "All Time"
				: period === "7d"
					? "Last 7 Days"
					: period === "1m"
						? "Last Month"
						: period === "3m"
							? "Last 3 Months"
							: "Last 6 Months";

		const reportLines = [
			"=".repeat(70),
			"PAYMENT STATISTICS REPORT",
			"=".repeat(70),
			"",
			`Report Period: ${periodLabel}`,
			`Generated: ${new Date().toLocaleString()}`,
			`Date Range: ${startDate ? startDate.toISOString().split("T")[0] : "All time"} to ${now.toISOString().split("T")[0]}`,
			"",
			"=".repeat(70),
			"REVENUE SUMMARY",
			"=".repeat(70),
			"",
			`Total Revenue:              $${(totalRevenue / 100).toFixed(2)}`,
			`Monthly Revenue (Last 30d): $${(monthlyRevenue / 100).toFixed(2)}`,
			`Average Transaction Value:  $${(avgTransactionValue / 100).toFixed(2)}`,
			"",
			"Revenue by User Type:",
			`  - Applicants:             $${(applicantRevenue / 100).toFixed(2)} (${applicantRevenue > 0 ? ((applicantRevenue / totalRevenue) * 100).toFixed(1) : 0}%)`,
			`  - Institutions:           $${(institutionRevenue / 100).toFixed(2)} (${institutionRevenue > 0 ? ((institutionRevenue / totalRevenue) * 100).toFixed(1) : 0}%)`,
			"",
			"=".repeat(70),
			"TRANSACTION SUMMARY",
			"=".repeat(70),
			"",
			`Total Transactions:         ${allInvoices.toLocaleString()}`,
			`Successful Transactions:    ${paidInvoices.length.toLocaleString()} (${successRate.toFixed(1)}%)`,
			`Pending Transactions:       ${pendingInvoices.toLocaleString()}`,
			`Failed Transactions:        ${failedInvoices.toLocaleString()}`,
			"",
			"=".repeat(70),
			"SUBSCRIPTION SUMMARY",
			"=".repeat(70),
			"",
			`Total Subscriptions:        ${subscriptions.length.toLocaleString()}`,
			`Active Subscriptions:       ${activeSubscriptions.toLocaleString()}`,
			"",
			"=".repeat(70),
			"MONTHLY REVENUE TREND",
			"=".repeat(70),
			"",
		];

		// Add monthly trend data
		const sortedMonths = Object.keys(monthlyData).sort();
		if (sortedMonths.length > 0) {
			reportLines.push("Month          Revenue        Transactions");
			reportLines.push("-".repeat(70));
			sortedMonths.forEach((month) => {
				const data = monthlyData[month];
				const monthLabel = new Date(month + "-01").toLocaleDateString(
					"en-US",
					{
						year: "numeric",
						month: "short",
					}
				);
				reportLines.push(
					`${monthLabel.padEnd(15)}$${((data.revenue / 100).toFixed(2) + "").padStart(12)}${data.count.toString().padStart(15)}`
				);
			});
		} else {
			reportLines.push("No transaction data available for this period.");
		}

		reportLines.push("");
		reportLines.push("=".repeat(70));
		reportLines.push("END OF REPORT");
		reportLines.push("=".repeat(70));

		const reportContent = reportLines.join("\n");

		// Return text file
		const periodFilename = period === "all" ? "all-time" : period;
		const filename = `payment-statistics-${periodFilename}-${new Date().toISOString().split("T")[0]}.txt`;

		return new NextResponse(reportContent, {
			headers: {
				"Content-Type": "text/plain",
				"Content-Disposition": `attachment; filename="${filename}"`,
			},
		});
	} catch (error) {
		// eslint-disable-next-line no-console
		console.error("Error exporting statistics:", error);
		return NextResponse.json(
			{ success: false, error: "Failed to export statistics" },
			{ status: 500 }
		);
	}
}
