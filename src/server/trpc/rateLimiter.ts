/**
 * Simple in-memory rate limiter for tRPC procedures.
 *
 * SECURITY NOTE: This is a basic rate limiter suitable for single-server deployments.
 * For production multi-instance deployments, consider:
 *   - Redis-backed rate limiting (e.g., @upstash/ratelimit, ioredis-rate-limiter)
 *   - nginx/CDN-level rate limiting
 *   - A dedicated API gateway
 *
 * The in-memory store resets when the server restarts, which means:
 *   - Abusers can bypass limits by waiting for a restart (low risk)
 *   - Limits are per-process, not shared across multiple server instances
 */

interface RateLimitEntry {
  count: number;
  resetAt: number; // timestamp in ms
}

const store = new Map<string, RateLimitEntry>();

// Cleanup stale entries every 5 minutes to prevent memory leaks
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of store) {
    if (now > entry.resetAt) {
      store.delete(key);
    }
  }
}, 5 * 60 * 1000);

export interface RateLimitConfig {
  /** Number of requests allowed in the window */
  maxRequests: number;
  /** Time window in seconds */
  windowSeconds: number;
  /** Custom identifier (defaults to IP from ctx or a generic key) */
  keyPrefix?: string;
}

/**
 * Creates a rate limiter middleware for tRPC procedures.
 *
 * @example
 * ```ts
 * export const loginTeacher = baseProcedure
 *   .use(rateLimiter({ maxRequests: 5, windowSeconds: 60, keyPrefix: "login" }))
 *   .input(z.object({ ... }))
 *   .mutation(async ({ input }) => { ... });
 * ```
 */
export function rateLimiter(config: RateLimitConfig) {
  const { maxRequests, windowSeconds, keyPrefix = "global" } = config;

  return ({ input, next }: { input: Record<string, unknown>; next: () => Promise<unknown> }) => {
    // Use phoneNumber if available (for auth endpoints), otherwise fall back to a generic key
    const identifier = (input?.phoneNumber as string) || "anonymous";
    const key = `${keyPrefix}:${identifier}`;
    const now = Date.now();
    const windowMs = windowSeconds * 1000;

    const entry = store.get(key);

    if (!entry || now > entry.resetAt) {
      // New window
      store.set(key, { count: 1, resetAt: now + windowMs });
      return next();
    }

    if (entry.count >= maxRequests) {
      const retryAfterSec = Math.ceil((entry.resetAt - now) / 1000);
      throw new Error(
        `请求过于频繁，请在 ${retryAfterSec} 秒后重试。`
      );
    }

    entry.count++;
    return next();
  };
}
