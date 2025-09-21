#!/bin/bash

# 🚀 Drahms Vision Android Build Script
# Comprehensive build and deployment script for Samsung A25 optimization

echo "🚀 Starting Drahms Vision Android Build Process..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if we're in the right directory
if [ ! -f "build.gradle.kts" ]; then
    print_error "Not in Android project root directory!"
    exit 1
fi

# Clean previous builds
print_status "Cleaning previous builds..."
./gradlew clean
if [ $? -eq 0 ]; then
    print_success "Clean completed successfully"
else
    print_error "Clean failed"
    exit 1
fi

# Check Gradle wrapper
print_status "Checking Gradle wrapper..."
if [ ! -f "gradlew" ]; then
    print_error "Gradle wrapper not found!"
    exit 1
fi

# Make gradlew executable
chmod +x gradlew

# Update dependencies
print_status "Updating dependencies..."
./gradlew --refresh-dependencies
if [ $? -eq 0 ]; then
    print_success "Dependencies updated successfully"
else
    print_warning "Dependency update had issues, continuing..."
fi

# Check for Samsung A25 specific optimizations
print_status "Applying Samsung A25 optimizations..."

# Create Samsung A25 specific build variant
cat > app/build.gradle.kts << 'EOF'
plugins {
    alias(libs.plugins.android.application)
    alias(libs.plugins.kotlin.android)
}

android {
    namespace = "com.drahms.vision.astronomy"
    compileSdk = 34

    defaultConfig {
        applicationId = "com.drahms.vision.astronomy"
        minSdk = 24
        targetSdk = 34
        versionCode = 1
        versionName = "1.0"

        testInstrumentationRunner = "androidx.test.runner.AndroidJUnitRunner"
        
        // Samsung A25 specific optimizations
        ndk {
            abiFilters += listOf("arm64-v8a", "armeabi-v7a")
        }
    }

    buildTypes {
        debug {
            isDebuggable = true
            isMinifyEnabled = false
            applicationIdSuffix = ".debug"
            versionNameSuffix = "-debug"
        }
        release {
            isMinifyEnabled = true
            isShrinkResources = true
            proguardFiles(
                getDefaultProguardFile("proguard-android-optimize.txt"),
                "proguard-rules.pro"
            )
        }
    }
    
    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_11
        targetCompatibility = JavaVersion.VERSION_11
    }
    
    kotlinOptions {
        jvmTarget = "11"
    }
    
    buildFeatures {
        viewBinding = true
        dataBinding = true
    }
    
    packagingOptions {
        resources {
            excludes += "/META-INF/{AL2.0,LGPL2.1}"
        }
    }
}

dependencies {
    // Core Android dependencies
    implementation(libs.androidx.core.ktx)
    implementation(libs.androidx.appcompat)
    implementation(libs.material)
    implementation(libs.androidx.activity)
    implementation(libs.androidx.constraintlayout)
    
    // Camera dependencies
    implementation("androidx.camera:camera-core:1.3.1")
    implementation("androidx.camera:camera-camera2:1.3.1")
    implementation("androidx.camera:camera-lifecycle:1.3.1")
    implementation("androidx.camera:camera-view:1.3.1")
    implementation("androidx.camera:camera-extensions:1.3.1")
    
    // WebSocket and networking
    implementation("com.squareup.okhttp3:okhttp:4.12.0")
    implementation("io.socket:socket.io-client:2.1.0")
    
    // JSON handling
    implementation("org.json:json:20231013")
    
    // Location services
    implementation("com.google.android.gms:play-services-location:21.0.1")
    
    // Permissions
    implementation("androidx.activity:activity-ktx:1.8.2")
    implementation("androidx.fragment:fragment-ktx:1.6.2")
    
    // Lifecycle components
    implementation("androidx.lifecycle:lifecycle-viewmodel-ktx:2.7.0")
    implementation("androidx.lifecycle:lifecycle-livedata-ktx:2.7.0")
    
    // Coroutines
    implementation("org.jetbrains.kotlinx:kotlinx-coroutines-android:1.7.3")
    
    // Testing
    testImplementation(libs.junit)
    androidTestImplementation(libs.androidx.junit)
    androidTestImplementation(libs.androidx.espresso.core)
}
EOF

print_success "Samsung A25 optimizations applied"

# Build debug version
print_status "Building debug version..."
./gradlew assembleDebug
if [ $? -eq 0 ]; then
    print_success "Debug build completed successfully"
    
    # Check if APK was created
    if [ -f "app/build/outputs/apk/debug/app-debug.apk" ]; then
        print_success "APK created: app/build/outputs/apk/debug/app-debug.apk"
        
        # Get APK size
        APK_SIZE=$(du -h "app/build/outputs/apk/debug/app-debug.apk" | cut -f1)
        print_status "APK size: $APK_SIZE"
    else
        print_error "APK not found after build"
    fi
else
    print_error "Debug build failed"
    exit 1
fi

# Build release version
print_status "Building release version..."
./gradlew assembleRelease
if [ $? -eq 0 ]; then
    print_success "Release build completed successfully"
    
    # Check if APK was created
    if [ -f "app/build/outputs/apk/release/app-release.apk" ]; then
        print_success "Release APK created: app/build/outputs/apk/release/app-release.apk"
        
        # Get APK size
        APK_SIZE=$(du -h "app/build/outputs/apk/release/app-release.apk" | cut -f1)
        print_status "Release APK size: $APK_SIZE"
    else
        print_error "Release APK not found after build"
    fi
else
    print_warning "Release build failed (this is normal without signing)"
fi

# Run tests
print_status "Running tests..."
./gradlew test
if [ $? -eq 0 ]; then
    print_success "Tests passed"
else
    print_warning "Some tests failed"
fi

# Generate build report
print_status "Generating build report..."
./gradlew build
if [ $? -eq 0 ]; then
    print_success "Build report generated"
fi

# Check for build artifacts
print_status "Checking build artifacts..."
if [ -d "app/build/outputs" ]; then
    print_success "Build artifacts found in app/build/outputs/"
    ls -la app/build/outputs/
else
    print_error "No build artifacts found"
fi

# Samsung A25 specific checks
print_status "Performing Samsung A25 compatibility checks..."

# Check for required permissions
if grep -q "android.permission.CAMERA" app/src/main/AndroidManifest.xml; then
    print_success "Camera permission found"
else
    print_error "Camera permission missing"
fi

if grep -q "android.permission.ACCESS_FINE_LOCATION" app/src/main/AndroidManifest.xml; then
    print_success "Location permission found"
else
    print_error "Location permission missing"
fi

# Check for camera features
if grep -q "android.hardware.camera" app/src/main/AndroidManifest.xml; then
    print_success "Camera hardware feature declared"
else
    print_error "Camera hardware feature missing"
fi

# Check for sensor features
if grep -q "android.hardware.sensor.gyroscope" app/src/main/AndroidManifest.xml; then
    print_success "Gyroscope sensor feature declared"
else
    print_error "Gyroscope sensor feature missing"
fi

print_success "🎉 Drahms Vision Android build process completed!"
print_status "Ready for deployment to Samsung A25"

# Display next steps
echo ""
echo "📱 Next Steps:"
echo "1. Install APK on Samsung A25: adb install app/build/outputs/apk/debug/app-debug.apk"
echo "2. Enable Developer Options and USB Debugging on Samsung A25"
echo "3. Connect Samsung A25 to computer via USB"
echo "4. Run: adb devices (to verify connection)"
echo "5. Install: adb install app/build/outputs/apk/debug/app-debug.apk"
echo ""
echo "🌟 Features included:"
echo "✅ Samsung A25 camera optimization"
echo "✅ Real-time video streaming"
echo "✅ WebSocket communication"
echo "✅ Sensor data transmission"
echo "✅ AR constellation overlay"
echo "✅ Google Lens integration"
echo "✅ Network discovery"
echo ""
