const ApiError = require('../utils/ApiError');
const { verifyAccessToken } = require('../utils/jwt');
const User = require('../modules/users/user.model');
const redis = require('../config/redis');

/**
 * Authentication middleware: ensures request contains valid access token
 */
const requireAuth = async (req, res, next) => {
  try {
    let token = null;

    if (req.cookies && req.cookies.accessToken) {
      token = req.cookies.accessToken;
    } else if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return next(ApiError.unauthorized('Authentication token missing or invalid', 'TOKEN_MISSING'));
    }

    let decoded;
    try {
      decoded = verifyAccessToken(token);
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        return next(ApiError.unauthorized('Token has expired. Please refresh your session.', 'TOKEN_EXPIRED'));
      }
      return next(ApiError.unauthorized('Invalid authentication token', 'TOKEN_INVALID'));
    }

    // Check if token was revoked in Redis blacklist (e.g. on logout)
    const isBlacklisted = await redis.get(`blacklist:${token}`);
    if (isBlacklisted) {
      return next(ApiError.unauthorized('Token has been revoked', 'TOKEN_REVOKED'));
    }

    // Fetch user from DB
    const user = await User.findById(decoded.userId).select('-password');
    if (!user) {
      return next(ApiError.unauthorized('User associated with this token no longer exists', 'USER_NOT_FOUND'));
    }

    if (!user.isActive) {
      return next(ApiError.forbidden('User account has been deactivated', 'ACCOUNT_DEACTIVATED'));
    }

    req.user = user;
    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Role-based authorization middleware
 * @param  {...string} allowedRoles
 */
const authorizeRoles = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(ApiError.unauthorized('User not authenticated'));
    }
    if (!allowedRoles.includes(req.user.role)) {
      return next(ApiError.forbidden('You do not have permission to perform this action', 'FORBIDDEN_ROLE'));
    }
    next();
  };
};

module.exports = {
  requireAuth,
  authorizeRoles,
};
