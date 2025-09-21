package com.drahms.vision.astronomy.camera

import android.app.Service
import android.content.Intent
import android.os.IBinder
import android.util.Log
import androidx.camera.core.*
import androidx.camera.lifecycle.ProcessCameraProvider
import androidx.core.app.ServiceCompat
import com.drahms.vision.astronomy.CameraActivity
import io.socket.client.IO
import io.socket.client.Socket
import kotlinx.coroutines.*
import java.io.File

class VideoStreamingService : Service() {

    private var socket: Socket? = null
    private val serverUrl = "http://10.0.0.60:3001"

    private var imageCapture: ImageCapture? = null
    private var cameraProvider: ProcessCameraProvider? = null

    private val serviceScope = CoroutineScope(Dispatchers.IO + SupervisorJob())

    override fun onCreate() {
        super.onCreate()
        Log.d(TAG, "Video streaming service created")
        connectToServer()
        setupCamera()
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        Log.d(TAG, "Video streaming service started")
        // Start continuous capture
        startVideoStreaming()
        return START_STICKY
    }

    override fun onDestroy() {
        super.onDestroy()
        serviceScope.cancel()
        socket?.disconnect()
        cameraProvider?.unbindAll()
        Log.d(TAG, "Video streaming service destroyed")
    }

    override fun onBind(intent: Intent?): IBinder? {
        return null
    }

    private fun connectToServer() {
        try {
            socket = IO.socket(serverUrl)
            socket?.connect()

            socket?.on(Socket.EVENT_CONNECT) {
                Log.d(TAG, "Video service connected to server")
            }

            socket?.on(Socket.EVENT_DISCONNECT) {
                Log.d(TAG, "Video service disconnected from server")
            }

        } catch (e: Exception) {
            Log.e(TAG, "Failed to connect video service to server", e)
        }
    }

    private fun setupCamera() {
        val cameraProviderFuture = ProcessCameraProvider.getInstance(this)

        cameraProviderFuture.addListener({
            try {
                cameraProvider = cameraProviderFuture.get()

                imageCapture = ImageCapture.Builder()
                    .setCaptureMode(ImageCapture.CAPTURE_MODE_MINIMIZE_LATENCY)
                    .build()

                val cameraSelector = CameraSelector.DEFAULT_BACK_CAMERA

                cameraProvider?.unbindAll()
                cameraProvider?.bindToLifecycle(null, cameraSelector, imageCapture)

                Log.d(TAG, "Camera setup for streaming")

            } catch (exc: Exception) {
                Log.e(TAG, "Camera setup failed", exc)
            }
        }, android.os.Handler(mainLooper))
    }

    private fun startVideoStreaming() {
        serviceScope.launch {
            while (isActive) {
                takeStreamingFrame()
                delay(1000) // 1 FPS for testing, adjust as needed
            }
        }
    }

    private fun takeStreamingFrame() {
        val imageCapture = imageCapture ?: return

        val outputFileOptions = ImageCapture.OutputFileOptions.Builder(
            File(cacheDir, "stream_${System.currentTimeMillis()}.jpg")
        ).build()

        imageCapture.takePicture(
            outputFileOptions,
            android.os.Handler(mainLooper),
            object : ImageCapture.OnImageSavedCallback {
                override fun onError(exception: ImageCaptureException) {
                    Log.e(TAG, "Streaming frame capture failed: ${exception.message}", exception)
                }

                override fun onImageSaved(output: ImageCapture.OutputFileResults) {
                    // Send frame to server
                    output.savedUri?.let { uri ->
                        try {
                            val inputStream = contentResolver.openInputStream(uri)
                            val bytes = inputStream?.readBytes()
                            if (bytes != null) {
                                val base64Image = android.util.Base64.encodeToString(bytes, android.util.Base64.DEFAULT)
                                socket?.emit("camera_feed", "data:image/jpeg;base64,$base64Image")
                                Log.d(TAG, "Streaming frame sent")
                            }
                        } catch (e: Exception) {
                            Log.e(TAG, "Failed to send streaming frame", e)
                        }
                    }
                }
            }
        )
    }

    companion object {
        private const val TAG = "VideoStreamingService"
    }
}
