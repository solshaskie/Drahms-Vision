#!/usr/bin/env node

/**
 * 🔑 Drahms Vision - API Keys Setup Script
 * 
 * This script helps you set up your .env file with all 9 API keys
 * Run: node setup-api-keys.js
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const question = (query) => new Promise((resolve) => rl.question(query, resolve));

async function setupApiKeys() {
  console.log('🔭 Drahms Vision - API Keys Setup\n');
  console.log('This script will help you set up your .env file with all 9 API keys.\n');

  const envContent = `# 🔭 Drahms Vision - Environment Variables
# Generated on ${new Date().toISOString()}

# Server Configuration
NODE_ENV=development
PORT=3001
HOST=localhost

# Database (Optional - for future use)
MONGODB_URI=mongodb://localhost:27017/drahms-vision
REDIS_URL=redis://localhost:6379

# Security (Generate your own JWT secret)
JWT_SECRET=${generateRandomString(32)}
JWT_EXPIRES_IN=24h
BCRYPT_ROUNDS=12

# 🔍 GENERAL OBJECT APIs
GOOGLE_VISION_API_KEY=${await question('Enter your Google Vision API Key: ')}
IMAGGA_API_KEY=${await question('Enter your Imagga API Key: ')}
IMAGGA_API_SECRET=${await question('Enter your Imagga API Secret: ')}
CLOUDINARY_API_KEY=${await question('Enter your Cloudinary API Key: ')}
CLOUDINARY_API_SECRET=${await question('Enter your Cloudinary API Secret: ')}
ROBOFLOW_API_KEY=${await question('Enter your Roboflow API Key: ')}

# 🦅 BIRD APIs
EBIRD_API_KEY=${await question('Enter your eBird API Key: ')}
BIRDNET_API_KEY=birdnet_free

# 🌌 ASTRONOMY APIs
NASA_API_KEY=${await question('Enter your NASA API Key: ')}

# 🌤️ WEATHER APIs
OPENWEATHER_API_KEY=${await question('Enter your OpenWeather API Key: ')}

# 🌿 PLANT APIs
PLANTNET_API_KEY=${await question('Enter your PlantNet API Key: ')}
TREFLE_API_KEY=${await question('Enter your Trefle API Key: ')}
INATURALIST_API_KEY=${await question('Enter your iNaturalist API Key: ')}

# 🔍 ADDITIONAL APIs
WOLFRAM_API_KEY=wolfram_free
MERRIAM_API_KEY=merriam_free

# External Service URLs
OPENWEATHER_BASE_URL=https://api.openweathermap.org/data/2.5
NASA_BASE_URL=https://api.nasa.gov
EBIRD_BASE_URL=https://api.ebird.org/v2
PLANTNET_BASE_URL=https://my-api.plantnet.org
TREFLE_BASE_URL=https://trefle.io/api/v1

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# CORS
CORS_ORIGIN=*

# Logging
LOG_LEVEL=info

# File Upload
MAX_FILE_SIZE=10485760
ALLOWED_IMAGE_TYPES=image/jpeg,image/png,image/webp

# App Settings
APP_NAME=Drahms Vision
APP_VERSION=2.0.0
`;

  try {
    fs.writeFileSync('.env', envContent);
    console.log('\n✅ .env file created successfully!');
    console.log('🔒 Your API keys are now securely stored in the .env file');
    console.log('📝 Remember: Never commit the .env file to version control');
    console.log('\n🚀 You can now start the application with: npm start');
  } catch (error) {
    console.error('❌ Error creating .env file:', error.message);
  }

  rl.close();
}

function generateRandomString(length) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// Run the setup
setupApiKeys().catch(console.error);
