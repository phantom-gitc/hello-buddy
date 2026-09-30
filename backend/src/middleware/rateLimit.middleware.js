const redis = require('../config/redis');
const ApiError = require('../utils/ApiError');

/**
 * Creates a rate limiter middleware for specified window and max requests
 * @param {object} options
 * @param {number} options.windowSeconds - Window size in seconds
 * @param {number} options.max - Max requests within window
 * @param {string} options.prefix - Key prefix in Redis
 * @param {boolean} options.byUser - Whether to rate limit by req.user.id if available, otherwise req.ip
 */
const createRateLimiter = ({
  windowSeconds = 60,
  max = 60,
  prefix = 'ratelimit',
  byUser = false,
}) => {
  return async (req, res, next) => {
    try {
      const identifier = byUser && req.user ? `user:${req.user._id}` : `ip:${req.ip || req.connection.remoteAddress}`;
      const key = `${prefix}:${identifier}`;

      const currentCount = await redis.incr(key);

      if (currentCount === 1) {
        await redis.expire(key, windowSeconds);
      }

      if (currentCount > max) {
        return next(
          ApiError.tooManyRequests(
            `Too many requests. Limit is ${max} requests per ${windowSeconds}s. Please try again later.`,
            'RATE_LIMIT_EXCEEDED'
          )
        );
      }

      // Add rate limit headers
      res.setHeader('X-RateLimit-Limit', max);
      res.setHeader('X-RateLimit-Remaining', Math.max(0, max - currentCount));

      next();
    } catch (err) {
      // In case of rate limiter store failure, let request pass to not block service
      next();
    }
  };
};

const isDev = process.env.NODE_ENV === 'development';

module.exports = {
  generalLimiter: createRateLimiter({ windowSeconds: 60, max: isDev ? 1000 : 100, prefix: 'rl:general' }),
  authLimiter: createRateLimiter({ windowSeconds: 15 * 60, max: isDev ? 200 : 10, prefix: 'rl:auth' }),
  otpLimiter: createRateLimiter({ windowSeconds: 60, max: isDev ? 50 : 3, prefix: 'rl:otp' }),
  aiLimiter: createRateLimiter({ windowSeconds: 60, max: isDev ? 100 : 20, prefix: 'rl:ai', byUser: true }),
  uploadLimiter: createRateLimiter({ windowSeconds: 60, max: isDev ? 50 : 10, prefix: 'rl:upload', byUser: true }),
  createRateLimiter,
};
