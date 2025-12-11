"use client";

import { useQuery } from "@tanstack/react-query";

export type Period = "all" | "7d" | "1m" | "3m" | "6m";

interface PaymentStats {
	totalRevenue: number;
	monthlyRevenue: number;
	totalTransactions: number;
	successfulTransactions: number;
	pendingTransactions: number;
	failedTransactions: number;
	totalSubscriptions: number;
	activeSubscriptions: number;
}

interface ChartDataPoint {
	month: string;
	revenue: number;
	transactions: number;
}

interface PaymentStatsResponse {
	stats: PaymentStats;
	chartData: ChartDataPoint[];
}

const fetchPaymentStats = async (
	period: Period,
	groupBy: "day" | "month" = "month"
): Promise<PaymentStatsResponse> => {
	const response = await fetch(
		`/api/admin/payment-stats?period=${period}&groupBy=${groupBy}`
	);

	if (!response.ok) {
		throw new Error("Failed to fetch payment statistics");
	}

	const result = await response.json();

	if (!result.success) {
		throw new Error(result.error || "Failed to fetch payment statistics");
	}

	return result.data;
};

export function useAdminPaymentStats(
	period: Period,
	groupBy: "day" | "month" = "month"
) {
	return useQuery({
		queryKey: ["admin-payment-stats", period, groupBy],
		queryFn: () => fetchPaymentStats(period, groupBy),
		staleTime: 0, // Always refetch when data becomes stale
		refetchOnMount: "always", // Always refetch when component mounts
	});
}

export type { ChartDataPoint, PaymentStats, PaymentStatsResponse };
