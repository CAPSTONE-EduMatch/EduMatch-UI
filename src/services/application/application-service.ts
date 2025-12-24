import {
	ApplicationListResponse,
	ApplicationRequest,
	ApplicationResponse,
	ApplicationStatsResponse,
	ApplicationUpdateRequest,
	ApplicationUpdateResponse,
} from "@/types/api/application-api";
import {
	ApplicationEligibilityData,
	ApplicationError,
	ApplicationLimitError,
} from "@/types/api/application-errors";

class ApplicationService {
	private baseUrl = "/api/applications";

	private async request<T>(
		endpoint: string,
		options: RequestInit = {}
	): Promise<T> {
		const url = `${this.baseUrl}${endpoint}`;

		const defaultHeaders = {
			"Content-Type": "application/json",
		};

		const config: RequestInit = {
			...options,
			credentials: "include", // Include cookies for authentication
			headers: {
				...defaultHeaders,
				...options.headers,
			},
		};

		try {
			const response = await fetch(url, config);
			const data = await response.json();

			if (!response.ok) {
				// Handle 403 Forbidden - Application Limit Reached
				if (response.status === 403 && data.eligibility) {
					const limitError = new ApplicationLimitError(
						data.error || "Application limit reached",
						data.eligibility as ApplicationEligibilityData
					);
					throw limitError;
				}

				// Handle other application errors
				throw new ApplicationError(
					data.error || "Request failed",
					response.status
				);
			}

			return data;
		} catch (error) {
			// Re-throw custom errors as-is
			if (
				error instanceof ApplicationLimitError ||
				error instanceof ApplicationError
			) {
				throw error;
			}

			// Handle network/other errors
			console.error(`Application API Error (${endpoint}):`, error);
			throw new ApplicationError(
				error instanceof Error
					? error.message
					: "Network error occurred"
			);
		}
	}

	// Submit a new application
	async submitApplication(
		applicationData: ApplicationRequest
	): Promise<ApplicationResponse> {
		return this.request<ApplicationResponse>("", {
			method: "POST",
			body: JSON.stringify(applicationData),
		});
	}

	// Get user's applications
	async getApplications(params?: {
		page?: number;
		limit?: number;
		status?: string;
	}): Promise<ApplicationListResponse> {
		const searchParams = new URLSearchParams();

		if (params?.page) searchParams.append("page", params.page.toString());
		if (params?.limit)
			searchParams.append("limit", params.limit.toString());
		if (params?.status) searchParams.append("status", params.status);

		const queryString = searchParams.toString();
		const endpoint = queryString ? `?${queryString}` : "";

		return this.request<ApplicationListResponse>(endpoint);
	}

	// Get application statistics
	async getApplicationStats(): Promise<ApplicationStatsResponse> {
		return this.request<ApplicationStatsResponse>("?stats=true");
	}

	// Get specific application
	async getApplication(applicationId: string): Promise<ApplicationResponse> {
		return this.request<ApplicationResponse>(`/${applicationId}`);
	}

	// Update application (for institutions)
	async updateApplication(
		applicationId: string,
		updateData: ApplicationUpdateRequest
	): Promise<ApplicationUpdateResponse> {
		return this.request<ApplicationUpdateResponse>(`/${applicationId}`, {
			method: "PUT",
			body: JSON.stringify(updateData),
		});
	}

	// Update application status (alias for updateApplication)
	async updateApplicationStatus(
		applicationId: string,
		updateData: ApplicationUpdateRequest
	): Promise<ApplicationUpdateResponse> {
		return this.updateApplication(applicationId, updateData);
	}

	// Cancel/delete application
	async cancelApplication(
		applicationId: string
	): Promise<{ success: boolean; message: string }> {
		return this.request<{ success: boolean; message: string }>(
			`/${applicationId}`,
			{
				method: "DELETE",
			}
		);
	}

	// Get applications for institution (institution endpoint)
	async getInstitutionApplications(params?: {
		page?: number;
		limit?: number;
		status?: string;
		postId?: string;
	}): Promise<ApplicationListResponse> {
		const searchParams = new URLSearchParams();

		if (params?.page) searchParams.append("page", params.page.toString());
		if (params?.limit)
			searchParams.append("limit", params.limit.toString());
		if (params?.status) searchParams.append("status", params.status);
		if (params?.postId) searchParams.append("postId", params.postId);

		const queryString = searchParams.toString();
		const endpoint = `/institution${queryString ? `?${queryString}` : ""}`;

		return this.request<ApplicationListResponse>(endpoint);
	}

	// Update application documents (for applicants when status is SUBMITTED)
	async updateApplicationDocuments(
		applicationId: string,
		documents: Array<{
			documentId?: string;
			url: string;
			name: string;
			size: number;
			documentTypeId?: string;
			documentType?: string;
		}>,
		selectedProfileDocumentIds?: string[]
	): Promise<{ success: boolean; message: string }> {
		// Pre-flight check: Verify subscription eligibility before attempting update
		try {
			const eligibilityResponse = await fetch(
				"/api/applications/eligibility",
				{
					method: "GET",
					headers: {
						"Content-Type": "application/json",
					},
					credentials: "include",
				}
			);
			const eligibilityData = await eligibilityResponse.json();

			if (!eligibilityData.eligibility?.canApply) {
				throw new ApplicationError(
					"You need an active Standard or Premium subscription to edit applications. Please upgrade your plan.",
					403
				);
			}
		} catch (error) {
			if (error instanceof ApplicationError) {
				throw error;
			}
			// If eligibility check fails for other reasons, continue
			// (API route will perform the authoritative check)
		}

		return this.request<{ success: boolean; message: string }>(
			`/${applicationId}/documents`,
			{
				method: "PUT",
				body: JSON.stringify({
					documents,
					selectedProfileDocumentIds,
				}),
			}
		);
	}
}

// Export singleton instance
export const applicationService = new ApplicationService();

// Export class for testing
export { ApplicationService };
