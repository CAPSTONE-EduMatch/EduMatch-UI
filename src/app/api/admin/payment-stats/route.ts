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
		const groupBy = url.searchParams.get("groupBy") || "month"; // day, month

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
			activeSubscriptionsCount,
			totalSubscriptionsCount,
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

			// Get active subscriptions from subscription table (not filtered by period)
			prismaClient.subscription.count({
				where: {
					status: "active",
				},
			}),

			// Get total subscriptions count
			prismaClient.subscription.count(),
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

		// Active subscriptions from subscription table (already calculated above)
		const activeSubscriptions = activeSubscriptionsCount;

		// Group invoices by day or month for chart data
		const groupedData: {
			[key: string]: { revenue: number; count: number };
		} = {};

		paidInvoices.forEach((invoice) => {
			const invoiceDate = new Date(invoice.createdAt);
			let key: string;

			if (groupBy === "day") {
				// Group by day: YYYY-MM-DD
				key = invoiceDate.toISOString().slice(0, 10);
			} else {
				// Group by month: YYYY-MM
				key = invoiceDate.toISOString().slice(0, 7);
			}

			if (!groupedData[key]) {
				groupedData[key] = { revenue: 0, count: 0 };
			}
			groupedData[key].revenue += invoice.amount;
			groupedData[key].count += 1;
		});

		// Convert to array and sort by date
		const chartData = Object.entries(groupedData)
			.map(([dateKey, data]) => {
				let date: Date;
				if (groupBy === "day") {
					// For daily grouping, use the date directly
					date = new Date(dateKey);
					date.setHours(12, 0, 0, 0); // Set to noon for consistent display
				} else {
					// For monthly grouping, use the first day of the month
					date = new Date(dateKey + "-01");
				}

				return {
					month: date.toISOString(),
					revenue: data.revenue / 100, // Convert cents to dollars
					transactions: data.count,
				};
			})
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
					totalSubscriptions: totalSubscriptionsCount,
					activeSubscriptions: activeSubscriptionsCount,
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
