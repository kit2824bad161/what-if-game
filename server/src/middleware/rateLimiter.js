const requestCounts = new Map();

/**
 * Lightweight in-memory rate limiter
 * windowMs: timeframe in milliseconds
 * maxRequests: maximum requests allowed per IP in the timeframe
 */
export const rateLimiter = (options = { windowMs: 60000, maxRequests: 60 }) => {
  const { windowMs, maxRequests } = options;

  return (req, res, next) => {
    const ip = req.ip || req.connection.remoteAddress || 'unknown-ip';
    const now = Date.now();

    const record = requestCounts.get(ip) || { count: 0, resetTime: now + windowMs };

    if (now > record.resetTime) {
      record.count = 1;
      record.resetTime = now + windowMs;
    } else {
      record.count++;
    }

    requestCounts.set(ip, record);

    res.setHeader('X-RateLimit-Limit', maxRequests);
    res.setHeader('X-RateLimit-Remaining', Math.max(0, maxRequests - record.count));
    res.setHeader('X-RateLimit-Reset', Math.ceil(record.resetTime / 1000));

    if (record.count > maxRequests) {
      return res.status(429).json({
        error: true,
        message: 'Too many requests. Please slow down and try again shortly.',
      });
    }

    next();
  };
};
