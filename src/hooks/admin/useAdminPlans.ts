"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";

// Plan interface matching the database schema
export interface Plan {
	plan_id: string;
	priceId: string | null;
	name: string;
	description: string | null;
	features: string[];
	month_price: number; // stored in cents
	year_price: number | null; // stored in cents, only for institution plans
	status: boolean;
	type: number; // 1 = Applicant, 2 = Institution
	hierarchy: number; // 0 = Free, 1 = Standard, 2 = Premium, 3 = Institution
}

// Plan types
export const PLAN_TYPE = {
	APPLICANT: 1,
	INSTITUTION: 2,
} as const;

// Update payload for plan
export interface PlanUpdatePayload {
	plan_id: string;
	month_price?: number;
	year_price?: number;
	priceId?: string;
}

interface PlansApiResponse {
	plans: Plan[];
}

interface UpdatePlanResponse {
	message: string;
	plan: Plan;
}

// Fetch all plans from admin API
const fetchPlans = async (): Promise<Plan[]> => {
	const response = await fetch("/api/admin/plans", {
		method: "GET",
		headers: {
			"Content-Type": "application/json",
		},
	});

	if (!response.ok) {
		throw new Error(`Failed to fetch plans: ${response.statusText}`);
	}

	const data: PlansApiResponse = await response.json();
	return data.plans;
};

// Update plan price/priceId
const updatePlan = async (
	payload: PlanUpdatePayload
): Promise<UpdatePlanResponse> => {
	const response = await fetch("/api/admin/plans", {
		method: "PATCH",
		headers: {
			"Content-Type": "application/json",
		},
		body: JSON.stringify(payload),
	});

	if (!response.ok) {
		const errorData = await response.json().catch(() => ({}));
		throw new Error(
			errorData.error || `Failed to update plan: ${response.statusText}`
		);
	}

	return response.json();
};

export function useAdminPlans() {
	const queryClient = useQueryClient();

	// Query for fetching all plans
	const {
		data: plans = [],
		isLoading,
		error,
		refetch,
	} = useQuery<Plan[], Error>({
		queryKey: ["admin", "plans"],
		queryFn: fetchPlans,
		staleTime: 0, // Always consider data stale for admin pages
		refetchOnMount: "always", // Always refetch when component mounts
	});

	// Mutation for updating plan
	const updatePlanMutation = useMutation<
		UpdatePlanResponse,
		Error,
		PlanUpdatePayload
	>({
		mutationFn: updatePlan,
		onSuccess: () => {
			// Invalidate and refetch plans after successful update
			queryClient.invalidateQueries({ queryKey: ["admin", "plans"] });
		},
	});

	// Filter plans by type
	const getApplicantPlans = useCallback((): Plan[] => {
		return plans.filter((plan) => plan.type === PLAN_TYPE.APPLICANT);
	}, [plans]);

	const getInstitutionPlans = useCallback((): Plan[] => {
		return plans.filter((plan) => plan.type === PLAN_TYPE.INSTITUTION);
	}, [plans]);

	// Get plan by ID
	const getPlanById = useCallback(
		(planId: string): Plan | undefined => {
			return plans.find((plan) => plan.plan_id === planId);
		},
		[plans]
	);

	// Helper to convert cents to dollars for display
	const centsToDollars = (cents: number): number => {
		return cents / 100;
	};

	// Helper to convert dollars to cents for storage
	const dollarsToCents = (dollars: number): number => {
		return Math.round(dollars * 100);
	};

	return {
		// Data
		plans,
		applicantPlans: getApplicantPlans(),
		institutionPlans: getInstitutionPlans(),

		// State
		isLoading,
		error,
		isUpdating: updatePlanMutation.isPending,
		updateError: updatePlanMutation.error,

		// Actions
		updatePlan: updatePlanMutation.mutateAsync,
		refetch,
		getPlanById,

		// Helpers
		centsToDollars,
		dollarsToCents,

		// Constants
		PLAN_TYPE,
	};
}
