"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useState } from "react";
import { toast } from "sonner";

// Interfaces
export interface Discipline {
	id: string;
	name: string;
	status: "Active" | "Inactive";
	subdisciplineCount: number;
}

export interface Subdiscipline {
	id: string;
	subdisciplineName: string;
	discipline: string;
	disciplineId: string;
	status: "Active" | "Inactive";
	createdAt: string;
}

export interface DisciplineFilters {
	search?: string;
	status?: "all" | "active" | "inactive";
	sortBy?: "name" | "createdAt" | "subdisciplineCount";
	sortDirection?: "asc" | "desc";
	page?: number;
	limit?: number;
}

export interface DisciplineStats {
	total: number;
	active: number;
	inactive: number;
}

export interface DisciplineDetails {
	id: string;
	name: string;
	status: "Active" | "Inactive";
	subdisciplines: {
		id: string;
		name: string;
		status: "Active" | "Inactive";
		createdAt: string;
	}[];
	stats: {
		totalSubdisciplines: number;
		activeSubdisciplines: number;
		inactiveSubdisciplines: number;
		linkedPosts: number;
		linkedInstitutions: number;
		linkedApplicants: number;
	};
}

interface ApiResponse {
	success: boolean;
	disciplines: Discipline[];
	subdisciplines: Subdiscipline[];
	stats: DisciplineStats;
	pagination: {
		currentPage: number;
		totalPages: number;
		totalCount: number;
		limit: number;
		hasNextPage: boolean;
		hasPrevPage: boolean;
	};
}

const DEFAULT_FILTERS: DisciplineFilters = {
	search: "",
	status: "all",
	sortBy: "name",
	sortDirection: "asc",
	page: 1,
	limit: 10,
};

// Fetch disciplines from API
const fetchDisciplines = async (
	filters: DisciplineFilters
): Promise<ApiResponse> => {
	const params = new URLSearchParams();

	Object.entries(filters).forEach(([key, value]) => {
		if (value !== undefined && value !== null && value !== "") {
			params.append(key, value.toString());
		}
	});

	const response = await fetch(
		`/api/admin/disciplines?${params.toString()}`,
		{
			method: "GET",
			headers: {
				"Content-Type": "application/json",
			},
		}
	);

	if (!response.ok) {
		throw new Error(`Failed to fetch disciplines: ${response.statusText}`);
	}

	const data = await response.json();

	if (!data.success) {
		throw new Error(data.message || "Failed to fetch disciplines");
	}

	return data;
};

// Create discipline or subdiscipline
const createDisciplineOrSubdiscipline = async ({
	type,
	name,
	disciplineId,
}: {
	type: "discipline" | "subdiscipline";
	name: string;
	disciplineId?: string;
}) => {
	const response = await fetch("/api/admin/disciplines", {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
		},
		body: JSON.stringify({ type, name, disciplineId }),
	});

	if (!response.ok) {
		const errorData = await response.json().catch(() => ({}));
		throw new Error(
			errorData.error ||
				`Failed to create ${type}: ${response.statusText}`
		);
	}

	const data = await response.json();

	if (!data.success) {
		throw new Error(data.error || `Failed to create ${type}`);
	}

	return data;
};

// Update discipline or subdiscipline
const updateDisciplineOrSubdiscipline = async ({
	type,
	id,
	name,
	status,
	disciplineId,
}: {
	type: "discipline" | "subdiscipline";
	id: string;
	name?: string;
	status?: "Active" | "Inactive";
	disciplineId?: string;
}) => {
	const response = await fetch("/api/admin/disciplines", {
		method: "PATCH",
		headers: {
			"Content-Type": "application/json",
		},
		body: JSON.stringify({ type, id, name, status, disciplineId }),
	});

	if (!response.ok) {
		const errorData = await response.json().catch(() => ({}));
		throw new Error(
			errorData.error ||
				`Failed to update ${type}: ${response.statusText}`
		);
	}

	const data = await response.json();

	if (!data.success) {
		throw new Error(data.error || `Failed to update ${type}`);
	}

	return data;
};

// Delete (deactivate) discipline or subdiscipline
const deleteDisciplineOrSubdiscipline = async ({
	type,
	id,
}: {
	type: "discipline" | "subdiscipline";
	id: string;
}) => {
	const response = await fetch(
		`/api/admin/disciplines?type=${type}&id=${id}`,
		{
			method: "DELETE",
		}
	);

	if (!response.ok) {
		const errorData = await response.json().catch(() => ({}));
		throw new Error(
			errorData.error ||
				`Failed to delete ${type}: ${response.statusText}`
		);
	}

	const data = await response.json();

	if (!data.success) {
		throw new Error(data.error || `Failed to delete ${type}`);
	}

	return data;
};

// Fetch single discipline details
const fetchDisciplineDetails = async (
	id: string
): Promise<DisciplineDetails> => {
	const response = await fetch(`/api/admin/disciplines/${id}`, {
		method: "GET",
		headers: {
			"Content-Type": "application/json",
		},
	});

	if (!response.ok) {
		throw new Error(
			`Failed to fetch discipline details: ${response.statusText}`
		);
	}

	const result = await response.json();

	if (!result.success) {
		throw new Error(result.error || "Failed to fetch discipline details");
	}

	return result.data;
};

export function useAdminDisciplines() {
	const queryClient = useQueryClient();
	const [filters, setFilters] = useState<DisciplineFilters>(DEFAULT_FILTERS);

	// Fetch query
	const { data, isLoading, error, refetch } = useQuery({
		queryKey: ["admin-disciplines", filters],
		queryFn: () => fetchDisciplines(filters),
		staleTime: 0, // Always consider data stale for admin pages
		refetchOnMount: "always", // Always refetch when component mounts
	});

	// Create mutation
	const createMutation = useMutation({
		mutationFn: createDisciplineOrSubdiscipline,
		onSuccess: (data, variables) => {
			queryClient.invalidateQueries({ queryKey: ["admin-disciplines"] });
			toast.success(
				`${variables.type === "discipline" ? "Discipline" : "Subdiscipline"} created successfully`
			);
		},
		onError: (error: Error) => {
			toast.error(error.message || "Failed to create");
		},
	});

	// Update mutation
	const updateMutation = useMutation({
		mutationFn: updateDisciplineOrSubdiscipline,
		onSuccess: (data, variables) => {
			queryClient.invalidateQueries({ queryKey: ["admin-disciplines"] });
			toast.success(
				`${variables.type === "discipline" ? "Discipline" : "Subdiscipline"} updated successfully`
			);
		},
		onError: (error: Error) => {
			toast.error(error.message || "Failed to update");
		},
	});

	// Delete mutation
	const deleteMutation = useMutation({
		mutationFn: deleteDisciplineOrSubdiscipline,
		onSuccess: (data, variables) => {
			queryClient.invalidateQueries({ queryKey: ["admin-disciplines"] });
			toast.success(
				`${variables.type === "discipline" ? "Discipline" : "Subdiscipline"} deactivated successfully`
			);
		},
		onError: (error: Error) => {
			toast.error(error.message || "Failed to deactivate");
		},
	});

	// Update filters function
	const updateFilters = useCallback(
		(newFilters: Partial<DisciplineFilters>) => {
			setFilters((prev) => ({
				...prev,
				...newFilters,
				page: newFilters.page !== undefined ? newFilters.page : 1,
			}));
		},
		[]
	);

	// Set page function
	const setPage = useCallback((page: number) => {
		setFilters((prev) => ({
			...prev,
			page,
		}));
	}, []);

	// Reset filters
	const resetFilters = useCallback(() => {
		setFilters(DEFAULT_FILTERS);
	}, []);

	// Action functions
	const createDiscipline = useCallback(
		async (name: string) => {
			return createMutation.mutateAsync({ type: "discipline", name });
		},
		[createMutation]
	);

	const createSubdiscipline = useCallback(
		async (name: string, disciplineId: string) => {
			return createMutation.mutateAsync({
				type: "subdiscipline",
				name,
				disciplineId,
			});
		},
		[createMutation]
	);

	const updateDiscipline = useCallback(
		async (
			id: string,
			updates: { name?: string; status?: "Active" | "Inactive" }
		) => {
			return updateMutation.mutateAsync({
				type: "discipline",
				id,
				...updates,
			});
		},
		[updateMutation]
	);

	const updateSubdiscipline = useCallback(
		async (
			id: string,
			updates: {
				name?: string;
				status?: "Active" | "Inactive";
				disciplineId?: string;
			}
		) => {
			return updateMutation.mutateAsync({
				type: "subdiscipline",
				id,
				...updates,
			});
		},
		[updateMutation]
	);

	const deleteDiscipline = useCallback(
		async (id: string) => {
			return deleteMutation.mutateAsync({ type: "discipline", id });
		},
		[deleteMutation]
	);

	const deleteSubdiscipline = useCallback(
		async (id: string) => {
			return deleteMutation.mutateAsync({ type: "subdiscipline", id });
		},
		[deleteMutation]
	);

	return {
		// Data
		disciplines: data?.disciplines || [],
		subdisciplines: data?.subdisciplines || [],
		stats: data?.stats || { total: 0, active: 0, inactive: 0 },
		pagination: data?.pagination || {
			currentPage: 1,
			totalPages: 1,
			totalCount: 0,
			limit: 10,
			hasNextPage: false,
			hasPrevPage: false,
		},

		// State
		filters,
		isLoading,
		error: error as Error | null,
		isCreating: createMutation.isPending,
		isUpdating: updateMutation.isPending,
		isDeleting: deleteMutation.isPending,

		// Filter actions
		updateFilters,
		setPage,
		resetFilters,
		refetch,

		// CRUD actions
		createDiscipline,
		createSubdiscipline,
		updateDiscipline,
		updateSubdiscipline,
		deleteDiscipline,
		deleteSubdiscipline,
	};
}

export function useDisciplineDetails(id: string) {
	const queryClient = useQueryClient();

	const { data, isLoading, error, refetch } = useQuery({
		queryKey: ["discipline-detail", id],
		queryFn: () => fetchDisciplineDetails(id),
		staleTime: 0,
		enabled: !!id,
	});

	// Create subdiscipline mutation
	const createSubdisciplineMutation = useMutation({
		mutationFn: createDisciplineOrSubdiscipline,
		onSuccess: () => {
			queryClient.invalidateQueries({
				queryKey: ["discipline-detail", id],
			});
			queryClient.invalidateQueries({ queryKey: ["admin-disciplines"] });
			toast.success("Subdiscipline created successfully");
		},
		onError: (error: Error) => {
			toast.error(error.message || "Failed to create subdiscipline");
		},
	});

	// Update subdiscipline mutation
	const updateSubdisciplineMutation = useMutation({
		mutationFn: updateDisciplineOrSubdiscipline,
		onSuccess: () => {
			queryClient.invalidateQueries({
				queryKey: ["discipline-detail", id],
			});
			queryClient.invalidateQueries({ queryKey: ["admin-disciplines"] });
			toast.success("Subdiscipline updated successfully");
		},
		onError: (error: Error) => {
			toast.error(error.message || "Failed to update subdiscipline");
		},
	});

	// Delete subdiscipline mutation
	const deleteSubdisciplineMutation = useMutation({
		mutationFn: deleteDisciplineOrSubdiscipline,
		onSuccess: () => {
			queryClient.invalidateQueries({
				queryKey: ["discipline-detail", id],
			});
			queryClient.invalidateQueries({ queryKey: ["admin-disciplines"] });
			toast.success("Subdiscipline deactivated successfully");
		},
		onError: (error: Error) => {
			toast.error(error.message || "Failed to deactivate subdiscipline");
		},
	});

	return {
		discipline: data || null,
		isLoading,
		error: error as Error | null,
		refetch,
		isCreating: createSubdisciplineMutation.isPending,
		isUpdating: updateSubdisciplineMutation.isPending,
		isDeleting: deleteSubdisciplineMutation.isPending,
		createSubdiscipline: async (name: string) => {
			return createSubdisciplineMutation.mutateAsync({
				type: "subdiscipline",
				name,
				disciplineId: id,
			});
		},
		updateSubdiscipline: async (
			subdisciplineId: string,
			updates: { name?: string; status?: "Active" | "Inactive" }
		) => {
			return updateSubdisciplineMutation.mutateAsync({
				type: "subdiscipline",
				id: subdisciplineId,
				...updates,
			});
		},
		deleteSubdiscipline: async (subdisciplineId: string) => {
			return deleteSubdisciplineMutation.mutateAsync({
				type: "subdiscipline",
				id: subdisciplineId,
			});
		},
	};
}
