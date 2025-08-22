# 🔭 Drahms Vision - Astronomy Camera System

An advanced astronomy camera system with real-time sky mapping, object identification, and Android companion app integration.

## 🌟 Features

### Web Interface
- **Real-time Camera Control** - Remote camera operation from web browser
- **Image Processing** - Advanced editing tools for astronomy photography
- **Object Identification** - AI-powered celestial object recognition
- **Sky Mapping** - Interactive star charts and constellation guides
- **Gallery Management** - Photo organization and sharing

### Android Companion App
- **Samsung Galaxy A25 Optimized** - Multi-lens camera support
- **Real-time Communication** - WebSocket connection to web server
- **Sensor Integration** - Accelerometer, gyroscope, magnetometer, light sensor
- **Astronomy Modes** - Auto, Night, Manual, and Astronomy photography modes
- **Audio Guidance** - Text-to-speech and sound feedback

## 🚀 Quick Start

### Prerequisites
- Node.js (v16 or higher)
- Android Studio (for Android app development)
- Samsung Galaxy A25 (or compatible Android device)

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/solshaskie/Drahms-Vision.git
   cd Drahms-Vision
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Set up environment variables:**
   Create a `.env` file in the root directory:
   ```env
   # Google Cloud Vision API
   GOOGLE_VISION_API_KEY=your_google_vision_api_key_here
   
   # eBird API 2.0
   EBIRD_API_KEY=your_ebird_api_key_here
   
   # Server Configuration
   PORT=3003
   NODE_ENV=development
   ```

4. **Start the web server:**
   ```bash
   npm start
   ```

5. **Build and install Android app:**
   ```bash
   cd android-app
   ./gradlew assembleDebug
   ```

## 📱 Android App Setup

### Requirements
- Android Studio
- Samsung Galaxy A25 (or compatible device)
- USB debugging enabled

### Installation
1. Build the APK: `./gradlew assembleDebug`
2. Transfer APK to your device
3. Enable "Install from Unknown Sources"
4. Install the APK

### Configuration
- Update server IP in `WebSocketManager.kt` to match your computer's IP
- Ensure both devices are on the same network

## 🌐 Web Interface

Access the web interface at: `http://localhost:3003`

### Features
- **Camera Control** - Remote camera operation
- **Image Editor** - Advanced photo editing tools
- **Object Identification** - AI-powered recognition
- **Sky Mapping** - Interactive star charts
- **Gallery** - Photo management

## 🔧 API Integration

### Google Cloud Vision API
- Object identification in captured images
- Text recognition for astronomy data
- Image analysis for celestial objects

### eBird API 2.0
- Bird identification in captured images
- Species information and data
- Location-based bird sightings

## 📁 Project Structure

```
drahms-vision/
├── README.md                 # Project documentation
├── package.json              # Node.js dependencies
├── server.js                 # Main web server
├── working-server.js         # Development server
├── .env                      # Environment variables
├── .gitignore               # Git ignore rules
├── index.html               # Main web interface
├── styles/                  # CSS stylesheets
├── js/                      # JavaScript modules
├── public/                  # Static assets
└── android-app/             # Android companion app
    ├── app/
    │   ├── src/main/
    │   │   ├── java/com/astronomy/camera/
    │   │   │   ├── MainActivity.kt
    │   │   │   ├── CameraActivity.kt
    │   │   │   ├── camera/           # Camera management
    │   │   │   ├── sensors/          # Sensor integration
    │   │   │   ├── network/          # WebSocket communication
    │   │   │   └── utils/            # Utility classes
    │   │   └── res/                  # Android resources
    │   └── build.gradle
    └── build.gradle
```

## 🛠️ Development

### Web Server
- **Framework:** Node.js with Express
- **Real-time:** Socket.io for WebSocket communication
- **APIs:** Google Cloud Vision, eBird 2.0

### Android App
- **Language:** Kotlin
- **Camera:** CameraX API
- **Sensors:** Android Sensor Framework
- **Communication:** Socket.io client

## 📸 Camera Features

### Samsung Galaxy A25 Support
- **50MP Main Camera** - High-resolution astronomy photography
- **8MP Ultra-wide** - Wide-field sky views
- **2MP Macro** - Detailed close-up shots
- **Night Mode** - Optimized for low-light conditions

### Photography Modes
- **Auto** - Standard automatic settings
- **Night** - Low-light optimization
- **Manual** - Full manual control
- **Astronomy** - Specialized for celestial photography

## 🔌 Network Configuration

### WebSocket Communication
- **Protocol:** Socket.io
- **Port:** 3003
- **Features:** Real-time image transfer, sensor data, camera control

### Server Setup
- **IP Address:** Configure in Android app
- **Port:** 3003 (configurable)
- **CORS:** Enabled for cross-origin requests

## 🎯 Use Cases

### Astronomy Photography
- Capture high-resolution images of celestial objects
- Real-time object identification
- Integration with astronomy databases

### Educational
- Interactive sky mapping
- Constellation identification
- Astronomical data visualization

### Research
- Data collection for astronomy research
- Sensor data logging
- Image analysis and processing

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- **Drahms** - The mascot and inspiration for this project
- **Samsung** - Galaxy A25 camera technology
- **Google Cloud Vision** - AI-powered image analysis
- **eBird** - Bird identification and data

## 📞 Support

For support and questions:
- Create an issue on GitHub
- Check the documentation
- Review the troubleshooting guide

---

**🔭 Drahms Vision** - Exploring the cosmos, one pixel at a time.
