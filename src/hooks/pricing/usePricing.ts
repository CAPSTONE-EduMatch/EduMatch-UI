import { useState, useEffect, useCallback } from "react";
import type { Plan } from "@/types/domain/pricing";

interface UsePricingReturn {
	plans: Plan[];
	loading: boolean;
	error: string | null;
	refetch: () => Promise<void>;
}

export function usePricing(): UsePricingReturn {
	const [plans, setPlans] = useState<Plan[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	const fetchPlans = useCallback(async () => {
		try {
			setLoading(true);
			setError(null);

			const response = await fetch("/api/pricing/applicant");
			const data = await response.json();

			if (!response.ok || !data.success) {
				throw new Error(data.error || "Failed to fetch pricing plans");
			}

			// Mark Standard plan (hierarchy = 1) as popular
			const plansWithPopular = data.plans.map((plan: Plan) => ({
				...plan,
				popular: plan.hierarchy === 1,
			}));

			setPlans(plansWithPopular);
		} catch (err) {
			setError(err instanceof Error ? err.message : "Unknown error");
			console.error("Error fetching pricing plans:", err);
		} finally {
			setLoading(false);
		}
	}, []);

	useEffect(() => {
		fetchPlans();
	}, [fetchPlans]);

	return {
		plans,
		loading,
		error,
		refetch: fetchPlans,
	};
}
