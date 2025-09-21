package com.drahms.vision.astronomy.service

import android.app.*
import android.content.Intent
import android.os.Binder
import android.os.IBinder
import android.util.Log
import androidx.core.app.NotificationCompat
import com.drahms.vision.astronomy.MainActivity
import com.drahms.vision.astronomy.R
import com.drahms.vision.astronomy.network.WebSocketManager
import com.drahms.vision.astronomy.utils.SensorManager
import kotlinx.coroutines.*

class CameraService : Service() {

    private val binder = LocalBinder()
    private val serviceScope = CoroutineScope(Dispatchers.IO + SupervisorJob())
    
    private lateinit var webSocketManager: WebSocketManager
    private lateinit var sensorManager: SensorManager
    
    private var isRunning = false
    private var isConnected = false

    companion object {
        private const val TAG = "CameraService"
        private const val NOTIFICATION_ID = 1001
        private const val CHANNEL_ID = "DrahmsVisionCamera"
        private const val CHANNEL_NAME = "Camera Service"
    }

    inner class LocalBinder : Binder() {
        fun getService(): CameraService = this@CameraService
    }

    override fun onCreate() {
        super.onCreate()
        Log.d(TAG, "🔧 CameraService created")
        
        createNotificationChannel()
        initializeManagers()
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        Log.d(TAG, "🚀 CameraService started")
        
        startForeground(NOTIFICATION_ID, createNotification())
        startService()
        
        return START_STICKY
    }

    override fun onBind(intent: Intent?): IBinder {
        return binder
    }

    override fun onDestroy() {
        super.onDestroy()
        Log.d(TAG, "🛑 CameraService destroyed")
        
        stopService()
        serviceScope.cancel()
    }

    private fun createNotificationChannel() {
        if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                CHANNEL_ID,
                CHANNEL_NAME,
                NotificationManager.IMPORTANCE_LOW
            ).apply {
                description = "Camera service for Drahms Vision"
                setShowBadge(false)
            }
            
            val notificationManager = getSystemService(NotificationManager::class.java)
            notificationManager.createNotificationChannel(channel)
        }
    }

    private fun createNotification(): Notification {
        val intent = Intent(this, MainActivity::class.java).apply {
            flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TASK
        }
        
        val pendingIntent = PendingIntent.getActivity(
            this, 0, intent,
            PendingIntent.FLAG_IMMUTABLE
        )

        return NotificationCompat.Builder(this, CHANNEL_ID)
            .setContentTitle("Drahms Vision")
            .setContentText("Camera service running")
            .setSmallIcon(R.drawable.ic_camera)
            .setContentIntent(pendingIntent)
            .setOngoing(true)
            .setSilent(true)
            .build()
    }

    private fun initializeManagers() {
        webSocketManager = WebSocketManager("http://10.0.0.60:3001")
        sensorManager = SensorManager(this)
        
        sensorManager.initialize()
    }

    private fun startService() {
        if (isRunning) return
        
        isRunning = true
        Log.d(TAG, "🎥 Starting camera service")
        
        // Start sensor data transmission
        sensorManager.startDataTransmission { sensorData ->
            if (isConnected) {
                webSocketManager.sendSensorData(sensorData)
            }
        }
        
        // Connect to server
        connectToServer()
    }

    private fun stopService() {
        if (!isRunning) return
        
        isRunning = false
        Log.d(TAG, "🎥 Stopping camera service")
        
        sensorManager.stopDataTransmission()
        webSocketManager.disconnect()
        isConnected = false
    }

    private fun connectToServer() {
        serviceScope.launch {
            try {
                webSocketManager.connect { success ->
                    isConnected = success
                    if (success) {
                        Log.d(TAG, "✅ Connected to server from service")
                        updateNotification("Connected to server")
                    } else {
                        Log.w(TAG, "❌ Failed to connect to server from service")
                        updateNotification("Disconnected")
                    }
                }
            } catch (e: Exception) {
                Log.e(TAG, "❌ Error connecting to server", e)
                updateNotification("Connection error")
            }
        }
    }

    private fun updateNotification(status: String) {
        val notification = NotificationCompat.Builder(this, CHANNEL_ID)
            .setContentTitle("Drahms Vision")
            .setContentText("Camera service: $status")
            .setSmallIcon(R.drawable.ic_camera)
            .setOngoing(true)
            .setSilent(true)
            .build()
        
        val notificationManager = getSystemService(NotificationManager::class.java)
        notificationManager.notify(NOTIFICATION_ID, notification)
    }

    // Public methods for activity interaction
    fun isServiceRunning(): Boolean = isRunning
    
    fun isServerConnected(): Boolean = isConnected
    
    fun getWebSocketManager(): WebSocketManager = webSocketManager
    
    fun getSensorManager(): SensorManager = sensorManager
    
    fun sendCameraFrame(frameData: ByteArray, timestamp: Long) {
        if (isConnected) {
            webSocketManager.sendCameraFrame(frameData, timestamp)
        }
    }
    
    fun sendMotionData(motionData: Map<String, Any>) {
        if (isConnected) {
            webSocketManager.sendMotionData(motionData)
        }
    }
    
    fun sendTrackingData(trackingData: Map<String, Any>) {
        if (isConnected) {
            webSocketManager.sendTrackingData(trackingData)
        }
    }
    
    fun sendCapturedImage(imageData: ByteArray, metadata: Map<String, Any>) {
        if (isConnected) {
            webSocketManager.sendCapturedImage(imageData, metadata)
        }
    }
}
