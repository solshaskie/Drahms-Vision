// 🌐 Network Discovery System for Drahms Vision
// Automatic discovery and connection between Android app and web server

class NetworkDiscovery {
    constructor() {
        this.discoveredDevices = new Map();
        this.isScanning = false;
        this.scanInterval = null;
        this.broadcastInterval = null;
        this.serverPort = 3000;
        this.broadcastPort = 3001;
        this.discoveryTimeout = 5000; // 5 seconds
        this.connectionTimeout = 10000; // 10 seconds
        
        // Network configuration
        this.networkConfig = {
            protocol: 'ws',
            autoConnect: true,
            retryAttempts: 3,
            retryDelay: 2000
        };
        
        // Device information
        this.deviceInfo = {
            name: 'Drahms Vision Web Server',
            type: 'web_server',
            version: '1.0.0',
            capabilities: [
                'camera_control',
                'astronomy_overlay',
                'object_identification',
                'real_time_streaming'
            ]
        };
        
        this.init();
    }
    
    init() {
        console.log('🌐 Initializing Network Discovery System');
        this.setupEventListeners();
        this.startBroadcasting();
        this.startScanning();
    }
    
    setupEventListeners() {
        // Listen for page visibility changes
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                this.pauseDiscovery();
            } else {
                this.resumeDiscovery();
            }
        });
        
        // Listen for network status changes
        window.addEventListener('online', () => {
            console.log('🌐 Network connection restored');
            this.resumeDiscovery();
        });
        
        window.addEventListener('offline', () => {
            console.log('🌐 Network connection lost');
            this.pauseDiscovery();
        });
    }
    
    startBroadcasting() {
        console.log('📡 Starting device broadcasting...');
        
        this.broadcastInterval = setInterval(() => {
            this.broadcastPresence();
        }, 2000); // Broadcast every 2 seconds
    }
    
    stopBroadcasting() {
        if (this.broadcastInterval) {
            clearInterval(this.broadcastInterval);
            this.broadcastInterval = null;
            console.log('📡 Device broadcasting stopped');
        }
    }
    
    broadcastPresence() {
        try {
            // Get current network information
            const networkInfo = this.getNetworkInfo();
            
            const broadcastData = {
                type: 'device_discovery',
                device: {
                    ...this.deviceInfo,
                    ip: networkInfo.localIP,
                    port: this.serverPort,
                    timestamp: Date.now(),
                    network: networkInfo
                }
            };
            
            // Broadcast via WebSocket if available
            if (window.app && window.app.socket) {
                window.app.socket.emit('device_broadcast', broadcastData);
            }
            
            // Also try UDP-like broadcasting via HTTP
            this.httpBroadcast(broadcastData);
            
        } catch (error) {
            console.warn('Broadcast failed:', error);
        }
    }
    
    httpBroadcast(data) {
        // Try to broadcast to common Android app ports
        const commonPorts = [8080, 8081, 8082, 3000, 3001];
        const localIP = this.getLocalIP();
        
        commonPorts.forEach(port => {
            const url = `http://${localIP}:${port}/discovery`;
            
            fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data),
                mode: 'no-cors'
            }).catch(() => {
                // Ignore errors - device might not be listening
            });
        });
    }
    
    startScanning() {
        if (this.isScanning) return;
        
        console.log('🔍 Starting device scanning...');
        this.isScanning = true;
        
        this.scanInterval = setInterval(() => {
            this.scanForDevices();
        }, 3000); // Scan every 3 seconds
    }
    
    stopScanning() {
        if (this.scanInterval) {
            clearInterval(this.scanInterval);
            this.scanInterval = null;
            this.isScanning = false;
            console.log('🔍 Device scanning stopped');
        }
    }
    
    async scanForDevices() {
        try {
            const networkInfo = this.getNetworkInfo();
            const baseIP = this.getBaseIP(networkInfo.localIP);
            
            // Scan common IP ranges
            const ipRanges = [
                `${baseIP}.1-254`, // Local network
                '192.168.1.1-254', // Common home network
                '192.168.0.1-254', // Common home network
                '10.0.0.1-254'     // Corporate network
            ];
            
            for (const range of ipRanges) {
                await this.scanIPRange(range);
            }
            
        } catch (error) {
            console.warn('Device scanning failed:', error);
        }
    }
    
    async scanIPRange(range) {
        const [base, start, end] = range.split(/[.-]/);
        const startIP = parseInt(start);
        const endIP = parseInt(end);
        
        const promises = [];
        for (let i = startIP; i <= endIP; i++) {
            const ip = `${base}.${i}`;
            promises.push(this.scanIP(ip));
        }
        
        // Process in batches to avoid overwhelming the network
        const batchSize = 10;
        for (let i = 0; i < promises.length; i += batchSize) {
            const batch = promises.slice(i, i + batchSize);
            await Promise.allSettled(batch);
        }
    }
    
    async scanIP(ip) {
        const commonPorts = [8080, 8081, 8082, 3000, 3001, 5000];
        
        for (const port of commonPorts) {
            try {
                const response = await fetch(`http://${ip}:${port}/discovery`, {
                    method: 'GET',
                    mode: 'no-cors',
                    timeout: 1000
                });
                
                // If we get here, the device is responding
                this.handleDiscoveredDevice({
                    ip: ip,
                    port: port,
                    type: 'android_device',
                    timestamp: Date.now()
                });
                
            } catch (error) {
                // Device not responding on this port
            }
        }
    }
    
    handleDiscoveredDevice(device) {
        const deviceKey = `${device.ip}:${device.port}`;
        
        if (!this.discoveredDevices.has(deviceKey)) {
            console.log(`📱 Discovered device: ${deviceKey}`);
            this.discoveredDevices.set(deviceKey, device);
            this.onDeviceDiscovered(device);
        } else {
            // Update timestamp
            const existingDevice = this.discoveredDevices.get(deviceKey);
            existingDevice.timestamp = device.timestamp;
        }
    }
    
    onDeviceDiscovered(device) {
        // Emit event for other components to handle
        const event = new CustomEvent('deviceDiscovered', {
            detail: device
        });
        document.dispatchEvent(event);
        
        // Auto-connect if enabled
        if (this.networkConfig.autoConnect) {
            this.attemptConnection(device);
        }
    }
    
    async attemptConnection(device) {
        console.log(`🔗 Attempting connection to ${device.ip}:${device.port}`);
        
        try {
            const wsUrl = `ws://${device.ip}:${device.port}`;
            const connection = await this.testWebSocketConnection(wsUrl);
            
            if (connection.success) {
                console.log(`✅ Successfully connected to ${device.ip}:${device.port}`);
                this.onConnectionSuccess(device, connection);
            } else {
                console.log(`❌ Failed to connect to ${device.ip}:${device.port}`);
                this.onConnectionFailed(device, connection.error);
            }
            
        } catch (error) {
            console.error(`Connection error for ${device.ip}:${device.port}:`, error);
            this.onConnectionFailed(device, error.message);
        }
    }
    
    testWebSocketConnection(url) {
        return new Promise((resolve) => {
            const ws = new WebSocket(url);
            const timeout = setTimeout(() => {
                ws.close();
                resolve({ success: false, error: 'Connection timeout' });
            }, this.connectionTimeout);
            
            ws.onopen = () => {
                clearTimeout(timeout);
                ws.close();
                resolve({ success: true });
            };
            
            ws.onerror = (error) => {
                clearTimeout(timeout);
                resolve({ success: false, error: 'WebSocket error' });
            };
        });
    }
    
    onConnectionSuccess(device, connection) {
        // Update device status
        device.status = 'connected';
        device.connectionTime = Date.now();
        
        // Emit connection success event
        const event = new CustomEvent('deviceConnected', {
            detail: { device, connection }
        });
        document.dispatchEvent(event);
        
        // Update UI if available
        this.updateDeviceList();
    }
    
    onConnectionFailed(device, error) {
        // Update device status
        device.status = 'failed';
        device.lastError = error;
        device.failedAttempts = (device.failedAttempts || 0) + 1;
        
        // Emit connection failed event
        const event = new CustomEvent('deviceConnectionFailed', {
            detail: { device, error }
        });
        document.dispatchEvent(event);
        
        // Retry if under limit
        if (device.failedAttempts < this.networkConfig.retryAttempts) {
            setTimeout(() => {
                this.attemptConnection(device);
            }, this.networkConfig.retryDelay);
        }
    }
    
    getNetworkInfo() {
        // Get basic network information
        const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
        
        return {
            localIP: this.getLocalIP(),
            connectionType: connection ? connection.effectiveType : 'unknown',
            downlink: connection ? connection.downlink : 'unknown',
            rtt: connection ? connection.rtt : 'unknown',
            userAgent: navigator.userAgent,
            platform: navigator.platform
        };
    }
    
    getLocalIP() {
        // Try to get local IP address
        // This is a simplified approach - in production, you'd use WebRTC or similar
        return '192.168.1.100'; // Placeholder - would be detected dynamically
    }
    
    getBaseIP(ip) {
        // Extract base IP (e.g., 192.168.1 from 192.168.1.100)
        const parts = ip.split('.');
        return parts.slice(0, 3).join('.');
    }
    
    pauseDiscovery() {
        console.log('⏸️ Pausing network discovery');
        this.stopBroadcasting();
        this.stopScanning();
    }
    
    resumeDiscovery() {
        console.log('▶️ Resuming network discovery');
        this.startBroadcasting();
        this.startScanning();
    }
    
    updateDeviceList() {
        // Update UI with discovered devices
        const deviceList = document.getElementById('discovered-devices');
        if (!deviceList) return;
        
        let html = '<h4>📱 Discovered Devices</h4>';
        
        if (this.discoveredDevices.size === 0) {
            html += '<p class="no-devices">No devices discovered yet...</p>';
        } else {
            this.discoveredDevices.forEach((device, key) => {
                const statusIcon = this.getStatusIcon(device.status);
                const lastSeen = new Date(device.timestamp).toLocaleTimeString();
                
                html += `
                    <div class="device-item">
                        <div class="device-info">
                            <div class="device-name">${device.name || 'Unknown Device'}</div>
                            <div class="device-address">${key}</div>
                            <div class="device-status">${statusIcon} ${device.status || 'unknown'}</div>
                            <div class="device-last-seen">Last seen: ${lastSeen}</div>
                        </div>
                        <div class="device-actions">
                            <button onclick="networkDiscovery.connectToDevice('${key}')" class="connect-btn">
                                Connect
                            </button>
                        </div>
                    </div>
                `;
            });
        }
        
        deviceList.innerHTML = html;
    }
    
    getStatusIcon(status) {
        const icons = {
            'connected': '✅',
            'failed': '❌',
            'connecting': '🔄',
            'unknown': '❓'
        };
        return icons[status] || '❓';
    }
    
    connectToDevice(deviceKey) {
        const device = this.discoveredDevices.get(deviceKey);
        if (device) {
            this.attemptConnection(device);
        }
    }
    
    // Public API methods
    getDiscoveredDevices() {
        return Array.from(this.discoveredDevices.values());
    }
    
    getConnectedDevices() {
        return this.getDiscoveredDevices().filter(device => device.status === 'connected');
    }
    
    clearDiscoveredDevices() {
        this.discoveredDevices.clear();
        this.updateDeviceList();
        console.log('🗑️ Cleared discovered devices list');
    }
    
    setAutoConnect(enabled) {
        this.networkConfig.autoConnect = enabled;
        console.log(`🔗 Auto-connect ${enabled ? 'enabled' : 'disabled'}`);
    }
    
    getNetworkStats() {
        return {
            discoveredDevices: this.discoveredDevices.size,
            connectedDevices: this.getConnectedDevices().length,
            isScanning: this.isScanning,
            networkInfo: this.getNetworkInfo()
        };
    }
    
    // Cleanup
    destroy() {
        this.stopBroadcasting();
        this.stopScanning();
        this.discoveredDevices.clear();
        console.log('🌐 Network Discovery System destroyed');
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = NetworkDiscovery;
} else {
    window.NetworkDiscovery = NetworkDiscovery;
}
