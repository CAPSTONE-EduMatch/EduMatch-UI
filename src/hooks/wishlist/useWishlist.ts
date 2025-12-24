import { useState, useEffect, useCallback } from "react";
import { wishlistService } from "@/services/wishlist/wishlist-service";
import {
	WishlistItem,
	WishlistQueryParams,
	WishlistStats,
} from "@/types/api/wishlist-api";

interface UseWishlistOptions {
	autoFetch?: boolean;
	initialParams?: WishlistQueryParams;
	isAuthenticated?: boolean;
}

interface UseWishlistReturn {
	// Data
	items: WishlistItem[];
	stats: WishlistStats | null;
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
	addToWishlist: (postId: string, status?: 0 | 1) => Promise<void>;
	removeFromWishlist: (postId: string) => Promise<void>;
	toggleWishlistItem: (postId: string) => Promise<void>;
	updateWishlistItem: (postId: string, status: 0 | 1) => Promise<void>;
	bulkAdd: (postIds: string[], status?: 0 | 1) => Promise<void>;
	bulkDelete: (postIds: string[]) => Promise<void>;
	bulkUpdate: (
		updates: Array<{ postId: string; status: 0 | 1 }>
	) => Promise<void>;

	// Utilities
	refresh: () => Promise<void>;
	refreshStats: () => Promise<void>;
	isInWishlist: (postId: string) => boolean;
	setParams: (params: WishlistQueryParams) => void;
}

export const useWishlist = (
	options: UseWishlistOptions = {}
): UseWishlistReturn => {
	const {
		autoFetch = true,
		initialParams = {},
		isAuthenticated = false,
	} = options;

	// Default params for better UX - fetch more items by default
	const defaultParams: WishlistQueryParams = {
		page: 1,
		limit: 100, // Increased default limit
		status: 1, // Only active items
		...initialParams, // Override with provided params
	};

	// State
	const [items, setItems] = useState<WishlistItem[]>([]);
	const [stats, setStats] = useState<WishlistStats | null>(null);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [meta, setMeta] = useState<{
		total: number;
		page: number;
		limit: number;
		totalPages: number;
	} | null>(null);
	const [params, setParamsState] =
		useState<WishlistQueryParams>(defaultParams);

	// Fetch wishlist items
	const fetchWishlist = useCallback(
		async (fetchParams?: WishlistQueryParams) => {
			setLoading(true);
			setError(null);

			try {
				const response = await wishlistService.getWishlist(
					fetchParams || params
				);
				setItems(response.data);
				setMeta(response.meta);
			} catch (err) {
				const errorMessage =
					err instanceof Error
						? err.message
						: "Failed to fetch wishlist";
				setError(errorMessage);
				console.error("Error fetching wishlist:", err);
			} finally {
				setLoading(false);
			}
		},
		[params]
	);

	// Fetch wishlist stats
	const fetchStats = useCallback(async () => {
		try {
			const response = await wishlistService.getWishlistStats();
			setStats(response.data);
		} catch (err) {
			console.error("Error fetching wishlist stats:", err);
		}
	}, []);

	// Add item to wishlist
	const addToWishlist = useCallback(
		async (postId: string, status: 0 | 1 = 1) => {
			try {
				await wishlistService.addToWishlist({ postId, status });
				await fetchWishlist(); // Refresh the list
				await fetchStats(); // Refresh stats
			} catch (err) {
				const errorMessage =
					err instanceof Error
						? err.message
						: "Failed to add to wishlist";
				setError(errorMessage);
				throw err;
			}
		},
		[fetchWishlist, fetchStats]
	);

	// Remove item from wishlist
	const removeFromWishlist = useCallback(
		async (postId: string) => {
			try {
				await wishlistService.removeFromWishlist(postId);
				setItems((prev) =>
					prev.filter((item) => item.postId !== postId)
				);
				await fetchStats(); // Refresh stats
			} catch (err) {
				const errorMessage =
					err instanceof Error
						? err.message
						: "Failed to remove from wishlist";
				setError(errorMessage);
				throw err;
			}
		},
		[fetchStats]
	);

	// Toggle wishlist item
	const toggleWishlistItem = useCallback(
		async (postId: string) => {
			try {
				const response =
					await wishlistService.toggleWishlistItem(postId);

				if (response.data.status === 0) {
					// Item was removed
					setItems((prev) =>
						prev.filter((item) => item.postId !== postId)
					);
				} else {
					// Item was added
					setItems((prev) => [response.data, ...prev]);
				}

				// Refresh wishlist and stats to ensure consistency
				await fetchWishlist();
				await fetchStats();
			} catch (err) {
				const errorMessage =
					err instanceof Error
						? err.message
						: "Failed to toggle wishlist item";
				setError(errorMessage);
				throw err;
			}
		},
		[fetchWishlist, fetchStats]
	);

	// Update wishlist item
	const updateWishlistItem = useCallback(
		async (postId: string, status: 0 | 1) => {
			try {
				const response = await wishlistService.updateWishlistItem(
					postId,
					{ status }
				);
				setItems((prev) =>
					prev.map((item) =>
						item.postId === postId ? response.data : item
					)
				);
				await fetchStats(); // Refresh stats
			} catch (err) {
				const errorMessage =
					err instanceof Error
						? err.message
						: "Failed to update wishlist item";
				setError(errorMessage);
				throw err;
			}
		},
		[fetchStats]
	);

	// Bulk add items
	const bulkAdd = useCallback(
		async (postIds: string[], status: 0 | 1 = 1) => {
			try {
				await wishlistService.bulkAdd(postIds, status);
				await fetchWishlist(); // Refresh the list
				await fetchStats(); // Refresh stats
			} catch (err) {
				const errorMessage =
					err instanceof Error
						? err.message
						: "Failed to bulk add items";
				setError(errorMessage);
				throw err;
			}
		},
		[fetchWishlist, fetchStats]
	);

	// Bulk delete items
	const bulkDelete = useCallback(
		async (postIds: string[]) => {
			try {
				await wishlistService.bulkDelete(postIds);
				setItems((prev) =>
					prev.filter((item) => !postIds.includes(item.postId))
				);
				await fetchStats(); // Refresh stats
			} catch (err) {
				const errorMessage =
					err instanceof Error
						? err.message
						: "Failed to bulk delete items";
				setError(errorMessage);
				throw err;
			}
		},
		[fetchStats]
	);

	// Bulk update items
	const bulkUpdate = useCallback(
		async (updates: Array<{ postId: string; status: 0 | 1 }>) => {
			try {
				await wishlistService.bulkUpdate(updates);
				await fetchWishlist(); // Refresh the list
				await fetchStats(); // Refresh stats
			} catch (err) {
				const errorMessage =
					err instanceof Error
						? err.message
						: "Failed to bulk update items";
				setError(errorMessage);
				throw err;
			}
		},
		[fetchWishlist, fetchStats]
	);

	// Refresh functions
	const refresh = useCallback(() => fetchWishlist(), [fetchWishlist]);
	const refreshStats = useCallback(() => fetchStats(), [fetchStats]);

	// Check if item is in wishlist
	const isInWishlist = useCallback(
		(postId: string) => {
			return items.some(
				(item) => item.postId === postId && item.status === 1
			);
		},
		[items]
	);

	// Set params and refetch
	const setParams = useCallback(
		(newParams: WishlistQueryParams) => {
			setParamsState(newParams);
			fetchWishlist(newParams);
		},
		[fetchWishlist]
	);

	// Auto-fetch on mount and when params change (only if authenticated)
	useEffect(() => {
		if (autoFetch && isAuthenticated) {
			// Add a small delay to prevent rapid successive calls
			const timeoutId = setTimeout(() => {
				fetchWishlist();
				fetchStats();
			}, 100); // 100ms delay

			return () => clearTimeout(timeoutId);
		}
	}, [autoFetch, isAuthenticated, fetchWishlist, fetchStats]);

	return {
		// Data
		items,
		stats,
		loading,
		error,
		meta,

		// Actions
		addToWishlist,
		removeFromWishlist,
		toggleWishlistItem,
		updateWishlistItem,
		bulkAdd,
		bulkDelete,
		bulkUpdate,

		// Utilities
		refresh,
		refreshStats,
		isInWishlist,
		setParams,
	};
};
