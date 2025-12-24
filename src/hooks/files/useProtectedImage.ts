import { useState, useEffect, useCallback } from "react";
import {
	getCachedImageUrl,
	setCachedImageUrl,
} from "@/utils/files/image-cache";

// Request deduplication: track ongoing requests to prevent duplicate API calls
const ongoingRequests = new Map<
	string,
	Promise<{ url: string; expiresAt: string; expiresIn: number }>
>();

interface ProtectedImageOptions {
	/**
	 * Expiration time in seconds (default: 3600 = 1 hour, max: 604800 = 7 days)
	 */
	expiresIn?: number;
	/**
	 * Whether to automatically refresh the URL before expiration
	 * @default false
	 */
	autoRefresh?: boolean;
	/**
	 * Refresh threshold in seconds - refresh when URL has less than this time remaining
	 * @default 300 (5 minutes)
	 */
	refreshThreshold?: number;
}

interface ProtectedImageResult {
	/**
	 * The pre-signed URL for the image (null while loading or on error)
	 */
	url: string | null;
	/**
	 * Whether the URL is currently being fetched
	 */
	loading: boolean;
	/**
	 * Error message if fetching failed
	 */
	error: string | null;
	/**
	 * Timestamp when the URL expires
	 */
	expiresAt: Date | null;
	/**
	 * Manually refresh the URL
	 */
	refresh: () => Promise<void>;
}

/**
 * Hook to fetch and manage protected image URLs with expiration
 *
 * @param imageUrl - The S3 URL or key of the image
 * @param options - Configuration options
 * @returns Protected image URL and management functions
 *
 * @example
 * ```tsx
 * const { url, loading, error } = useProtectedImage(
 *   "s3://bucket/path/to/image.jpg",
 *   { expiresIn: 7200 } // 2 hours
 * );
 *
 * if (loading) return <div>Loading...</div>;
 * if (error) return <div>Error: {error}</div>;
 * return <img src={url} alt="Protected image" />;
 * ```
 */
export function useProtectedImage(
	imageUrl: string | null | undefined,
	options: ProtectedImageOptions = {}
): ProtectedImageResult {
	const {
		expiresIn = 3600, // 1 hour default
		autoRefresh = false,
		refreshThreshold = 300, // 5 minutes
	} = options;

	const [url, setUrl] = useState<string | null>(null);
	const [loading, setLoading] = useState<boolean>(false);
	const [error, setError] = useState<string | null>(null);
	const [expiresAt, setExpiresAt] = useState<Date | null>(null);
	const [refreshTimer, setRefreshTimer] = useState<NodeJS.Timeout | null>(
		null
	);

	const fetchProtectedUrl = useCallback(async () => {
		if (!imageUrl) {
			setUrl(null);
			setError(null);
			setExpiresAt(null);
			return;
		}

		// Check cache first
		const cachedUrl = getCachedImageUrl(imageUrl, expiresIn);
		if (cachedUrl) {
			setUrl(cachedUrl);
			// Calculate expiresAt from cache (approximate)
			const expiresAtTime = Date.now() + expiresIn * 1000;
			setExpiresAt(new Date(expiresAtTime));
			setLoading(false);
			setError(null);
			return;
		}

		setLoading(true);
		setError(null);

		try {
			// Check if there's an ongoing request for this image
			const requestKey = `${imageUrl}:${expiresIn}`;
			let requestPromise = ongoingRequests.get(requestKey);

			if (!requestPromise) {
				// Create new request
				requestPromise = (async () => {
					// Build query parameters
					const params = new URLSearchParams({
						url: imageUrl,
						expiresIn: expiresIn.toString(),
					});

					const response = await fetch(
						`/api/files/protected-image?${params.toString()}`,
						{
							method: "GET",
							credentials: "include",
						}
					);

					if (!response.ok) {
						const errorData = await response
							.json()
							.catch(() => ({}));
						throw new Error(
							errorData.error ||
								"Failed to fetch protected image URL"
						);
					}

					const data = await response.json();
					return data;
				})();

				// Store the promise
				ongoingRequests.set(requestKey, requestPromise);

				// Clean up after request completes
				requestPromise
					.finally(() => {
						ongoingRequests.delete(requestKey);
					})
					.catch(() => {
						// Error already handled below
					});
			}

			// Wait for the request (either new or existing)
			const data = await requestPromise;

			// Store in cache
			setCachedImageUrl(imageUrl, data.url, expiresIn);

			setUrl(data.url);
			setExpiresAt(new Date(data.expiresAt));

			// Set up auto-refresh if enabled
			if (autoRefresh && data.expiresIn) {
				// Clear existing timer
				if (refreshTimer) {
					clearTimeout(refreshTimer);
				}

				// Calculate refresh time (expiresIn - refreshThreshold)
				const refreshTime = Math.max(
					(data.expiresIn - refreshThreshold) * 1000,
					1000 // At least 1 second
				);

				const timer = setTimeout(() => {
					fetchProtectedUrl();
				}, refreshTime);

				setRefreshTimer(timer);
			}
		} catch (err) {
			const errorMessage =
				err instanceof Error ? err.message : "Unknown error";
			setError(errorMessage);
			setUrl(null);
			setExpiresAt(null);
		} finally {
			setLoading(false);
		}
	}, [imageUrl, expiresIn, autoRefresh, refreshThreshold, refreshTimer]);

	// Fetch URL when imageUrl changes
	useEffect(() => {
		fetchProtectedUrl();

		// Cleanup timer on unmount
		return () => {
			if (refreshTimer) {
				clearTimeout(refreshTimer);
			}
		};
	}, [imageUrl, expiresIn]); // Only depend on imageUrl and expiresIn

	// Manual refresh function
	const refresh = useCallback(async () => {
		await fetchProtectedUrl();
	}, [fetchProtectedUrl]);

	return {
		url,
		loading,
		error,
		expiresAt,
		refresh,
	};
}

/**
 * Utility function to get a protected image URL synchronously (for one-time use)
 * Note: This doesn't handle auto-refresh. Use the hook for components that need
 * persistent access to protected images.
 *
 * @param imageUrl - The S3 URL or key of the image
 * @param expiresIn - Expiration time in seconds (default: 3600 = 1 hour)
 * @returns Promise resolving to the pre-signed URL
 */
export async function getProtectedImageUrl(
	imageUrl: string,
	expiresIn: number = 3600
): Promise<string> {
	const params = new URLSearchParams({
		url: imageUrl,
		expiresIn: expiresIn.toString(),
	});

	const response = await fetch(
		`/api/files/protected-image?${params.toString()}`,
		{
			method: "GET",
			credentials: "include",
		}
	);

	if (!response.ok) {
		const errorData = await response.json().catch(() => ({}));
		throw new Error(
			errorData.error || "Failed to fetch protected image URL"
		);
	}

	const data = await response.json();
	return data.url;
}
