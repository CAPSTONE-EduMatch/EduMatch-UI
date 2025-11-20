import axios from "axios";

export interface SupportRequest {
	id: string;
	name: string;
	email: string;
	contact: string;
	sendDate: string;
	status: "Replied" | "Pending";
	subject?: string;
	message?: string;
	reply?: string;
	managerId?: string;
	createdAt?: string;
	updatedAt?: string;
}

export interface SupportFilters {
	search?: string;
	status?: "all" | "pending" | "replied";
	sortBy?: "newest" | "oldest";
	page?: number;
	limit?: number;
}

export interface SupportResponse {
	success: boolean;
	data: SupportRequest[];
	pagination: {
		currentPage: number;
		totalPages: number;
		totalCount: number;
		limit: number;
	};
	stats: {
		total: number;
		pending: number;
		replied: number;
	};
}

class SupportService {
	/**
	 * Fetch support requests with filtering and pagination
	 */
	async fetchSupportRequests(
		filters: SupportFilters = {}
	): Promise<SupportResponse> {
		const params = new URLSearchParams();

		if (filters.search) params.append("search", filters.search);
		if (filters.status && filters.status !== "all")
			params.append("status", filters.status);
		if (filters.sortBy) params.append("sortBy", filters.sortBy);
		if (filters.page) params.append("page", filters.page.toString());
		if (filters.limit) params.append("limit", filters.limit.toString());

		const response = await axios.get(
			`/api/admin/support?${params.toString()}`
		);
		return response.data;
	}

	/**
	 * Send reply to a support request
	 */
	async replyToSupport(supportId: string, reply: string): Promise<void> {
		const response = await axios.patch("/api/admin/support", {
			supportId,
			reply,
			action: "reply",
		});

		if (!response.data.success) {
			throw new Error(response.data.message || "Failed to send reply");
		}
	}

	/**
	 * Get support statistics
	 */
	async getSupportStats(): Promise<{
		total: number;
		pending: number;
		replied: number;
	}> {
		const response = await this.fetchSupportRequests({ limit: 1 });
		return response.stats;
	}
}

export const supportService = new SupportService();
