import {
	WishlistResponse,
	WishlistItemResponse,
	WishlistCreateRequest,
	WishlistUpdateRequest,
	WishlistQueryParams,
	WishlistStatsResponse,
} from "@/types/wishlist-api";

class WishlistService {
	private baseUrl = "/api/wishlist";

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
			console.log("🚀 Making wishlist request to:", url);
			console.log("🔧 Request config:", {
				method: config.method || "GET",
				credentials: config.credentials,
				headers: config.headers,
			});

			const response = await fetch(url, config);
			console.log("📡 Response status:", response.status);
			console.log(
				"📡 Response headers:",
				Object.fromEntries(response.headers.entries())
			);

			const data = await response.json();

			if (!response.ok) {
				console.error("❌ Wishlist API Error:", data);
				throw new Error(data.error || "Request failed");
			}

			console.log("✅ Wishlist API Success:", data);
			return data;
		} catch (error) {
			console.error(`Wishlist API Error (${endpoint}):`, error);
			throw error;
		}
	}

	// Get user's wishlist items
	async getWishlist(params?: WishlistQueryParams): Promise<WishlistResponse> {
		const searchParams = new URLSearchParams();

		if (params) {
			Object.entries(params).forEach(([key, value]) => {
				if (value !== undefined && value !== null) {
					searchParams.append(key, value.toString());
				}
			});
		}

		const queryString = searchParams.toString();
		const endpoint = queryString ? `?${queryString}` : "";

		return this.request<WishlistResponse>(endpoint);
	}

	// Get specific wishlist item
	async getWishlistItem(postId: string): Promise<WishlistItemResponse> {
		return this.request<WishlistItemResponse>(`/${postId}`);
	}

	// Add item to wishlist
	async addToWishlist(
		data: WishlistCreateRequest
	): Promise<WishlistItemResponse> {
		return this.request<WishlistItemResponse>("", {
			method: "POST",
			body: JSON.stringify(data),
		});
	}

	// Update wishlist item status
	async updateWishlistItem(
		postId: string,
		data: WishlistUpdateRequest
	): Promise<WishlistItemResponse> {
		return this.request<WishlistItemResponse>(`/${postId}`, {
			method: "PUT",
			body: JSON.stringify(data),
		});
	}

	// Remove item from wishlist
	async removeFromWishlist(
		postId: string
	): Promise<{ success: boolean; message: string }> {
		return this.request<{ success: boolean; message: string }>(
			`/${postId}`,
			{
				method: "DELETE",
			}
		);
	}

	// Get wishlist statistics
	async getWishlistStats(): Promise<WishlistStatsResponse> {
		return this.request<WishlistStatsResponse>("/stats");
	}

	// Bulk operations
	async bulkAdd(postIds: string[], status: 0 | 1 = 1): Promise<any> {
		return this.request("/bulk", {
			method: "POST",
			body: JSON.stringify({ postIds, status }),
		});
	}

	async bulkUpdate(
		updates: Array<{ postId: string; status: 0 | 1 }>
	): Promise<any> {
		return this.request("/bulk", {
			method: "PUT",
			body: JSON.stringify({ updates }),
		});
	}

	async bulkDelete(postIds: string[]): Promise<any> {
		return this.request("/bulk", {
			method: "DELETE",
			body: JSON.stringify({ postIds }),
		});
	}

	// Utility methods
	async toggleWishlistItem(postId: string): Promise<WishlistItemResponse> {
		try {
			// Check if item exists in wishlist
			const isInWishlist = await this.isInWishlist(postId);

			if (isInWishlist) {
				// Item exists, remove it
				await this.removeFromWishlist(postId);

				// Return a response indicating it was removed
				return {
					success: true,
					data: {
						id: `${postId}-removed`,
						postId: postId,
						userId: "current-user",
						createdAt: new Date().toISOString(),
						status: 0, // Mark as inactive/removed
						post: {} as any, // Empty post data for removed item
					},
				};
			} else {
				// Item doesn't exist, add it
				return this.addToWishlist({ postId, status: 1 });
			}
		} catch (error) {
			// If there's an error checking or adding, try to add it
			return this.addToWishlist({ postId, status: 1 });
		}
	}

	async isInWishlist(postId: string): Promise<boolean> {
		try {
			// Get all wishlist items and check if the postId exists
			const response = await this.getWishlist();
			return response.data.some((item) => item.postId === postId);
		} catch (error) {
			return false;
		}
	}

	// Helper method to build query parameters
	buildQueryParams(params: WishlistQueryParams): string {
		const searchParams = new URLSearchParams();

		Object.entries(params).forEach(([key, value]) => {
			if (value !== undefined && value !== null) {
				searchParams.append(key, value.toString());
			}
		});

		return searchParams.toString();
	}
}

// Export singleton instance
export const wishlistService = new WishlistService();

// Export class for custom instances
export { WishlistService };
