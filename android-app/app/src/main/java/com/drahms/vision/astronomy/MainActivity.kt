package com.drahms.vision.astronomy

import android.os.Bundle
import android.widget.Button
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity

class MainActivity : AppCompatActivity() {

    private lateinit var btnCamera: Button

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)

        btnCamera = findViewById(R.id.btnCamera)
        
        btnCamera.setOnClickListener {
            // Launch camera activity
            startActivity(android.content.Intent(this, CameraActivity::class.java))
        }
    }
}
