require('dotenv').config();

const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const compression = require('compression');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const cors = require('cors');

const config = require('./config');
const logger = require('./utils/logger');
const database = require('./services/database');
const {
  errorHandler,
  notFoundHandler,
  asyncHandler,
} = require('./middlewares/errorHandler');

// Initialize Express app
const app = express();
const server = http.createServer(app);

// Initialize Socket.IO with security
const io = socketIo(server, {
  cors: {
    origin: config.security.cors.origin,
    credentials: config.security.cors.credentials,
  },
  transports: ['websocket', 'polling'],
});

// Trust proxy for rate limiting and logging
app.set('trust proxy', 1);

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://cdnjs.cloudflare.com", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      scriptSrc: ["'self'", "'unsafe-inline'", "https://cdnjs.cloudflare.com"],
      imgSrc: ["'self'", "data:", "https:", "blob:"],
      connectSrc: ["'self'", "wss:", "ws:", "https:"],
    },
  },
  crossOriginEmbedderPolicy: false,
}));

// CORS configuration
app.use(cors(config.security.cors));

// Rate limiting
const limiter = rateLimit(config.rateLimit);
app.use('/api/', limiter);

// File upload rate limit (stricter for uploads)
const uploadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 uploads per window
  message: 'Too many file uploads, please try again later',
});
app.use('/api/upload', uploadLimiter);

// Compression
app.use(compression());

// Body parsing with limits
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  req.id = require('crypto').randomUUID().substring(0, 8);

  logger.request(req, `${req.method} ${req.path} - Start`);

  res.on('finish', () => {
    const duration = Date.now() - start;
    const statusCode = res.statusCode;
    const level = statusCode >= 400 ? 'warn' : 'info';

    logger.log(level, `${req.method} ${req.path} - ${statusCode} (${duration}ms)`, {
      requestId: req.id,
      statusCode,
      duration,
      userAgent: req.get('User-Agent'),
      ip: req.ip,
    });
  });

  next();
});

// Static files with cache control
app.use(express.static('public', {
  maxAge: config.env === 'production' ? '1d' : 0,
  etag: true,
}));

// Health check endpoint
app.get('/api/health', asyncHandler(async (req, res) => {
  const health = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: config.env,
    version: config.app.version,
  };

  // Check database health
  try {
    const mongoHealth = await database.checkMongoDBHealth();
    const redisHealth = await database.checkRedisHealth();

    health.services = {
      mongodb: mongoHealth,
      redis: redisHealth,
    };

    // If any service is unhealthy, mark overall health as degraded
    if (mongoHealth.status !== 'healthy' || redisHealth.status !== 'healthy') {
      health.status = 'degraded';
      res.status(200); // Still return 200 but indicate degraded status
    }
  } catch (error) {
    health.status = 'unhealthy';
    health.error = error.message;
    res.status(503);
  }

  res.json(health);
}));

// API routes will be registered here
// TODO: Import and use route modules

// Catch-all handler for client-side routing
app.get('*', (req, res) => {
  res.sendFile('index.html', { root: 'public' });
});

// 404 handler
app.use(notFoundHandler);

// Error handling middleware (must be last)
app.use(errorHandler);

// Socket.IO connection handling
io.on('connection', (socket) => {
  logger.info(`WebSocket connected: ${socket.id}`);

  socket.on('disconnect', (reason) => {
    logger.info(`WebSocket disconnected: ${socket.id}, reason: ${reason}`);
  });

  // Camera control events
  socket.on('camera_command', (data) => {
    logger.info(`Camera command received: ${data.type}`, { socketId: socket.id });
    // Broadcast to appropriate clients or handle camera logic
    socket.broadcast.emit('camera_command', data);
  });

  // Real-time updates
  socket.on('sensor_data', (data) => {
    socket.volatile.emit('sensor_update', data);
  });

  socket.on('motion_detected', (data) => {
    logger.info('Motion detected', { socketId: socket.id });
    io.emit('motion_alert', data);
  });

  // Handle connection errors
  socket.on('error', (error) => {
    logger.errorWithContext(error, { socketId: socket.id, event: 'socket_error' });
  });
});

// Graceful shutdown handler
const gracefulShutdown = async (signal) => {
  logger.info(`Received ${signal}. Starting graceful shutdown...`);

  try {
    // Close Socket.IO connections
    io.close(() => {
      logger.info('Socket.IO connections closed');
    });

    // Close database connections
    await database.disconnectMongoDB();
    await database.disconnectRedis();

    // Close HTTP server
    server.close(() => {
      logger.info('HTTP server closed');
      process.exit(0);
    });

    // Force shutdown after timeout
    setTimeout(() => {
      logger.error('Forced shutdown due to timeout');
      process.exit(1);
    }, 10000);

  } catch (error) {
    logger.errorWithContext(error, { signal, operation: 'gracefulShutdown' });
    process.exit(1);
  }
};

// Handle shutdown signals
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Start server
const startServer = async () => {
  try {
    // Connect to databases
    await database.connectMongoDB();
    await database.connectRedis();

    // Start HTTP server
    server.listen(config.port, config.host, () => {
      logger.info(`${config.app.name} v${config.app.version} running`, {
        port: config.port,
        host: config.host,
        environment: config.env,
        nodeVersion: process.version,
      });

      // Log available endpoints
      logger.info('Available endpoints:', {
        webInterface: `http://${config.host}:${config.port}`,
        apiHealth: `http://${config.host}:${config.port}/api/health`,
        websocket: `ws://${config.host}:${config.port}`,
      });
    });

  } catch (error) {
    logger.errorWithContext(error, { operation: 'startServer' });
    process.exit(1);
  }
};

// Handle uncaught exceptions and unhandled rejections
process.on('uncaughtException', (error) => {
  logger.errorWithContext(error, { type: 'uncaughtException' });
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.errorWithContext(
    new Error(`Unhandled Rejection at ${promise}, reason: ${reason}`),
    { type: 'unhandledRejection' }
  );
  process.exit(1);
});

// Start the application
startServer().catch((error) => {
  logger.errorWithContext(error, { operation: 'applicationStart' });
  process.exit(1);
});

module.exports = { app, server, io };
