"use client";

import { ApplicationStatus } from "@prisma/client";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";

// Interfaces
export interface AdminApplication {
	id: string;
	applicantName: string;
	applicantEmail: string;
	postId: string;
	postTitle: string;
	institutionId: string;
	institutionName: string;
	appliedDate: Date;
	status: ApplicationStatus;
	reapplyCount: number;
}

export interface ApplicationFilters {
	search?: string;
	status?: "all" | ApplicationStatus;
	sortBy?: "newest" | "oldest" | "name" | "status";
	page?: number;
	limit?: number;
}

export interface ApplicationStats {
	total: number;
	submitted: number;
	progressing: number;
	accepted: number;
	rejected: number;
}

interface ApiResponse {
	success: boolean;
	applications: AdminApplication[];
	stats: ApplicationStats;
	pagination: {
		currentPage: number;
		totalPages: number;
		totalCount: number;
		limit: number;
		hasNextPage: boolean;
		hasPrevPage: boolean;
	};
}

const DEFAULT_FILTERS: ApplicationFilters = {
	search: "",
	status: "all",
	sortBy: "newest",
	page: 1,
	limit: 10,
};

// Fetch applications from API
const fetchApplications = async (
	filters: ApplicationFilters
): Promise<ApiResponse> => {
	const params = new URLSearchParams();

	Object.entries(filters).forEach(([key, value]) => {
		if (value !== undefined && value !== null && value !== "") {
			params.append(key, value.toString());
		}
	});

	const response = await fetch(
		`/api/admin/applications?${params.toString()}`,
		{
			method: "GET",
			headers: {
				"Content-Type": "application/json",
			},
		}
	);

	if (!response.ok) {
		const error = await response.json();
		throw new Error(error.message || "Failed to fetch applications");
	}

	return response.json();
};

export const useAdminApplications = () => {
	// Filter states
	const [filters, setFilters] = useState<ApplicationFilters>(DEFAULT_FILTERS);

	// Query for applications
	const {
		data,
		isLoading,
		error,
		refetch: refetchApplications,
	} = useQuery({
		queryKey: ["admin-applications", filters],
		queryFn: () => fetchApplications(filters),
		staleTime: 30000, // 30 seconds
		refetchOnMount: false,
	});

	// Helper functions for filter management
	const setSearch = (search: string) => {
		setFilters((prev) => ({ ...prev, search, page: 1 }));
	};

	const setStatus = (status: "all" | ApplicationStatus) => {
		setFilters((prev) => ({ ...prev, status, page: 1 }));
	};

	const setSortBy = (sortBy: "newest" | "oldest" | "name" | "status") => {
		setFilters((prev) => ({ ...prev, sortBy, page: 1 }));
	};

	const setPage = (page: number) => {
		setFilters((prev) => ({ ...prev, page }));
	};

	const setLimit = (limit: number) => {
		setFilters((prev) => ({ ...prev, limit, page: 1 }));
	};

	const resetFilters = () => {
		setFilters(DEFAULT_FILTERS);
	};

	return {
		// Data
		applications: data?.applications || [],
		stats: data?.stats || {
			total: 0,
			submitted: 0,
			progressing: 0,
			accepted: 0,
			rejected: 0,
		},
		pagination: data?.pagination || {
			currentPage: 1,
			totalPages: 1,
			totalCount: 0,
			limit: 10,
			hasNextPage: false,
			hasPrevPage: false,
		},

		// Loading and error states
		isLoading,
		error: error instanceof Error ? error.message : null,

		// Filters
		filters,
		setSearch,
		setStatus,
		setSortBy,
		setPage,
		setLimit,
		resetFilters,

		// Refetch
		refetch: refetchApplications,
	};
};
