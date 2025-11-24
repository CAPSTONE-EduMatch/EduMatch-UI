import { useSubscriptionProgress } from "@/contexts/SubscriptionProgressContext";
import { ApplicationLimitError } from "@/types/api/application-errors";
import { useCallback } from "react";
import { useApplications } from "./useApplications";

/**
 * Enhanced version of useApplications that also manages subscription progress updates
 * after application submissions to ensure real-time UI updates
 */
export function useApplicationsWithProgress(
	options?: Parameters<typeof useApplications>[0]
) {
	const applicationsHook = useApplications(options);
	const { refreshAfterApplication } = useSubscriptionProgress();

	// Enhanced submit application that also refreshes subscription progress
	const submitApplicationWithProgress = useCallback(
		async (
			postId: string,
			documents?: any[],
			coverLetter?: string,
			additionalInfo?: string
		) => {
			try {
				// Submit the application
				await applicationsHook.submitApplication(
					postId,
					documents,
					coverLetter,
					additionalInfo
				);

				// Refresh subscription progress to update UI components immediately
				refreshAfterApplication();
			} catch (error) {
				// For application limit errors, still refresh progress to show updated state
				if (error instanceof ApplicationLimitError) {
					refreshAfterApplication();
				}

				// Re-throw the error so calling components can handle it
				throw error;
			}
		},
		[applicationsHook, refreshAfterApplication]
	);

	return {
		...applicationsHook,
		submitApplication: submitApplicationWithProgress,
	};
}
