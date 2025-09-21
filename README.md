# 🔭 Drahms Vision - Astronomy Camera System

A professional-grade astronomy and wildlife photography system with real-time camera control, AI-powered object identification, and seamless web-mobile integration.

## 🌟 Features

### 📱 **Android App (Remote Camera)**
- **Real-time camera control** with zoom, focus, and exposure adjustment
- **Live video streaming** to web interface
- **Motion detection** and object tracking
- **Sensor data transmission** (gyroscope, accelerometer, magnetometer)
- **Photo/video capture** with automatic upload to web interface
- **Background service** for continuous operation

### 🌐 **Web App (Base Station)**
- **Live camera feed** from Android device
- **23 Free AI APIs** for object identification (including Google Lens)
- **Real-time sky mapping** with celestial object tracking
- **Image editing tools** with professional-grade features
- **Motion detection** and wildlife tracking
- **Gallery management** with local storage
- **Dark astronomy-themed UI** optimized for night photography

### 🤖 **AI-Powered Identification**
- **Google Lens API** (Priority 1 - General objects)
- **Bird identification**: eBird, BirdNET, XenoCanto
- **Insect identification**: iNaturalist, BugGuide, BAMONA
- **Plant identification**: PlantNet, Flora Incognita, Trefle
- **Amphibian identification**: AmphibiaWeb
- **General objects**: Imagga, Cloudinary, Roboflow
- **Multi-API redundancy** for improved accuracy
- **Context-aware identification** based on location, time, weather

## 🏗️ Architecture

```
┌─────────────────┐    WebSocket    ┌─────────────────┐
│   Android App   │ ◄─────────────► │   Web Server    │
│  (Remote Camera)│                 │   (Port 3001)   │
└─────────────────┘                 └─────────────────┘
         │                                   │
         │                                   │
         ▼                                   ▼
┌─────────────────┐                 ┌─────────────────┐
│  Camera Feed    │                 │   Web Interface │
│  Sensor Data    │                 │  (Port 3001)    │
│  Motion Events  │                 │                 │
└─────────────────┘                 └─────────────────┘
```

## 🚀 Quick Start

### Prerequisites
- **Node.js** (v16 or higher)
- **Android Studio** (for mobile app development)
- **Android device** or emulator (API level 33+)
- **Network connection** between devices

### 1. **Start the Web Server**
```bash
cd web-app
npm install
npm start
```
The web interface will be available at: **http://localhost:3001**

### 2. **Build and Install Android App**
```bash
cd android-app
# Open in Android Studio
# Build and install on device
```

### 3. **Automatic Network Discovery**
- **No manual configuration needed!** 
- Android app automatically discovers the server on your network
- Supports common network ranges: 192.168.x.x, 10.0.0.x
- Fallback to default: `http://10.0.0.60:3001`

## 📁 Project Structure

```
drahms-vision/
├── 📱 android-app/                # Android application (Samsung A25 optimized)
│   ├── app/src/main/
│   │   ├── java/com/drahms/vision/astronomy/
│   │   │   ├── MainActivity.kt    # Main app interface
│   │   │   ├── CameraActivity.kt  # Camera controls
│   │   │   ├── camera/            # Samsung A25 camera management
│   │   │   ├── network/           # WebSocket communication
│   │   │   ├── sensors/           # Sensor data collection
│   │   │   └── utils/             # Utilities
│   │   ├── res/                   # Resources
│   │   └── AndroidManifest.xml
│   └── build.gradle.kts
├── 🌐 web-app/                    # Web server and interface
│   ├── server.js                  # Express.js server
│   ├── public/                    # Static files
│   │   ├── index.html            # Main interface
│   │   ├── app.js                # Frontend logic
│   │   ├── identification-system.js
│   │   └── styles.css
│   └── package.json
├── 📚 docs/                       # Documentation
│   ├── API_INTEGRATION.md        # API integration guide
│   └── SETUP_GUIDE.md
└── README.md
```

## 🔧 Configuration

### Server Configuration
- **Port**: 3001 (configurable via `PORT` environment variable)
- **CORS**: Enabled for local development
- **WebSocket**: Socket.IO for real-time communication

### Android Configuration
- **Target SDK**: 36 (Android 15)
- **Minimum SDK**: 33 (Android 13)
- **Permissions**: Camera, Location, Internet, Storage
- **Samsung A25 Optimized**: 50MP camera, night mode, astrophotography

### Network Configuration
Update the server URL in these files:
- `android-app/app/src/main/java/com/drahms/vision/astronomy/MainActivity.kt`
- `android-app/app/src/main/java/com/drahms/vision/astronomy/CameraActivity.kt`
- `android-app/app/src/main/java/com/drahms/vision/astronomy/camera/SamsungA25CameraManager.kt`

## 🎯 Core Features

### **Real-time Camera Control**
- Zoom control (1x - 10x)
- Focus adjustment (manual/auto)
- Exposure control
- Photo/video capture
- Camera switching

### **AI Object Identification**
- **23 Free APIs** integrated
- **Multi-category support**: Birds, Insects, Plants, Amphibians, General Objects
- **Context-aware identification** based on:
  - Location (GPS coordinates)
  - Time of day
  - Weather conditions
  - Season
  - Moon phase

### **Astronomy Features**
- Real-time sky mapping
- Celestial object tracking
- Constellation identification
- Star/planet recognition
- AR overlay capabilities

### **Wildlife Photography**
- Motion detection
- Object tracking
- Automatic focus locking
- Continuous shooting
- Species identification

## 🔌 API Integration

The system integrates **23 free APIs** across 6 categories:

### **Birds (3 APIs)**
- **eBird API 2.0**: Bird species database
- **BirdNET**: Audio-based bird identification
- **XenoCanto**: Bird sound recordings

### **Insects (3 APIs)**
- **iNaturalist**: Naturalist observations
- **BugGuide**: Insect identification
- **BAMONA**: Butterfly and moth network

### **Plants (4 APIs)**
- **PlantNet**: Plant identification
- **Flora Incognita**: Plant recognition
- **Trefle**: Plant database
- **iNaturalist**: Plant observations

### **Amphibians (1 API)**
- **AmphibiaWeb**: Amphibian species database

### **General Objects (4 APIs)**
- **Google Lens**: Visual search (Priority 1)
- **Imagga**: General object recognition
- **Cloudinary**: AI transformations
- **Roboflow**: Computer vision

### **Additional APIs (8 APIs)**
- **NASA APIs**: Astronomy data
- **OpenWeather**: Weather conditions
- **Heavens Above**: Celestial objects
- **MammalNet**: Mammal identification
- **Wildlife Insights**: Wildlife data
- **BAMONA**: Butterfly tracking
- **XenoCanto**: Bird sounds
- **BugGuide**: Insect guide

## 🛠️ Development

### **Adding New APIs**
1. Add API configuration to `identification-system.js`
2. Implement API endpoint in `server.js`
3. Update documentation in `API_INTEGRATION.md`

### **Building Android App**
```bash
cd android-app
./gradlew assembleDebug
```

### **Testing**
- **Web Interface**: http://localhost:3001
- **API Status**: http://localhost:3001/api/status
- **Test Endpoint**: http://localhost:3001/api/test

## 📊 Performance

### **Optimizations**
- **Image compression** before transmission
- **WebSocket connection** pooling
- **API response caching**
- **Background processing** for heavy operations
- **Progressive image loading**

### **Resource Usage**
- **Memory**: ~50MB (Android), ~100MB (Web)
- **Network**: ~1-5 Mbps for video streaming
- **Storage**: Configurable local storage

## 🔒 Security

### **Best Practices**
- **No API keys** committed to repository
- **Environment variables** for sensitive data
- **HTTPS** for production deployment
- **Input validation** on all endpoints
- **Rate limiting** on API calls

### **Privacy**
- **Local storage** for captured images
- **No cloud upload** without user consent
- **Data anonymization** for analytics

## 🤝 Contributing

1. **Fork** the repository
2. **Create** a feature branch
3. **Make** your changes
4. **Test** thoroughly
5. **Submit** a pull request

### **Development Guidelines**
- Follow **Kotlin** coding standards for Android
- Use **ES6+** for JavaScript
- Add **JSDoc** comments for functions
- Include **unit tests** for new features
- Update **documentation** for changes

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Google Lens API** for visual search capabilities
- **eBird** for bird identification data
- **iNaturalist** for naturalist observations
- **NASA** for astronomy data
- **OpenWeather** for weather information

## 📞 Support

For support and questions:
- **Issues**: Create a GitHub issue
- **Documentation**: Check the `docs/` folder
- **API Keys**: See `docs/API_INTEGRATION.md`

---

**🔭 Drahms Vision** - Bringing the universe closer, one photo at a time.
