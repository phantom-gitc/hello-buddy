const ApiError = require('../utils/ApiError');
const logger = require('../utils/logger');
const config = require('../config/env');

/**
 * Global Error Handling Middleware
 */
const errorHandler = (err, req, res, next) => {
  let error = err;

  // Convert known external/framework errors into ApiError
  if (!(error instanceof ApiError)) {
    const statusCode = error.statusCode || (error.name === 'ValidationError' ? 400 : 500);
    const message = error.message || 'Internal server error';
    const code = error.name || 'INTERNAL_SERVER_ERROR';
    error = new ApiError(statusCode, message, code, error.errors || []);
  }

  // Handle Mongoose cast errors
  if (err.name === 'CastError') {
    error = ApiError.badRequest(`Invalid resource identifier: ${err.value}`, 'INVALID_ID');
  }

  // Handle Mongoose duplicate key errors
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0] || 'field';
    error = ApiError.conflict(`An entry with this ${field} already exists`, 'DUPLICATE_KEY');
  }

  // Log non-operational or 500 errors
  if (!error.isOperational || error.statusCode >= 500) {
    logger.error(`Unhandled Exception [${req.method} ${req.originalUrl}]: ${error.message}`, {
      stack: error.stack,
      body: req.body,
    });
  } else {
    logger.warn(`Operational Error [${req.method} ${req.originalUrl}]: ${error.message}`);
  }

  const responsePayload = {
    success: false,
    message: error.message,
    error: {
      code: error.code || 'ERROR',
      ...(error.errors && error.errors.length > 0 ? { details: error.errors } : {}),
      ...(config.env === 'development' && { stack: error.stack }),
    },
  };

  return res.status(error.statusCode || 500).json(responsePayload);
};

module.exports = errorHandler;
