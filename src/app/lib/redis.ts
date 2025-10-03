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

const redisClient = createClient({
	url: process.env.REDIS_URL || "redis://localhost:6379",
	// socket: {
	// host: process.env.REDIS_URL, // e.g. 'my-redis.xxxxxx.0001.apn2.cache.amazonaws.com'
	// port: Number(process.env.REDIS_PORT) || 6379,
	// tls: true, // Uncomment if TLS is required
	// },
	// password: process.env.REDIS_PASSWORD, // Uncomment if password is required
});

redisClient.on("error", (err) => {
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
redisClient.connect().catch((err) => {
	// eslint-disable-next-line no-console
	console.error("Failed to connect to Redis:", err);
	// Don't throw error to prevent app crash if Redis is unavailable
});

export { redisClient };
