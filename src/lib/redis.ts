import Redis from "ioredis";

const REDIS_URL = process.env.REDIS_URL;

if (!REDIS_URL) {
  console.warn(
    "REDIS_URL is not defined in environment variables. Falling back to localhost.",
  );
}

const redisConfig = REDIS_URL || "redis://localhost:6379";

const redisOptions = {
  // Retry with exponential back-off capped at 3 seconds
  retryStrategy: (times: number) => Math.min(times * 200, 3000),
  maxRetriesPerRequest: 3,
  enableOfflineQueue: true, // queue commands while reconnecting
  lazyConnect: false,
};

// Setup global redis instance to prevent connection leaks during hot reload in dev
let redis: Redis;
const globalForRedis = global as unknown as { redis: Redis };

if (process.env.NODE_ENV === "production") {
  redis = new Redis(redisConfig, redisOptions);
} else {
  if (!globalForRedis.redis) {
    globalForRedis.redis = new Redis(redisConfig, redisOptions);
  }
  redis = globalForRedis.redis;
}

redis.on("error", (err) => {
  console.error("Redis Client Error:", err);
});

redis.on("connect", () => {
  console.log("Redis Client Connected");
});

export default redis;
