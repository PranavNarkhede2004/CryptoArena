import rateLimit from 'express-rate-limit';

// Public routes: 100 req/15min per IP
export const publicLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: false,
  skipFailedRequests: false,
  keyGenerator: (req) => req.ip || 'unknown',
});

// Auth routes: 10 req/15min per IP
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: false,
  skipFailedRequests: false,
  keyGenerator: (req) => req.ip || 'unknown',
});

// Trade routes: 30 req/min based on exact path/token, but effectively memory store will use IP or custom keyGenerator
export const tradeLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  keyGenerator: (req) => {
    return req.user ? req.user.userId : req.ip || 'unknown';
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: false,
  skipFailedRequests: false,
});
