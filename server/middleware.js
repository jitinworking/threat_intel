// Simple in-memory rate limiter
const rateLimits = new Map();

export const rateLimiter = (options = { windowMs: 60000, max: 100 }) => {
  return (req, res, next) => {
    const ip = req.ip || req.connection.remoteAddress;
    const now = Date.now();
    
    if (!rateLimits.has(ip)) {
      rateLimits.set(ip, { count: 1, resetTime: now + options.windowMs });
      return next();
    }
    
    const record = rateLimits.get(ip);
    if (now > record.resetTime) {
      record.count = 1;
      record.resetTime = now + options.windowMs;
      return next();
    }
    
    if (record.count >= options.max) {
      return res.status(429).json({
        error: 'Too Many Requests',
        message: 'Rate limit exceeded. Please try again later.',
        code: 'RATE_LIMIT_EXCEEDED'
      });
    }
    
    record.count++;
    next();
  };
};

export const requestLogger = (req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const ms = Date.now() - start;
    console.log(`[API] ${req.method} ${req.originalUrl} ${res.statusCode} - ${ms}ms`);
  });
  next();
};

export const globalErrorHandler = (err, req, res, next) => {
  console.error('[ERROR]', err.stack);
  res.status(err.status || 500).json({
    error: 'Internal Server Error',
    message: err.message || 'An unexpected error occurred.',
    code: err.code || 'INTERNAL_ERROR'
  });
};
