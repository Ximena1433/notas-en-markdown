export interface RateLimiter {
  check(key: string): boolean;
  reset(): void;
}

export const AUTH_LIMIT = 10;
export const AUTH_WINDOW_MS = 15 * 60 * 1000;

export function createRateLimiter(
  maxAttempts: number = AUTH_LIMIT,
  windowMs: number = AUTH_WINDOW_MS,
  now: () => number = Date.now,
): RateLimiter {
  const attempts = new Map<string, { count: number; resetAt: number }>();

  return {
    check(key: string): boolean {
      const time = now();
      for (const [entryKey, entry] of attempts) {
        if (entry.resetAt <= time) attempts.delete(entryKey);
      }

      const current = attempts.get(key);
      if (current) {
        if (current.count >= maxAttempts) return false;
        current.count += 1;
        return true;
      }

      attempts.set(key, { count: 1, resetAt: time + windowMs });
      return true;
    },
    reset(): void {
      attempts.clear();
    },
  };
}
