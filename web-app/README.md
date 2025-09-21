# Drahms Vision - Astronomy Camera System

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/Node.js-18+-brightgreen)](https://nodejs.org/)
[![Docker](https://img.shields.io/badge/Docker-Ready-blue)](https://docker.com/)

A production-ready, AI-powered astronomy and wildlife photography system featuring real-time camera control, celestial object tracking, and multi-API identification across 23+ identification services.

> **🔭 Professional-grade astronomy platform** - Bringing the universe closer, one photograph at a time.

## 🌟 Features

### 📸 **Real-time Camera Control**
- Professional-grade camera configuration (Samsung A25 series)
- Live video streaming with WebSocket support
- Advanced controls: ISO, shutter speed, white balance, focus modes
- Motion detection and automated tracking

### 🤖 **AI-Powered Object Identification**
- **23+ API integrations** for comprehensive identification
- **Google Vision API** (Primary visual recognition)
- **eBird API** (Bird species identification)
- **PlantNet** (Plant recognition)
- **iNaturalist** (Wildlife database)
- **NASA APIs** (Astronomical objects)
- **Multi-API redundancy** with confidence scoring

### 🌌 **Celestial Overlay System**
- Real-time sky mapping with AR overlays
- Celestial object tracking (planets, stars, constellations)
- Location-based visibility calculations
- Interactive star charts with zoom/pan

### 🎯 **Wildlife Photography**
- Motion-triggered capture
- AI-assisted species identification
- Automatic focus locking
- Gallery management with metadata

### 🔒 **Security & Reliability**
- **JWT authentication** with secure sessions
- **Rate limiting** and DDoS protection
- **Input validation** with Joi schemas
- **Helmet.js** security headers
- **Database encryption** for sensitive data
- **Health monitoring** with circuit breakers

## 🚀 Quick Start

### Prerequisites

- **Node.js 18+** and **npm**
- **MongoDB** (local or cloud instance)
- **Redis** (local or cloud instance)
- **Docker** (optional, for containerized deployment)

### 1. Clone & Install

```bash
git clone https://github.com/your-org/drahms-vision.git
cd drahms-vision/web-app
npm install
```

### 2. Environment Setup

Copy the example environment file and configure your settings:

```bash
cp .env.example .env
```

Edit `.env` with your configuration:

```env
# Server Configuration
NODE_ENV=development
PORT=3001
HOST=localhost

# Database
MONGODB_URI=mongodb://localhost:27017/drahms_vision
REDIS_URL=redis://localhost:6379

# Security (Required)
JWT_SECRET=your-secure-jwt-secret-here

# API Keys (Replace with real keys)
GOOGLE_VISION_API_KEY=your-google-api-key
EBIRD_API_KEY=your-ebird-api-key
```

### 3. Database Setup

Start MongoDB and Redis services:

```bash
# Using Docker (recommended)
docker run -d -p 27017:27017 --name mongodb mongo:latest
docker run -d -p 6379:6379 --name redis redis:alpine

# Or using local installations
mongod  # Terminal 1
redis-server  # Terminal 2
```

### 4. Start Development Server

```bash
# Development mode with hot reload
npm run dev

# Production mode
npm run build
npm start
```

Visit `http://localhost:3001` to access the application.

## 🐳 Docker Deployment

### Build & Run with Docker Compose

```bash
# Clone the repository
git clone https://github.com/your-org/drahms-vision.git
cd drahms-vision

# Start all services
docker-compose up -d

# Or build individually
cd web-app
docker build -t drahms-vision .
docker run -p 3001:3001 --env-file .env drahms-vision
```

## 🛠️ Development

### Available Scripts

```bash
# Development
npm run dev          # Start with nodemon
npm run build        # Run tests and lint
npm start           # Production server

# Quality & Testing
npm run test         # Run Jest tests
npm run test:watch   # Watch mode tests
npm run test:cov     # Coverage report
npm run lint         # ESLint check
npm run lint:fix     # Auto-fix linting issues

# Docker
npm run docker:build # Build Docker image
npm run docker:run   # Run Docker container
```

### Project Structure

```
web-app/
├── src/
│   ├── config/           # Environment & app configuration
│   ├── controllers/      # Route handlers (API endpoints)
│   ├── middlewares/      # Express middlewares
│   ├── models/           # MongoDB schemas
│   ├── routes/           # API route definitions
│   ├── services/         # Business logic & external APIs
│   ├── utils/            # Utility functions
│   ├── validation/       # Input validation schemas
│   └── index.js          # Application entry point
├── public/               # Static assets
│   ├── index.html        # Main UI
│   ├── styles.css        # CSS stylesheets
│   └── js/               # Client-side JavaScript
├── tests/                # Test files
├── .env.example          # Environment template
├── docker-compose.yml    # Docker services
├── Dockerfile           # Container definition
├── package.json         # Dependencies & scripts
└── README.md           # This file
```

### Key Technologies

- **Backend**: Node.js, Express.js
- **Database**: MongoDB, Redis
- **Real-time**: Socket.IO
- **Security**: Helmet, JWT, bcrypt
- **Validation**: Joi
- **Testing**: Jest, Supertest
- **Deployment**: Docker, PM2

## 🔧 Configuration

### Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `NODE_ENV` | No | `development` | Environment mode |
| `PORT` | No | `3001` | Server port |
| `HOST` | No | `localhost` | Server host |
| `MONGODB_URI` | Yes | - | MongoDB connection string |
| `REDIS_URL` | Yes | - | Redis connection URL |
| `JWT_SECRET` | Yes | - | JWT signing secret |
| `GOOGLE_VISION_API_KEY` | Yes | - | Google Vision API key |
| `EBIRD_API_KEY` | Yes | - | eBird API token |

### API Rate Limits

- **General API**: 100 requests per 15 minutes
- **File uploads**: 10 per 15 minutes
- **Authentication**: 10 attempts per minute

### Security Headers

The application implements security headers via Helmet.js:
- Content Security Policy (CSP)
- HSTS (HTTP Strict Transport Security)
- X-Frame-Options
- X-Content-Type-Options
- XSS Protection

## 📋 API Reference

### Health Check
```http
GET /api/health
```

Response:
```json
{
  "status": "healthy",
  "timestamp": "2025-09-19T17:30:48.000Z",
  "version": "2.0.0",
  "services": {
    "mongodb": { "status": "healthy", "latency": 12 },
    "redis": { "status": "healthy", "latency": 2 }
  }
}
```

### Authentication Endpoints
```http
POST /api/auth/login
POST /api/auth/register
POST /api/auth/logout
GET  /api/auth/me
```

### Camera Control
```http
POST /api/camera/connect
POST /api/camera/capture
GET  /api/camera/status
POST /api/camera/settings
```

### Object Identification
```http
POST /api/identify/googlelens
POST /api/identify/ebird
POST /api/identify/inaturalist
POST /api/identify/plantnet
```

## 🔒 Security

### Authentication & Authorization
- **JWT-based authentication** with secure refresh tokens
- **Role-based access control** (RBAC)
- **Session management** with automatic timeout
- **Password hashing** with bcrypt (12 rounds)

### Data Protection
- **API keys encryption** at rest
- **TLS/HTTPS enforcement** in production
- **Input sanitization** and validation
- **SQL injection prevention** via parameterized queries

### Security Headers
```javascript
{
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "https://fonts.googleapis.com"],
      // ... additional directives
    }
  },
  hsts: { maxAge: 31536000, includeSubDomains: true }
}
```

## 🧪 Testing

### Running Tests

```bash
# All tests with coverage
npm run test:cov

# Unit tests only
npm run test -- --testPathPattern=unit

# Integration tests
npm run test -- --testPathPattern=integration

# E2E tests (requires running app)
npm run test -- --testPathPattern=e2e
```

### Test Structure

```
tests/
├── unit/              # Unit tests
├── integration/       # Integration tests
├── e2e/              # End-to-end tests
├── fixtures/         # Test data
├── helpers/          # Test utilities
└── setup.js          # Test configuration
```

## 📊 Monitoring & Logging

### Health Monitoring
- **Application health**: `/api/health`
- **Database connectivity**: Automatic ping checks
- **External API status**: Circuit breaker pattern
- **Memory usage**: Process monitoring

### Logging
- **Winston logger** with structured JSON output
- **Log levels**: error, warn, info, debug
- **Request tracking** with correlation IDs
- **Performance monitoring** with response times

### Metrics
- Response times and throughput
- Error rates by endpoint
- Database query performance
- Cache hit/miss ratios

## 🔧 Troubleshooting

### Common Issues

**MongoDB Connection Failed**
```bash
# Check if MongoDB is running
docker ps | grep mongo

# Start MongoDB container
docker run -d -p 27017:27017 mongo:latest
```

**Redis Connection Error**
```bash
# Check Redis status
redis-cli ping

# Start Redis container
docker run -d -p 6379:6379 redis:alpine
```

**Port Already in Use**
```bash
# Find process using port 3001
netstat -ano | findstr :3001

# Kill process (Windows)
taskkill /PID <process_id> /F
```

### Development Tips

- Use `npm run dev` for automatic restarts
- Check logs with `tail -f logs/combined.log`
- Use Postman for API testing
- Install React DevTools for debugging

## 🤝 Contributing

1. **Fork** the repository
2. **Create** a feature branch: `git checkout -b feature/your-feature`
3. **Write** tests for new functionality
4. **Commit** changes: `git commit -am 'Add your feature'`
5. **Push** to branch: `git push origin feature/your-feature`
6. **Submit** a Pull Request

### Development Guidelines

- Follow **ESLint** configuration
- Add **JSDoc** comments for functions
- Write **unit tests** for new features
- Update **documentation** for API changes
- Use **conventional commits**

### Code Style

```javascript
// Use semicolons
// 2-space indentation
// Single quotes for strings
// Named exports preferred
// Async/await over promises
```

## 📄 License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Google Cloud Vision** for AI-powered image recognition
- **eBird** for comprehensive bird species data
- **NASA** for astronomical data and APIs
- **iNaturalist** for naturalist observations
- **Open-source community** for amazing packages

## 📞 Support

### Getting Help

- **Documentation**: [GitHub Wiki](https://github.com/your-org/drahms-vision/wiki)
- **Issues**: [GitHub Issues](https://github.com/your-org/drahms-vision/issues)
- **Discussions**: [GitHub Discussions](https://github.com/your-org/drahms-vision/discussions)
- **Email**: support@drahms-vision.com

### Contributing to Support

Help improve the documentation by:
- Reporting bugs and issues
- Suggesting new features
- Improving documentation
- Sharing usage examples

---

**Built with ❤️ for astronomy and wildlife enthusiasts worldwide**

*Stargazing never looked so good.* ✨
