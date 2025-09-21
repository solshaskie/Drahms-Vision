// NASA Image Proxy Server
// This runs alongside the main server to proxy NASA images and bypass CORS

const express = require('express');
const fetch = require('node-fetch');
const path = require('path');

const proxyApp = express();
const PORT = 3002;

// Enable CORS for all routes
proxyApp.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    next();
});

// Proxy NASA images
proxyApp.get('/nasa-image', async (req, res) => {
    try {
        const imageUrl = req.query.url;
        
        if (!imageUrl) {
            return res.status(400).json({ error: 'Image URL required' });
        }
        
        console.log(`Proxying NASA image: ${imageUrl}`);
        
        const response = await fetch(imageUrl);
        
        if (!response.ok) {
            return res.status(response.status).json({ error: 'Failed to fetch image' });
        }
        
        const contentType = response.headers.get('content-type') || 'image/jpeg';
        const buffer = await response.buffer();
        
        res.set('Content-Type', contentType);
        res.set('Cache-Control', 'public, max-age=3600'); // Cache for 1 hour
        res.send(buffer);
        
    } catch (error) {
        console.error('Proxy error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Health check
proxyApp.get('/health', (req, res) => {
    res.json({ status: 'OK', service: 'NASA Image Proxy' });
});

proxyApp.listen(PORT, () => {
    console.log(`🖼️  NASA Image Proxy running on port ${PORT}`);
    console.log(`📡 Use: http://localhost:${PORT}/nasa-image?url=IMAGE_URL`);
});

module.exports = proxyApp;
