import rateLimit from 'express-rate-limit';

// Public routes: 100 req/15min per IP
export const publicLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // Skip rate limiting in development
    return process.env.NODE_ENV === 'development';
  },
});

// Auth routes: 10 req/15min per IP
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // Skip rate limiting in development
    return process.env.NODE_ENV === 'development';
  },
});

// Trade routes: 30 req/min based on exact path/token, but effectively memory store will use IP or custom keyGenerator
export const tradeLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  keyGenerator: (req) => {
    // Use user ID if authenticated, otherwise use a simple identifier
    if (req.user && req.user.userId) {
      return `user_${req.user.userId}`;
    }
    // For unauthenticated requests, use a simple approach
    return `anon_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // Skip rate limiting in development
    return process.env.NODE_ENV === 'development';
  },
});
