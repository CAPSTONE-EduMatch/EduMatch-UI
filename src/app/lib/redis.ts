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
import { createClient } from 'redis';
import dotenv from 'dotenv';
dotenv.config();

const redisClient = createClient({
  url: process.env.REDIS_URL || 'redis://localhost:6379',
  // socket: {
    // host: process.env.REDIS_URL, // e.g. 'my-redis.xxxxxx.0001.apn2.cache.amazonaws.com'
    // port: Number(process.env.REDIS_PORT) || 6379,
    // tls: true, // Uncomment if TLS is required
  // },
  // password: process.env.REDIS_PASSWORD, // Uncomment if password is required
});

redisClient.on('error', (err) => {
  console.error('Redis Client Error', err);
  return;
});

redisClient.connect().catch(console.error);

export { redisClient };