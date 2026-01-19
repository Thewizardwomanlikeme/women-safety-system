package com.safety.womenalert;

import android.Manifest;
import android.content.Context;
import android.content.SharedPreferences;
import android.content.pm.PackageManager;
import android.location.Location;
import android.location.LocationManager;
import android.os.Handler;
import android.os.Looper;
import android.util.Log;
import android.widget.Toast;

import androidx.core.app.ActivityCompat;

import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

/**
 * Women Safety System - Emergency Handler
 * Fetches GPS location and sends emergency event to backend
 */
public class EmergencyHandler {
    
    private static final String TAG = "EmergencyHandler";
    private static final long LOCATION_TIMEOUT_MS = 10000;  // 10 seconds
    
    private final Context context;
    private final ExecutorService executor;
    private final Handler mainHandler;
    private final ApiClient apiClient;
    
    public EmergencyHandler(Context context) {
        this.context = context;
        this.executor = Executors.newSingleThreadExecutor();
        this.mainHandler = new Handler(Looper.getMainLooper());
        this.apiClient = new ApiClient(context);
    }
    
    public void handleEmergency(int deviceId, int batteryLevel, int sequenceNumber) {
        Log.w(TAG, "Emergency triggered - Getting location...");
        
        // Execute on background thread
        executor.execute(() -> {
            try {
                // Get GPS location
                Location location = getLastKnownLocation();
                
                if (location != null) {
                    double latitude = location.getLatitude();
                    double longitude = location.getLongitude();
                    
                    Log.i(TAG, String.format("Location: %.6f, %.6f", latitude, longitude));
                    
                    // Send to backend
                    sendEmergencyToBackend(deviceId, latitude, longitude, batteryLevel, sequenceNumber);
                    
                } else {
                    Log.e(TAG, "Failed to get location - sending without coordinates");
                    sendEmergencyToBackend(deviceId, 0, 0, batteryLevel, sequenceNumber);
                }
                
            } catch (Exception e) {
                Log.e(TAG, "Error handling emergency", e);
                showToast("Emergency error: " + e.getMessage());
            }
        });
    }
    
    private Location getLastKnownLocation() {
        if (ActivityCompat.checkSelfPermission(context, Manifest.permission.ACCESS_FINE_LOCATION) 
            != PackageManager.PERMISSION_GRANTED) {
            Log.e(TAG, "Location permission not granted");
            return null;
        }
        
        LocationManager locationManager = (LocationManager) context.getSystemService(
            Context.LOCATION_SERVICE);
        
        if (locationManager == null) {
            return null;
        }
        
        // Try GPS first
        Location gpsLocation = locationManager.getLastKnownLocation(LocationManager.GPS_PROVIDER);
        if (gpsLocation != null) {
            return gpsLocation;
        }
        
        // Fallback to network location
        Location networkLocation = locationManager.getLastKnownLocation(
            LocationManager.NETWORK_PROVIDER);
        if (networkLocation != null) {
            return networkLocation;
        }
        
        // Fallback to passive location
        return locationManager.getLastKnownLocation(LocationManager.PASSIVE_PROVIDER);
    }
    
    private void sendEmergencyToBackend(int deviceId, double latitude, double longitude, 
                                        int batteryLevel, int sequenceNumber) {
        SharedPreferences prefs = context.getSharedPreferences("WomenSafetyPrefs", 
            Context.MODE_PRIVATE);
        
        String contact1 = prefs.getString("contact1", "");
        String contact2 = prefs.getString("contact2", "");
        String contact3 = prefs.getString("contact3", "");
        
        String[] contacts = new String[]{contact1, contact2, contact3};
        
        boolean success = apiClient.sendEmergencyAlert(
            deviceId, latitude, longitude, batteryLevel, sequenceNumber, contacts);
        
        if (success) {
            Log.i(TAG, "Emergency alert sent to backend successfully");
            showToast("Emergency alert sent!");
        } else {
            Log.e(TAG, "Failed to send emergency alert to backend");
            showToast("Failed to send alert - will retry");
            
            // Retry after 2 seconds
            new Handler(Looper.getMainLooper()).postDelayed(() -> {
                boolean retrySuccess = apiClient.sendEmergencyAlert(
                    deviceId, latitude, longitude, batteryLevel, sequenceNumber, contacts);
                
                if (retrySuccess) {
                    showToast("Alert sent on retry");
                }
            }, 2000);
        }
    }
    
    private void showToast(String message) {
        mainHandler.post(() -> Toast.makeText(context, message, Toast.LENGTH_LONG).show());
    }
}
