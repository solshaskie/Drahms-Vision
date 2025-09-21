const mongoose = require('mongoose');
const redis = require('redis');
const config = require('../config');
const logger = require('../utils/logger');

// MongoDB Connection
let mongodbConnection = null;

const connectMongoDB = async() => {
  try {
    if (mongodbConnection) {
      return mongodbConnection;
    }

    logger.info('Connecting to MongoDB...');

    const connection = await mongoose.connect(config.database.mongodb.uri, {
      ...config.database.mongodb.options,
      dbName: 'drahms_vision',
    });

    mongodbConnection = connection;

    // Connection event handlers
    connection.connection.on('connected', () => {
      logger.info('MongoDB connected successfully');
    });

    connection.connection.on('error', (err) => {
      logger.errorWithContext(err, { service: 'MongoDB' });
    });

    connection.connection.on('disconnected', () => {
      logger.warn('MongoDB disconnected');
      mongodbConnection = null;
    });

    // Graceful shutdown
    process.on('SIGINT', async() => {
      await connection.connection.close();
      logger.info('MongoDB connection closed through app termination');
      process.exit(0);
    });

    return connection;
  } catch (error) {
    logger.errorWithContext(error, { service: 'MongoDB', operation: 'connect' });
    throw error;
  }
};

const getMongoDBConnection = () => {
  if (!mongodbConnection) {
    throw new Error('MongoDB not connected. Call connectMongoDB() first.');
  }
  return mongodbConnection;
};

const disconnectMongoDB = async() => {
  if (mongodbConnection) {
    await mongodbConnection.connection.close();
    mongodbConnection = null;
    logger.info('MongoDB disconnected manually');
  }
};

// Redis Connection
let redisClient = null;

const connectRedis = async() => {
  try {
    if (redisClient) {
      return redisClient;
    }

    logger.info('Connecting to Redis...');

    redisClient = redis.createClient(config.database.redis);

    // Error handling
    redisClient.on('error', (err) => {
      logger.errorWithContext(err, { service: 'Redis' });
    });

    redisClient.on('connect', () => {
      logger.info('Redis connected successfully');
    });

    redisClient.on('ready', () => {
      logger.info('Redis client ready');
    });

    redisClient.on('end', () => {
      logger.info('Redis connection ended');
      redisClient = null;
    });

    await redisClient.connect();

    return redisClient;
  } catch (error) {
    logger.errorWithContext(error, { service: 'Redis', operation: 'connect' });
    throw error;
  }
};

const getRedisClient = () => {
  if (!redisClient) {
    throw new Error('Redis not connected. Call connectRedis() first.');
  }
  return redisClient;
};

const disconnectRedis = async() => {
  if (redisClient) {
    await redisClient.quit();
    redisClient = null;
    logger.info('Redis disconnected manually');
  }
};

// Health check methods
const checkMongoDBHealth = async() => {
  try {
    const connection = getMongoDBConnection();
    await connection.connection.db.admin().ping();
    return { status: 'healthy', latency: 0 };
  } catch (error) {
    return { status: 'unhealthy', error: error.message };
  }
};

const checkRedisHealth = async() => {
  try {
    const client = getRedisClient();
    const start = Date.now();
    await client.ping();
    const latency = Date.now() - start;
    return { status: 'healthy', latency };
  } catch (error) {
    return { status: 'unhealthy', error: error.message };
  }
};

module.exports = {
  connectMongoDB,
  getMongoDBConnection,
  disconnectMongoDB,
  connectRedis,
  getRedisClient,
  disconnectRedis,
  checkMongoDBHealth,
  checkRedisHealth,
};
