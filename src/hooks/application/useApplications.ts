import { applicationService } from "@/services/application/application-service";
import { Application, ApplicationStatus } from "@/types/api/application-api";
import { ApplicationLimitError } from "@/types/api/application-errors";
import { useCallback, useEffect, useState } from "react";

interface ApplicationQueryParams {
	page?: number;
	limit?: number;
	status?: ApplicationStatus;
	stats?: boolean;
}

interface UseApplicationsOptions {
	autoFetch?: boolean;
	initialParams?: ApplicationQueryParams;
}

interface UseApplicationsReturn {
	// Data
	applications: Application[];
	stats: {
		total: number;
		pending: number;
		reviewed: number;
		accepted: number;
		rejected: number;
	} | null;
	loading: boolean;
	error: string | null;

	// Pagination
	meta: {
		total: number;
		page: number;
		limit: number;
		totalPages: number;
	} | null;

	// Actions
	submitApplication: (
		postId: string,
		documents?: any[],
		coverLetter?: string,
		additionalInfo?: string
	) => Promise<void>;
	cancelApplication: (applicationId: string) => Promise<void>;
	updateApplicationStatus: (
		applicationId: string,
		status: ApplicationStatus,
		notes?: string
	) => Promise<void>;

	// Utilities
	refresh: () => Promise<void>;
	refreshStats: () => Promise<void>;
	setParams: (params: ApplicationQueryParams) => void;
}

export const useApplications = (
	options: UseApplicationsOptions = {}
): UseApplicationsReturn => {
	const { autoFetch = true, initialParams = {} } = options;

	// State
	const [applications, setApplications] = useState<Application[]>([]);
	const [stats, setStats] = useState<{
		total: number;
		pending: number;
		reviewed: number;
		accepted: number;
		rejected: number;
	} | null>(null);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [meta, setMeta] = useState<{
		total: number;
		page: number;
		limit: number;
		totalPages: number;
	} | null>(null);
	const [params, setParamsState] =
		useState<ApplicationQueryParams>(initialParams);

	// Fetch applications
	const fetchApplications = useCallback(
		async (fetchParams?: ApplicationQueryParams) => {
			setLoading(true);
			setError(null);

			try {
				const response = await applicationService.getApplications(
					fetchParams || params
				);

				if (response.success && response.applications) {
					setApplications(response.applications);
					setMeta({
						total: response.total || 0,
						page: response.page || 1,
						limit: response.limit || 10,
						totalPages: Math.ceil(
							(response.total || 0) / (response.limit || 10)
						),
					});
				} else {
					setError(response.error || "Failed to fetch applications");
				}
			} catch (err) {
				const errorMessage =
					err instanceof Error
						? err.message
						: "Failed to fetch applications";
				setError(errorMessage);
				console.error("Error fetching applications:", err);
			} finally {
				setLoading(false);
			}
		},
		[params]
	);

	// Fetch application stats
	const fetchStats = useCallback(async () => {
		try {
			const response = await applicationService.getApplicationStats();
			if (response.success && response.stats) {
				setStats(response.stats);
			}
		} catch (err) {
			console.error("Error fetching application stats:", err);
		}
	}, []);

	// Submit new application
	const submitApplication = useCallback(
		async (
			postId: string,
			documents?: any[],
			coverLetter?: string,
			additionalInfo?: string
		) => {
			try {
				await applicationService.submitApplication({
					postId,
					documents,
					coverLetter,
					additionalInfo,
				});
				await fetchApplications(); // Refresh the list
				await fetchStats(); // Refresh stats
			} catch (err) {
				let errorMessage = "Failed to submit application";

				// Handle application limit error with user-friendly message
				if (err instanceof ApplicationLimitError) {
					errorMessage = err.getUserFriendlyMessage();
				} else if (err instanceof Error) {
					errorMessage = err.message;
				}

				setError(errorMessage);
				throw err;
			}
		},
		[fetchApplications, fetchStats]
	);

	// Cancel application
	const cancelApplication = useCallback(
		async (applicationId: string) => {
			try {
				await applicationService.cancelApplication(applicationId);
				setApplications((prev) =>
					prev.filter((app) => app.applicationId !== applicationId)
				);
				await fetchStats(); // Refresh stats
			} catch (err) {
				const errorMessage =
					err instanceof Error
						? err.message
						: "Failed to cancel application";
				setError(errorMessage);
				throw err;
			}
		},
		[fetchStats]
	);

	// Update application status (for institutions)
	const updateApplicationStatus = useCallback(
		async (
			applicationId: string,
			status: ApplicationStatus,
			notes?: string
		) => {
			try {
				await applicationService.updateApplicationStatus(
					applicationId,
					{
						status,
						notes,
					}
				);
				await fetchApplications(); // Refresh the list
				await fetchStats(); // Refresh stats
			} catch (err) {
				const errorMessage =
					err instanceof Error
						? err.message
						: "Failed to update application status";
				setError(errorMessage);
				throw err;
			}
		},
		[fetchApplications, fetchStats]
	);

	// Refresh functions
	const refresh = useCallback(() => fetchApplications(), [fetchApplications]);
	const refreshStats = useCallback(() => fetchStats(), [fetchStats]);

	// Set params and refetch
	const setParams = useCallback(
		(newParams: ApplicationQueryParams) => {
			setParamsState(newParams);
			fetchApplications(newParams);
		},
		[fetchApplications]
	);

	// Auto-fetch on mount and when params change
	useEffect(() => {
		if (autoFetch) {
			fetchApplications();
			fetchStats();
		}
	}, [autoFetch, fetchApplications, fetchStats]);

	return {
		// Data
		applications,
		stats,
		loading,
		error,
		meta,

		// Actions
		submitApplication,
		cancelApplication,
		updateApplicationStatus,

		// Utilities
		refresh,
		refreshStats,
		setParams,
	};
};
