import redis from "@/lib/redis";
import { NextRequest, NextResponse } from "next/server";

interface RateLimitOptions {
  /** Window size in seconds */
  windowMs: number;
  /** Max requests per window */
  max: number;
  /** Key prefix for namespacing */
  keyPrefix?: string;
}

/**
 * Redis-based sliding counter rate limiter.
 * Returns a 429 NextResponse if the limit is exceeded, or null if OK.
 * Fails open if Redis is unavailable.
 */
export async function rateLimit(
  req: NextRequest,
  options: RateLimitOptions,
): Promise<NextResponse | null> {
  const { windowMs, max, keyPrefix = "rl" } = options;

  // Prefer x-forwarded-for (set by reverse proxies/CDNs), fallback to x-real-ip
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "127.0.0.1";

  const key = `${keyPrefix}:${ip}`;

  try {
    const current = await redis.incr(key);
    if (current === 1) {
      // First request — set expiry
      await redis.expire(key, windowMs);
    }
    if (current > max) {
      return NextResponse.json(
        { error: "Too many requests. Please try again later." },
        {
          status: 429,
          headers: {
            "Retry-After": String(windowMs),
            "X-RateLimit-Limit": String(max),
            "X-RateLimit-Remaining": "0",
          },
        },
      );
    }
    return null;
  } catch {
    // Fail open — if Redis is down, don't block requests
    return null;
  }
}
