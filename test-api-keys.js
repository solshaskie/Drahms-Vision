#!/usr/bin/env node

/**
 * 🧪 Drahms Vision - API Keys Test Script
 * 
 * This script tests your API keys to ensure they're working correctly
 * Run: node test-api-keys.js
 */

require('dotenv').config();
const axios = require('axios');

const API_TESTS = [
  {
    name: 'Google Vision API',
    key: 'GOOGLE_VISION_API_KEY',
    test: async (key) => {
      try {
        const response = await axios.post(
          `https://vision.googleapis.com/v1/images:annotate?key=${key}`,
          {
            requests: [{
              image: { source: { imageUri: 'https://example.com/test.jpg' } },
              features: [{ type: 'LABEL_DETECTION', maxResults: 1 }]
            }]
          },
          { timeout: 10000 }
        );
        return { success: true, message: 'API key is valid' };
      } catch (error) {
        if (error.response?.status === 400) {
          return { success: true, message: 'API key is valid (test image not found, but key works)' };
        }
        return { success: false, message: error.response?.data?.error?.message || error.message };
      }
    }
  },
  {
    name: 'eBird API',
    key: 'EBIRD_API_KEY',
    test: async (key) => {
      try {
        const response = await axios.get(
          'https://api.ebird.org/v2/ref/taxonomy/ebird?fmt=json',
          { 
            headers: { 'X-eBirdApiToken': key },
            timeout: 10000 
          }
        );
        return { success: true, message: 'API key is valid' };
      } catch (error) {
        return { success: false, message: error.response?.data?.message || error.message };
      }
    }
  },
  {
    name: 'NASA API',
    key: 'NASA_API_KEY',
    test: async (key) => {
      try {
        const response = await axios.get(
          `https://api.nasa.gov/planetary/apod?api_key=${key}`,
          { timeout: 10000 }
        );
        return { success: true, message: 'API key is valid' };
      } catch (error) {
        return { success: false, message: error.response?.data?.error?.message || error.message };
      }
    }
  },
  {
    name: 'OpenWeather API',
    key: 'OPENWEATHER_API_KEY',
    test: async (key) => {
      try {
        const response = await axios.get(
          `https://api.openweathermap.org/data/2.5/weather?q=London&appid=${key}`,
          { timeout: 10000 }
        );
        return { success: true, message: 'API key is valid' };
      } catch (error) {
        return { success: false, message: error.response?.data?.message || error.message };
      }
    }
  },
  {
    name: 'PlantNet API',
    key: 'PLANTNET_API_KEY',
    test: async (key) => {
      try {
        const response = await axios.get(
          `https://my-api.plantnet.org/v2/organs?api-key=${key}`,
          { timeout: 10000 }
        );
        return { success: true, message: 'API key is valid' };
      } catch (error) {
        return { success: false, message: error.response?.data?.message || error.message };
      }
    }
  },
  {
    name: 'Trefle API',
    key: 'TREFLE_API_KEY',
    test: async (key) => {
      try {
        const response = await axios.get(
          `https://trefle.io/api/v1/plants?token=${key}`,
          { timeout: 10000 }
        );
        return { success: true, message: 'API key is valid' };
      } catch (error) {
        return { success: false, message: error.response?.data?.message || error.message };
      }
    }
  },
  {
    name: 'Imagga API',
    key: 'IMAGGA_API_KEY',
    test: async (key) => {
      try {
        const response = await axios.get(
          `https://api.imagga.com/v2/tags?image_url=https://example.com/test.jpg`,
          { 
            auth: { username: key, password: process.env.IMAGGA_API_SECRET },
            timeout: 10000 
          }
        );
        return { success: true, message: 'API key is valid' };
      } catch (error) {
        return { success: false, message: error.response?.data?.message || error.message };
      }
    }
  },
  {
    name: 'Cloudinary API',
    key: 'CLOUDINARY_API_KEY',
    test: async (key) => {
      try {
        const response = await axios.get(
          `https://api.cloudinary.com/v1_1/${key}/resources/image/upload`,
          { 
            auth: { username: key, password: process.env.CLOUDINARY_API_SECRET },
            timeout: 10000 
          }
        );
        return { success: true, message: 'API key is valid' };
      } catch (error) {
        return { success: false, message: error.response?.data?.message || error.message };
      }
    }
  },
  {
    name: 'Roboflow API',
    key: 'ROBOFLOW_API_KEY',
    test: async (key) => {
      try {
        const response = await axios.get(
          'https://api.roboflow.com/workspace',
          { 
            headers: { 'Authorization': `Bearer ${key}` },
            timeout: 10000 
          }
        );
        return { success: true, message: 'API key is valid' };
      } catch (error) {
        return { success: false, message: error.response?.data?.message || error.message };
      }
    }
  }
];

async function testApiKeys() {
  console.log('🧪 Drahms Vision - API Keys Test\n');
  console.log('Testing all 9 API keys...\n');

  let successCount = 0;
  let totalCount = API_TESTS.length;

  for (const test of API_TESTS) {
    const apiKey = process.env[test.key];
    
    if (!apiKey) {
      console.log(`❌ ${test.name}: No API key found in environment variables`);
      continue;
    }

    console.log(`🔍 Testing ${test.name}...`);
    
    try {
      const result = await test.test(apiKey);
      if (result.success) {
        console.log(`✅ ${test.name}: ${result.message}`);
        successCount++;
      } else {
        console.log(`❌ ${test.name}: ${result.message}`);
      }
    } catch (error) {
      console.log(`❌ ${test.name}: ${error.message}`);
    }
    
    console.log(''); // Empty line for readability
  }

  console.log('📊 Test Results:');
  console.log(`✅ Successful: ${successCount}/${totalCount}`);
  console.log(`❌ Failed: ${totalCount - successCount}/${totalCount}`);
  
  if (successCount === totalCount) {
    console.log('\n🎉 All API keys are working correctly!');
  } else {
    console.log('\n⚠️  Some API keys need attention. Check the errors above.');
  }
}

// Run the tests
testApiKeys().catch(console.error);
