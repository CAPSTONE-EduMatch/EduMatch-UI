import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from "axios";
import { cacheManager, cacheInvalidation } from "@/utils/cache/cache";

// Extend AxiosRequestConfig to include metadata
declare module "axios" {
	interface AxiosRequestConfig {
		metadata?: {
			cacheKey: string;
			startTime: number;
			deduplicated?: boolean;
			isCached?: boolean;
			cachedData?: any;
		};
	}
}

/**
 * Centralized Axios configuration with Redis caching
 * Provides consistent API calls across the entire application
 */

// Note: Request deduplication is handled by React Query, so we don't need to implement it here

// Create axios instance with base configuration
const createAxiosInstance = (): AxiosInstance => {
	const instance = axios.create({
		baseURL: process.env.NEXT_PUBLIC_API_URL || "",
		timeout: 30000, // 30 seconds
		headers: {
			"Content-Type": "application/json",
		},
	});

	// Request interceptor for caching
	instance.interceptors.request.use(
		async (config) => {
			// Add cache key to request config
			const cacheKey = generateCacheKey(config);
			config.metadata = { cacheKey, startTime: Date.now() };

			// Check cache first for GET requests
			if (config.method === "get" && shouldCache(config)) {
				try {
					const cachedData = await cacheManager.get(cacheKey);
					if (cachedData) {
						// Mark as cached - will be handled in response interceptor
						config.metadata.isCached = true;
						config.metadata.cachedData = cachedData;
					}
				} catch (error) {
					// Cache read error - continue with normal request
					console.warn("Cache read error:", error);
				}
			}

			return config;
		},
		(error) => {
			// Standard error handling for request interceptor
			return Promise.reject(error);
		}
	);

	// Response interceptor for caching and error handling
	instance.interceptors.response.use(
		async (response: AxiosResponse) => {
			const { config } = response;
			const { cacheKey, startTime, isCached, cachedData } =
				config.metadata || {};

			// If this was a cached response, return the cached data
			if (isCached && cachedData) {
				return {
					...response,
					data: cachedData,
					isCached: true,
				};
			}

			// Cache successful GET responses
			if (config.method === "get" && shouldCache(config) && cacheKey) {
				try {
					await cacheManager.set(
						cacheKey,
						response.data,
						getCacheTTL(config)
					);
				} catch (error) {
					console.warn("Cache write error:", error);
				}
			}

			// Log performance
			if (startTime) {
				const duration = Date.now() - startTime;
				console.log(
					`API Call: ${config.method?.toUpperCase()} ${config.url} - ${duration}ms`
				);
			}

			return response;
		},
		(error) => {
			// Handle network errors with better error messages
			if (error.code === "ECONNABORTED") {
				const errorMessage = `Request timeout: ${error.config?.url || "unknown URL"}`;
				console.error(errorMessage);
				return Promise.reject(new Error(errorMessage));
			} else if (error.response) {
				// Server responded with error status
				const errorMessage =
					error.response.data?.error ||
					error.response.data?.message ||
					`API Error: ${error.response.status}`;
				console.error(
					"API Error:",
					error.response.status,
					error.response.data
				);
				return Promise.reject(new Error(errorMessage));
			} else if (error.request) {
				// Request was made but no response received
				const errorMessage =
					error.message ||
					`Network Error: Unable to reach server for ${error.config?.url || "unknown URL"}`;
				console.error("Network Error:", errorMessage);
				return Promise.reject(new Error(errorMessage));
			} else {
				// Error setting up the request
				const errorMessage =
					error.message || "An unexpected error occurred";
				console.error("Request Error:", errorMessage);
				return Promise.reject(new Error(errorMessage));
			}
		}
	);

	return instance;
};

// Generate cache key from request config
const generateCacheKey = (config: AxiosRequestConfig): string => {
	const { method, url, params, data } = config;
	const baseKey = `${method}:${url}`;

	if (params) {
		return `${baseKey}:${JSON.stringify(params)}`;
	}

	if (data && method !== "get") {
		return `${baseKey}:${JSON.stringify(data)}`;
	}

	return baseKey;
};

// Determine if request should be cached
const shouldCache = (config: AxiosRequestConfig): boolean => {
	// Only cache GET requests
	if (config.method !== "get") return false;

	// Don't cache auth endpoints
	if (config.url?.includes("/auth/")) return false;

	// Don't cache profile endpoints
	if (config.url?.includes("/api/profile")) return false;

	// Cache users/status endpoint for 1 minute
	if (config.url?.includes("/api/users/status")) return true;

	// Cache static data and other read-only endpoints
	return !!(
		config.url?.includes("/api/cache/static") ||
		config.url?.includes("/api/health")
	);
};

// Get cache TTL based on endpoint
const getCacheTTL = (config: AxiosRequestConfig): number => {
	const url = config.url || "";

	if (url.includes("/api/profile")) return 5 * 60; // 5 minutes
	if (url.includes("/api/users/status")) return 1 * 60; // 1 minute
	if (url.includes("/api/cache/static")) return 24 * 60 * 60; // 24 hours
	if (url.includes("/api/health")) return 60; // 1 minute

	return 5 * 60; // Default 5 minutes
};

// Create the main axios instance
export const apiClient = createAxiosInstance();

// API Service class for organized endpoints
export class ApiService {
	// Profile endpoints
	static async getProfile() {
		const response = await apiClient.get("/api/profile");
		return response.data;
	}

	static async createProfile(profileData: any) {
		const response = await apiClient.post("/api/profile", profileData);
		return response.data;
	}

	static async updateProfile(profileData: any) {
		const response = await apiClient.put("/api/profile", profileData);
		return response.data;
	}

	static async deleteProfile() {
		const response = await apiClient.delete("/api/profile");
		return response.data;
	}

	static async checkProfile(userId: string) {
		const response = await apiClient.get(`/api/profile/${userId}`);
		return response.data;
	}

	// File upload endpoints
	static async uploadFile(file: File, category: string = "uploads") {
		const formData = new FormData();
		formData.append("file", file);
		formData.append("category", category);

		const response = await apiClient.post(
			"/api/files/s3-upload",
			formData,
			{
				headers: {
					"Content-Type": "multipart/form-data",
				},
			}
		);

		// Invalidate file-related cache if needed
		// await cacheInvalidation.invalidateApiCache("files");

		return response.data;
	}

	// Static data endpoints
	static async getCountries() {
		const response = await apiClient.get(
			"/api/cache/static?type=countries"
		);
		return response.data;
	}

	static async getTranslations(locale: string) {
		const response = await apiClient.get(
			`/api/cache/static?type=translations&locale=${locale}`
		);
		return response.data;
	}

	// Health check
	static async getHealth() {
		const response = await apiClient.get("/api/health");
		return response.data;
	}

	// User endpoints
	static async checkEmailExists(email: string) {
		const response = await apiClient.get(
			`/api/user?email=${encodeURIComponent(email)}`
		);
		return response.data;
	}

	// Subdisciplines endpoints
	static async getSubdisciplines() {
		const response = await apiClient.get("/api/subdisciplines");
		return response.data;
	}

	// Notification settings endpoints
	static async getNotificationSettings() {
		const response = await apiClient.get("/api/notification-settings");
		return response.data;
	}

	static async updateNotificationSettings(settings: {
		applicationStatus: boolean;
		wishlistDeadline: boolean;
		payment: boolean;
	}) {
		const response = await apiClient.put(
			"/api/notification-settings",
			settings
		);
		return response.data;
	}
}

// Cache management utilities
export const cacheUtils = {
	// Clear all cache
	async clearAll(): Promise<void> {
		await cacheManager.clear();
	},

	// Clear user-specific cache
	async clearUserCache(userId: string): Promise<void> {
		await cacheInvalidation.invalidateUser(userId);
	},

	// Clear profile cache (deprecated - no longer using profile caching)
	async clearProfileCache(userId: string): Promise<void> {
		// Profile caching removed - no action needed
	},

	// Clear specific cache by key
	async clearCacheByKey(key: string): Promise<void> {
		await cacheManager.delete(key);
	},

	// Clear cache by pattern (for Redis)
	async clearCacheByPattern(pattern: string): Promise<void> {
		await cacheInvalidation.invalidateApiCache(pattern);
	},

	// Force refresh profile data (deprecated - no longer using profile caching)
	async refreshProfile(userId: string): Promise<void> {
		// Profile caching removed - no action needed
	},

	// Get cache statistics
	async getCacheStats(): Promise<any> {
		return await cacheManager.getStats();
	},
};

// Export the axios instance for direct use if needed
export default apiClient;
