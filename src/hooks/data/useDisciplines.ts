"use client";

import { useQuery } from "@tanstack/react-query";
import { ApiService } from "@/services/api/axios-config";

export interface SubdisciplineOption {
	value: string;
	label: string;
	discipline: string;
	subdiscipline_id?: string;
}

export interface DisciplineData {
	disciplines: Array<{
		id: string;
		name: string;
		subdisciplines: Array<{
			id: string;
			name: string;
		}>;
	}>;
	subdisciplines: Array<{
		id: string;
		name: string;
		disciplineName: string;
	}>;
	subdisciplinesByDiscipline: Record<string, string[]>;
}

/**
 * Hook to fetch and cache subdisciplines
 * Uses React Query for automatic caching and sharing across components
 * Cache duration: 5 minutes (configured in QueryProvider)
 */
export function useSubdisciplines() {
	return useQuery<SubdisciplineOption[]>({
		queryKey: ["subdisciplines"],
		queryFn: async () => {
			try {
				const response = await ApiService.getSubdisciplines();
				if (!response.success || !response.subdisciplines) {
					throw new Error(
						response.error || "Failed to fetch subdisciplines"
					);
				}
				return response.subdisciplines;
			} catch (error) {
				// Handle axios errors and provide meaningful error messages
				if (error instanceof Error) {
					throw error;
				}
				// Handle non-Error objects (e.g., axios errors)
				const errorMessage =
					typeof error === "object" &&
					error !== null &&
					"message" in error &&
					typeof error.message === "string"
						? error.message
						: "Network error: Failed to fetch subdisciplines";
				throw new Error(errorMessage);
			}
		},
		staleTime: 10 * 60 * 1000, // 10 minutes - disciplines don't change often
		gcTime: 30 * 60 * 1000, // 30 minutes - keep in cache longer
		retry: 3,
		retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
	});
}

/**
 * Hook to fetch and cache disciplines with subdisciplines
 * Uses React Query for automatic caching and sharing across components
 */
export function useDisciplines() {
	return useQuery<DisciplineData>({
		queryKey: ["disciplines"],
		queryFn: async () => {
			try {
				const { apiClient } =
					await import("@/services/api/axios-config");
				const response = await apiClient.get("/api/disciplines");
				if (!response.data.success) {
					throw new Error(
						response.data.error || "Failed to fetch disciplines"
					);
				}
				return response.data;
			} catch (error) {
				// Handle axios errors and provide meaningful error messages
				if (error instanceof Error) {
					throw error;
				}
				// Handle non-Error objects (e.g., axios errors)
				const errorMessage =
					typeof error === "object" &&
					error !== null &&
					"message" in error &&
					typeof error.message === "string"
						? error.message
						: "Network error: Failed to fetch disciplines";
				throw new Error(errorMessage);
			}
		},
		staleTime: 10 * 60 * 1000, // 10 minutes
		gcTime: 30 * 60 * 1000, // 30 minutes
		retry: 3,
		retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
	});
}
