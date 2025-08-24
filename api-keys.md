# API Keys Setup Guide

## Google Lens API (Google Cloud Vision API)

### 1. Get Google Cloud Vision API Key
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable the **Cloud Vision API**
4. Go to **APIs & Services > Credentials**
5. Click **Create Credentials > API Key**
6. Copy your API key

### 2. Set Environment Variable
```bash
# Windows
set GOOGLE_VISION_API_KEY=your_api_key_here

# Linux/Mac
export GOOGLE_VISION_API_KEY=your_api_key_here
```

### 3. Usage Limits
- **Free Tier**: 1,000 requests/month
- **Paid**: $1.50 per 1,000 requests
- **Rate Limit**: 1,800 requests/minute

## eBird API 2.0

### 1. Get eBird API Key
1. Go to [eBird API Registration](https://ebird.org/api/keygen)
2. Sign in with your eBird account
3. Accept the terms of service
4. Copy your API key

### 2. Set Environment Variable
```bash
# Windows
set EBIRD_API_KEY=your_api_key_here

# Linux/Mac
export EBIRD_API_KEY=your_api_key_here
```

### 3. Usage Limits
- **Free Tier**: 10,000 requests/day
- **Rate Limit**: 10 requests/second

## Environment Variables File (.env)

Create a `.env` file in the project root:

```env
# Google Cloud Vision API
GOOGLE_VISION_API_KEY=your_google_vision_api_key_here

# eBird API 2.0
EBIRD_API_KEY=your_ebird_api_key_here

# Server Configuration
PORT=3000
NODE_ENV=development
```

## Testing API Keys

### Test Google Vision API
```bash
curl -X POST \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "requests": [
      {
        "image": {
          "source": {
            "imageUri": "https://example.com/test-image.jpg"
          }
        },
        "features": [
          {
            "type": "LABEL_DETECTION",
            "maxResults": 5
          }
        ]
      }
    ]
  }' \
  https://vision.googleapis.com/v1/images:annotate
```

### Test eBird API
```bash
curl -H "X-eBirdApiToken: YOUR_API_KEY" \
  "https://api.ebird.org/v2/ref/taxonomy/ebird?fmt=json"
```

## Security Notes

1. **Never commit API keys to version control**
2. **Use environment variables**
3. **Rotate keys regularly**
4. **Monitor usage to avoid charges**

## Cost Estimation

### Google Vision API
- **Free Tier**: 1,000 requests/month
- **Typical Usage**: ~100-500 requests/month for astronomy app
- **Estimated Cost**: $0-2/month

### eBird API
- **Free Tier**: 10,000 requests/day
- **Typical Usage**: ~50-200 requests/day for bird identification
- **Estimated Cost**: $0/month (well within free tier)

## Integration Status

- [ ] Google Vision API key obtained
- [ ] eBird API key obtained
- [ ] Environment variables configured
- [ ] API endpoints tested
- [ ] Integration implemented
- [ ] Error handling added
- [ ] Rate limiting implemented
