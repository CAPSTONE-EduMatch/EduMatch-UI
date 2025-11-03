// import { createClient } from 'redis';

// // Create Redis client
// const redisClient = createClient({
//   url: process.env.REDIS_URL || 'redis://localhost:6379',
//   // password: process.env.REDIS_PASSWORD,
// });

// redisClient.on('error', (err) => {
//   console.error('Redis Client Error', err);
// });

// // Connect to Redis
// redisClient.connect().catch(console.error);

// export { redisClient };
import dotenv from "dotenv";
import { createClient } from "redis";
dotenv.config();

// Only create Redis client if proper Redis URL is provided
let redisClient: any = null;

if (
	process.env.REDIS_URL &&
	process.env.REDIS_URL !== "redis://localhost:6379"
) {
	redisClient = createClient({
		url: process.env.REDIS_URL,
	});

	redisClient.on("error", (err: Error) => {
		// eslint-disable-next-line no-console
		console.error("Redis Client Error", err);
	});

	redisClient.on("connect", () => {
		// eslint-disable-next-line no-console
		console.log("Redis connected successfully");
	});

	redisClient.on("ready", () => {
		// eslint-disable-next-line no-console
		console.log("Redis client ready");
	});

	// Connect with better error handling
	redisClient.connect().catch((err: Error) => {
		// eslint-disable-next-line no-console
		console.error("Failed to connect to Redis:", err);
	});
} else {
	// eslint-disable-next-line no-console
	console.log("Redis not configured - using memory-only session storage");
}

export { redisClient };
