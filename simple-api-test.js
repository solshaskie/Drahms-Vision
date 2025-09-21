#!/usr/bin/env node

/**
 * 🧪 Simple API Keys Test - No Dependencies Required
 * 
 * This script checks if your .env file exists and has the required API keys
 */

const fs = require('fs');
const path = require('path');

function testApiKeys() {
  console.log('🧪 Drahms Vision - Simple API Keys Test\n');

  // Check if .env file exists
  const envPath = path.join(__dirname, '.env');
  if (!fs.existsSync(envPath)) {
    console.log('❌ .env file not found!');
    console.log('📝 Please create a .env file using the template:');
    console.log('   copy api-keys-template.txt .env');
    console.log('   Then edit .env with your actual API keys');
    return;
  }

  console.log('✅ .env file found!');

  // Read .env file
  const envContent = fs.readFileSync(envPath, 'utf8');
  const lines = envContent.split('\n');

  // Required API keys
  const requiredKeys = [
    'GOOGLE_VISION_API_KEY',
    'EBIRD_API_KEY', 
    'NASA_API_KEY',
    'OPENWEATHER_API_KEY',
    'PLANTNET_API_KEY',
    'TREFLE_API_KEY',
    'IMAGGA_API_KEY',
    'IMAGGA_API_SECRET',
    'CLOUDINARY_API_KEY',
    'CLOUDINARY_API_SECRET',
    'ROBOFLOW_API_KEY'
  ];

  // Optional API keys
  const optionalKeys = [
    'INATURALIST_API_KEY'
  ];

  console.log('\n🔍 Checking API Keys...\n');

  let requiredCount = 0;
  let optionalCount = 0;

  // Check required keys
  console.log('📋 Required API Keys:');
  requiredKeys.forEach(key => {
    const line = lines.find(l => l.startsWith(key + '='));
    if (line && !line.includes('your_') && !line.includes('_here')) {
      console.log(`✅ ${key}: Configured`);
      requiredCount++;
    } else {
      console.log(`❌ ${key}: Not configured`);
    }
  });

  console.log('\n📋 Optional API Keys:');
  optionalKeys.forEach(key => {
    const line = lines.find(l => l.startsWith(key + '='));
    if (line && !line.includes('your_') && !line.includes('_here')) {
      console.log(`✅ ${key}: Configured`);
      optionalCount++;
    } else {
      console.log(`⚠️  ${key}: Not configured (optional)`);
    }
  });

  console.log('\n📊 Summary:');
  console.log(`✅ Required: ${requiredCount}/${requiredKeys.length}`);
  console.log(`⚠️  Optional: ${optionalCount}/${optionalKeys.length}`);

  if (requiredCount === requiredKeys.length) {
    console.log('\n🎉 All required API keys are configured!');
    console.log('🚀 You can now start the application:');
    console.log('   cd web-app && npm start');
  } else {
    console.log('\n⚠️  Some required API keys are missing.');
    console.log('📝 Please edit your .env file and add the missing keys.');
  }

  // Check for iNaturalist specifically
  const inaturalistLine = lines.find(l => l.startsWith('INATURALIST_API_KEY='));
  if (!inaturalistLine || inaturalistLine.includes('your_')) {
    console.log('\n💡 About iNaturalist API:');
    console.log('   - It\'s optional and not required for basic functionality');
    console.log('   - You can get it later if you want enhanced plant/animal identification');
    console.log('   - The app will work fine without it');
  }
}

// Run the test
testApiKeys();
