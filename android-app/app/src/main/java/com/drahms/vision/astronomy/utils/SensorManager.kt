package com.drahms.vision.astronomy.utils

import android.content.Context
import android.hardware.Sensor
import android.hardware.SensorEvent
import android.hardware.SensorEventListener
import android.hardware.SensorManager
import android.util.Log
import kotlin.math.sqrt

class SensorManager(private val context: Context) : SensorEventListener {

    private val sensorManager: android.hardware.SensorManager = context.getSystemService(Context.SENSOR_SERVICE) as android.hardware.SensorManager
    
    private var accelerometer: Sensor? = null
    private var gyroscope: Sensor? = null
    private var magnetometer: Sensor? = null
    private var lightSensor: Sensor? = null

    private var isInitialized = false
    private var isTransmitting = false
    private var dataCallback: ((Map<String, Any>) -> Unit)? = null

    // Sensor data
    private var accelerometerData = FloatArray(3)
    private var gyroscopeData = FloatArray(3)
    private var magnetometerData = FloatArray(3)
    private var lightLevel = 0f
    private var orientation = FloatArray(3)

    companion object {
        private const val TAG = "SensorManager"
        private const val SENSOR_DELAY = android.hardware.SensorManager.SENSOR_DELAY_GAME
    }

    fun initialize() {
        if (isInitialized) return

        try {
            // Get sensors
            accelerometer = sensorManager.getDefaultSensor(Sensor.TYPE_ACCELEROMETER)
            gyroscope = sensorManager.getDefaultSensor(Sensor.TYPE_GYROSCOPE)
            magnetometer = sensorManager.getDefaultSensor(Sensor.TYPE_MAGNETIC_FIELD)
            lightSensor = sensorManager.getDefaultSensor(Sensor.TYPE_LIGHT)

            // Register listeners
            accelerometer?.let { sensor ->
                sensorManager.registerListener(this, sensor, SENSOR_DELAY)
                Log.d(TAG, "✅ Accelerometer registered")
            }

            gyroscope?.let { sensor ->
                sensorManager.registerListener(this, sensor, SENSOR_DELAY)
                Log.d(TAG, "✅ Gyroscope registered")
            }

            magnetometer?.let { sensor ->
                sensorManager.registerListener(this, sensor, SENSOR_DELAY)
                Log.d(TAG, "✅ Magnetometer registered")
            }

            lightSensor?.let { sensor ->
                sensorManager.registerListener(this, sensor, SENSOR_DELAY)
                Log.d(TAG, "✅ Light sensor registered")
            }

            isInitialized = true
            Log.d(TAG, "🔧 SensorManager initialized successfully")

        } catch (e: Exception) {
            Log.e(TAG, "❌ Error initializing sensors", e)
        }
    }

    fun startDataTransmission(callback: (Map<String, Any>) -> Unit) {
        dataCallback = callback
        isTransmitting = true
        Log.d(TAG, "📡 Started sensor data transmission")
    }

    fun stopDataTransmission() {
        isTransmitting = false
        dataCallback = null
        Log.d(TAG, "📡 Stopped sensor data transmission")
    }

    override fun onSensorChanged(event: SensorEvent?) {
        event?.let { sensorEvent ->
            when (sensorEvent.sensor.type) {
                Sensor.TYPE_ACCELEROMETER -> {
                    System.arraycopy(sensorEvent.values, 0, accelerometerData, 0, 3)
                    calculateOrientation()
                }
                Sensor.TYPE_GYROSCOPE -> {
                    System.arraycopy(sensorEvent.values, 0, gyroscopeData, 0, 3)
                }
                Sensor.TYPE_MAGNETIC_FIELD -> {
                    System.arraycopy(sensorEvent.values, 0, magnetometerData, 0, 3)
                    calculateOrientation()
                }
                Sensor.TYPE_LIGHT -> {
                    lightLevel = sensorEvent.values[0]
                }
            }

            // Send data if transmission is active
            if (isTransmitting) {
                sendSensorData()
            }
        }
    }

    override fun onAccuracyChanged(sensor: Sensor?, accuracy: Int) {
        // Handle accuracy changes if needed
    }

    private fun calculateOrientation() {
        val rotationMatrix = FloatArray(9)
        val orientationAngles = FloatArray(3)

        if (SensorManager.getRotationMatrix(rotationMatrix, null, accelerometerData, magnetometerData)) {
            SensorManager.getOrientation(rotationMatrix, orientationAngles)
            System.arraycopy(orientationAngles, 0, orientation, 0, 3)
        }
    }

    private fun sendSensorData() {
        val sensorData = mapOf(
            "timestamp" to System.currentTimeMillis(),
            "accelerometer" to mapOf(
                "x" to accelerometerData[0],
                "y" to accelerometerData[1],
                "z" to accelerometerData[2],
                "magnitude" to sqrt(accelerometerData[0] * accelerometerData[0] + 
                                  accelerometerData[1] * accelerometerData[1] + 
                                  accelerometerData[2] * accelerometerData[2])
            ),
            "gyroscope" to mapOf(
                "x" to gyroscopeData[0],
                "y" to gyroscopeData[1],
                "z" to gyroscopeData[2]
            ),
            "magnetometer" to mapOf(
                "x" to magnetometerData[0],
                "y" to magnetometerData[1],
                "z" to magnetometerData[2]
            ),
            "orientation" to mapOf(
                "azimuth" to Math.toDegrees(orientation[0].toDouble()),
                "pitch" to Math.toDegrees(orientation[1].toDouble()),
                "roll" to Math.toDegrees(orientation[2].toDouble())
            ),
            "light" to lightLevel,
            "device_info" to mapOf(
                "sensors_available" to getAvailableSensors(),
                "sensor_accuracy" to getSensorAccuracy()
            )
        )

        dataCallback?.invoke(sensorData)
    }

    private fun getAvailableSensors(): Map<String, Boolean> {
        return mapOf(
            "accelerometer" to (accelerometer != null),
            "gyroscope" to (gyroscope != null),
            "magnetometer" to (magnetometer != null),
            "light" to (lightSensor != null)
        )
    }

    private fun getSensorAccuracy(): Map<String, Int> {
        return mapOf(
            "accelerometer" to (accelerometer?.maximumRange?.toInt() ?: 0),
            "gyroscope" to (gyroscope?.maximumRange?.toInt() ?: 0),
            "magnetometer" to (magnetometer?.maximumRange?.toInt() ?: 0),
            "light" to (lightSensor?.maximumRange?.toInt() ?: 0)
        )
    }

    fun getCurrentOrientation(): Map<String, Double> {
        return mapOf(
            "azimuth" to Math.toDegrees(orientation[0].toDouble()),
            "pitch" to Math.toDegrees(orientation[1].toDouble()),
            "roll" to Math.toDegrees(orientation[2].toDouble())
        )
    }

    fun getLightLevel(): Float = lightLevel

    fun isDeviceMoving(): Boolean {
        val magnitude = sqrt(accelerometerData[0] * accelerometerData[0] + 
                           accelerometerData[1] * accelerometerData[1] + 
                           accelerometerData[2] * accelerometerData[2])
        return magnitude > 1.5f // Threshold for movement detection
    }

    fun cleanup() {
        try {
            sensorManager.unregisterListener(this)
            isInitialized = false
            isTransmitting = false
            dataCallback = null
            Log.d(TAG, "🧹 SensorManager cleaned up")
        } catch (e: Exception) {
            Log.e(TAG, "❌ Error cleaning up sensors", e)
        }
    }
}
