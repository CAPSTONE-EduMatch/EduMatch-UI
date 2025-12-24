/**
 * Global image cache for protected images to prevent duplicate API calls
 * This cache stores pre-signed URLs with their expiration times
 */

interface CachedImage {
	url: string;
	expiresAt: number; // timestamp in milliseconds
	expiresIn: number; // original expiration in seconds
}

// Global cache map: imageUrl -> CachedImage
const imageCache = new Map<string, CachedImage>();

// Cache duration buffer (refresh 5 minutes before expiration)
const CACHE_BUFFER = 5 * 60 * 1000; // 5 minutes in milliseconds

/**
 * Get cached image URL if available and not expired
 * @param imageUrl - The original S3 URL or key
 * @param expiresIn - Desired expiration time in seconds
 * @returns Cached URL if valid, null otherwise
 */
export function getCachedImageUrl(
	imageUrl: string,
	expiresIn: number = 3600
): string | null {
	if (!imageUrl) return null;

	const cached = imageCache.get(imageUrl);
	if (!cached) return null;

	const now = Date.now();
	const bufferTime = Math.min(CACHE_BUFFER, (expiresIn * 1000) / 2); // Use half of expiresIn or 5 minutes, whichever is smaller

	// Check if cache is still valid (with buffer time)
	if (cached.expiresAt - now > bufferTime) {
		return cached.url;
	}

	// Cache expired, remove it
	imageCache.delete(imageUrl);
	return null;
}

/**
 * Store image URL in cache
 * @param imageUrl - The original S3 URL or key
 * @param url - The pre-signed URL
 * @param expiresIn - Expiration time in seconds
 */
export function setCachedImageUrl(
	imageUrl: string,
	url: string,
	expiresIn: number
): void {
	if (!imageUrl || !url) return;

	const expiresAt = Date.now() + expiresIn * 1000;
	imageCache.set(imageUrl, {
		url,
		expiresAt,
		expiresIn,
	});
}

/**
 * Clear expired cache entries (call periodically)
 */
export function clearExpiredCache(): void {
	const now = Date.now();
	const entries = Array.from(imageCache.entries());
	for (const [imageUrl, cached] of entries) {
		if (cached.expiresAt <= now) {
			imageCache.delete(imageUrl);
		}
	}
}

/**
 * Clear all cache entries
 */
export function clearAllCache(): void {
	imageCache.clear();
}

/**
 * Clear cache for a specific image URL
 */
export function clearCacheForUrl(imageUrl: string): void {
	imageCache.delete(imageUrl);
}

// Periodically clean up expired cache entries (every 10 minutes)
if (typeof window !== "undefined") {
	setInterval(
		() => {
			clearExpiredCache();
		},
		10 * 60 * 1000
	); // Every 10 minutes
}
