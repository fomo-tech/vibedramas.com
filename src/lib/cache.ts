import redis from "./redis";

/**
 * Get highly optimized data from Redis
 * @param key Redis key
 * @returns Parsed JSON data or null
 */
export async function getCache<T>(key: string): Promise<T | null> {
  try {
    const data = await redis.get(key);
    if (!data) return null;
    return JSON.parse(data) as T;
  } catch (error) {
    console.error(`[Redis Error] Failed to get cache for key ${key}:`, error);
    return null;
  }
}

/**
 * Set data to Redis with a TTL
 * @param key Redis key
 * @param data Data object to store
 * @param ttl Time to live in seconds (default 3600s / 1h)
 */
export async function setCache(
  key: string,
  data: any,
  ttl: number = 3600,
): Promise<void> {
  try {
    const stringifiedData = JSON.stringify(data);
    await redis.setex(key, ttl, stringifiedData);
  } catch (error) {
    console.error(`[Redis Error] Failed to set cache for key ${key}:`, error);
  }
}

/**
 * Delete a specific cache key
 * @param key Redis key
 */
export async function deleteCache(key: string): Promise<void> {
  try {
    await redis.del(key);
  } catch (error) {
    console.error(
      `[Redis Error] Failed to delete cache for key ${key}:`,
      error,
    );
  }
}

/**
 * Clear cache by pattern using SCAN to avoid blocking Redis in production.
 * @param pattern e.g. "drama:*"
 */
export async function deleteCacheByPattern(pattern: string): Promise<void> {
  try {
    let cursor = "0";
    const keysToDelete: string[] = [];

    do {
      // SCAN is non-blocking unlike KEYS — safe for production
      const [nextCursor, keys] = await redis.scan(
        cursor,
        "MATCH",
        pattern,
        "COUNT",
        100,
      );
      cursor = nextCursor;
      keysToDelete.push(...keys);
    } while (cursor !== "0");

    if (keysToDelete.length > 0) {
      await redis.del(...keysToDelete);
    }
  } catch (error) {
    console.error(
      `[Redis Error] Failed to delete cache by pattern ${pattern}:`,
      error,
    );
  }
}
