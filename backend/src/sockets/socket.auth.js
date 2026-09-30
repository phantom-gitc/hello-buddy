const { verifyAccessToken } = require('../utils/jwt');
const User = require('../modules/users/user.model');
const redis = require('../config/redis');
const logger = require('../utils/logger');

/**
 * Socket.IO authentication middleware: verifies JWT server-side
 */
const socketAuthMiddleware = async (socket, next) => {
  try {
    let token = socket.handshake.auth?.token || socket.handshake.query?.token;

    // Check cookie in handshake headers if token not explicitly in auth object
    if (!token && socket.handshake.headers?.cookie) {
      const cookieHeader = socket.handshake.headers.cookie;
      const match = cookieHeader.match(/accessToken=([^;]+)/);
      if (match) {
        token = match[1];
      }
    }

    if (!token) {
      return next(new Error('Authentication token required'));
    }

    // Verify token
    let decoded;
    try {
      decoded = verifyAccessToken(token);
    } catch (err) {
      return next(new Error('Invalid or expired authentication token'));
    }

    // Check blacklist
    const isBlacklisted = await redis.get(`blacklist:${token}`);
    if (isBlacklisted) {
      return next(new Error('Token has been revoked'));
    }

    // Fetch user
    const user = await User.findById(decoded.userId).select('-password');
    if (!user || !user.isActive) {
      return next(new Error('User not found or account deactivated'));
    }

    // Attach authenticated identity to socket
    socket.user = user;
    logger.info(`Socket authenticated for user: ${user.email} (socket ID: ${socket.id})`);

    next();
  } catch (error) {
    logger.error('Socket authentication failed:', { error: error.message });
    next(new Error('Authentication failed'));
  }
};

module.exports = socketAuthMiddleware;
