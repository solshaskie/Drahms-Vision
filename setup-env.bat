@echo off
echo 🔭 Drahms Vision - Environment Setup
echo.
echo This script will help you create your .env file
echo.
echo Step 1: Copy the template file
copy api-keys-template.txt .env
echo.
echo ✅ .env file created!
echo.
echo Step 2: Edit the .env file
echo - Open .env in your text editor
echo - Replace each "your_api_key_here" with your actual API key
echo - Save the file
echo.
echo Step 3: Test your API keys
echo - Run: node test-api-keys.js
echo.
echo Step 4: Start the application
echo - Run: cd web-app && npm start
echo.
pause
