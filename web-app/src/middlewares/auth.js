const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const config = require('../config');
const logger = require('../utils/logger');
const { AuthenticationError, AuthorizationError } = require('./errorHandler');

// In-memory user store (replace with database in production)
/**
 * NOTE: This is a temporary in-memory store for development.
 * Replace with proper user model and database queries in production.
 */
const users = new Map();

// JWT middleware - authenticates requests
/**
 * Middleware to authenticate JWT tokens
 * Extracts and verifies JWT from Authorization header
 * Adds user information to req.user if valid
 *
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Next middleware function
 */
const authenticateToken = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      logger.warn('Authentication attempt without token', {
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        path: req.path,
      });
      return next(new AuthenticationError());
    }

    jwt.verify(token, config.security.jwt.secret, (error, decoded) => {
      if (error) {
        logger.warn('Invalid JWT token', {
          error: error.message,
          token: token.substring(0, 20) + '...', // Log partial token for debugging
          ip: req.ip,
          path: req.path,
        });

        if (error.name === 'TokenExpiredError') {
          return next(new AuthenticationError('Token expired'));
        }

        return next(new AuthenticationError('Invalid token'));
      }

      // Add decoded user info to request
      req.user = {
        id: decoded.id,
        username: decoded.username,
        email: decoded.email,
        role: decoded.role || 'user',
      };

      logger.audit('token_verified', req.user.id, 'authentication', {
        path: req.path,
        method: req.method,
        ip: req.ip,
      });

      next();
    });
  } catch (error) {
    logger.errorWithContext(error, {
      operation: 'authenticateToken',
      path: req.path,
      ip: req.ip,
    });
    next(new AuthenticationError('Authentication failed'));
  }
};

/**
 * Middleware to check if user has required role
 * Must be used after authenticateToken middleware
 *
 * @param {Array|string} roles - Required role(s) (string or array)
 * @returns {Function} - Express middleware function
 */
const requireRole = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new AuthenticationError('Authentication required'));
    }

    const userRole = req.user.role;
    const allowedRoles = Array.isArray(roles) ? roles : [roles];

    if (!allowedRoles.includes(userRole)) {
      logger.warn('Insufficient permissions', {
        userId: req.user.id,
        userRole,
        requiredRoles: allowedRoles,
        path: req.path,
      });

      return next(new AuthorizationError(
        `Role '${userRole}' does not have permission. Required: ${allowedRoles.join(', ')}`,
      ));
    }

    next();
  };
};

/**
 * Middleware for optional authentication
 * If token is present and valid, adds user to req.user
 * If no token or invalid token, continues without user context
 *
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Next middleware function
 */
const optionalAuth = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return next(); // Continue without user
    }

    jwt.verify(token, config.security.jwt.secret, (error, decoded) => {
      if (error) {
        // Token invalid but we don't fail - just continue without user
        logger.debug('Invalid token in optional auth', {
          error: error.message,
          path: req.path,
        });
        return next();
      }

      req.user = {
        id: decoded.id,
        username: decoded.username,
        email: decoded.email,
        role: decoded.role || 'user',
      };

      next();
    });
  } catch (error) {
    // Silently continue on error
    logger.debug('Optional auth error', {
      error: error.message,
      path: req.path,
    });
    next();
  }
};

/**
 * Hash password using bcrypt
 * @param {string} password - Plain text password
 * @returns {Promise<string>} - Hashed password
 */
const hashPassword = async(password) => {
  const saltRounds = config.security.bcrypt.rounds;
  return bcrypt.hash(password, saltRounds);
};

/**
 * Verify password against hash
 * @param {string} password - Plain text password
 * @param {string} hash - Hashed password
 * @returns {Promise<boolean>} - True if password matches
 */
const verifyPassword = async(password, hash) => {
  return bcrypt.compare(password, hash);
};

/**
 * Generate JWT token for user
 * @param {Object} user - User object with id, username, email, role
 * @returns {string} - Signed JWT token
 */
const generateToken = (user) => {
  const payload = {
    id: user.id,
    username: user.username,
    email: user.email,
    role: user.role || 'user',
  };

  return jwt.sign(payload, config.security.jwt.secret, {
    expiresIn: config.security.jwt.expiresIn,
    issuer: 'drahms-vision-api',
    audience: 'drahms-vision-users',
  });
};

/**
 * Generate secure refresh token
 * @param {Object} user - User object
 * @returns {string} - Refresh token
 */
const generateRefreshToken = (user) => {
  const payload = {
    id: user.id,
    type: 'refresh',
  };

  // Refresh tokens have longer expiration
  return jwt.sign(payload, config.security.jwt.secret, {
    expiresIn: '30d', // 30 days
    issuer: 'drahms-vision-api',
    audience: 'drahms-vision-refresh',
  });
};

/**
 * Register a new user (temporary in-memory implementation)
 * Replace with proper database operations in production
 *
 * @param {Object} userData - User registration data
 * @param {string} userData.username
 * @param {string} userData.email
 * @param {string} userData.password
 * @returns {Promise<Object>} - Created user object
 */
const registerUser = async(userData) => {
  const { username, email, password } = userData;

  // Check if user already exists
  for (const user of users.values()) {
    if (user.username === username || user.email === email) {
      throw new Error('User already exists');
    }
  }

  // Hash password
  const passwordHash = await hashPassword(password);

  // Create user
  const userId = Date.now().toString();
  const user = {
    id: userId,
    username,
    email,
    passwordHash,
    role: 'user',
    createdAt: new Date(),
    active: true,
  };

  users.set(userId, user);

  logger.audit('user_registered', userId, 'authentication', {
    username,
    email,
  });

  return {
    id: user.id,
    username: user.username,
    email: user.email,
    role: user.role,
    createdAt: user.createdAt,
  };
};

/**
 * Authenticate user login
 * @param {string} identifier - Username or email
 * @param {string} password - Plain text password
 * @returns {Promise<Object>} - User object if authenticated
 */
const authenticateUser = async(identifier, password) => {
  // Find user by username or email
  let user = null;
  for (const u of users.values()) {
    if (u.username === identifier || u.email === identifier) {
      user = u;
      break;
    }
  }

  if (!user) {
    logger.warn('Login attempt with unknown user', { identifier });
    throw new AuthenticationError('Invalid credentials');
  }

  if (!user.active) {
    logger.warn('Login attempt with inactive user', {
      userId: user.id,
      identifier,
    });
    throw new AuthenticationError('Account is disabled');
  }

  // Verify password
  const isValidPassword = await verifyPassword(password, user.passwordHash);
  if (!isValidPassword) {
    logger.warn('Login attempt with wrong password', {
      userId: user.id,
      identifier,
    });
    throw new AuthenticationError('Invalid credentials');
  }

  const userWithoutPassword = { ...user };
  delete userWithoutPassword.passwordHash;
  return userWithoutPassword;
};

/**
 * Get user by ID
 * @param {string} userId - User ID
 * @returns {Object|null} - User object or null if not found
 */
const getUserById = (userId) => {
  const user = users.get(userId);
  if (!user) return null;

  const userWithoutPassword = { ...user };
  delete userWithoutPassword.passwordHash;
  return userWithoutPassword;
};

module.exports = {
  authenticateToken,
  requireRole,
  optionalAuth,
  hashPassword,
  verifyPassword,
  generateToken,
  generateRefreshToken,
  registerUser,
  authenticateUser,
  getUserById,
  users, // Exported for testing purposes
};
