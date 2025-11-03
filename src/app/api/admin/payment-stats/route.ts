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
		const period = url.searchParams.get("period") || "all"; // all, 7d, 1m, 3m, 6m

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

			// Get subscriptions count (approximate from recent invoices)
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

		// Calculate monthly revenue (for the current or most recent month in the period)
		const oneMonthAgo = new Date(now);
		oneMonthAgo.setMonth(now.getMonth() - 1);

		const monthlyRevenue = paidInvoices
			.filter((inv) => inv.createdAt >= oneMonthAgo)
			.reduce((sum, invoice) => sum + invoice.amount, 0);

		// Active subscriptions (those with recent paid invoices)
		const activeSubscriptions = subscriptions.filter(
			(sub) => sub.status === "paid"
		).length;

		// Group invoices by month for chart data
		const monthlyData: {
			[key: string]: { revenue: number; count: number };
		} = {};

		paidInvoices.forEach((invoice) => {
			const monthKey = new Date(invoice.createdAt)
				.toISOString()
				.slice(0, 7); // YYYY-MM
			if (!monthlyData[monthKey]) {
				monthlyData[monthKey] = { revenue: 0, count: 0 };
			}
			monthlyData[monthKey].revenue += invoice.amount;
			monthlyData[monthKey].count += 1;
		});

		// Convert to array and sort by date
		const chartData = Object.entries(monthlyData)
			.map(([month, data]) => ({
				month: new Date(month + "-01").toISOString(),
				revenue: data.revenue / 100, // Convert cents to dollars
				transactions: data.count,
			}))
			.sort(
				(a, b) =>
					new Date(a.month).getTime() - new Date(b.month).getTime()
			);

		// Return statistics
		return NextResponse.json({
			success: true,
			data: {
				stats: {
					totalRevenue: totalRevenue / 100, // Convert cents to dollars
					monthlyRevenue: monthlyRevenue / 100,
					totalTransactions: allInvoices,
					successfulTransactions: paidInvoices.length,
					pendingTransactions: pendingInvoices,
					failedTransactions: failedInvoices,
					totalSubscriptions: subscriptions.length,
					activeSubscriptions,
				},
				chartData,
				period,
			},
		});
	} catch (error) {
		// eslint-disable-next-line no-console
		console.error("Error fetching payment stats:", error);
		return NextResponse.json(
			{ success: false, error: "Failed to fetch payment stats" },
			{ status: 500 }
		);
	}
}
