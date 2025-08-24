package com.drahms.vision.astronomy

import android.Manifest
import android.content.pm.PackageManager
import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.os.Bundle
import android.util.Log
import android.widget.Toast
import androidx.activity.result.contract.ActivityResultContracts
import androidx.appcompat.app.AppCompatActivity
import androidx.camera.core.*
import androidx.camera.lifecycle.ProcessCameraProvider
import androidx.core.app.ActivityCompat
import androidx.core.content.ContextCompat
import com.drahms.vision.astronomy.databinding.ActivityCameraBinding
import com.drahms.vision.astronomy.network.WebSocketManager
import java.io.ByteArrayOutputStream
import java.io.File
import java.text.SimpleDateFormat
import java.util.*
import java.util.concurrent.ExecutorService
import java.util.concurrent.Executors

class CameraActivity : AppCompatActivity() {
    
    private lateinit var binding: ActivityCameraBinding
    private lateinit var cameraExecutor: ExecutorService
    private lateinit var webSocketManager: WebSocketManager
    
    private var imageCapture: ImageCapture? = null
    private var videoCapture: VideoCapture<Recorder>? = null
    private var camera: Camera? = null
    private var cameraProvider: ProcessCameraProvider? = null
    
    private var isRecording = false
    private var isMotionDetectionEnabled = false
    private var isObjectTrackingEnabled = false
    
    companion object {
        private const val TAG = "CameraActivity"
        private const val FILENAME_FORMAT = "yyyy-MM-dd-HH-mm-ss-SSS"
        private const val REQUEST_CODE_PERMISSIONS = 10
        private val REQUIRED_PERMISSIONS = arrayOf(Manifest.permission.CAMERA)
    }
    
    // Permission request launcher
    private val requestPermissionLauncher = registerForActivityResult(
        ActivityResultContracts.RequestPermission()
    ) { isGranted ->
        if (isGranted) {
            startCamera()
        } else {
            Toast.makeText(this, "Camera permission required", Toast.LENGTH_LONG).show()
            finish()
        }
    }
    
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityCameraBinding.inflate(layoutInflater)
        setContentView(binding.root)
        
        Log.d(TAG, "📷 Camera Activity started")
        
        // Initialize WebSocket manager
        webSocketManager = WebSocketManager("http://10.0.0.60:3001")
        
        // Request camera permissions
        if (allPermissionsGranted()) {
            startCamera()
        } else {
            requestPermissionLauncher.launch(Manifest.permission.CAMERA)
        }
        
        // Set up the listeners for capture buttons
        binding.apply {
            btnCapture.setOnClickListener { takePhoto() }
            btnRecord.setOnClickListener { toggleVideoRecording() }
            btnSwitchCamera.setOnClickListener { switchCamera() }
            btnSettings.setOnClickListener { openCameraSettings() }
            
            // Motion detection toggle
            switchMotionDetection.setOnCheckedChangeListener { _, isChecked ->
                toggleMotionDetection(isChecked)
            }
            
            // Object tracking toggle
            switchObjectTracking.setOnCheckedChangeListener { _, isChecked ->
                toggleObjectTracking(isChecked)
            }
        }
        
        cameraExecutor = Executors.newSingleThreadExecutor()
    }
    
    private fun startCamera() {
        val cameraProviderFuture = ProcessCameraProvider.getInstance(this)
        
        cameraProviderFuture.addListener({
            try {
                cameraProvider = cameraProviderFuture.get()
                
                // Set up the preview use case
                val preview = Preview.Builder()
                    .build()
                    .also {
                        it.setSurfaceProvider(binding.viewFinder.surfaceProvider)
                    }
                
                // Set up image capture use case
                imageCapture = ImageCapture.Builder()
                    .setCaptureMode(ImageCapture.CAPTURE_MODE_MINIMIZE_LATENCY)
                    .build()
                
                // Set up video capture use case
                val recorder = Recorder.Builder()
                    .setQualitySelector(QualitySelector.from(Quality.HIGHEST))
                    .build()
                videoCapture = VideoCapture.withOutput(recorder)
                
                // Select back camera as a default
                val cameraSelector = CameraSelector.DEFAULT_BACK_CAMERA
                
                try {
                    // Unbind any bound use cases before rebinding
                    cameraProvider?.unbindAll()
                    
                    // Bind use cases to camera
                    camera = cameraProvider?.bindToLifecycle(
                        this, cameraSelector, preview, imageCapture, videoCapture
                    )
                    
                    // Set up camera controls
                    setupCameraControls()
                    
                } catch (exc: Exception) {
                    Log.e(TAG, "Use case binding failed", exc)
                }
                
            } catch (exc: Exception) {
                Log.e(TAG, "Camera provider binding failed", exc)
            }
        }, ContextCompat.getMainExecutor(this))
    }
    
    private fun setupCameraControls() {
        camera?.let { cam ->
            // Set up zoom control
            binding.sliderZoom.addOnChangeListener { _, value, fromUser ->
                if (fromUser) {
                    cam.cameraControl.setZoomRatio(value)
                }
            }
            
            // Set up focus control
            binding.sliderFocus.addOnChangeListener { _, value, fromUser ->
                if (fromUser) {
                    // Implement focus control
                    Log.d(TAG, "Focus value: $value")
                }
            }
            
            // Set up exposure control
            binding.sliderExposure.addOnChangeListener { _, value, fromUser ->
                if (fromUser) {
                    // Implement exposure control
                    Log.d(TAG, "Exposure value: $value")
                }
            }
        }
    }
    
    private fun takePhoto() {
        val imageCapture = imageCapture ?: return
        
        // Create timestamped file
        val photoFile = File(
            outputDirectory,
            SimpleDateFormat(FILENAME_FORMAT, Locale.US)
                .format(System.currentTimeMillis()) + ".jpg"
        )
        
        val outputOptions = ImageCapture.OutputFileOptions.Builder(photoFile).build()
        
        imageCapture.takePicture(
            outputOptions,
            ContextCompat.getMainExecutor(this),
            object : ImageCapture.OnImageSavedCallback {
                override fun onImageSaved(output: ImageCapture.OutputFileResults) {
                    val savedUri = output.savedUri
                    val msg = "Photo capture succeeded: ${savedUri?.path}"
                    Toast.makeText(baseContext, msg, Toast.LENGTH_SHORT).show()
                    Log.d(TAG, msg)
                    
                    // Send captured image to server
                    sendCapturedImage(photoFile)
                }
                
                override fun onError(exc: ImageCaptureException) {
                    Log.e(TAG, "Photo capture failed: ${exc.message}", exc)
                }
            }
        )
    }
    
    private fun toggleVideoRecording() {
        val videoCapture = videoCapture ?: return
        
        if (!isRecording) {
            // Start recording
            val videoFile = File(
                outputDirectory,
                SimpleDateFormat(FILENAME_FORMAT, Locale.US)
                    .format(System.currentTimeMillis()) + ".mp4"
            )
            
            val outputOptions = VideoCapture.OutputFileOptions.Builder(videoFile).build()
            
            videoCapture.startRecording(
                outputOptions,
                ContextCompat.getMainExecutor(this),
                object : VideoCapture.OnVideoSavedCallback {
                    override fun onVideoSaved(output: VideoCapture.OutputFileResults) {
                        val savedUri = output.savedUri
                        val msg = "Video capture succeeded: ${savedUri?.path}"
                        Toast.makeText(baseContext, msg, Toast.LENGTH_SHORT).show()
                        Log.d(TAG, msg)
                    }
                    
                    override fun onError(videoCaptureError: Int, message: String, cause: Throwable?) {
                        Log.e(TAG, "Video capture failed: $message", cause)
                    }
                }
            )
            
            isRecording = true
            binding.btnRecord.text = "Stop Recording"
            
        } else {
            // Stop recording
            videoCapture.stopRecording()
            isRecording = false
            binding.btnRecord.text = "Start Recording"
        }
    }
    
    private fun switchCamera() {
        // Implement camera switching logic
        Log.d(TAG, "Switching camera")
        Toast.makeText(this, "Camera switching not implemented yet", Toast.LENGTH_SHORT).show()
    }
    
    private fun openCameraSettings() {
        // Implement camera settings
        Log.d(TAG, "Opening camera settings")
        Toast.makeText(this, "Camera settings not implemented yet", Toast.LENGTH_SHORT).show()
    }
    
    private fun toggleMotionDetection(enabled: Boolean) {
        isMotionDetectionEnabled = enabled
        Log.d(TAG, "Motion detection: $enabled")
        
        if (enabled) {
            // Start motion detection
            startMotionDetection()
        } else {
            // Stop motion detection
            stopMotionDetection()
        }
    }
    
    private fun toggleObjectTracking(enabled: Boolean) {
        isObjectTrackingEnabled = enabled
        Log.d(TAG, "Object tracking: $enabled")
        
        if (enabled) {
            // Start object tracking
            startObjectTracking()
        } else {
            // Stop object tracking
            stopObjectTracking()
        }
    }
    
    private fun startMotionDetection() {
        // Implement motion detection
        Log.d(TAG, "Starting motion detection")
    }
    
    private fun stopMotionDetection() {
        // Stop motion detection
        Log.d(TAG, "Stopping motion detection")
    }
    
    private fun startObjectTracking() {
        // Implement object tracking
        Log.d(TAG, "Starting object tracking")
    }
    
    private fun stopObjectTracking() {
        // Stop object tracking
        Log.d(TAG, "Stopping object tracking")
    }
    
    private fun sendCapturedImage(imageFile: File) {
        try {
            // Read image file
            val bitmap = BitmapFactory.decodeFile(imageFile.absolutePath)
            
            // Convert to byte array
            val stream = ByteArrayOutputStream()
            bitmap.compress(Bitmap.CompressFormat.JPEG, 90, stream)
            val imageData = stream.toByteArray()
            
            // Prepare metadata
            val metadata = mapOf(
                "timestamp" to System.currentTimeMillis(),
                "filename" to imageFile.name,
                "size" to imageData.size,
                "width" to bitmap.width,
                "height" to bitmap.height
            )
            
            // Send to server
            webSocketManager.sendCapturedImage(imageData, metadata)
            
            Log.d(TAG, "📸 Image sent to server: ${imageFile.name}")
            
        } catch (e: Exception) {
            Log.e(TAG, "Error sending captured image", e)
        }
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
    
    override fun onDestroy() {
        super.onDestroy()
        cameraExecutor.shutdown()
    }
    
    private val outputDirectory: File by lazy {
        val mediaDir = externalMediaDirs.firstOrNull()?.let {
            File(it, resources.getString(R.string.app_name)).apply { mkdirs() }
        }
        if (mediaDir != null && mediaDir.exists()) mediaDir else filesDir
    }
}
