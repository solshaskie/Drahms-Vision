package com.drahms.vision.astronomy.network

import android.util.Log
import io.socket.client.IO
import io.socket.client.Socket
import java.net.URISyntaxException

class WebSocketManager {
    
    companion object {
        private const val TAG = "WebSocketManager"
        private const val SERVER_URL = "http://10.0.0.60:3003"  // Your computer's IP address
    }
    
    private var socket: Socket? = null
    private var isConnected = false
    private var connectionCallback: ((Boolean) -> Unit)? = null
    
    fun setConnectionCallback(callback: (Boolean) -> Unit) {
        connectionCallback = callback
    }
    
    fun connect() {
        try {
            Log.d(TAG, "Attempting to connect to: $SERVER_URL")
            
            val options = IO.Options().apply {
                timeout = 10000 // 10 second timeout
                reconnection = true
                reconnectionAttempts = 5
                reconnectionDelay = 1000
            }
            
            socket = IO.socket(SERVER_URL, options)
            
            socket?.on(Socket.EVENT_CONNECT) {
                Log.d(TAG, "✅ Successfully connected to server")
                isConnected = true
                connectionCallback?.invoke(true)
            }
            
            socket?.on(Socket.EVENT_DISCONNECT) {
                Log.d(TAG, "❌ Disconnected from server")
                isConnected = false
                connectionCallback?.invoke(false)
            }
            
            socket?.on(Socket.EVENT_CONNECT_ERROR) { args ->
                val error = args.getOrNull(0)?.toString() ?: "Unknown error"
                Log.e(TAG, "❌ Connection error: $error")
                isConnected = false
                connectionCallback?.invoke(false)
            }
            
            // Note: Socket.IO reconnection events are handled automatically by the library
            // The reconnection options we set will handle retries automatically
            
            Log.d(TAG, "Initiating connection...")
            socket?.connect()
            
        } catch (e: URISyntaxException) {
            Log.e(TAG, "❌ Invalid server URL: $SERVER_URL", e)
            connectionCallback?.invoke(false)
        } catch (e: Exception) {
            Log.e(TAG, "❌ Unexpected error during connection", e)
            connectionCallback?.invoke(false)
        }
    }
    
    fun disconnect() {
        socket?.disconnect()
        isConnected = false
    }
    
    fun isConnected(): Boolean {
        return isConnected
    }
    
    fun sendImageData(imageData: ByteArray) {
        if (isConnected) {
            socket?.emit("image_data", imageData)
            Log.d(TAG, "Image data sent")
        } else {
            Log.w(TAG, "Cannot send image data - not connected")
        }
    }
    
    fun sendSensorData(sensorData: Map<String, Any>) {
        if (isConnected) {
            socket?.emit("sensor_data", sensorData)
            Log.d(TAG, "Sensor data sent")
        } else {
            Log.w(TAG, "Cannot send sensor data - not connected")
        }
    }
}
