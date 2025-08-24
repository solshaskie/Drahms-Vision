# New Project Setup Guide

## Step 1: Create New Android Project
1. Open Android Studio
2. Click "New Project"
3. Select "Empty Views Activity"
4. Configure project:
   - **Name:** `Drahms-Vision-New`
   - **Package name:** `com.drahms.vision`
   - **Language:** Kotlin
   - **Minimum SDK:** API 26
   - **Location:** `C:\Users\Ashley\Drahms-Vision-New`

## Step 2: Copy Source Files
After project creation, copy these files from `C:\Users\Ashley\Drahms-Vision\android-app\app\src\main\`:

### Java/Kotlin Files
```
java/com/astronomy/camera/MainActivity.kt
java/com/astronomy/camera/CameraActivity.kt
java/com/astronomy/camera/network/WebSocketManager.kt
java/com/astronomy/camera/sensors/SensorDataManager.kt
```

### Resource Files
```
res/layout/activity_main.xml
res/layout/activity_camera.xml
res/values/themes.xml
res/values/colors.xml
res/values-night/themes.xml
res/drawable/*.xml
res/xml/network_security_config.xml
```

### Configuration Files
```
AndroidManifest.xml
```

## Step 3: Update Package Names
1. Update all Kotlin files to use `com.drahms.vision` package
2. Update `AndroidManifest.xml` package attribute
3. Update import statements in all files

## Step 4: Copy Dependencies
Copy these dependencies from the old `build.gradle` to the new one:

```gradle
dependencies {
    // Core Android dependencies
    implementation 'androidx.core:core-ktx:1.12.0'
    implementation 'androidx.appcompat:appcompat:1.6.1'
    implementation 'com.google.android.material:material:1.10.0'
    implementation 'androidx.constraintlayout:constraintlayout:2.1.4'
    implementation 'androidx.lifecycle:lifecycle-viewmodel-ktx:2.6.2'
    implementation 'androidx.lifecycle:lifecycle-livedata-ktx:2.6.2'
    
    // Camera2 API
    implementation 'androidx.camera:camera-core:1.3.1'
    implementation 'androidx.camera:camera-camera2:1.3.1'
    implementation 'androidx.camera:camera-lifecycle:1.3.1'
    implementation 'androidx.camera:camera-view:1.3.1'
    implementation 'androidx.camera:camera-extensions:1.3.1'
    
    // Real-time communication
    implementation 'io.socket:socket.io-client:2.1.0'
    implementation 'com.squareup.okhttp3:okhttp:4.12.0'
    implementation 'com.squareup.retrofit2:retrofit:2.9.0'
    implementation 'com.squareup.retrofit2:converter-gson:2.9.0'
    
    // Debug logging
    implementation 'com.jakewharton.timber:timber:5.0.1'
    
    // Image processing
    implementation 'com.github.bumptech.glide:glide:4.16.0'
    
    // Location and sensors
    implementation 'com.google.android.gms:play-services-location:21.0.1'
    implementation 'com.google.android.gms:play-services-maps:18.2.0'
    
    // Permissions
    implementation 'com.karumi:dexter:6.2.3'
}
```

## Step 5: Test Build System
1. Make a simple change to `activity_main.xml` (change text)
2. Build APK: `./gradlew assembleDebug`
3. Check APK metadata: `app/build/outputs/apk/debug/output-metadata.json`
4. Verify changes are reflected

## Step 6: Copy Web Server Files
Copy these files from `C:\Users\Ashley\Drahms-Vision\`:
```
working-server.js
index.html
js/
styles/
package.json
.env
```

## Step 7: Test Complete System
1. Start server: `node working-server.js`
2. Build and install Android app
3. Test connection between app and web interface

## Success Criteria
- ✅ APK metadata matches build.gradle settings
- ✅ Code changes are reflected in APK
- ✅ App connects to web server
- ✅ Camera video appears on web interface

## Troubleshooting
If build system still doesn't work:
1. Check Android Studio project settings
2. Verify Gradle wrapper version
3. Invalidate caches and restart
4. Check for conflicting project configurations
