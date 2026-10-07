const cacheStore = new Map();

export const cacheMap = cacheStore;

/**
 * Cache middleware for Express routes.
 * @param {number} ttlSeconds Time to live in seconds
 */
export const routeCache = (ttlSeconds) => {
  return (req, res, next) => {
    // Only cache GET requests
    if (req.method !== 'GET') return next();

    const key = req.originalUrl;
    const cached = cacheStore.get(key);

    if (cached && cached.expiry > Date.now()) {
      return res.json(cached.data);
    }

    // Override res.json to cache the response before sending it
    const originalJson = res.json.bind(res);
    res.json = (body) => {
      // Only cache successful responses
      if (res.statusCode >= 200 && res.statusCode < 300) {
        cacheStore.set(key, {
          data: body,
          expiry: Date.now() + ttlSeconds * 1000
        });
      }
      originalJson(body);
    };

    next();
  };
};

/**
 * Manually invalidate a cache key (e.g. after a POST/PUT operation)
 */
export const invalidateCache = (pattern) => {
  for (const key of cacheStore.keys()) {
    if (key.includes(pattern)) {
      cacheStore.delete(key);
    }
  }
};
