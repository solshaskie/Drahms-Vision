require('dotenv').config();

const Joi = require('joi');

const envSchema = Joi.object({
  NODE_ENV: Joi.string().valid('development', 'production', 'test').default('development'),
  PORT: Joi.number().default(3001),
  HOST: Joi.string().default('localhost'),

  // Database
  MONGODB_URI: Joi.string().required(),
  REDIS_URL: Joi.string().required(),

  // Security
  JWT_SECRET: Joi.string().required(),
  JWT_EXPIRES_IN: Joi.string().default('24h'),
  BCRYPT_ROUNDS: Joi.number().default(12),

  // API Keys
  GOOGLE_VISION_API_KEY: Joi.string().required(),
  EBIRD_API_KEY: Joi.string().required(),
  OPENWEATHER_API_KEY: Joi.string(),
  NASA_API_KEY: Joi.string(),
  PLANTNET_API_KEY: Joi.string(),
  TREFLE_API_KEY: Joi.string(),
  INATURALIST_API_KEY: Joi.string(),
  IMAGGA_API_KEY: Joi.string(),
  IMAGGA_API_SECRET: Joi.string(),
  CLOUDINARY_API_KEY: Joi.string(),
  CLOUDINARY_API_SECRET: Joi.string(),
  ROBOFLOW_API_KEY: Joi.string(),
  BIRDNET_API_KEY: Joi.string(),

  // External Services
  OPENWEATHER_BASE_URL: Joi.string().default('https://api.openweathermap.org/data/2.5'),
  NASA_BASE_URL: Joi.string().default('https://api.nasa.gov'),
  EBIRD_BASE_URL: Joi.string().default('https://api.ebird.org/v2'),
  PLANTNET_BASE_URL: Joi.string().default('https://my-api.plantnet.org'),
  TREFLE_BASE_URL: Joi.string().default('https://trefle.io/api/v1'),

  // Rate Limiting
  RATE_LIMIT_WINDOW_MS: Joi.number().default(900000), // 15 minutes
  RATE_LIMIT_MAX_REQUESTS: Joi.number().default(100),

  // CORS
  CORS_ORIGIN: Joi.string().default('*'),

  // Logging
  LOG_LEVEL: Joi.string().valid('error', 'warn', 'info', 'debug').default('info'),

  // File Upload
  MAX_FILE_SIZE: Joi.number().default(10 * 1024 * 1024), // 10MB
  ALLOWED_IMAGE_TYPES: Joi.string().default('image/jpeg,image/png,image/webp'),

  // App Settings
  APP_NAME: Joi.string().default('Drahms Vision'),
  APP_VERSION: Joi.string().default('2.0.0'),

}).unknown(true);

const { error, value: envVars } = envSchema.validate(process.env, { stripUnknown: true });

if (error) {
  throw new Error(`Config validation error: ${error.message}`);
}

module.exports = {
  env: envVars.NODE_ENV,
  port: envVars.PORT,
  host: envVars.HOST,

  database: {
    mongodb: {
      uri: envVars.MONGODB_URI,
      options: {
        maxPoolSize: 10,
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
      },
    },
    redis: {
      url: envVars.REDIS_URL,
      options: {
        maxRetriesPerRequest: 3,
        retryDelayOnFailover: 100,
      },
    },
  },

  security: {
    jwt: {
      secret: envVars.JWT_SECRET,
      expiresIn: envVars.JWT_EXPIRES_IN,
    },
    bcrypt: {
      rounds: envVars.BCRYPT_ROUNDS,
    },
    cors: {
      origin: envVars.NODE_ENV === 'production'
        ? envVars.CORS_ORIGIN.split(',') || [envVars.CORS_ORIGIN]
        : envVars.CORS_ORIGIN,
      credentials: true,
    },
  },

  apiKeys: {
    googleVision: envVars.GOOGLE_VISION_API_KEY,
    ebird: envVars.EBIRD_API_KEY,
    openweather: envVars.OPENWEATHER_API_KEY,
    nasa: envVars.NASA_API_KEY,
    plantnet: envVars.PLANTNET_API_KEY,
    trefle: envVars.TREFLE_API_KEY,
    inaturalist: envVars.INATURALIST_API_KEY,
    imagga: {
      key: envVars.IMAGGA_API_KEY,
      secret: envVars.IMAGGA_API_SECRET,
    },
    cloudinary: {
      key: envVars.CLOUDINARY_API_KEY,
      secret: envVars.CLOUDINARY_API_SECRET,
    },
    roboflow: envVars.ROBOFLOW_API_KEY,
    birdnet: envVars.BIRDNET_API_KEY,
  },

  externalApis: {
    openweather: {
      baseUrl: envVars.OPENWEATHER_BASE_URL,
      timeout: 10000,
    },
    nasa: {
      baseUrl: envVars.NASA_BASE_URL,
      timeout: 30000,
    },
    ebird: {
      baseUrl: envVars.EBIRD_BASE_URL,
      timeout: 15000,
    },
    plantnet: {
      baseUrl: envVars.PLANTNET_BASE_URL,
      timeout: 20000,
    },
    trefle: {
      baseUrl: envVars.TREFLE_BASE_URL,
      timeout: 15000,
    },
  },

  rateLimit: {
    windowMs: envVars.RATE_LIMIT_WINDOW_MS,
    max: envVars.RATE_LIMIT_MAX_REQUESTS,
  },

  logging: {
    level: envVars.LOG_LEVEL,
    format: envVars.NODE_ENV === 'production' ? 'json' : 'simple',
  },

  fileUpload: {
    maxSize: envVars.MAX_FILE_SIZE,
    allowedTypes: envVars.ALLOWED_IMAGE_TYPES.split(','),
  },

  app: {
    name: envVars.APP_NAME,
    version: envVars.APP_VERSION,
  },
};
