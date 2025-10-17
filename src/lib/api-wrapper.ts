import { useNotification } from "@/contexts/NotificationContext";

export interface ApiResponse<T = any> {
	success: boolean;
	data?: T;
	error?: string;
	message?: string;
}

export class ApiWrapper {
	private showSuccess: (
		title: string,
		message: string,
		options?: any
	) => void;
	private showError: (title: string, message: string, options?: any) => void;

	constructor(notificationHooks: {
		showSuccess: (title: string, message: string, options?: any) => void;
		showError: (title: string, message: string, options?: any) => void;
	}) {
		this.showSuccess = notificationHooks.showSuccess;
		this.showError = notificationHooks.showError;
	}

	async handleApiCall<T>(
		apiCall: () => Promise<ApiResponse<T>>,
		options?: {
			successTitle?: string;
			successMessage?: string;
			errorTitle?: string;
			errorMessage?: string;
			showSuccess?: boolean;
			showError?: boolean;
			onSuccess?: (data: T) => void;
			onError?: (error: string) => void;
			onRetry?: () => void;
		}
	): Promise<ApiResponse<T> | null> {
		try {
			const response = await apiCall();

			if (response.success) {
				if (
					options?.showSuccess !== false &&
					(options?.successTitle || options?.successMessage)
				) {
					this.showSuccess(
						options.successTitle || "Success",
						options.successMessage ||
							"Operation completed successfully"
					);
				}

				if (options?.onSuccess && response.data) {
					options.onSuccess(response.data);
				}

				return response;
			} else {
				if (options?.showError !== false) {
					this.showError(
						options?.errorTitle || "Error",
						options?.errorMessage ||
							response.error ||
							"An error occurred",
						options?.onRetry
							? {
									onRetry: options.onRetry,
									showRetry: true,
									retryText: "Retry",
								}
							: undefined
					);
				}

				if (options?.onError) {
					options.onError(response.error || "Unknown error");
				}

				return response;
			}
		} catch (error) {
			const errorMessage =
				error instanceof Error
					? error.message
					: "An unexpected error occurred";

			if (options?.showError !== false) {
				this.showError(
					options?.errorTitle || "Error",
					options?.errorMessage || errorMessage,
					options?.onRetry
						? {
								onRetry: options.onRetry,
								showRetry: true,
								retryText: "Retry",
							}
						: undefined
				);
			}

			if (options?.onError) {
				options.onError(errorMessage);
			}

			return null;
		}
	}
}

// Hook to create an API wrapper instance
export const useApiWrapper = () => {
	const { showSuccess, showError } = useNotification();
	return new ApiWrapper({ showSuccess, showError });
};
