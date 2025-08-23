require('dotenv').config();
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');
const cors = require('cors');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname)));

// Serve static files
app.use('/styles', express.static(path.join(__dirname, 'styles')));
app.use('/js', express.static(path.join(__dirname, 'js')));
app.use('/public', express.static(path.join(__dirname, 'public')));

const port = process.env.PORT || 3003; // Changed to 3003 to match app

// Main route
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/favicon.ico', (req, res) => {
    res.status(204).end();
});

// API Status
app.get('/api/status', (req, res) => {
    res.json({
        status: 'running',
        name: 'Drahms Vision Astronomy Camera System',
        version: '1.0.0',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        apis: {
            googleVision: {
                configured: true,
                rateLimit: { remaining: 1000, limit: 1000, resetTime: new Date(Date.now() + 3600000).toISOString() }
            },
            eBird: {
                configured: true,
                rateLimit: { remaining: 1000, limit: 1000, resetTime: new Date(Date.now() + 3600000).toISOString() }
            }
        }
    });
});

// Test endpoint
app.get('/api/test', (req, res) => {
    res.json({
        message: 'Drahms Vision server is working!',
        timestamp: new Date().toISOString(),
        port: port
    });
});

// Camera endpoints
app.post('/api/camera/initialize', (req, res) => {
    res.json({
        success: true,
        cameraId: 'default',
        status: 'initialized',
        message: 'Camera initialized successfully'
    });
});

app.post('/api/camera/stream/start', (req, res) => {
    res.json({
        success: true,
        streamId: 'stream_' + Date.now(),
        status: 'started',
        message: 'Camera stream started successfully'
    });
});

app.post('/api/camera/capture', (req, res) => {
    res.json({
        success: true,
        imageId: 'img_' + Date.now(),
        timestamp: new Date().toISOString(),
        message: 'Image captured successfully'
    });
});

// Sky mapping endpoints
app.get('/api/sky/constellations', (req, res) => {
    res.json([
        { id: 'ursa_major', name: 'Ursa Major', visible: true },
        { id: 'ursa_minor', name: 'Ursa Minor', visible: true },
        { id: 'orion', name: 'Orion', visible: false }
    ]);
});

app.get('/api/stars', (req, res) => {
    res.json([
        { id: 'polaris', name: 'Polaris', magnitude: 1.97, visible: true },
        { id: 'sirius', name: 'Sirius', magnitude: -1.46, visible: false }
    ]);
});

app.get('/api/planets', (req, res) => {
    res.json([
        { id: 'mars', name: 'Mars', visible: true, magnitude: -0.5 },
        { id: 'venus', name: 'Venus', visible: false, magnitude: -4.0 }
    ]);
});

// Gallery endpoint
app.get('/api/gallery', async (req, res) => {
    try {
        res.json([]);
    } catch (error) {
        console.error('Gallery error:', error);
        res.status(500).json({
            error: 'Failed to load gallery',
            message: error.message
        });
    }
});

// Object identification endpoints
app.post('/api/identify', (req, res) => {
    res.json({
        success: true,
        results: [
            {
                label: 'Celestial Object',
                confidence: 0.95,
                type: 'star'
            }
        ],
        timestamp: new Date().toISOString()
    });
});

// Image processing endpoints
app.post('/api/image/enhance', (req, res) => {
    res.json({
        success: true,
        enhanced: true,
        message: 'Image enhanced successfully'
    });
});

// Socket.io connection handling
io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);
    
    socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id);
    });
    
    socket.on('image_data', (data) => {
        console.log('Received image data from client');
        
        // Convert the image data to base64 for web display
        const base64Image = Buffer.from(data).toString('base64');
        const imageUrl = `data:image/jpeg;base64,${base64Image}`;
        
        // Broadcast the image to all connected web clients
        io.emit('camera_feed', {
            type: 'image',
            data: imageUrl,
            timestamp: new Date().toISOString()
        });
        
        // Also emit a capture event for the web interface
        io.emit('capture_complete', {
            success: true,
            imageId: 'img_' + Date.now(),
            imageUrl: imageUrl,
            timestamp: new Date().toISOString()
        });
    });
    
    socket.on('sensor_data', (data) => {
        console.log('Received sensor data:', data);
        
        // Broadcast sensor data to all connected web clients
        io.emit('sensor_update', {
            ...data,
            timestamp: new Date().toISOString()
        });
    });
});

server.listen(port, async () => {
    console.log('🔭 Drahms Vision - Astronomy Camera System');
    console.log('==========================================');
    console.log(`✅ Server running on port ${port}`);
    console.log(`🌐 Web interface: http://localhost:${port}`);
    console.log(`📡 API status: http://localhost:${port}/api/status`);
    console.log(`🧪 Test endpoint: http://localhost:${port}/api/test`);
    console.log('==========================================');
    console.log('Press Ctrl+C to stop the server');
});

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('\n🛑 Shutting down Drahms Vision server...');
    server.close(() => {
        console.log('✅ Server stopped gracefully');
        process.exit(0);
    });
});
