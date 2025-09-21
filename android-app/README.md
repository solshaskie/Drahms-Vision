# 🚀 Drahms Vision Android App

## Samsung A25 Optimized Astronomy Camera System

This Android application is specifically optimized for the **Samsung Galaxy A25** and provides a comprehensive astronomy camera system with real-time AR overlays, object identification, and remote control capabilities.

## 🌟 Features

### Core Features
- **Real-time Video Streaming** - Live camera feed to web app
- **AR Constellation Overlay** - Real-time celestial object mapping
- **Object Identification** - AI-powered plant, animal, and insect recognition
- **Remote Camera Control** - Full control from web interface
- **Sensor Data Transmission** - GPS, gyroscope, accelerometer data
- **Network Discovery** - Automatic device connection

### Samsung A25 Optimizations
- **50MP Main Camera** - High-resolution photography
- **Night Mode** - Enhanced low-light performance
- **Astrophotography Mode** - Long exposure for stars
- **Pro Mode Controls** - Manual ISO, shutter speed, focus
- **OIS (Optical Image Stabilization)** - Reduced camera shake
- **Ultra-wide & Macro Cameras** - Multiple camera support

## 📱 Requirements

### Device Requirements
- **Samsung Galaxy A25** (optimized)
- **Android 7.0+** (API level 24+)
- **4GB RAM minimum** (6GB recommended)
- **64GB storage** (for high-resolution photos/videos)
- **WiFi/4G/5G** connectivity

### Hardware Features Required
- Camera (main, ultra-wide, macro)
- GPS
- Gyroscope
- Accelerometer
- Magnetometer
- WiFi
- Bluetooth

## 🛠️ Build Instructions

### Prerequisites
1. **Android Studio** (latest version)
2. **Java 11** or higher
3. **Android SDK** (API level 34)
4. **Gradle** (included in project)

### Quick Build (Windows)
```batch
# Navigate to android-app directory
cd android-app

# Run build script
build-android.bat
```

### Quick Build (Linux/Mac)
```bash
# Navigate to android-app directory
cd android-app

# Make script executable
chmod +x build-android.sh

# Run build script
./build-android.sh
```

### Manual Build
```bash
# Clean previous builds
./gradlew clean

# Update dependencies
./gradlew --refresh-dependencies

# Build debug version
./gradlew assembleDebug

# Build release version
./gradlew assembleRelease
```

## 📦 Installation

### Method 1: ADB Installation
```bash
# Enable Developer Options on Samsung A25
# Settings > About Phone > Tap "Build Number" 7 times

# Enable USB Debugging
# Settings > Developer Options > USB Debugging

# Connect device via USB
adb devices

# Install APK
adb install app/build/outputs/apk/debug/app-debug.apk
```

### Method 2: Direct Installation
1. Copy `app-debug.apk` to Samsung A25
2. Enable "Install from Unknown Sources"
3. Tap APK file to install

## 🔧 Configuration

### API Keys
The app requires API keys for full functionality:

1. **Google Vision API** - For object identification
2. **OpenWeather API** - For weather data
3. **NASA APIs** - For astronomy data

### Network Configuration
- **Web Server IP** - Configure in app settings
- **WebSocket Port** - Default 3000
- **Discovery Port** - Default 3001

## 🎯 Usage

### Initial Setup
1. **Launch App** - Tap Drahms Vision icon
2. **Grant Permissions** - Camera, Location, Storage
3. **Connect to Network** - Same WiFi as web app
4. **Start Camera** - Tap camera button

### Camera Controls
- **Zoom** - Pinch to zoom or use controls
- **Focus** - Tap to focus or manual control
- **Exposure** - Adjust brightness/exposure
- **Night Mode** - Enhanced low-light
- **Astro Mode** - Long exposure for stars
- **Pro Mode** - Manual camera settings

### AR Overlay
- **Constellations** - Real-time star mapping
- **Planets** - Current planet positions
- **Labels** - Object identification
- **Compass** - Direction indicator
- **Grid** - Reference lines

## 🔍 Troubleshooting

### Common Issues

#### Build Errors
```bash
# Clean and rebuild
./gradlew clean
./gradlew assembleDebug
```

#### Camera Not Working
1. Check camera permissions
2. Restart app
3. Check camera hardware

#### Network Connection Issues
1. Verify WiFi connection
2. Check firewall settings
3. Ensure web server is running

#### Performance Issues
1. Close other apps
2. Restart device
3. Check available storage

### Debug Mode
Enable debug logging:
```kotlin
// In MainActivity.kt
Log.d("DrahmsVision", "Debug message")
```

## 📊 Performance Optimization

### Samsung A25 Specific
- **RAM Management** - Optimized for 6GB RAM
- **Battery Optimization** - Efficient power usage
- **Storage Management** - Compressed video streaming
- **Network Optimization** - Adaptive quality

### Camera Performance
- **Resolution Scaling** - Adaptive based on network
- **Frame Rate** - 30fps for smooth streaming
- **Compression** - H.264 encoding
- **Buffer Management** - Optimized for real-time

## 🔒 Security

### Permissions
- **Camera** - Required for video streaming
- **Location** - Required for astronomy calculations
- **Storage** - Required for photo/video saving
- **Network** - Required for web communication

### Data Privacy
- **Local Processing** - Camera data processed locally
- **Encrypted Communication** - WebSocket encryption
- **No Data Collection** - No personal data stored
- **Open Source** - Transparent codebase

## 🚀 Advanced Features

### Customization
- **UI Themes** - Dark/light mode
- **Overlay Settings** - Customize AR elements
- **Camera Profiles** - Save settings
- **Network Profiles** - Multiple server configs

### Integration
- **Web App** - Full remote control
- **API Integration** - 23+ identification APIs
- **Sensor Fusion** - Combined sensor data
- **Real-time Processing** - Live object detection

## 📈 Future Enhancements

### Planned Features
- **Machine Learning** - On-device AI processing
- **Cloud Sync** - Photo/video backup
- **Social Sharing** - Share discoveries
- **Advanced AR** - 3D constellation models
- **Voice Control** - Hands-free operation

### Performance Improvements
- **GPU Acceleration** - Hardware-accelerated processing
- **Edge Computing** - Local AI processing
- **5G Optimization** - Ultra-low latency
- **Battery Optimization** - Extended usage time

## 🤝 Contributing

### Development Setup
1. Fork the repository
2. Create feature branch
3. Make changes
4. Test on Samsung A25
5. Submit pull request

### Code Standards
- **Kotlin** - Primary language
- **MVVM Architecture** - Clean architecture
- **Coroutines** - Async programming
- **Material Design** - UI guidelines

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- **Samsung** - For A25 optimization guidelines
- **Google** - For CameraX and Vision APIs
- **NASA** - For astronomy data APIs
- **Open Source Community** - For libraries and tools

## 📞 Support

### Documentation
- **API Documentation** - See `/docs` folder
- **User Manual** - See `/docs/USER_MANUAL.md`
- **Developer Guide** - See `/docs/DEVELOPER_GUIDE.md`

### Contact
- **Issues** - GitHub Issues
- **Discussions** - GitHub Discussions
- **Email** - [Your Email]

---

**🌟 Built with ❤️ for astronomy enthusiasts and Samsung A25 users**
