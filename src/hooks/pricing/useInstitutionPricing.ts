import { useState, useEffect, useCallback } from "react";
import type { Plan } from "@/types/domain/pricing";

interface UseInstitutionPricingReturn {
	plan: Plan | null;
	loading: boolean;
	error: string | null;
	refetch: () => Promise<void>;
}

export function useInstitutionPricing(): UseInstitutionPricingReturn {
	const [plan, setPlan] = useState<Plan | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	const fetchPlan = useCallback(async () => {
		try {
			setLoading(true);
			setError(null);

			// Add timestamp to bust browser cache and force fresh data
			const timestamp = new Date().getTime();
			const response = await fetch(
				`/api/pricing/institution?t=${timestamp}`,
				{
					cache: "no-store",
					headers: {
						"Cache-Control": "no-cache, no-store, must-revalidate",
						Pragma: "no-cache",
					},
				}
			);
			const data = await response.json();

			if (!response.ok || !data.success) {
				throw new Error(
					data.error || "Failed to fetch institution pricing plan"
				);
			}

			// Get the first (and should be only) institution plan
			const institutionPlan = data.plans?.[0] || null;

			// eslint-disable-next-line no-console
			console.log(
				"[USE INSTITUTION PRICING] ✅ Fetched plan:",
				institutionPlan
					? {
							name: institutionPlan.name,
							month_price: institutionPlan.month_price,
							year_price: institutionPlan.year_price,
						}
					: "No plan found"
			);

			setPlan(institutionPlan);
		} catch (err) {
			const errorMessage =
				err instanceof Error ? err.message : "Unknown error";
			setError(errorMessage);
			// eslint-disable-next-line no-console
			console.error(
				"[USE INSTITUTION PRICING] ❌ Error fetching pricing plan:",
				err
			);
		} finally {
			setLoading(false);
		}
	}, []);

	useEffect(() => {
		fetchPlan();
	}, [fetchPlan]);

	return {
		plan,
		loading,
		error,
		refetch: fetchPlan,
	};
}
