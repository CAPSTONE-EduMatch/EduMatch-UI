import { useState, useEffect, useCallback } from "react";

export interface ApplicationEligibility {
	canApply: boolean;
	reason?: string;
	planName: string;
	applicationsUsed: number;
	applicationsLimit: number | null;
	applicationsRemaining: number | null;
	periodStart: Date | null;
	periodEnd: Date | null;
	daysUntilReset: number | null;
	isLoading: boolean;
	error: string | null;
}

export function useApplicationEligibility(applicantId?: string) {
	const [eligibility, setEligibility] = useState<ApplicationEligibility>({
		canApply: false,
		planName: "Unknown",
		applicationsUsed: 0,
		applicationsLimit: 0,
		applicationsRemaining: 0,
		periodStart: null,
		periodEnd: null,
		daysUntilReset: null,
		isLoading: true,
		error: null,
	});

	const [lastFetch, setLastFetch] = useState<number>(0);
	const CACHE_DURATION = 30000; // 30 seconds cache

	const fetchEligibility = useCallback(async () => {
		if (!applicantId) {
			setEligibility((prev) => ({
				...prev,
				isLoading: false,
				error: "No applicant ID provided",
			}));
			return;
		}

		const now = Date.now();
		if (now - lastFetch < CACHE_DURATION) {
			return; // Use cached data
		}

		try {
			setEligibility((prev) => ({
				...prev,
				isLoading: true,
				error: null,
			}));

			const response = await fetch("/api/applications/eligibility", {
				method: "GET",
				headers: {
					"Content-Type": "application/json",
				},
			});

			if (!response.ok) {
				throw new Error(
					`HTTP ${response.status}: ${response.statusText}`
				);
			}

			const data = await response.json();

			if (data.success && data.eligibility) {
				const eligibilityData = data.eligibility;

				// Calculate remaining applications
				const remaining =
					eligibilityData.applicationsLimit === null
						? null
						: Math.max(
								0,
								eligibilityData.applicationsLimit -
									eligibilityData.applicationsUsed
							);

				setEligibility({
					canApply: eligibilityData.canApply,
					reason: eligibilityData.reason,
					planName: eligibilityData.planName,
					applicationsUsed: eligibilityData.applicationsUsed,
					applicationsLimit: eligibilityData.applicationsLimit,
					applicationsRemaining: remaining,
					periodStart: eligibilityData.periodStart
						? new Date(eligibilityData.periodStart)
						: null,
					periodEnd: eligibilityData.periodEnd
						? new Date(eligibilityData.periodEnd)
						: null,
					daysUntilReset: eligibilityData.daysUntilReset,
					isLoading: false,
					error: null,
				});

				setLastFetch(now);
			} else {
				throw new Error(data.message || "Failed to fetch eligibility");
			}
		} catch (error) {
			setEligibility((prev) => ({
				...prev,
				isLoading: false,
				error:
					error instanceof Error
						? error.message
						: "Unknown error occurred",
			}));
		}
	}, [applicantId, lastFetch]);

	const refresh = useCallback(() => {
		setLastFetch(0); // Reset cache
		fetchEligibility();
	}, [fetchEligibility]);

	useEffect(() => {
		fetchEligibility();
	}, [fetchEligibility]);

	return {
		...eligibility,
		refresh,
	};
}
