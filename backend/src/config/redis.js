const Redis = require('ioredis');
const config = require('./env');
const logger = require('../utils/logger');

let redisClient;
const memoryStore = new Map(); // Dev fallback store if Redis server is not reachable

let hasLoggedFallback = false;

try {
  redisClient = new Redis(config.redis.url, {
    maxRetriesPerRequest: 1,
    enableReadyCheck: false,
    lazyConnect: true,
    retryStrategy: () => null,
  });

  redisClient.on('connect', () => {
    logger.redis('Connected (Ready for OTP & cache)');
  });

  redisClient.on('error', () => {
    if (!hasLoggedFallback) {
      hasLoggedFallback = true;
      logger.redis('In-memory fallback cache active');
    }
  });

  redisClient.connect().catch(() => {
    if (!hasLoggedFallback) {
      hasLoggedFallback = true;
      logger.redis('In-memory fallback cache active');
    }
  });
} catch (err) {
  if (!hasLoggedFallback) {
    hasLoggedFallback = true;
    logger.redis('In-memory fallback cache active');
  }
}

/**
 * Universal Redis wrapper with automatic memory store fallback
 */
const redisService = {
  async get(key) {
    try {
      if (redisClient && redisClient.status === 'ready') {
        return await redisClient.get(key);
      }
    } catch (err) {
      logger.warn(`Redis get failed for ${key}, checking fallback`);
    }
    const item = memoryStore.get(key);
    if (!item) return null;
    if (item.expiresAt && Date.now() > item.expiresAt) {
      memoryStore.delete(key);
      return null;
    }
    return item.value;
  },

  async set(key, value, mode, duration) {
    const valString = typeof value === 'object' ? JSON.stringify(value) : String(value);
    try {
      if (redisClient && redisClient.status === 'ready') {
        if (mode === 'EX' && duration) {
          return await redisClient.set(key, valString, 'EX', duration);
        }
        return await redisClient.set(key, valString);
      }
    } catch (err) {
      logger.warn(`Redis set failed for ${key}, setting in fallback`);
    }
    const expiresAt = mode === 'EX' && duration ? Date.now() + duration * 1000 : null;
    memoryStore.set(key, { value: valString, expiresAt });
    return 'OK';
  },

  async del(key) {
    try {
      if (redisClient && redisClient.status === 'ready') {
        return await redisClient.del(key);
      }
    } catch (err) {
      logger.warn(`Redis del failed for ${key}`);
    }
    memoryStore.delete(key);
    return 1;
  },

  async incr(key) {
    try {
      if (redisClient && redisClient.status === 'ready') {
        return await redisClient.incr(key);
      }
    } catch (err) {
      logger.warn(`Redis incr failed for ${key}`);
    }
    const current = (await this.get(key)) || 0;
    const nextVal = parseInt(current, 10) + 1;
    await this.set(key, nextVal);
    return nextVal;
  },

  async expire(key, seconds) {
    try {
      if (redisClient && redisClient.status === 'ready') {
        return await redisClient.expire(key, seconds);
      }
    } catch (err) {
      logger.warn(`Redis expire failed for ${key}`);
    }
    const item = memoryStore.get(key);
    if (item) {
      item.expiresAt = Date.now() + seconds * 1000;
      memoryStore.set(key, item);
    }
    return 1;
  },

  getClient() {
    return redisClient;
  },
};

module.exports = redisService;
