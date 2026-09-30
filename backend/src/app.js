const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const config = require('./config/env');
const routes = require('./routes');
const errorHandler = require('./middleware/error.middleware');
const { generalLimiter } = require('./middleware/rateLimit.middleware');
const ApiError = require('./utils/ApiError');
const logger = require('./utils/logger');

const app = express();

// Security HTTP headers
app.use(
  helmet({
    contentSecurityPolicy: false, // Let client applications embed or load appropriately in dev
    crossOriginEmbedderPolicy: false,
  })
);

// Cross-Origin Resource Sharing
app.use(
  cors({
    origin: config.clientUrl,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  })
);

// Body parsing with safe size limits
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Cookie parsing
app.use(cookieParser(config.jwt.cookieSecret));

// Basic request logging in development
if (config.env === 'development') {
  app.use((req, res, next) => {
    logger.debug(`[HTTP] ${req.method} ${req.url}`);
    next();
  });
}

// Global baseline rate limiting
app.use('/api', generalLimiter);

// Versioned API Routes
app.use('/api/v1', routes);

// 404 handler for unrecognized routes
app.use((req, res, next) => {
  next(ApiError.notFound(`Cannot ${req.method} ${req.originalUrl}`, 'ROUTE_NOT_FOUND'));
});

// Global error handling middleware (must be registered last)
app.use(errorHandler);

module.exports = app;
