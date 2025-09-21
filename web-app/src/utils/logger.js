const winston = require('winston');
const path = require('path');
const config = require('../config');

const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.json(),
);

const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    const metaStr = Object.keys(meta).length ? JSON.stringify(meta, null, 2) : '';
    return `${timestamp} [${level}]: ${message} ${metaStr}`;
  }),
);

const transports = [];

if (config.env === 'production') {
  transports.push(
    new winston.transports.File({
      filename: path.join(process.cwd(), 'logs', 'error.log'),
      level: 'error',
      format: logFormat,
    }),
    new winston.transports.File({
      filename: path.join(process.cwd(), 'logs', 'combined.log'),
      format: logFormat,
    }),
    new winston.transports.Console({
      format: consoleFormat,
      level: config.logging.level,
    }),
  );
} else {
  transports.push(
    new winston.transports.Console({
      format: consoleFormat,
      level: config.logging.level,
    }),
  );
}

const logger = winston.createLogger({
  level: config.logging.level,
  format: logFormat,
  transports,
  exitOnError: false,
});

// Handle uncaught exceptions and unhandled rejections
logger.exceptions.handle(
  new winston.transports.Console(),
  new winston.transports.File({ filename: path.join(process.cwd(), 'logs', 'exceptions.log') }),
);

logger.rejections.handle(
  new winston.transports.Console(),
  new winston.transports.File({ filename: path.join(process.cwd(), 'logs', 'rejections.log') }),
);

// Helper methods for structured logging
logger.request = (req, message, meta = {}) => {
  const requestMeta = {
    method: req.method,
    url: req.url,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    requestId: req.id,
    ...meta,
  };
  logger.info(message, requestMeta);
};

logger.errorWithContext = (error, context = {}) => {
  const errorMeta = {
    error: {
      message: error.message,
      stack: error.stack,
      name: error.name,
    },
    ...context,
  };
  logger.error(error.message, errorMeta);
};

logger.performance = (operation, duration, meta = {}) => {
  logger.info(`Performance: ${operation}`, { duration, ...meta });
};

logger.audit = (action, userId, resource, meta = {}) => {
  logger.info(`AUDIT: ${action}`, {
    userId,
    resource,
    timestamp: new Date().toISOString(),
    ...meta,
  });
};

module.exports = logger;
