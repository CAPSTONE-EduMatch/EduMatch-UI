/**
 * Enhanced caching system with Redis support
 * Provides multi-layer caching: Redis + Memory + localStorage
 */

// Conditional import to avoid client-side issues
let createClient: any = null;
if (typeof window === "undefined") {
	try {
		const redis = require("redis");
		createClient = redis.createClient;
	} catch (error) {
		console.warn("Redis not available:", error);
	}
}

// Cache configuration
export const CACHE_CONFIG = {
	// Cache TTL (Time To Live) in seconds
	TTL: {
		PROFILE: 5 * 60, // 5 minutes
		USER_SESSION: 15 * 60, // 15 minutes
		STATIC_DATA: 24 * 60 * 60, // 24 hours
		COUNTRIES: 7 * 24 * 60 * 60, // 7 days
		TRANSLATIONS: 24 * 60 * 60, // 24 hours
		FILE_METADATA: 60 * 60, // 1 hour
	},

	// Cache keys
	KEYS: {
		PROFILE: (userId: string) => `profile:${userId}`,
		USER_SESSION: (userId: string) => `session:${userId}`,
		COUNTRIES: "static:countries",
		TRANSLATIONS: (locale: string) => `i18n:${locale}`,
		FILE_METADATA: (fileId: string) => `file:${fileId}`,
		USER_PROFILE_CHECK: (userId: string) => `profile_check:${userId}`,
		API_RESPONSE: (key: string) => `api:${key}`,
	},
};

// Memory cache for development/small deployments
class MemoryCache {
	private cache = new Map<string, { data: any; expires: number }>();

	set(key: string, data: any, ttl: number = CACHE_CONFIG.TTL.PROFILE): void {
		const expires = Date.now() + ttl * 1000;
		this.cache.set(key, { data, expires });
	}

	get(key: string): any | null {
		const item = this.cache.get(key);
		if (!item) return null;

		if (Date.now() > item.expires) {
			this.cache.delete(key);
			return null;
		}

		return item.data;
	}

	delete(key: string): void {
		this.cache.delete(key);
	}

	clear(): void {
		this.cache.clear();
	}

	// Clean expired entries
	cleanup(): void {
		const now = Date.now();
		this.cache.forEach((item, key) => {
			if (now > item.expires) {
				this.cache.delete(key);
			}
		});
	}
}

// Redis cache for production
class RedisCache {
	private redis: any = null;
	private isConnected = false;

	async init(): Promise<void> {
		if (typeof window !== "undefined") return; // Skip on client
		if (!createClient) return; // Skip if Redis not available

		const redisUrl = process.env.REDIS_URL;
		console.log(
			"🔗 Attempting Redis connection to:",
			redisUrl ? "configured URL" : "localhost"
		);

		try {
			this.redis = createClient({
				url: redisUrl || "redis://localhost:6379",
				socket: {
					connectTimeout: 10000,
					reconnectStrategy: (retries: number) => {
						if (retries > 3) {
							console.error(
								"Redis: Max reconnection attempts reached"
							);
							return new Error(
								"Max reconnection attempts reached"
							);
						}
						return Math.min(retries * 100, 3000);
					},
				},
			});

			this.redis.on("error", (err: Error) => {
				console.error("❌ Redis connection error:", err);
				this.isConnected = false;
			});

			this.redis.on("connect", () => {
				console.log("✅ Redis connected successfully");
				this.isConnected = true;
			});

			this.redis.on("ready", () => {
				console.log("🚀 Redis ready for operations");
				this.isConnected = true;
			});

			this.redis.on("end", () => {
				console.log("🔌 Redis connection ended");
				this.isConnected = false;
			});

			await this.redis.connect();
			console.log("🎯 Redis initialization completed");
		} catch (error) {
			console.error("❌ Redis connection failed:", error);
			console.warn("⚠️ Falling back to memory cache only");
			this.isConnected = false;
		}
	}

	async set(
		key: string,
		data: any,
		ttl: number = CACHE_CONFIG.TTL.PROFILE
	): Promise<void> {
		if (!this.redis || !this.isConnected) return;

		try {
			await this.redis.setEx(key, ttl, JSON.stringify(data));
		} catch (error) {
			console.error("Redis set error:", error);
		}
	}

	async get(key: string): Promise<any | null> {
		if (!this.redis || !this.isConnected) return null;

		try {
			const data = await this.redis.get(key);
			return data ? JSON.parse(data) : null;
		} catch (error) {
			console.error("Redis get error:", error);
			return null;
		}
	}

	async delete(key: string): Promise<void> {
		if (!this.redis || !this.isConnected) return;

		try {
			await this.redis.del(key);
		} catch (error) {
			console.error("Redis delete error:", error);
		}
	}

	async clear(): Promise<void> {
		if (!this.redis || !this.isConnected) return;

		try {
			await this.redis.flushAll();
		} catch (error) {
			console.error("Redis clear error:", error);
		}
	}

	async getStats(): Promise<any> {
		if (!this.redis || !this.isConnected) return null;

		try {
			const info = await this.redis.info("memory");
			return {
				connected: this.isConnected,
				info: info,
			};
		} catch (error) {
			return { connected: false, error: (error as Error).message };
		}
	}
}

// Main cache manager
class CacheManager {
	private memoryCache = new MemoryCache();
	private redisCache = new RedisCache();
	private isRedisAvailable = false;

	async init(): Promise<void> {
		await this.redisCache.init();
		// Check if Redis is actually connected
		const stats = await this.redisCache.getStats();
		this.isRedisAvailable = stats?.connected || false;

		console.log("🚀 Cache Manager initialized:", {
			redisAvailable: this.isRedisAvailable,
			redisStats: stats,
		});

		// Cleanup memory cache every 5 minutes
		setInterval(
			() => {
				this.memoryCache.cleanup();
			},
			5 * 60 * 1000
		);
	}

	async set(key: string, data: any, ttl?: number): Promise<void> {
		// Always set in memory cache
		this.memoryCache.set(key, data, ttl);

		// Set in Redis if available
		if (this.isRedisAvailable) {
			await this.redisCache.set(key, data, ttl);
		}
	}

	async get(key: string): Promise<any | null> {
		// Try memory cache first
		let data = this.memoryCache.get(key);
		if (data) return data;

		// Try Redis cache
		if (this.isRedisAvailable) {
			data = await this.redisCache.get(key);
			if (data) {
				// Update memory cache with Redis data
				this.memoryCache.set(key, data);
				return data;
			}
		}

		return null;
	}

	async delete(key: string): Promise<void> {
		this.memoryCache.delete(key);
		if (this.isRedisAvailable) {
			await this.redisCache.delete(key);
		}
	}

	async clear(): Promise<void> {
		this.memoryCache.clear();
		if (this.isRedisAvailable) {
			await this.redisCache.clear();
		}
	}

	// Profile-specific cache methods (deprecated - profile caching removed)
	async getProfile(userId: string): Promise<any | null> {
		// Profile caching removed - always return null
		return null;
	}

	async setProfile(userId: string, profile: any): Promise<void> {
		// Profile caching removed - no action needed
	}

	async deleteProfile(userId: string): Promise<void> {
		// Profile caching removed - no action needed
	}

	// User session cache methods
	async getSession(userId: string): Promise<any | null> {
		return await this.get(CACHE_CONFIG.KEYS.USER_SESSION(userId));
	}

	async setSession(userId: string, session: any): Promise<void> {
		await this.set(
			CACHE_CONFIG.KEYS.USER_SESSION(userId),
			session,
			CACHE_CONFIG.TTL.USER_SESSION
		);
	}

	// Static data cache methods
	async getCountries(): Promise<any | null> {
		return await this.get(CACHE_CONFIG.KEYS.COUNTRIES);
	}

	async setCountries(countries: any): Promise<void> {
		await this.set(
			CACHE_CONFIG.KEYS.COUNTRIES,
			countries,
			CACHE_CONFIG.TTL.COUNTRIES
		);
	}

	async getTranslations(locale: string): Promise<any | null> {
		return await this.get(CACHE_CONFIG.KEYS.TRANSLATIONS(locale));
	}

	async setTranslations(locale: string, translations: any): Promise<void> {
		await this.set(
			CACHE_CONFIG.KEYS.TRANSLATIONS(locale),
			translations,
			CACHE_CONFIG.TTL.TRANSLATIONS
		);
	}

	// Profile check cache (for middleware)
	async getProfileCheck(userId: string): Promise<boolean | null> {
		return await this.get(CACHE_CONFIG.KEYS.USER_PROFILE_CHECK(userId));
	}

	async setProfileCheck(userId: string, hasProfile: boolean): Promise<void> {
		await this.set(
			CACHE_CONFIG.KEYS.USER_PROFILE_CHECK(userId),
			hasProfile,
			CACHE_CONFIG.TTL.PROFILE
		);
	}

	// API response caching
	async getApiResponse(key: string): Promise<any | null> {
		return await this.get(CACHE_CONFIG.KEYS.API_RESPONSE(key));
	}

	async setApiResponse(key: string, data: any, ttl?: number): Promise<void> {
		await this.set(CACHE_CONFIG.KEYS.API_RESPONSE(key), data, ttl);
	}

	// Get cache statistics
	async getStats(): Promise<any> {
		if (this.isRedisAvailable) {
			return await this.redisCache.getStats();
		}
		return { connected: false, type: "memory" };
	}
}

// Export singleton instance
export const cacheManager = new CacheManager();

// Initialize cache on server startup
if (typeof window === "undefined") {
	cacheManager.init().catch(console.error);
}

// Cache decorator for functions
export function cached(ttl: number = CACHE_CONFIG.TTL.PROFILE) {
	return function (
		target: any,
		propertyName: string,
		descriptor: PropertyDescriptor
	) {
		const method = descriptor.value;

		descriptor.value = async function (...args: any[]) {
			const cacheKey = `${propertyName}:${JSON.stringify(args)}`;

			// Try to get from cache
			let result = await cacheManager.get(cacheKey);
			if (result) return result;

			// Execute method and cache result
			result = await method.apply(this, args);
			await cacheManager.set(cacheKey, result, ttl);

			return result;
		};
	};
}

// Cache invalidation helpers
export const cacheInvalidation = {
	// Invalidate all profile-related cache (deprecated - profile caching removed)
	async invalidateUserProfile(userId: string): Promise<void> {
		// Profile caching removed - only clear session cache
		await cacheManager.delete(CACHE_CONFIG.KEYS.USER_SESSION(userId));
	},

	// Invalidate all cache for a user
	async invalidateUser(userId: string): Promise<void> {
		await cacheInvalidation.invalidateUserProfile(userId);
	},

	// Invalidate static data
	async invalidateStaticData(): Promise<void> {
		await Promise.all([
			cacheManager.delete(CACHE_CONFIG.KEYS.COUNTRIES),
			cacheManager.delete(CACHE_CONFIG.KEYS.TRANSLATIONS("en")),
			cacheManager.delete(CACHE_CONFIG.KEYS.TRANSLATIONS("vn")),
		]);
	},

	// Invalidate API cache by pattern
	async invalidateApiCache(pattern: string): Promise<void> {
		// This would need Redis SCAN command for pattern matching
		// For now, we'll clear all API cache
		await cacheManager.delete(CACHE_CONFIG.KEYS.API_RESPONSE(pattern));
	},
};
