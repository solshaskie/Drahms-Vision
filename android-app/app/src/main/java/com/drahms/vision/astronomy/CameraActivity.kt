package com.drahms.vision.astronomy

import android.Manifest
import android.content.pm.PackageManager
import android.os.Bundle
import android.util.Log
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import androidx.camera.core.*
import androidx.camera.lifecycle.ProcessCameraProvider
import androidx.core.app.ActivityCompat
import androidx.core.content.ContextCompat
import com.drahms.vision.astronomy.databinding.ActivityCameraBinding
import com.drahms.vision.astronomy.camera.A25CameraManager
import com.drahms.vision.astronomy.camera.AstronomyCameraModes
import com.drahms.vision.astronomy.sensors.SensorDataManager
import com.drahms.vision.astronomy.network.WebSocketManager
import com.drahms.vision.astronomy.utils.AudioGuidance
import com.drahms.vision.astronomy.utils.PowerManager
import java.io.File
import java.text.SimpleDateFormat
import java.util.*
import java.util.concurrent.ExecutorService
import java.util.concurrent.Executors

class CameraActivity : AppCompatActivity() {
    
    private lateinit var binding: ActivityCameraBinding
    private lateinit var cameraExecutor: ExecutorService
    private lateinit var a25CameraManager: A25CameraManager
    private lateinit var astronomyModes: AstronomyCameraModes
    private lateinit var sensorDataManager: SensorDataManager
    private lateinit var webSocketManager: WebSocketManager
    private lateinit var audioGuidance: AudioGuidance
    private lateinit var powerManager: PowerManager
    
    private var imageCapture: ImageCapture? = null
    private var camera: Camera? = null
    private var lensFacing = CameraSelector.LENS_FACING_BACK
    
    companion object {
        private const val TAG = "CameraActivity"
        private const val REQUEST_CODE_PERMISSIONS = 10
        private val REQUIRED_PERMISSIONS = arrayOf(Manifest.permission.CAMERA)
    }
    
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityCameraBinding.inflate(layoutInflater)
        setContentView(binding.root)
        
        initializeComponents()
        setupUI()
        
        if (allPermissionsGranted()) {
            startCamera()
        } else {
            ActivityCompat.requestPermissions(
                this, REQUIRED_PERMISSIONS, REQUEST_CODE_PERMISSIONS
            )
        }
    }
    
    private fun initializeComponents() {
        cameraExecutor = Executors.newSingleThreadExecutor()
        a25CameraManager = A25CameraManager(this)
        astronomyModes = AstronomyCameraModes(this)
        sensorDataManager = SensorDataManager(this)
        webSocketManager = WebSocketManager()
        audioGuidance = AudioGuidance(this)
        powerManager = PowerManager(this)
        
        // Initialize A25-specific camera features
        a25CameraManager.initializeCameras()
        
        // Start sensor data collection
        sensorDataManager.startSensors()
        
        // Initialize power management for astronomy sessions
        powerManager.disablePowerSaving()
        
        // Initialize audio guidance
        audioGuidance.initialize()
        
        // Connect to WebSocket server
        webSocketManager.connect()
    }
    
    private fun setupUI() {
        binding.apply {
            // Camera controls
            btnCapture.setOnClickListener {
                takePhoto()
            }
            
            btnSwitchCamera.setOnClickListener {
                switchCamera()
            }
            
            btnFlash.setOnClickListener {
                toggleFlash()
            }
            
            // Back button
            btnBack.setOnClickListener {
                finish()
            }
            
            // Settings button
            btnSettings.setOnClickListener {
                showCameraSettings()
            }
            
            // Mode selection
            chipAuto.setOnClickListener {
                astronomyModes.setMode(AstronomyCameraModes.CameraMode.AUTO)
                updateModeUI()
            }
            
            chipNight.setOnClickListener {
                astronomyModes.setMode(AstronomyCameraModes.CameraMode.NIGHT)
                updateModeUI()
            }
            
            chipManual.setOnClickListener {
                astronomyModes.setMode(AstronomyCameraModes.CameraMode.MANUAL)
                updateModeUI()
            }
            
            chipAstronomy.setOnClickListener {
                astronomyModes.setMode(AstronomyCameraModes.CameraMode.ASTRONOMY)
                updateModeUI()
            }
        }
        
        // Update UI with current camera info
        updateCameraInfo()
    }
    
    private fun updateModeUI() {
        val currentMode = astronomyModes.getCurrentMode()
        binding.apply {
            // Reset all chips to default color
            chipAuto.setChipBackgroundColorResource(android.R.color.darker_gray)
            chipNight.setChipBackgroundColorResource(android.R.color.darker_gray)
            chipManual.setChipBackgroundColorResource(android.R.color.darker_gray)
            chipAstronomy.setChipBackgroundColorResource(android.R.color.darker_gray)
            
            // Highlight current mode
            when (currentMode) {
                AstronomyCameraModes.CameraMode.AUTO -> chipAuto.setChipBackgroundColorResource(android.R.color.holo_blue_dark)
                AstronomyCameraModes.CameraMode.NIGHT -> chipNight.setChipBackgroundColorResource(android.R.color.holo_blue_dark)
                AstronomyCameraModes.CameraMode.MANUAL -> chipManual.setChipBackgroundColorResource(android.R.color.holo_blue_dark)
                AstronomyCameraModes.CameraMode.ASTRONOMY -> chipAstronomy.setChipBackgroundColorResource(android.R.color.holo_blue_dark)
            }
        }
    }
    
    private fun startCamera() {
        val cameraProviderFuture = ProcessCameraProvider.getInstance(this)
        
        cameraProviderFuture.addListener({
            val cameraProvider: ProcessCameraProvider = cameraProviderFuture.get()
            
            val preview = Preview.Builder()
                .build()
                .also {
                    it.setSurfaceProvider(binding.viewFinder.surfaceProvider)
                }
            
            imageCapture = ImageCapture.Builder()
                .setCaptureMode(ImageCapture.CAPTURE_MODE_MAXIMIZE_QUALITY)
                .build()
            
            val cameraSelector = CameraSelector.DEFAULT_BACK_CAMERA
            
            try {
                cameraProvider.unbindAll()
                camera = cameraProvider.bindToLifecycle(
                    this, cameraSelector, preview, imageCapture
                )
                
                Log.d(TAG, "Camera started successfully")
                
            } catch (exc: Exception) {
                Log.e(TAG, "Use case binding failed", exc)
            }
        }, ContextCompat.getMainExecutor(this))
    }
    
    private fun takePhoto() {
        val imageCapture = imageCapture ?: return
        
        val photoFile = File(
            outputDirectory,
            SimpleDateFormat("yyyy-MM-dd-HH-mm-ss-SSS", Locale.US)
                .format(System.currentTimeMillis()) + ".jpg"
        )
        
        val outputOptions = ImageCapture.OutputFileOptions.Builder(photoFile).build()
        
        imageCapture.takePicture(
            outputOptions,
            ContextCompat.getMainExecutor(this),
            object : ImageCapture.OnImageSavedCallback {
                override fun onImageSaved(output: ImageCapture.OutputFileResults) {
                    val savedUri = output.savedUri
                    val msg = "Photo saved: $savedUri"
                    Toast.makeText(baseContext, msg, Toast.LENGTH_SHORT).show()
                    Log.d(TAG, msg)
                    
                    // Play capture sound
                    audioGuidance.playCaptureSound()
                    
                    // Send photo to web server
                    sendPhotoToServer(photoFile)
                }
                
                override fun onError(exc: ImageCaptureException) {
                    Log.e(TAG, "Photo capture failed: ${exc.message}", exc)
                    audioGuidance.playErrorSound()
                }
            }
        )
    }
    
    private fun sendPhotoToServer(photoFile: File) {
        try {
            // Read the photo file into a byte array
            val imageBytes = photoFile.readBytes()
            
            // Send the image data to the server via WebSocket
            webSocketManager.sendImageData(imageBytes)
            
            Log.d(TAG, "Photo sent to server: ${photoFile.absolutePath}")
            Toast.makeText(this, "Photo sent to server", Toast.LENGTH_SHORT).show()
            
        } catch (e: Exception) {
            Log.e(TAG, "Failed to send photo to server", e)
            Toast.makeText(this, "Failed to send photo", Toast.LENGTH_SHORT).show()
        }
    }
    
    private fun switchCamera() {
        lensFacing = if (CameraSelector.LENS_FACING_BACK == lensFacing) {
            CameraSelector.LENS_FACING_FRONT
        } else {
            CameraSelector.LENS_FACING_BACK
        }
        startCamera()
    }
    
    private fun toggleFlash() {
        camera?.let { camera ->
            if (camera.cameraInfo.hasFlashUnit()) {
                val flashMode = if (imageCapture?.flashMode == ImageCapture.FLASH_MODE_OFF) {
                    ImageCapture.FLASH_MODE_ON
                } else {
                    ImageCapture.FLASH_MODE_OFF
                }
                imageCapture?.flashMode = flashMode
                Log.d(TAG, "Flash mode: $flashMode")
            }
        }
    }
    
    private fun showCameraSettings() {
        Toast.makeText(this, "Camera Settings", Toast.LENGTH_SHORT).show()
        // TODO: Implement camera settings dialog
    }
    
    private fun updateCameraInfo() {
        binding.tvCameraInfo.text = "50MP Main Camera - ${astronomyModes.getCurrentMode()}"
        binding.tvSensorInfo.text = "GPS: Active"
    }
    
    private fun allPermissionsGranted() = REQUIRED_PERMISSIONS.all {
        ContextCompat.checkSelfPermission(baseContext, it) == PackageManager.PERMISSION_GRANTED
    }
    
    override fun onRequestPermissionsResult(
        requestCode: Int,
        permissions: Array<String>,
        grantResults: IntArray
    ) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults)
        if (requestCode == REQUEST_CODE_PERMISSIONS) {
            if (allPermissionsGranted()) {
                startCamera()
            } else {
                Toast.makeText(this, "Permissions not granted by the user.", Toast.LENGTH_SHORT).show()
                finish()
            }
        }
    }
    
    private val outputDirectory: File by lazy {
        val mediaDir = externalMediaDirs.firstOrNull()?.let {
            File(it, "AstronomyCamera").apply { mkdirs() }
        }
        if (mediaDir != null && mediaDir.exists()) mediaDir else filesDir
    }
    
    override fun onDestroy() {
        super.onDestroy()
        cameraExecutor.shutdown()
        sensorDataManager.stopSensors()
        powerManager.enablePowerSaving()
        audioGuidance.cleanup()
    }
}
