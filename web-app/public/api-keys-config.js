// 🔑 Drahms Vision - API Keys Configuration
// Add your actual API keys here

const API_KEYS = {
    // 🔍 GENERAL OBJECT APIs
    GOOGLE_VISION_API_KEY: 'AIzaSyCbOwoqUM535YrQGanmTcdayXpGnTO7BUA',
    
    // 🦅 BIRD APIs
    EBIRD_API_KEY: 'cnav964ln5f',
    
    // 🌌 ASTRONOMY APIs
    NASA_API_KEY: 'xw0ANQgH0rqzD1ZNenzLe0a8zmLIbBPdQgotIMfr',
    // Open-Meteo doesn't need an API key - it's completely free!

    // 🌤️ WEATHER APIs
    OPENWEATHER_API_KEY: 'e516c1e2988b23883888c64a5c7867a3',
    
    // 🌿 PLANT APIs
    PLANTNET_API_KEY: '2b10qnJP1zrXJafPSBGLxo9Wu',
    TREFLE_API_KEY: 'LYgs40ZkUuQPgoF0wyJQkrMeWbAbFet7YJF46zDC2R0',
    
    // 🔍 ADDITIONAL APIs
    IMAGGA_API_KEY: 'acc_653242ec878e6f8',
    IMAGGA_API_SECRET: 'da69dbd3591a25ed54596b6d0e0cecc8',
    CLOUDINARY_API_KEY: '788888796976785',
    CLOUDINARY_API_SECRET: 'AKUwYyJATXqLbzeRvdl0apnkiZk',
    ROBOFLOW_API_KEY: 'rf_TeaKij7j6Te2nRKZwjwSCGcH6HP2',
    
    // 🎵 AUDIO APIs
    BIRDNET_API_KEY: 'birdnet_free',
    
    // 🔍 VISION APIs
    CLOUDVISION_API_KEY: 'AIzaSyCbOwoqUM535YrQGanmTcdayXpGnTO7BUA',
    
    // 🌐 WEB APIs
    WOLFRAM_API_KEY: 'wolfram_free',
    MERRIAM_API_KEY: 'merriam_free'
};

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = API_KEYS;
} else {
    window.API_KEYS = API_KEYS;
}
