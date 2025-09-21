const config = require('../config');
const logger = require('../utils/logger');

// Custom error classes
class BaseError extends Error {
  constructor(message, statusCode = 500, isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.name = this.constructor.name;

    Error.captureStackTrace(this, this.constructor);
  }
}

class ValidationError extends BaseError {
  constructor(message) {
    super(message, 400);
  }
}

class AuthenticationError extends BaseError {
  constructor(message = 'Authentication required') {
    super(message, 401);
  }
}

class AuthorizationError extends BaseError {
  constructor(message = 'Insufficient permissions') {
    super(message, 403);
  }
}

class NotFoundError extends BaseError {
  constructor(resource = 'Resource') {
    super(`${resource} not found`, 404);
  }
}

class ConflictError extends BaseError {
  constructor(message = 'Resource conflict') {
    super(message, 409);
  }
}

class RateLimitError extends BaseError {
  constructor(message = 'Too many requests') {
    super(message, 429);
  }
}

class ExternalServiceError extends BaseError {
  constructor(service = 'External service', message = 'Service unavailable') {
    super(`${service}: ${message}`, 502);
  }
}

// Error response formatter
const formatErrorResponse = (error, req) => {
  const isDevelopment = config.env === 'development';

  const baseResponse = {
    success: false,
    error: {
      message: error.message,
      type: error.name,
      timestamp: new Date().toISOString(),
    },
  };

  // Add stack trace in development
  if (isDevelopment) {
    baseResponse.error.stack = error.stack;
    baseResponse.error.path = req.path;
    baseResponse.error.method = req.method;
  }

  // Add additional info for specific error types
  if (error.name === 'ValidationError') {
    baseResponse.error.details = error.details;
  }

  if (error.name === 'MongoError' || error.name === 'MongoServerError') {
    baseResponse.error.type = 'DatabaseError';
    if (!isDevelopment) {
      baseResponse.error.message = 'Database operation failed';
    }
  }

  if (error.name === 'JsonWebTokenError') {
    baseResponse.error.type = 'AuthenticationError';
    baseResponse.error.message = 'Invalid authentication token';
  }

  return baseResponse;
};

// Main error handling middleware
const errorHandler = (error, req, res, next) => {
  // Log the error with context
  logger.errorWithContext(error, {
    url: req.url,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    requestId: req.id,
    body: config.env === 'development' ? req.body : '[REDACTED]',
    query: req.query,
    params: req.params,
  });

  // Don't expose internal errors in production
  let statusCode = error.statusCode || 500;
  let message = error.message;

  if (statusCode === 500 && config.env === 'production') {
    message = 'Internal server error';
  }

  // Ensure status code is valid
  if (statusCode < 400 || statusCode > 599) {
    statusCode = 500;
  }

  const errorResponse = formatErrorResponse(error, req);

  res.status(statusCode).json(errorResponse);
};

// 404 handler
const notFoundHandler = (req, res, next) => {
  const error = new NotFoundError(`Route ${req.originalUrl}`);
  next(error);
};

// Validation error handler for Joi
const handleValidationError = (error) => {
  if (error.isJoi) {
    const details = error.details.map(detail => ({
      field: detail.path.join('.'),
      message: detail.message,
      value: detail.context.value,
    }));

    const validationError = new ValidationError('Validation failed');
    validationError.details = details;
    return validationError;
  }
  return error;
};

// Async error wrapper
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// Graceful shutdown handler
const gracefulShutdown = (signal) => {
  logger.info(`Received ${signal}. Starting graceful shutdown...`);
  // Add cleanup logic here
  process.exit(0);
};

// Unhandled rejection handler
process.on('unhandledRejection', (reason, promise) => {
  logger.errorWithContext(
    new Error(`Unhandled Rejection at ${promise}, reason: ${reason}`),
    { type: 'unhandledRejection' }
  );
});

// Uncaught exception handler (though Winston handles this)
process.on('uncaughtException', (error) => {
  logger.errorWithContext(error, { type: 'uncaughtException' });
  process.exit(1);
});

// Graceful shutdown signals
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

module.exports = {
  errorHandler,
  notFoundHandler,
  handleValidationError,
  asyncHandler,
  BaseError,
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  ConflictError,
  RateLimitError,
  ExternalServiceError,
};
