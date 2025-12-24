"use client";

import {
	SupportFilters,
	SupportRequest,
	supportService,
} from "@/services/admin/support-service";
import { useEffect, useState } from "react";

interface UseSupportDataResult {
	data: SupportRequest[];
	loading: boolean;
	error: string | null;
	pagination: {
		currentPage: number;
		totalPages: number;
		totalCount: number;
		limit: number;
	} | null;
	stats: {
		total: number;
		pending: number;
		replied: number;
	} | null;
	refetch: (filters?: SupportFilters) => Promise<void>;
	replyToSupport: (supportId: string, reply: string) => Promise<void>;
}

export function useSupportData(
	initialFilters: SupportFilters = {}
): UseSupportDataResult {
	const [data, setData] = useState<SupportRequest[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [pagination, setPagination] = useState<any>(null);
	const [stats, setStats] = useState<any>(null);
	const [currentFilters, setCurrentFilters] =
		useState<SupportFilters>(initialFilters);

	const fetchData = async (filters: SupportFilters = currentFilters) => {
		try {
			setLoading(true);
			setError(null);

			const response = await supportService.fetchSupportRequests(filters);

			if (response.success) {
				setData(response.data);
				setPagination(response.pagination);
				setStats(response.stats);
				setCurrentFilters(filters);
			} else {
				throw new Error("Failed to fetch support requests");
			}
		} catch (err) {
			setError(err instanceof Error ? err.message : "An error occurred");
			setData([]);
		} finally {
			setLoading(false);
		}
	};

	const replyToSupport = async (supportId: string, reply: string) => {
		try {
			await supportService.replyToSupport(supportId, reply);
			// Refetch data to update the UI
			await fetchData();
		} catch (err) {
			throw err; // Let the component handle the error
		}
	};

	useEffect(() => {
		setCurrentFilters(initialFilters);
	}, [initialFilters]);

	useEffect(() => {
		fetchData(currentFilters);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [currentFilters]);

	return {
		data,
		loading,
		error,
		pagination,
		stats,
		refetch: fetchData,
		replyToSupport,
	};
}
