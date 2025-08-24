package com.drahms.vision.astronomy.network

import android.util.Log
import io.socket.client.IO
import io.socket.client.Socket
import org.json.JSONObject
import java.net.URISyntaxException

class WebSocketManager(private val serverUrl: String) {
    
    private var socket: Socket? = null
    private var isConnected = false
    private var connectionCallback: ((Boolean) -> Unit)? = null
    
    companion object {
        private const val TAG = "WebSocketManager"
    }
    
    fun connect(callback: (Boolean) -> Unit) {
        connectionCallback = callback
        
        try {
            Log.d(TAG, "🔌 Initializing Socket.IO connection to: $serverUrl")
            
            val options = IO.Options().apply {
                timeout = 20000 // 20 seconds
                reconnection = true
                reconnectionAttempts = 5
                reconnectionDelay = 1000
                reconnectionDelayMax = 5000
                transports = arrayOf("websocket", "polling")
                forceNew = true
            }
            
            socket = IO.socket(serverUrl, options)
            
            setupSocketListeners()
            
            socket?.connect()
            
        } catch (e: URISyntaxException) {
            Log.e(TAG, "Invalid server URL: $serverUrl", e)
            callback(false)
        } catch (e: Exception) {
            Log.e(TAG, "Error creating socket connection", e)
            callback(false)
        }
    }
    
    private fun setupSocketListeners() {
        socket?.apply {
            
            // Connection events
            on(Socket.EVENT_CONNECT) {
                Log.d(TAG, "✅ Connected to server")
                isConnected = true
                connectionCallback?.invoke(true)
                
                // Send initial ping
                emit("ping", "Hello from Drahms Vision Android!")
            }
            
            on(Socket.EVENT_DISCONNECT) {
                Log.d(TAG, "❌ Disconnected from server")
                isConnected = false
                connectionCallback?.invoke(false)
            }
            
            on(Socket.EVENT_CONNECT_ERROR) { args ->
                Log.e(TAG, "🔌 Connection error: ${args.firstOrNull()}")
                isConnected = false
                connectionCallback?.invoke(false)
            }
            
            // Server events
            on("pong") { args ->
                Log.d(TAG, "🏓 Received pong: ${args.firstOrNull()}")
            }
            
            on("camera_control") { args ->
                Log.d(TAG, "📷 Camera control received: ${args.firstOrNull()}")
                handleCameraControl(args.firstOrNull())
            }
            
            on("motion_detected") { args ->
                Log.d(TAG, "🎯 Motion detected: ${args.firstOrNull()}")
                handleMotionDetection(args.firstOrNull())
            }
            
            on("object_tracked") { args ->
                Log.d(TAG, "🎯 Object tracked: ${args.firstOrNull()}")
                handleObjectTracking(args.firstOrNull())
            }
            
            on("identification_result") { args ->
                Log.d(TAG, "🧠 Identification result: ${args.firstOrNull()}")
                handleIdentificationResult(args.firstOrNull())
            }
            
            on("error") { args ->
                Log.e(TAG, "❌ Server error: ${args.firstOrNull()}")
            }
        }
    }
    
    fun disconnect() {
        Log.d(TAG, "🔌 Disconnecting from server")
        
        socket?.disconnect()
        socket = null
        isConnected = false
    }
    
    fun emit(event: String, data: Any) {
        if (isConnected && socket != null) {
            Log.d(TAG, "📤 Emitting $event: $data")
            socket?.emit(event, data)
        } else {
            Log.w(TAG, "⚠️ Cannot emit $event: not connected")
        }
    }
    
    fun emit(event: String, data: Map<String, Any>) {
        val jsonData = JSONObject(data)
        emit(event, jsonData)
    }
    
    fun isConnected(): Boolean = isConnected
    
    // Camera feed transmission
    fun sendCameraFrame(frameData: ByteArray, timestamp: Long) {
        if (isConnected) {
            val data = mapOf(
                "frame" to frameData,
                "timestamp" to timestamp,
                "type" to "camera_feed"
            )
            emit("camera_feed", data)
        }
    }
    
    // Sensor data transmission
    fun sendSensorData(sensorData: Map<String, Any>) {
        if (isConnected) {
            emit("sensor_data", sensorData)
        }
    }
    
    // Motion detection data
    fun sendMotionData(motionData: Map<String, Any>) {
        if (isConnected) {
            emit("motion_detected", motionData)
        }
    }
    
    // Object tracking data
    fun sendTrackingData(trackingData: Map<String, Any>) {
        if (isConnected) {
            emit("object_tracked", trackingData)
        }
    }
    
    // Image capture
    fun sendCapturedImage(imageData: ByteArray, metadata: Map<String, Any>) {
        if (isConnected) {
            val data = metadata.toMutableMap()
            data["image"] = imageData
            data["type"] = "captured_image"
            emit("image_captured", data)
        }
    }
    
    // Private handlers for incoming events
    private fun handleCameraControl(data: Any?) {
        // Handle camera control commands from server
        Log.d(TAG, "📷 Processing camera control: $data")
    }
    
    private fun handleMotionDetection(data: Any?) {
        // Handle motion detection events from server
        Log.d(TAG, "🎯 Processing motion detection: $data")
    }
    
    private fun handleObjectTracking(data: Any?) {
        // Handle object tracking events from server
        Log.d(TAG, "🎯 Processing object tracking: $data")
    }
    
    private fun handleIdentificationResult(data: Any?) {
        // Handle AI identification results from server
        Log.d(TAG, "🧠 Processing identification result: $data")
    }
    
    // Utility methods
    fun getConnectionStatus(): String {
        return if (isConnected) "Connected" else "Disconnected"
    }
    
    fun getServerUrl(): String = serverUrl
}
