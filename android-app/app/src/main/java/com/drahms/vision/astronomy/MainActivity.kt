package com.drahms.vision.astronomy

import android.Manifest
import android.content.Intent
import android.content.pm.PackageManager
import android.os.Bundle
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import androidx.core.app.ActivityCompat
import androidx.core.content.ContextCompat
import com.drahms.vision.astronomy.databinding.ActivityMainBinding
import com.drahms.vision.astronomy.network.WebSocketManager

class MainActivity : AppCompatActivity() {
    
    private lateinit var binding: ActivityMainBinding
    
    companion object {
        private const val PERMISSION_REQUEST_CODE = 100
        private const val CAMERA_PERMISSION_REQUEST = 101
    }
    
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityMainBinding.inflate(layoutInflater)
        setContentView(binding.root)
        
        setupUI()
        checkPermissions()
    }
    
    private fun setupUI() {
        binding.apply {
            // Start camera button
            btnStartCamera.setOnClickListener {
                if (checkCameraPermission()) {
                    startCameraActivity()
                } else {
                    requestCameraPermission()
                }
            }
            
            // Settings button
            btnSettings.setOnClickListener {
                showSettings()
            }
            
            // Connection status
            btnConnect.setOnClickListener {
                connectToWebApp()
            }
        }
        
        // Update status indicators
        updateConnectionStatus(false)
        updateSensorStatus()
    }
    
    private fun checkPermissions() {
        val permissions = arrayOf(
            Manifest.permission.CAMERA,
            Manifest.permission.ACCESS_FINE_LOCATION,
            Manifest.permission.ACCESS_COARSE_LOCATION,
            Manifest.permission.INTERNET,
            Manifest.permission.RECORD_AUDIO,
            Manifest.permission.VIBRATE
        )
        
        val missingPermissions = permissions.filter {
            ContextCompat.checkSelfPermission(this, it) != PackageManager.PERMISSION_GRANTED
        }
        
        if (missingPermissions.isNotEmpty()) {
            ActivityCompat.requestPermissions(
                this,
                missingPermissions.toTypedArray(),
                PERMISSION_REQUEST_CODE
            )
        }
    }
    
    private fun checkCameraPermission(): Boolean {
        return ContextCompat.checkSelfPermission(
            this,
            Manifest.permission.CAMERA
        ) == PackageManager.PERMISSION_GRANTED
    }
    
    private fun requestCameraPermission() {
        ActivityCompat.requestPermissions(
            this,
            arrayOf(Manifest.permission.CAMERA),
            CAMERA_PERMISSION_REQUEST
        )
    }
    
    private fun startCameraActivity() {
        val intent = Intent(this, CameraActivity::class.java)
        startActivity(intent)
    }
    
    private fun showSettings() {
        // Show a simple settings dialog
        val settingsDialog = androidx.appcompat.app.AlertDialog.Builder(this)
            .setTitle("Drahms Vision Settings")
            .setItems(arrayOf("Server IP: 10.0.0.60:3003", "Camera Quality: High", "Auto-Connect: Enabled", "Night Mode: Auto")) { _, _ ->
                // Settings selected
            }
            .setPositiveButton("OK") { dialog, _ ->
                dialog.dismiss()
            }
            .setNegativeButton("Test Connection") { _, _ ->
                // Test the connection
                connectToWebApp()
            }
            .create()
        
        settingsDialog.show()
    }
    
    private fun connectToWebApp() {
        Toast.makeText(this, "Connecting to web app...", Toast.LENGTH_SHORT).show()
        
        // Create WebSocket manager and connect
        val webSocketManager = WebSocketManager()
        webSocketManager.connect()
        
        // Update UI after a short delay to show connection attempt
        binding.connectionStatus.postDelayed({
            if (webSocketManager.isConnected()) {
                updateConnectionStatus(true)
                Toast.makeText(this, "Connected to web app!", Toast.LENGTH_SHORT).show()
            } else {
                updateConnectionStatus(false)
                Toast.makeText(this, "Connection failed. Check network.", Toast.LENGTH_SHORT).show()
            }
        }, 2000) // 2 second delay
    }
    
    private fun updateConnectionStatus(connected: Boolean) {
        binding.connectionStatus.text = if (connected) "Connected" else "Disconnected"
        binding.connectionStatus.setTextColor(
            if (connected) getColor(R.color.green) else getColor(R.color.red)
        )
    }
    
    private fun updateSensorStatus() {
        binding.sensorStatus.text = "Sensors: Active"
        binding.sensorStatus.setTextColor(getColor(R.color.orange))
    }
    
    override fun onRequestPermissionsResult(
        requestCode: Int,
        permissions: Array<String>,
        grantResults: IntArray
    ) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults)
        
        when (requestCode) {
            PERMISSION_REQUEST_CODE -> {
                if (grantResults.isNotEmpty() && grantResults.all { it == PackageManager.PERMISSION_GRANTED }) {
                    Toast.makeText(this, "All permissions granted", Toast.LENGTH_SHORT).show()
                } else {
                    Toast.makeText(this, "Some permissions were denied", Toast.LENGTH_SHORT).show()
                }
            }
            CAMERA_PERMISSION_REQUEST -> {
                if (grantResults.isNotEmpty() && grantResults[0] == PackageManager.PERMISSION_GRANTED) {
                    startCameraActivity()
                } else {
                    Toast.makeText(this, "Camera permission is required", Toast.LENGTH_SHORT).show()
                }
            }
        }
    }
}
