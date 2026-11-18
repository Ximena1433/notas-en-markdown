import { createRateLimiter } from "./rate-limit";

export const ipLimiter = createRateLimiter();
export const accountLimiter = createRateLimiter();
