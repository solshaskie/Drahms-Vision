package com.drahms.vision.astronomy

import android.Manifest
import android.content.Intent
import android.content.pm.PackageManager
import android.os.Bundle
import android.util.Log
import android.widget.Toast
import androidx.activity.result.contract.ActivityResultContracts
import androidx.appcompat.app.AppCompatActivity
import androidx.core.app.ActivityCompat
import androidx.core.content.ContextCompat
import com.drahms.vision.astronomy.databinding.ActivityMainBinding
import com.drahms.vision.astronomy.network.WebSocketManager
import com.drahms.vision.astronomy.service.CameraService
import com.drahms.vision.astronomy.utils.PermissionHelper
import com.drahms.vision.astronomy.utils.SensorManager
import com.drahms.vision.astronomy.utils.NetworkUtils
import io.socket.client.IO
import io.socket.client.Socket
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext

class MainActivity : AppCompatActivity() {
    
    private lateinit var binding: ActivityMainBinding
    private lateinit var webSocketManager: WebSocketManager
    private lateinit var sensorManager: SensorManager
    private lateinit var permissionHelper: PermissionHelper
    
    private var isConnected = false
    private var isCameraActive = false
    private var serverUrl = DEFAULT_SERVER_URL
    
            companion object {
            private const val TAG = "MainActivity"
            private const val DEFAULT_SERVER_URL = "http://10.0.0.60:3001" // Fallback URL
        }
    
    // Permission request launcher
    private val permissionLauncher = registerForActivityResult(
        ActivityResultContracts.RequestMultiplePermissions()
    ) { permissions ->
        val allGranted = permissions.entries.all { it.value }
        if (allGranted) {
            initializeApp()
        } else {
            Toast.makeText(this, "Permissions required for full functionality", Toast.LENGTH_LONG).show()
        }
    }
    
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityMainBinding.inflate(layoutInflater)
        setContentView(binding.root)
        
        Log.d(TAG, "🚀 Drahms Vision Astronomy Camera System - Starting...")
        
        initializeManagers()
        checkPermissions()
        setupUI()
    }
    
    private fun initializeManagers() {
        // Discover server URL dynamically
        serverUrl = NetworkUtils.discoverServer(this) ?: DEFAULT_SERVER_URL
        Log.d(TAG, "Using server URL: $serverUrl")
        
        webSocketManager = WebSocketManager(serverUrl)
        sensorManager = SensorManager(this)
        permissionHelper = PermissionHelper(this)
    }
    
    private fun checkPermissions() {
        val requiredPermissions = arrayOf(
            Manifest.permission.CAMERA,
            Manifest.permission.ACCESS_FINE_LOCATION,
            Manifest.permission.ACCESS_COARSE_LOCATION,
            Manifest.permission.INTERNET,
            Manifest.permission.ACCESS_NETWORK_STATE
        )
        
        val permissionsToRequest = requiredPermissions.filter {
            ContextCompat.checkSelfPermission(this, it) != PackageManager.PERMISSION_GRANTED
        }.toTypedArray()
        
        if (permissionsToRequest.isEmpty()) {
            initializeApp()
        } else {
            permissionLauncher.launch(permissionsToRequest)
        }
    }
    
    private fun initializeApp() {
        Log.d(TAG, "🔧 Initializing Drahms Vision app...")
        
        // Initialize sensor manager
        sensorManager.initialize()
        
        // Connect to web server
        connectToServer()
        
        // Start camera service
        startCameraService()
        
        Toast.makeText(this, "🔭 Drahms Vision initialized!", Toast.LENGTH_SHORT).show()
    }
    
    private fun setupUI() {
        binding.apply {
            // Camera controls
            btnStartCamera.setOnClickListener {
                if (isConnected) {
                    startCameraActivity()
                } else {
                    Toast.makeText(this@MainActivity, "Please connect to server first", Toast.LENGTH_SHORT).show()
                }
            }
            
            btnConnect.setOnClickListener {
                if (isConnected) {
                    disconnectFromServer()
                } else {
                    connectToServer()
                }
            }
            
            btnSettings.setOnClickListener {
                startSettingsActivity()
            }
            
            // Camera parameter controls
            sliderZoom.addOnChangeListener { _, value, fromUser ->
                if (fromUser && isCameraActive) {
                    updateCameraZoom(value)
                }
            }
            
            sliderFocus.addOnChangeListener { _, value, fromUser ->
                if (fromUser && isCameraActive) {
                    updateCameraFocus(value)
                }
            }
            
            sliderExposure.addOnChangeListener { _, value, fromUser ->
                if (fromUser && isCameraActive) {
                    updateCameraExposure(value)
                }
            }
            
            // Capture buttons
            btnCapturePhoto.setOnClickListener {
                if (isCameraActive) {
                    capturePhoto()
                } else {
                    Toast.makeText(this@MainActivity, "Camera not active", Toast.LENGTH_SHORT).show()
                }
            }
            
            btnStartVideo.setOnClickListener {
                if (isCameraActive) {
                    toggleVideoRecording()
                } else {
                    Toast.makeText(this@MainActivity, "Camera not active", Toast.LENGTH_SHORT).show()
                }
            }
            
            // Motion detection
            switchMotionDetection.setOnCheckedChangeListener { _, isChecked ->
                toggleMotionDetection(isChecked)
            }
            
            // Object tracking
            switchObjectTracking.setOnCheckedChangeListener { _, isChecked ->
                toggleObjectTracking(isChecked)
            }
        }
    }
    
    private fun connectToServer() {
        Log.d(TAG, "🔌 Connecting to server: $serverUrl")
        
        binding.btnConnect.text = "Connecting..."
        binding.btnConnect.isEnabled = false
        
        CoroutineScope(Dispatchers.IO).launch {
            try {
                webSocketManager.connect { success ->
                    runOnUiThread {
                        if (success) {
                            isConnected = true
                            binding.btnConnect.text = "Disconnect"
                            binding.btnConnect.isEnabled = true
                            binding.statusConnection.text = "Connected"
                            binding.statusConnection.setTextColor(
                                ContextCompat.getColor(this@MainActivity, android.R.color.holo_green_dark)
                            )
                            
                            Toast.makeText(this@MainActivity, "✅ Connected to server!", Toast.LENGTH_SHORT).show()
                            
                            // Start sending sensor data
                            startSensorDataTransmission()
                        } else {
                            isConnected = false
                            binding.btnConnect.text = "Connect"
                            binding.btnConnect.isEnabled = true
                            binding.statusConnection.text = "Disconnected"
                            binding.statusConnection.setTextColor(
                                ContextCompat.getColor(this@MainActivity, android.R.color.holo_red_dark)
                            )
                            
                            Toast.makeText(this@MainActivity, "❌ Connection failed", Toast.LENGTH_SHORT).show()
                        }
                    }
                }
            } catch (e: Exception) {
                Log.e(TAG, "Connection error", e)
                runOnUiThread {
                    binding.btnConnect.text = "Connect"
                    binding.btnConnect.isEnabled = true
                    Toast.makeText(this@MainActivity, "Connection error: ${e.message}", Toast.LENGTH_LONG).show()
                }
            }
        }
    }
    
    private fun disconnectFromServer() {
        Log.d(TAG, "🔌 Disconnecting from server")
        
        webSocketManager.disconnect()
        isConnected = false
        
        binding.btnConnect.text = "Connect"
        binding.statusConnection.text = "Disconnected"
        binding.statusConnection.setTextColor(
            ContextCompat.getColor(this, android.R.color.holo_red_dark)
        )
        
        Toast.makeText(this, "Disconnected from server", Toast.LENGTH_SHORT).show()
    }
    
    private fun startCameraActivity() {
        Log.d(TAG, "📷 Starting camera activity")
        
        val intent = Intent(this, CameraActivity::class.java)
        startActivity(intent)
    }
    
    private fun startCameraService() {
        Log.d(TAG, "🎥 Starting camera service")
        
        val intent = Intent(this, CameraService::class.java)
        startForegroundService(intent)
    }
    
    private fun startSettingsActivity() {
        val intent = Intent(this, SettingsActivity::class.java)
        startActivity(intent)
    }
    
    private fun updateCameraZoom(value: Float) {
        Log.d(TAG, "🔍 Updating camera zoom: $value")
        
        if (isConnected) {
            webSocketManager.emit("camera_control", mapOf(
                "type" to "zoom",
                "value" to value
            ))
        }
    }
    
    private fun updateCameraFocus(value: Float) {
        Log.d(TAG, "🎯 Updating camera focus: $value")
        
        if (isConnected) {
            webSocketManager.emit("camera_control", mapOf(
                "type" to "focus",
                "value" to value
            ))
        }
    }
    
    private fun updateCameraExposure(value: Float) {
        Log.d(TAG, "☀️ Updating camera exposure: $value")
        
        if (isConnected) {
            webSocketManager.emit("camera_control", mapOf(
                "type" to "exposure",
                "value" to value
            ))
        }
    }
    
    private fun capturePhoto() {
        Log.d(TAG, "📸 Capturing photo")
        
        if (isConnected) {
            webSocketManager.emit("camera_control", mapOf(
                "type" to "capture",
                "action" to "photo"
            ))
            
            Toast.makeText(this, "📸 Photo captured!", Toast.LENGTH_SHORT).show()
        }
    }
    
    private fun toggleVideoRecording() {
        Log.d(TAG, "🎥 Toggling video recording")
        
        if (isConnected) {
            webSocketManager.emit("camera_control", mapOf(
                "type" to "capture",
                "action" to "video_toggle"
            ))
        }
    }
    
    private fun toggleMotionDetection(enabled: Boolean) {
        Log.d(TAG, "🎯 Motion detection: $enabled")
        
        if (isConnected) {
            webSocketManager.emit("motion_control", mapOf(
                "enabled" to enabled
            ))
        }
    }
    
    private fun toggleObjectTracking(enabled: Boolean) {
        Log.d(TAG, "🎯 Object tracking: $enabled")
        
        if (isConnected) {
            webSocketManager.emit("tracking_control", mapOf(
                "enabled" to enabled
            ))
        }
    }
    
    private fun startSensorDataTransmission() {
        Log.d(TAG, "📡 Starting sensor data transmission")
        
        sensorManager.startDataTransmission { sensorData ->
            if (isConnected) {
                webSocketManager.emit("sensor_data", sensorData)
            }
        }
    }
    
    override fun onResume() {
        super.onResume()
        Log.d(TAG, "🔄 Activity resumed")
        
        // Update UI based on current state
        updateUI()
    }
    
    override fun onPause() {
        super.onPause()
        Log.d(TAG, "⏸️ Activity paused")
    }
    
    override fun onDestroy() {
        super.onDestroy()
        Log.d(TAG, "🛑 Activity destroyed")
        
        // Cleanup
        webSocketManager.disconnect()
        sensorManager.cleanup()
    }
    
    private fun updateUI() {
        binding.apply {
            // Update connection status
            statusConnection.text = if (isConnected) "Connected" else "Disconnected"
            statusConnection.setTextColor(
                ContextCompat.getColor(
                    this@MainActivity,
                    if (isConnected) android.R.color.holo_green_dark else android.R.color.holo_red_dark
                )
            )
            
            // Update camera status
            statusCamera.text = if (isCameraActive) "Active" else "Inactive"
            statusCamera.setTextColor(
                ContextCompat.getColor(
                    this@MainActivity,
                    if (isCameraActive) android.R.color.holo_green_dark else android.R.color.holo_orange_dark
                )
            )
            
            // Update sensor status
            statusSensors.text = "Active"
            statusSensors.setTextColor(
                ContextCompat.getColor(this@MainActivity, android.R.color.holo_green_dark)
            )
        }
    }
    
    // Callback from CameraActivity
    fun onCameraActiveChanged(active: Boolean) {
        isCameraActive = active
        updateUI()
    }
}
