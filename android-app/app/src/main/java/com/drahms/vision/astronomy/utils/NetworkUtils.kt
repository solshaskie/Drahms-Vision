package com.drahms.vision.astronomy.utils

import android.content.Context
import android.net.ConnectivityManager
import android.net.NetworkCapabilities
import android.net.wifi.WifiManager
import android.util.Log
import java.net.InetAddress
import java.net.NetworkInterface
import java.util.*

object NetworkUtils {
    private const val TAG = "NetworkUtils"
    
    /**
     * Get the local IP address of the device
     */
    fun getLocalIpAddress(context: Context): String? {
        return try {
            val wifiManager = context.applicationContext.getSystemService(Context.WIFI_SERVICE) as WifiManager
            val wifiInfo = wifiManager.connectionInfo
            val ipInt = wifiInfo.ipAddress
            
            if (ipInt == 0) {
                // Fallback to network interface method
                getLocalIpAddressFromInterfaces()
            } else {
                // Convert integer IP to string
                String.format(
                    Locale.getDefault(),
                    "%d.%d.%d.%d",
                    ipInt and 0xff,
                    ipInt shr 8 and 0xff,
                    ipInt shr 16 and 0xff,
                    ipInt shr 24 and 0xff
                )
            }
        } catch (e: Exception) {
            Log.e(TAG, "Error getting local IP address", e)
            getLocalIpAddressFromInterfaces()
        }
    }
    
    /**
     * Fallback method to get IP address from network interfaces
     */
    private fun getLocalIpAddressFromInterfaces(): String? {
        return try {
            val interfaces = NetworkInterface.getNetworkInterfaces()
            for (networkInterface in Collections.list(interfaces)) {
                val addresses = networkInterface.inetAddresses
                for (address in Collections.list(addresses)) {
                    if (!address.isLoopbackAddress && address is java.net.Inet4Address) {
                        val hostAddress = address.hostAddress
                        if (hostAddress != null && !hostAddress.startsWith("169.254")) {
                            Log.d(TAG, "Found IP address: $hostAddress")
                            return hostAddress
                        }
                    }
                }
            }
            null
        } catch (e: Exception) {
            Log.e(TAG, "Error getting IP from interfaces", e)
            null
        }
    }
    
    /**
     * Generate server URL based on local IP
     */
    fun generateServerUrl(context: Context, port: Int = 3001): String {
        val localIp = getLocalIpAddress(context)
        return if (localIp != null) {
            "http://$localIp:$port"
        } else {
            // Fallback to default
            "http://10.0.0.60:$port"
        }
    }
    
    /**
     * Check if network is available
     */
    fun isNetworkAvailable(context: Context): Boolean {
        val connectivityManager = context.getSystemService(Context.CONNECTIVITY_SERVICE) as ConnectivityManager
        val network = connectivityManager.activeNetwork ?: return false
        val networkCapabilities = connectivityManager.getNetworkCapabilities(network) ?: return false
        
        return networkCapabilities.hasTransport(NetworkCapabilities.TRANSPORT_WIFI) ||
                networkCapabilities.hasTransport(NetworkCapabilities.TRANSPORT_CELLULAR) ||
                networkCapabilities.hasTransport(NetworkCapabilities.TRANSPORT_ETHERNET)
    }
    
    /**
     * Discover server on network (simple ping)
     */
    fun discoverServer(context: Context, port: Int = 3001, timeoutMs: Int = 1000): String? {
        val localIp = getLocalIpAddress(context)
        if (localIp == null) return null
        
        // Extract network prefix (e.g., "192.168.1" from "192.168.1.100")
        val networkPrefix = localIp.substring(0, localIp.lastIndexOf('.'))
        
        Log.d(TAG, "Scanning network $networkPrefix.x for server on port $port")
        
        // Scan common IP ranges
        val commonRanges = listOf(
            "$networkPrefix.1",  // Router
            "$networkPrefix.2",  // Common server IP
            "$networkPrefix.100", // Common server IP
            "$networkPrefix.200", // Common server IP
            "10.0.0.60",         // Hardcoded fallback
            "192.168.1.100",     // Common home network
            "192.168.0.100"      // Common home network
        )
        
        for (ip in commonRanges) {
            if (isServerReachable(ip, port, timeoutMs)) {
                Log.d(TAG, "Found server at: $ip:$port")
                return "http://$ip:$port"
            }
        }
        
        return null
    }
    
    /**
     * Check if server is reachable
     */
    private fun isServerReachable(host: String, port: Int, timeoutMs: Int): Boolean {
        return try {
            val socket = java.net.Socket()
            socket.connect(java.net.InetSocketAddress(host, port), timeoutMs)
            socket.close()
            true
        } catch (e: Exception) {
            false
        }
    }
}
