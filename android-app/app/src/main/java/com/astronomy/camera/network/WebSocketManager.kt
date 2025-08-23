package com.astronomy.camera.network

import android.util.Log
import io.socket.client.IO
import io.socket.client.Socket
import java.net.URISyntaxException

class WebSocketManager {
    
    companion object {
        private const val TAG = "WebSocketManager"
        private const val SERVER_URL = "http://10.0.0.60:3003"
    }
    
    private var socket: Socket? = null
    private var isConnected = false
    
    fun connect() {
        try {
            socket = IO.socket(SERVER_URL)
            
            socket?.on(Socket.EVENT_CONNECT) {
                Log.d(TAG, "Connected to server")
                isConnected = true
            }
            
            socket?.on(Socket.EVENT_DISCONNECT) {
                Log.d(TAG, "Disconnected from server")
                isConnected = false
            }
            
            socket?.on(Socket.EVENT_CONNECT_ERROR) { args ->
                Log.e(TAG, "Connection error: ${args[0]}")
                isConnected = false
            }
            
            socket?.connect()
            
        } catch (e: URISyntaxException) {
            Log.e(TAG, "Invalid server URL: $SERVER_URL", e)
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
