package com.drahms.vision.astronomy.utils

import android.content.Context
import android.media.MediaPlayer
import android.speech.tts.TextToSpeech
import android.util.Log
import java.util.*

class AudioGuidance(private val context: Context) {
    
    companion object {
        private const val TAG = "AudioGuidance"
    }
    
    private var textToSpeech: TextToSpeech? = null
    private var mediaPlayer: MediaPlayer? = null
    
    fun initialize() {
        textToSpeech = TextToSpeech(context) { status ->
            if (status == TextToSpeech.SUCCESS) {
                val result = textToSpeech?.setLanguage(Locale.US)
                if (result == TextToSpeech.LANG_MISSING_DATA || result == TextToSpeech.LANG_NOT_SUPPORTED) {
                    Log.e(TAG, "Language not supported")
                }
            } else {
                Log.e(TAG, "TextToSpeech initialization failed")
            }
        }
    }
    
    fun speak(text: String) {
        textToSpeech?.speak(text, TextToSpeech.QUEUE_FLUSH, null, null)
        Log.d(TAG, "Speaking: $text")
    }
    
    fun playSound(soundResourceId: Int) {
        try {
            mediaPlayer?.release()
            mediaPlayer = MediaPlayer.create(context, soundResourceId)
            mediaPlayer?.start()
            Log.d(TAG, "Playing sound: $soundResourceId")
        } catch (e: Exception) {
            Log.e(TAG, "Error playing sound", e)
        }
    }
    
    fun playCaptureSound() {
        // Play camera shutter sound
        speak("Photo captured")
    }
    
    fun playErrorSound() {
        speak("Error occurred")
    }
    
    fun playSuccessSound() {
        speak("Operation successful")
    }
    
    fun cleanup() {
        textToSpeech?.stop()
        textToSpeech?.shutdown()
        mediaPlayer?.release()
        mediaPlayer = null
    }
}
