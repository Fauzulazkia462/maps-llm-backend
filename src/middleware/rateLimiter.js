import rateLimit from "express-rate-limit";

export function createRateLimiter({ windowMs = 60000, max = 60 } = {}) {
    return rateLimit({
        windowMs,
        max,
        standardHeaders: true,
        legacyHeaders: false,
        message: { error: "Too many requests, slow down" }
    });
}