package com.drahms.vision.astronomy

import android.content.SharedPreferences
import android.os.Bundle
import android.util.Log
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import androidx.preference.EditTextPreference
import androidx.preference.ListPreference
import androidx.preference.Preference
import androidx.preference.PreferenceFragmentCompat
import androidx.preference.SwitchPreferenceCompat
import com.drahms.vision.astronomy.R

class SettingsActivity : AppCompatActivity() {

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_settings)
        
        supportFragmentManager
            .beginTransaction()
            .replace(R.id.settings_container, SettingsFragment())
            .commit()
            
        supportActionBar?.setDisplayHomeAsUpEnabled(true)
        title = getString(R.string.settings)
    }

    override fun onSupportNavigateUp(): Boolean {
        onBackPressed()
        return true
    }

    class SettingsFragment : PreferenceFragmentCompat(), SharedPreferences.OnSharedPreferenceChangeListener {

        override fun onCreatePreferences(savedInstanceState: Bundle?, rootKey: String?) {
            setPreferencesFromResource(R.xml.preferences, rootKey)
            
            // Initialize preference summaries
            updatePreferenceSummaries()
        }

        override fun onResume() {
            super.onResume()
            preferenceScreen.sharedPreferences?.registerOnSharedPreferenceChangeListener(this)
        }

        override fun onPause() {
            super.onPause()
            preferenceScreen.sharedPreferences?.unregisterOnSharedPreferenceChangeListener(this)
        }

        override fun onSharedPreferenceChanged(sharedPreferences: SharedPreferences?, key: String?) {
            key?.let { preferenceKey ->
                updatePreferenceSummary(preferenceKey)
                
                when (preferenceKey) {
                    "server_url" -> {
                        val newUrl = sharedPreferences?.getString(preferenceKey, "")
                        Log.d("Settings", "Server URL changed to: $newUrl")
                        Toast.makeText(context, "Server URL updated", Toast.LENGTH_SHORT).show()
                    }
                    "image_quality" -> {
                        val quality = sharedPreferences?.getString(preferenceKey, "high")
                        Log.d("Settings", "Image quality changed to: $quality")
                    }
                    "motion_sensitivity" -> {
                        val sensitivity = sharedPreferences?.getString(preferenceKey, "medium")
                        Log.d("Settings", "Motion sensitivity changed to: $sensitivity")
                    }
                    "ai_enabled" -> {
                        val enabled = sharedPreferences?.getBoolean(preferenceKey, true)
                        Log.d("Settings", "AI features ${if (enabled == true) "enabled" else "disabled"}")
                    }
                }
            }
        }

        private fun updatePreferenceSummaries() {
            updatePreferenceSummary("server_url")
            updatePreferenceSummary("image_quality")
            updatePreferenceSummary("video_quality")
            updatePreferenceSummary("motion_sensitivity")
            updatePreferenceSummary("tracking_accuracy")
        }

        private fun updatePreferenceSummary(key: String) {
            val preference = findPreference<Preference>(key)
            val sharedPreferences = preferenceScreen.sharedPreferences
            
            when (key) {
                "server_url" -> {
                    val url = sharedPreferences?.getString(key, "http://10.0.0.60:3001")
                    (preference as? EditTextPreference)?.summary = url
                }
                "image_quality" -> {
                    val quality = sharedPreferences?.getString(key, "high")
                    (preference as? ListPreference)?.summary = quality?.capitalize()
                }
                "video_quality" -> {
                    val quality = sharedPreferences?.getString(key, "high")
                    (preference as? ListPreference)?.summary = quality?.capitalize()
                }
                "motion_sensitivity" -> {
                    val sensitivity = sharedPreferences?.getString(key, "medium")
                    (preference as? ListPreference)?.summary = sensitivity?.capitalize()
                }
                "tracking_accuracy" -> {
                    val accuracy = sharedPreferences?.getString(key, "high")
                    (preference as? ListPreference)?.summary = accuracy?.capitalize()
                }
            }
        }

        private fun String.capitalize(): String {
            return this.replaceFirstChar { if (it.isLowerCase()) it.titlecase() else it.toString() }
        }
    }
}
