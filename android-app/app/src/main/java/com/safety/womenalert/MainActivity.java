package com.safety.womenalert;

import android.Manifest;
import android.app.PendingIntent;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.content.SharedPreferences;
import android.content.pm.PackageManager;
import android.hardware.usb.UsbDevice;
import android.hardware.usb.UsbManager;
import android.os.Build;
import android.os.Bundle;
import android.widget.Button;
import android.widget.EditText;
import android.widget.Switch;
import android.widget.TextView;
import android.widget.Toast;

import androidx.annotation.NonNull;
import androidx.appcompat.app.AppCompatActivity;
import androidx.core.app.ActivityCompat;
import androidx.core.content.ContextCompat;

/**
 * Women Safety System - Main Activity
 * Minimal UI for app configuration and service control
 */
public class MainActivity extends AppCompatActivity {
    
    private static final String TAG = "MainActivity";
    private static final int PERMISSION_REQUEST_CODE = 1001;
    private static final String ACTION_USB_PERMISSION = "com.safety.womenalert.USB_PERMISSION";
    
    private static final String[] REQUIRED_PERMISSIONS = {
        Manifest.permission.ACCESS_FINE_LOCATION,
        Manifest.permission.ACCESS_COARSE_LOCATION,
        Manifest.permission.SEND_SMS,
        Manifest.permission.CALL_PHONE,
        Manifest.permission.POST_NOTIFICATIONS
    };
    
    private Switch serviceSwitch;
    private TextView statusText;
    private EditText contact1Input, contact2Input, contact3Input;
    private EditText backendUrlInput;
    private Button saveButton;
    
    private SharedPreferences prefs;
    private UsbManager usbManager;
    
    private final BroadcastReceiver usbReceiver = new BroadcastReceiver() {
        @Override
        public void onReceive(Context context, Intent intent) {
            String action = intent.getAction();
            if (ACTION_USB_PERMISSION.equals(action)) {
                synchronized (this) {
                    UsbDevice device = intent.getParcelableExtra(UsbManager.EXTRA_DEVICE);
                    if (intent.getBooleanExtra(UsbManager.EXTRA_PERMISSION_GRANTED, false)) {
                        if (device != null) {
                            Toast.makeText(context, "USB LoRa device connected", Toast.LENGTH_SHORT).show();
                            updateStatus();
                        }
                    } else {
                        Toast.makeText(context, "USB permission denied", Toast.LENGTH_SHORT).show();
                    }
                }
            }
        }
    };
    
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_main);
        
        prefs = getSharedPreferences("WomenSafetyPrefs", MODE_PRIVATE);
        usbManager = (UsbManager) getSystemService(Context.USB_SERVICE);
        
        initializeViews();
        checkPermissions();
        loadSettings();
        setupListeners();
        updateStatus();
        
        // Register USB receiver
        IntentFilter filter = new IntentFilter(ACTION_USB_PERMISSION);
        registerReceiver(usbReceiver, filter);
        
        // Check for USB device on startup
        checkUsbDevice();
    }
    
    @Override
    protected void onDestroy() {
        super.onDestroy();
        unregisterReceiver(usbReceiver);
    }
    
    private void initializeViews() {
        serviceSwitch = findViewById(R.id.serviceSwitch);
        statusText = findViewById(R.id.statusText);
        contact1Input = findViewById(R.id.contact1Input);
        contact2Input = findViewById(R.id.contact2Input);
        contact3Input = findViewById(R.id.contact3Input);
        backendUrlInput = findViewById(R.id.backendUrlInput);
        saveButton = findViewById(R.id.saveButton);
    }
    
    private void setupListeners() {
        serviceSwitch.setOnCheckedChangeListener((buttonView, isChecked) -> {
            if (isChecked) {
                startLoRaService();
            } else {
                stopLoRaService();
            }
        });
        
        saveButton.setOnClickListener(v -> saveSettings());
    }
    
    private void loadSettings() {
        contact1Input.setText(prefs.getString("contact1", ""));
        contact2Input.setText(prefs.getString("contact2", ""));
        contact3Input.setText(prefs.getString("contact3", ""));
        backendUrlInput.setText(prefs.getString("backendUrl", "https://your-backend.com"));
        
        boolean serviceRunning = prefs.getBoolean("serviceRunning", false);
        serviceSwitch.setChecked(serviceRunning);
    }
    
    private void saveSettings() {
        SharedPreferences.Editor editor = prefs.edit();
        editor.putString("contact1", contact1Input.getText().toString());
        editor.putString("contact2", contact2Input.getText().toString());
        editor.putString("contact3", contact3Input.getText().toString());
        editor.putString("backendUrl", backendUrlInput.getText().toString());
        editor.apply();
        
        Toast.makeText(this, "Settings saved", Toast.LENGTH_SHORT).show();
    }
    
    private void checkPermissions() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            for (String permission : REQUIRED_PERMISSIONS) {
                if (ContextCompat.checkSelfPermission(this, permission) 
                    != PackageManager.PERMISSION_GRANTED) {
                    ActivityCompat.requestPermissions(this, REQUIRED_PERMISSIONS, 
                        PERMISSION_REQUEST_CODE);
                    return;
                }
            }
        }
    }
    
    @Override
    public void onRequestPermissionsResult(int requestCode, @NonNull String[] permissions, 
                                          @NonNull int[] grantResults) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults);
        
        if (requestCode == PERMISSION_REQUEST_CODE) {
            boolean allGranted = true;
            for (int result : grantResults) {
                if (result != PackageManager.PERMISSION_GRANTED) {
                    allGranted = false;
                    break;
                }
            }
            
            if (allGranted) {
                Toast.makeText(this, "All permissions granted", Toast.LENGTH_SHORT).show();
            } else {
                Toast.makeText(this, "Permissions required for safety features", 
                    Toast.LENGTH_LONG).show();
            }
        }
    }
    
    private void checkUsbDevice() {
        for (UsbDevice device : usbManager.getDeviceList().values()) {
            // Request permission for USB device
            PendingIntent permissionIntent = PendingIntent.getBroadcast(this, 0, 
                new Intent(ACTION_USB_PERMISSION), PendingIntent.FLAG_IMMUTABLE);
            usbManager.requestPermission(device, permissionIntent);
        }
    }
    
    private void startLoRaService() {
        if (!checkAllPermissionsGranted()) {
            Toast.makeText(this, "Please grant all permissions first", Toast.LENGTH_SHORT).show();
            serviceSwitch.setChecked(false);
            return;
        }
        
        Intent intent = new Intent(this, LoRaService.class);
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            startForegroundService(intent);
        } else {
            startService(intent);
        }
        
        prefs.edit().putBoolean("serviceRunning", true).apply();
        updateStatus();
    }
    
    private void stopLoRaService() {
        Intent intent = new Intent(this, LoRaService.class);
        stopService(intent);
        
        prefs.edit().putBoolean("serviceRunning", false).apply();
        updateStatus();
    }
    
    private boolean checkAllPermissionsGranted() {
        for (String permission : REQUIRED_PERMISSIONS) {
            if (ContextCompat.checkSelfPermission(this, permission) 
                != PackageManager.PERMISSION_GRANTED) {
                return false;
            }
        }
        return true;
    }
    
    private void updateStatus() {
        boolean serviceRunning = prefs.getBoolean("serviceRunning", false);
        boolean usbConnected = !usbManager.getDeviceList().isEmpty();
        
        String status = "Service: " + (serviceRunning ? "Running" : "Stopped") + "\n" +
                       "USB LoRa: " + (usbConnected ? "Connected" : "Not connected");
        statusText.setText(status);
    }
}
